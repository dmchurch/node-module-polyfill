/// <reference path="../types/index.d.ts" />

import Module from 'module';
import semver from 'semver';
import { getPath, poly_resolveLookupPaths, poly_resolveFilename, createRequire, createRequireFromPath } from './node-internals/module';

function hasArgument(func:Function, argName:string):boolean {
    const argmatch = /^function[^(]*\(([^)]*)\)/.exec(func.toString());
    if (!argmatch) return false;
    return argmatch[1].split(/,\s*/).includes(argName);
}

if (semver.gte(process.versions.node, "12.2.0")) {
    console.debug(`Node version ${process.versions.node} >= 12.2.0, not polyfilling`);
} else {
    console.debug(`Node version ${process.versions.node} < 12.2.0, applying polyfills`);
    if (!('path' in module)) {
        console.debug("overriding module.path");
        Object.defineProperty(Module.prototype, 'path', {
            get: getPath,
        })
    }

    if (hasArgument(Module._resolveLookupPaths, "newReturn")) {
        console.debug("overriding Module._resolveLookupPaths()");
        Module._resolveLookupPaths = poly_resolveLookupPaths(Module._resolveLookupPaths);
    }

    if (!hasArgument(Module._resolveFilename, "options")) {
        console.debug("overriding Module._resolveFilename()");
        Module._resolveFilename = poly_resolveFilename(Module._resolveFilename);
    }

    if (!('createRequire' in (Module as any))) {
        console.debug("overriding Module.createRequire()");
        Module.createRequire = createRequire;
    }

    if (!('createRequireFromPath' in (Module as any))) {
        console.debug("overriding Module.createRequireFromPath()");
        Module.createRequireFromPath = createRequireFromPath;
    }
}