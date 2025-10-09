import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ModuleReloader } from '../../packages/core/dist/index.js';

describe('ModuleReloader', function () {
  this.timeout(10000);

  let tmpDir;
  let modPath;
  const reloader = new ModuleReloader();

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'racejs-reloader-'));
    modPath = path.join(tmpDir, 'mod.js');
  });

  afterEach(async () => {
    try {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('reloads module after change', async () => {
    await fsp.writeFile(modPath, 'export const value = 1;');
    const r1 = await reloader.reload(modPath);
    assert.equal(r1.success, true);
    assert.equal(r1.module.value, 1);

    await fsp.writeFile(modPath, 'export const value = 2;');
    const r2 = await reloader.reload(modPath);
    assert.equal(r2.success, true);
    assert.equal(r2.module.value, 2);
  });
});
