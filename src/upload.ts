import * as mime from 'mime-types';
import { BlobServiceClient } from '@azure/storage-blob';
import * as core from '@actions/core';
import { promises as fs } from 'fs';
import { forEachConcurrently, walk } from './util';
import { basename, relative } from 'path';
import * as glob from 'glob';

const CONCURRENCY = 16;

// The SDK uploads a file over 256 MiB in blocks, 5 at a time by default.
const SDK_BLOCK_CONCURRENCY = 5;

// Blocks uploaded at a time per file, so that the requests in flight stay
// within CONCURRENCY. A single file keeps the SDK default, as before.
export function blockConcurrency(fileCount: number): number {
  const filesInFlight = Math.min(CONCURRENCY, fileCount);
  return Math.min(
    SDK_BLOCK_CONCURRENCY,
    Math.max(1, Math.floor(CONCURRENCY / filesInFlight)),
  );
}

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
    const stale: string[] = [];
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      if (blob.name.startsWith(prefix)) {
        stale.push(blob.name);
      }
    }
    core.info(`Removing ${stale.length} blobs under "${prefix}" ...`);
    await forEachConcurrently(
      stale,
      CONCURRENCY,
      (blobName) => `Failed to remove ${blobName}`,
      (blobName) =>
        containerClient.getBlockBlobClient(blobName).deleteIfExists(),
    );
  }

  const files = await collectFiles(name, path);
  const concurrency = blockConcurrency(files.size);

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
      concurrency,
    });
  };

  await forEachConcurrently(
    [...files],
    CONCURRENCY,
    ([dst, src]) => `Failed to upload ${src} to ${dst}`,
    ([dst, src]) => {
      core.info(`Uploading ${src} to ${dst} ...`);
      return uploadFileWithContentType(src, dst);
    },
  );
}
