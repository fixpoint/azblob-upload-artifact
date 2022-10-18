import * as mime from 'mime-types';
import { BlobServiceClient } from '@azure/storage-blob';
import * as core from '@actions/core';
import { promises as fs } from 'fs';
import { walk } from './util';
import { basename, relative } from 'path';
import * as glob from 'glob';

export async function upload(
  connectionString: string,
  name: string,
  path: string,
  container: string,
  cleanup: boolean,
) {
  const serviceClient =
    BlobServiceClient.fromConnectionString(connectionString);

  // Create container if necessary
  core.info(`Creating a container "${container}" ...`);
  const containerClient = serviceClient.getContainerClient(container);
  if (!(await containerClient.exists())) {
    await containerClient.create();
  }

  // Remove blobs under the 'name'
  if (cleanup) {
    for await (const blob of containerClient.listBlobsFlat()) {
      if (!blob.name.startsWith(name + '/')) {
        continue;
      }
      const blockClient = containerClient.getBlockBlobClient(blob.name);
      await blockClient.delete();
    }
  }

  const uploadFileWithContentType = async (src: string, dst: string) => {
    const mt = mime.lookup(src);
    const blobHTTPHeaders = mt
      ? {
          blobContentType: mt,
        }
      : {};
    const blockClient = containerClient.getBlockBlobClient(dst);
    await blockClient.uploadFile(src, {
      blobHTTPHeaders,
    });
  };

  // Upload the file/directory
  const paths = glob.sync(path);
  for (const path of paths) {
    const stat = await fs.lstat(path);
    if (stat.isDirectory()) {
      for (const src of await walk(path)) {
        const dst = [name, relative(path, src).replace(/\\/g, '/')].join('/');
        core.info(`Uploading ${src} to ${dst} ...`);
        await uploadFileWithContentType(src, dst);
      }
    } else {
      const dst = [name, basename(path)].join('/');
      core.info(`Uploading ${path} to ${dst} ...`);
      await uploadFileWithContentType(path, dst);
    }
  }
}
