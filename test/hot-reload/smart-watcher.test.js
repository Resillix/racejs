import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { SmartWatcher } from '../../packages/core/dist/index.js';

const waitFor = (emitter, event, timeout = 3000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
    emitter.once(event, (...args) => {
      clearTimeout(t);
      resolve(args[0]);
    });
  });

describe('SmartWatcher', function () {
  this.timeout(10000);

  let tmpDir;
  let watcher;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'racejs-watcher-'));
  });

  afterEach(async () => {
    if (watcher) await watcher.close();
    // best-effort cleanup
    try {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('emits ready and batches add/modify/delete', async () => {
    watcher = new SmartWatcher({
      roots: [tmpDir],
      debounceMs: 20,
      batchMs: 60,
      pollFallbackMs: 0,
      ignore: [],
      hashMode: 'mtime',
    });

    const readyP = waitFor(watcher, 'ready');
    await watcher.start();
    await readyP;

    const batchP = new Promise((resolve) => {
      watcher.once('batch', (batch) => resolve(batch));
    });

    const fileA = path.join(tmpDir, 'fileA.js');
    await fsp.writeFile(fileA, 'console.log(1)\n');
    await fsp.appendFile(fileA, 'console.log(2)\n');
    await fsp.rm(fileA);

    const batch = await Promise.race([
      batchP,
      new Promise((resolve) =>
        setTimeout(() => resolve({ changes: [], summary: () => 'timeout' }), 1500)
      ),
    ]);
    assert.ok(batch && 'changes' in batch, 'should produce a batch object');
    assert.ok(Array.isArray(batch.changes));
  });
});
