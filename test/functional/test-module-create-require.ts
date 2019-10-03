// Taken from Node v12.11 tests

/// <reference path="../../types/index.d.ts" />

import assert from 'assert';
import path from 'path';

import Module from 'module';
import { URL } from 'url';
import { doPolyfill, clearCache } from '../polyfill';

const p = path.resolve(__dirname, '..', 'fixtures', 'fake.js');
const u = new URL(`file://${p}`);

export default function defineModuleCreateRequire() {
  beforeAll(function() {
    doPolyfill(false);
  });

  afterAll(clearCache);

  describe("createRequire() with filename", function() {
    test("allows createRequireFromPath(path)", function() {
      const req = Module.createRequireFromPath(p);
      assert.strictEqual(req('./baz'), 'perhaps I work');
    });

    test("allows createRequire(path)", function() {
      const req = Module.createRequire(p);
      assert.strictEqual(req('./baz'), 'perhaps I work');
    });

    test("allows createRequire(file:// URL)", function() {
      const reqToo = Module.createRequire(u);
      assert.deepEqual(reqToo('./experimental'), { ofLife: 42 });
    });

    test("fails on non-file URL", function() {
      assert.throws(() => {
        Module.createRequire('https://github.com/nodejs/node/pull/27405/');
      }, {
        code: 'ERR_INVALID_ARG_VALUE'
      });    
    });

    test("fails on ../", function() {
      assert.throws(() => {
        Module.createRequire('../');
      }, {
        code: 'ERR_INVALID_ARG_VALUE'
      });    
    });

    test("fails on {}", function() {
      assert.throws(() => {
        Module.createRequire({} as any);
      }, {
        code: 'ERR_INVALID_ARG_VALUE',
        message: 'The argument \'filename\' must be a file URL object, file URL ' +
                'string, or absolute path string. Received {}'
      });
    })
  });
}