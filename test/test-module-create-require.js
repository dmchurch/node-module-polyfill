// Taken from Node v12.11 tests

'use strict';

require('../dist/index');
const assert = require('assert');
const path = require('path');

const { createRequire, createRequireFromPath } = require('module');
const { URL } = require('url');

const p = path.resolve(__dirname, 'fixtures', 'fake.js');
const u = new URL(`file://${p}`);

describe("createRequire() with filename", function() {
  it("allows createRequireFromPath(path)", function() {
    const req = createRequireFromPath(p);
    assert.strictEqual(req('./baz'), 'perhaps I work');
  });

  it("allows createRequire(path)", function() {
    const req = createRequire(p);
    assert.strictEqual(req('./baz'), 'perhaps I work');
  });

  it("allows createRequire(file:// URL)", function() {
    const reqToo = createRequire(u);
    assert.deepStrictEqual(reqToo('./experimental'), { ofLife: 42 });
  });

  it("fails on non-file URL", function() {
    assert.throws(() => {
      createRequire('https://github.com/nodejs/node/pull/27405/');
    }, {
      code: 'ERR_INVALID_ARG_VALUE'
    });    
  });

  it("fails on ../", function() {
    assert.throws(() => {
      createRequire('../');
    }, {
      code: 'ERR_INVALID_ARG_VALUE'
    });    
  });

  it("fails on {}", function() {
    assert.throws(() => {
      createRequire({});
    }, {
      code: 'ERR_INVALID_ARG_VALUE',
      message: 'The argument \'filename\' must be a file URL object, file URL ' +
               'string, or absolute path string. Received {}'
    });
  })
});