/// <reference path="../types/index.d.ts" />

import Module from 'module';
import semver from 'semver';
import path from 'path';
import { getPath, poly_resolveLookupPaths, poly_resolveFilename, createRequire, createRequireFromPath } from './node-internals/module';
import { URL } from 'url';

function hasArgument(func:Function, argName:string):boolean {
    const argmatch = /^function[^(]*\(([^)]*)\)/.exec(func.toString());
    if (!argmatch) return false;
    return argmatch[1].split(/,\s*/).includes(argName);
}

function requireTest(createRequire:((arg:any)=>(id:string)=>any)|undefined, requireArg:any,...moduleIds:string[]):boolean {
    if (!createRequire) {
        return false;
    }
    try {
        const requireFunc = createRequire(requireArg);
        for (const moduleId of moduleIds) {
            requireFunc(moduleId);
        }
    } catch (e) {
        return false;
    }
    return true;
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

    if (!requireTest(Module.createRequireFromPath, __filename, "./node-internals/module") ||
        !requireTest(Module.createRequireFromPath, path.join(__dirname,path.sep), "./node-internals/module")) {
        console.debug("overriding Module.createRequireFromPath()");
        Module.createRequireFromPath = createRequireFromPath;
    }

    if (!requireTest(Module.createRequire, __filename, "./node-internals/module") ||
        !requireTest(Module.createRequire, path.join(__dirname,path.sep), "./node-internals/module") ||
        !requireTest(Module.createRequire, new URL(`file://${__filename}`), "./node-internals/module")) {
        console.debug("overriding Module.createRequire()");
        Module.createRequire = createRequire;
    }

}