// Taken from Node v12.11 tests

'use strict';

require('../dist/index');
const assert = require('assert');
const path = require('path');

const { createRequire, createRequireFromPath } = require('module');

const fixPath = path.resolve(__dirname, 'fixtures');
const p = path.join(fixPath, path.sep);


describe("createRequire() with directory", function() {
  it("allows createRequireFromPath(path/)", function() {
    const req = createRequireFromPath(p);
    assert.strictEqual(req('./baz'), 'perhaps I work');
  });

  it("allows createRequire(path/)", function() {
    const req = createRequire(p);
    assert.strictEqual(req('./baz'), 'perhaps I work');
  });

  it("fails when called as filename", function() {
    const reqFromNotDir = createRequireFromPath(fixPath);
    assert.throws(() => {
      reqFromNotDir('./baz');
    }, { code: 'MODULE_NOT_FOUND' });
  });
});

