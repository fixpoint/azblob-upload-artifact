import { promises as fs } from 'fs';
import { join } from 'path';

export async function walk(dir: string) {
  async function _walk(dir: string, fileList: string[]) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const path = join(dir, file);
      const stat = await fs.lstat(path);
      if (stat.isDirectory()) {
        fileList = await _walk(path, fileList);
      } else {
        fileList.push(path);
      }
    }
    return fileList;
  }
  return await _walk(dir, []);
}

// Runs fn over items with at most `limit` calls in flight.
// After the first failure no new item is started. Calls already in flight
// are awaited, so nothing is still writing when this returns, and every
// failure is reported with `describe(item)`, not only the first.
export async function forEachConcurrently<T>(
  items: readonly T[],
  limit: number,
  describe: (item: T) => string,
  fn: (item: T) => Promise<unknown>,
) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`limit must be a positive integer: ${limit}`);
  }
  let next = 0;
  const errors: string[] = [];
  const worker = async () => {
    while (errors.length === 0 && next < items.length) {
      const item = items[next++];
      try {
        await fn(item);
      } catch (e) {
        errors.push(`${describe(item)}: ${e instanceof Error ? e.message : e}`);
      }
    }
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  if (errors.length === 1) {
    throw new Error(errors[0]);
  }
  if (errors.length > 1) {
    throw new Error(
      `${errors.length} operations failed:\n${errors.join('\n')}`,
    );
  }
}
