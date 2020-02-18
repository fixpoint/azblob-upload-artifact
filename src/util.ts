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
