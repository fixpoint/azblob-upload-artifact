import { BlobServiceClient } from '@azure/storage-blob';
import * as core from '@actions/core';
import { promises as fs } from 'fs';
import { walk } from './util';
import { basename, relative } from 'path';

export async function upload(
  connectionString: string,
  name: string,
  path: string,
  container: string,
  cleanup: boolean,
) {
  const serviceClient = await BlobServiceClient.fromConnectionString(
    connectionString,
  );

  // Create container if necessary
  core.info(`Creating a container "${container}" ...`);
  const containerClient = await serviceClient.getContainerClient(container);
  if (!(await containerClient.exists())) {
    await containerClient.create();
  }

  // Remove blobs under the 'name'
  if (cleanup) {
    for await (const blob of containerClient.listBlobsFlat()) {
      if (!blob.name.startsWith(name + '/')) {
        continue;
      }
      const blockClient = await containerClient.getBlockBlobClient(blob.name);
      await blockClient.delete();
    }
  }

  // Upload the file/directory
  const stat = await fs.lstat(path);
  if (stat.isDirectory()) {
    for (const src of await walk(path)) {
      const dst = [name, relative(path, src).replace(/\\/g, '/')].join('/');
      core.info(`Uploading ${src} to ${dst} ...`);
      const blockClient = await containerClient.getBlockBlobClient(dst);
      await blockClient.uploadFile(src);
    }
  } else {
    const dst = [name, basename(path)].join('/');
    core.info(`Uploading ${path} to ${dst} ...`);
    const blockClient = await containerClient.getBlockBlobClient(dst);
    await blockClient.uploadFile(path);
  }
}
