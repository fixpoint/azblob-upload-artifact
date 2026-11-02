import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import * as glob from 'glob';
import { collectFiles } from '../src/upload';

describe('collectFiles', () => {
  const cwd = process.cwd();
  before(() => {
    process.chdir(mkdtempSync(join(tmpdir(), 'collect-files-')));
    mkdirSync('site/sub', { recursive: true });
    writeFileSync('site/index.html', '');
    writeFileSync('site/sub/page.html', '');
    mkdirSync('dup/a', { recursive: true });
    writeFileSync('dup/a/x.txt', 'from the directory');
    writeFileSync('dup/x.txt', 'from the file');
  });
  after(() => process.chdir(cwd));

  it('maps a directory to blobs under name', async () => {
    const files = await collectFiles('my/artifact', 'site');
    assert.deepEqual(Object.fromEntries(files), {
      'my/artifact/index.html': join('site', 'index.html'),
      'my/artifact/sub/page.html': join('site', 'sub', 'page.html'),
    });
  });

  it('maps a single file to name/basename', async () => {
    const files = await collectFiles('n', 'site/index.html');
    assert.deepEqual(Object.fromEntries(files), {
      'n/index.html': join('site', 'index.html'),
    });
  });

  it('keeps the source matched last when two map to the same blob', async () => {
    // dup/a (a directory holding x.txt) and dup/x.txt both map to n/x.txt.
    const matched = glob.sync('dup/*');
    assert.equal(matched.length, 2);
    const last =
      matched[1] === join('dup', 'a')
        ? join('dup', 'a', 'x.txt')
        : join('dup', 'x.txt');
    const files = await collectFiles('n', 'dup/*');
    assert.deepEqual([...files.keys()], ['n/x.txt']);
    assert.equal(files.get('n/x.txt'), last);
  });
});
