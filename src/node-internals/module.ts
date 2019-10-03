import path from 'path';
import Module from 'module';
import assert from 'assert';
import { URL } from 'url';
import { fileURLToPath } from './url';
import { ERR_INVALID_ARG_VALUE, ERR_INVALID_OPT_VALUE } from './error';
import { validateString } from './validators';

const isWindows = process.platform === 'win32';
const createRequireError = 'must be a file URL object, file URL string, or ' +
'absolute path string';

declare global {
  interface NodeModule {
    path: string;
  }

  namespace NodeJS {
    interface Module {
      path: string;
    }
    namespace Module {
      function _nodeModulePaths(path:string):string[];
      function _resolveFilename(request:string, parent:NodeModule, isMain:boolean, options?:{paths?:string[]}):string;
      function _resolveLookupPaths(request:string, parent:NodeModule, newReturn?:boolean/*=true*/):string[];
      function _findPath(request:string, paths:string[], isMain:boolean):string|false;

      var _extensions:NodeExtensions;
      var _cache:any;
    }
  }
}

class PoisonModule extends Module {
  constructor() { super('poison-module');}
  get id():string { throw "Poisoned";}
  set id(_:string) { } // gets called during constructor

  get filename():string { throw "Poisoned";}
  set filename(_:string) { } // gets called during constructor
  get paths():string[] { throw "Poisoned";}
}

export function poly_resolveLookupPaths(orig_resolveLookupPaths:typeof Module._resolveLookupPaths):typeof Module._resolveLookupPaths {
  function _resolveLookupPaths(request:string, parent:NodeModule, newReturn?:boolean):string[] {
    return orig_resolveLookupPaths(request, parent, typeof newReturn === 'undefined' ? true : newReturn);
  }
  return _resolveLookupPaths;
}

export function poly_resolveFilename(orig_resolveFilename:typeof Module._resolveFilename):typeof Module._resolveFilename {
  if ('_orig_resolveFilename' in orig_resolveFilename) {
    orig_resolveFilename = (<any>orig_resolveFilename)._orig_resolveFilename;
  }
  assert(!orig_resolveFilename.toString().includes("PoisonModule"));
  function _resolveFilename(request:string, parent:NodeModule, isMain:boolean, options?:{paths?:string[]}):string {
    try {
      // If {request} is a valid internal module, orig_resolveFilename will return it without
      // ever touching the "parent" we pass it. If it does, the poison pill will send it right back here.
      const simpleResolve = orig_resolveFilename(request, new PoisonModule, false);
      if (simpleResolve === request) {
        return request;
      }
    } catch (e) {
      if (e !== "Poisoned") {
        throw e;
      }
    }

    var paths:string[];

    if (typeof options === 'object' && options !== null) {
      if (Array.isArray(options.paths)) {
        const isRelative = request.startsWith('./') ||
            request.startsWith('../') ||
            (isWindows && request.startsWith('.\\') ||
            request.startsWith('..\\'));

        if (isRelative) {
          paths = options.paths;
        } else {
          const fakeParent = new Module('', null!);

          paths = [];

          for (var i = 0; i < options.paths.length; i++) {
            const path = options.paths[i];
            fakeParent.paths = Module._nodeModulePaths(path);
            const lookupPaths = Module._resolveLookupPaths(request, fakeParent);

            for (var j = 0; j < lookupPaths.length; j++) {
              if (!paths.includes(lookupPaths[j]))
                paths.push(lookupPaths[j]);
            }
          }
        }
      } else if (options.paths === undefined) {
        paths = Module._resolveLookupPaths(request, parent);
      } else {
        throw new ERR_INVALID_OPT_VALUE('options.paths', options.paths);
      }
    } else {
      paths = Module._resolveLookupPaths(request, parent);
    }

    // Look up the filename first, since that's the cache key.
    const filename = Module._findPath(request, paths, isMain);
    if (!filename) {
      const requireStack = [];
      for (var cursor:NodeModule|null = parent;
        cursor;
        cursor = cursor.parent) {
        requireStack.push(cursor.filename || cursor.id);
      }
      let message = `Cannot find module '${request}'`;
      if (requireStack.length > 0) {
        message = message + '\nRequire stack:\n- ' + requireStack.join('\n- ');
      }
      // eslint-disable-next-line no-restricted-syntax
      var err:any = new Error(message);
      err.code = 'MODULE_NOT_FOUND';
      err.requireStack = requireStack;
      throw err;
    }
    return filename;
  };
  _resolveFilename._orig_resolveFilename = orig_resolveFilename;
  return _resolveFilename;
}

function makeRequireFunction(mod:NodeModule, _redirects:null):NodeRequire {
  const Module = mod.constructor as typeof NodeJS.Module;

  let require:NodeRequire;
  require = function require(path:string):any {
    return mod.require(path);
  } as NodeRequire;

  function resolve(request:any, options?:{paths?:string[]}) {
    validateString(request, 'request');
    return Module._resolveFilename(request, mod, false, options);
  }

  require.resolve = resolve;

  function paths(request:string) {
    validateString(request, 'request');
    return Module._resolveLookupPaths(request, mod);
  }

  resolve.paths = paths;

  require.main = process.mainModule;

  // Enable support to add extra extension types.
  require.extensions = Module._extensions;

  require.cache = Module._cache;

  return require;
}
export function createRequire(filename:string|URL) {
  let filepath;

  if (filename instanceof URL ||
      (typeof filename === 'string' && !path.isAbsolute(filename))) {
      try {
      filepath = fileURLToPath(filename);
      } catch {
      throw new ERR_INVALID_ARG_VALUE('filename', filename,
                                      createRequireError);
      }
  } else if (typeof filename !== 'string') {
      throw new ERR_INVALID_ARG_VALUE('filename', filename, createRequireError);
  } else {
      filepath = filename;
  }
  return Module.createRequireFromPath(filepath);
}

export function createRequireFromPath(filename:string) {
  // Allow a directory to be passed as the filename
  const trailingSlash =
    filename.endsWith('/') || (isWindows && filename.endsWith('\\'));

  const proxyPath = trailingSlash ?
    path.join(filename, 'noop.js') :
    filename;

  const m = new Module(proxyPath);
  m.filename = proxyPath;

  m.paths = Module._nodeModulePaths(m.path);
  return makeRequireFunction(m, null);
}

export function getPathDescriptor():PropertyDescriptor {
  return {
    get: function getPath(this:NodeModule):string {
      return path.dirname(this.id);
    },
    set: function setPath(this:NodeModule, value:string):void {
      Object.defineProperty(this, "path", {
        value: value,
        configurable: true,
        writable: true,
      })
    },
    configurable: true,
  };
}
