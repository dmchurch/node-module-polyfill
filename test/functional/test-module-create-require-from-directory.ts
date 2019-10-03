// Taken from Node v12.11 tests

/// <reference path="../../types/index.d.ts" />

import assert from 'assert';
import path from 'path';

import Module from 'module';
import { doPolyfill, clearCache } from '../polyfill';

const fixPath = path.resolve(__dirname, '..', 'fixtures');
const p = path.join(fixPath, path.sep);

export default function defineModuleCreateRequireFromDirectory() {

  beforeAll(function() {
    clearCache();
    doPolyfill(false);
  });

  afterAll(clearCache);

  describe("Module.createRequire() with directory", function() {
    test("allows createRequireFromPath(path/)", function() {
      const req = Module.createRequireFromPath(p);
      assert.strictEqual(req('./baz'), 'perhaps I work');
    });

    test("allows createRequire(path/)", function() {
      const req = Module.createRequire(p);
      assert.strictEqual(req('./baz'), 'perhaps I work');
    });

    test("fails when called as filename", function() {
      const reqFromNotDir = Module.createRequireFromPath(fixPath);
      assert.throws(() => {
        reqFromNotDir('./baz');
      }, { code: 'MODULE_NOT_FOUND' });
    });
  });
}