import { URL } from "url"
import { validateString } from "../src/node-internals/validators";
import assert from 'assert';

let win32_url;
jest.isolateModules(() => {
  process.env.__TEST_WIN32_API = "1";
  win32_url = require("../src/node-internals/url")
  delete process.env.__TEST_WIN32_API;
});
type FileUrlToPath = (url:URL|string)=>string;
const poly_url = require("../src/node-internals/url");

const win32_fileURLToPath:FileUrlToPath = (win32_url as any).poly_fileURLToPath;
const poly_fileURLToPath:FileUrlToPath = poly_url.poly_fileURLToPath;
const fileURLToPath:FileUrlToPath = poly_url.fileURLToPath;

describe("validateString()", function() {
  test("works on a string", function() {
    validateString("test", "test");
  });
  test("fails on a non-string", function() {
    assert.throws(()=>validateString(null,"null"), {
      code: 'ERR_INVALID_ARG_TYPE'
    });
  })
});

describe("NodeError", function() {
  function getError() {
    try {
      validateString(null,"null")
    } catch (e) {
      return e;
    }
  }

  test("reports error code", function() {
    expect(getError().code).toBe('ERR_INVALID_ARG_TYPE');
  });

  test("code is in toString", function() {
    expect(getError().toString()).toContain('ERR_INVALID_ARG_TYPE');
  })

  test("can change error code", function() {
    const e = getError();
    e.code="__TEST__";
    expect(e.code).toBe('__TEST__');
  });
})


// Ensure that the internal APIs we've overridden have the same value as they should
// Taken from Node v12.11 tests

// /test/parallel/test-url-fileurltopath.js

describe.each`
    function               | name
    ${fileURLToPath}       | ${"Chosen URL.fileURLToPath"}
    ${poly_fileURLToPath}  | ${"Polyfill URL.fileURLToPath"}
    ${win32_fileURLToPath} | ${"Win32 API URL.fileURLToPath"}
    `("$name() functionality", function(args:{function:typeof fileURLToPath}) {

  const url = {
    fileURLToPath: args.function,
  };
  const isWindows = (process.platform === 'win32' || url.fileURLToPath === win32_fileURLToPath);

  function testInvalidArgs(...args:any[]) {
    for (const arg of args) {
      assert.throws(() => url.fileURLToPath(arg), {
        code: 'ERR_INVALID_ARG_TYPE'
      });
    }
  }

  test('Input must be string or URL', function() {
    // Input must be string or URL
    testInvalidArgs(null, undefined, 1, {}, true);
  });

  test('Input must be a file URL', function() {
    assert.throws(() => url.fileURLToPath('https://a/b/c'), {
      code: 'ERR_INVALID_URL_SCHEME'
    });      
  });

  test('Input with host', function (){
    const withHost = new URL('file://host/a');
  
    if (isWindows) {
      assert.strictEqual(url.fileURLToPath(withHost), '\\\\host\\a');
    } else {
      assert.throws(() => url.fileURLToPath(withHost), {
        code: 'ERR_INVALID_FILE_URL_HOST'
      });
    }
  });
  
  test('Input with bad characters', function(){
    if (isWindows) {
      assert.throws(() => url.fileURLToPath('file:///C:/a%2F/'), {
        code: 'ERR_INVALID_FILE_URL_PATH'
      });
      assert.throws(() => url.fileURLToPath('file:///C:/a%5C/'), {
        code: 'ERR_INVALID_FILE_URL_PATH'
      });
      assert.throws(() => url.fileURLToPath('file:///?:/'), {
        code: 'ERR_INVALID_FILE_URL_PATH'
      });
    } else {
      assert.throws(() => url.fileURLToPath('file:///a%2F/'), {
        code: 'ERR_INVALID_FILE_URL_PATH'
      });
    }
  });
  
  test("Input string same as input URL", function() {
    let testCases;
    if (isWindows) {
      testCases = [
        // Lowercase ascii alpha
        { path: 'C:\\foo', fileURL: 'file:///C:/foo' },
        // Uppercase ascii alpha
        { path: 'C:\\FOO', fileURL: 'file:///C:/FOO' },
        // dir
        { path: 'C:\\dir\\foo', fileURL: 'file:///C:/dir/foo' },
        // trailing separator
        { path: 'C:\\dir\\', fileURL: 'file:///C:/dir/' },
        // dot
        { path: 'C:\\foo.mjs', fileURL: 'file:///C:/foo.mjs' },
        // space
        { path: 'C:\\foo bar', fileURL: 'file:///C:/foo%20bar' },
        // question mark
        { path: 'C:\\foo?bar', fileURL: 'file:///C:/foo%3Fbar' },
        // number sign
        { path: 'C:\\foo#bar', fileURL: 'file:///C:/foo%23bar' },
        // ampersand
        { path: 'C:\\foo&bar', fileURL: 'file:///C:/foo&bar' },
        // equals
        { path: 'C:\\foo=bar', fileURL: 'file:///C:/foo=bar' },
        // colon
        { path: 'C:\\foo:bar', fileURL: 'file:///C:/foo:bar' },
        // semicolon
        { path: 'C:\\foo;bar', fileURL: 'file:///C:/foo;bar' },
        // percent
        { path: 'C:\\foo%bar', fileURL: 'file:///C:/foo%25bar' },
        // backslash
        { path: 'C:\\foo\\bar', fileURL: 'file:///C:/foo/bar' },
        // backspace
        { path: 'C:\\foo\bbar', fileURL: 'file:///C:/foo%08bar' },
        // tab
        { path: 'C:\\foo\tbar', fileURL: 'file:///C:/foo%09bar' },
        // newline
        { path: 'C:\\foo\nbar', fileURL: 'file:///C:/foo%0Abar' },
        // carriage return
        { path: 'C:\\foo\rbar', fileURL: 'file:///C:/foo%0Dbar' },
        // latin1
        { path: 'C:\\fóóbàr', fileURL: 'file:///C:/f%C3%B3%C3%B3b%C3%A0r' },
        // Euro sign (BMP code point)
        { path: 'C:\\€', fileURL: 'file:///C:/%E2%82%AC' },
        // Rocket emoji (non-BMP code point)
        { path: 'C:\\🚀', fileURL: 'file:///C:/%F0%9F%9A%80' }
      ];
    } else {
      testCases = [
        // Lowercase ascii alpha
        { path: '/foo', fileURL: 'file:///foo' },
        // Uppercase ascii alpha
        { path: '/FOO', fileURL: 'file:///FOO' },
        // dir
        { path: '/dir/foo', fileURL: 'file:///dir/foo' },
        // trailing separator
        { path: '/dir/', fileURL: 'file:///dir/' },
        // dot
        { path: '/foo.mjs', fileURL: 'file:///foo.mjs' },
        // space
        { path: '/foo bar', fileURL: 'file:///foo%20bar' },
        // question mark
        { path: '/foo?bar', fileURL: 'file:///foo%3Fbar' },
        // number sign
        { path: '/foo#bar', fileURL: 'file:///foo%23bar' },
        // ampersand
        { path: '/foo&bar', fileURL: 'file:///foo&bar' },
        // equals
        { path: '/foo=bar', fileURL: 'file:///foo=bar' },
        // colon
        { path: '/foo:bar', fileURL: 'file:///foo:bar' },
        // semicolon
        { path: '/foo;bar', fileURL: 'file:///foo;bar' },
        // percent
        { path: '/foo%bar', fileURL: 'file:///foo%25bar' },
        // backslash
        { path: '/foo\\bar', fileURL: 'file:///foo%5Cbar' },
        // backspace
        { path: '/foo\bbar', fileURL: 'file:///foo%08bar' },
        // tab
        { path: '/foo\tbar', fileURL: 'file:///foo%09bar' },
        // newline
        { path: '/foo\nbar', fileURL: 'file:///foo%0Abar' },
        // carriage return
        { path: '/foo\rbar', fileURL: 'file:///foo%0Dbar' },
        // latin1
        { path: '/fóóbàr', fileURL: 'file:///f%C3%B3%C3%B3b%C3%A0r' },
        // Euro sign (BMP code point)
        { path: '/€', fileURL: 'file:///%E2%82%AC' },
        // Rocket emoji (non-BMP code point)
        { path: '/🚀', fileURL: 'file:///%F0%9F%9A%80' },
      ];
    }
  
    for (const { path, fileURL } of testCases) {
      const fromString = url.fileURLToPath(fileURL);
      assert.strictEqual(fromString, path);
      const fromURL = url.fileURLToPath(new URL(fileURL));
      assert.strictEqual(fromURL, path);
    }
  });
    
});


