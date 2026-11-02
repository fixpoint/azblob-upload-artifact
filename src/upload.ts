import * as mime from 'mime-types';
import { BlobServiceClient } from '@azure/storage-blob';
import * as core from '@actions/core';
import { promises as fs } from 'fs';
import { walk } from './util';
import { basename, relative } from 'path';
import * as glob from 'glob';

// Maps each destination blob name to the local file uploaded there.
// When two sources map to the same blob the later one wins, which is what
// uploading them one after another used to end with.
export async function collectFiles(
  name: string,
  path: string,
): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const add = (dst: string, src: string) => {
    const previous = files.get(dst);
    if (previous !== undefined) {
      core.info(`Using ${src} instead of ${previous} for ${dst}`);
    }
    files.set(dst, src);
  };
  const paths = glob.sync(path.replace(/\\/g, '/'));
  for (const path of paths) {
    const stat = await fs.lstat(path);
    if (stat.isDirectory()) {
      for (const src of await walk(path)) {
        add([name, relative(path, src).replace(/\\/g, '/')].join('/'), src);
      }
    } else {
      add([name, basename(path)].join('/'), path);
    }
  }
  return files;
}

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
    // Without a prefix the service lists every blob in the container,
    // including those of other artifacts sharing it. The startsWith check
    // keeps the deletion scoped even if the service matched more widely.
    const prefix = name + '/';
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      if (!blob.name.startsWith(prefix)) {
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

  const files = await collectFiles(name, path);
  for (const [dst, src] of files) {
    core.info(`Uploading ${src} to ${dst} ...`);
    await uploadFileWithContentType(src, dst);
  }
}
