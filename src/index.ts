/// <reference path="../types/index.d.ts" />

import Module from 'module';
import semver from 'semver';
import path from 'path';
import { poly_resolveLookupPaths, poly_resolveFilename, createRequire, createRequireFromPath, getPathDescriptor } from './node-internals/module';
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

function debug(...args:any[]):void {
    if (process.env.DEBUG_NODE_MODULE_POLYFILL) {
        console.debug(...args);
    }
}

const forced_polyfills = (process.env.FORCE_NODE_MODULE_POLYFILL||"").split(":");

function shouldOverride(prop:string):boolean {
    return process.env.FORCE_NODE_MODULE_POLYFILL == "*" || forced_polyfills.includes(prop);
}

if (typeof process.env.FORCE_NODE_MODULE_POLYFILL === "undefined" && semver.gte(process.versions.node, "12.2.0")) {
    debug(`Node version ${process.versions.node} >= 12.2.0, not polyfilling`);
} else {
    debug(`Node version ${process.versions.node} < 12.2.0, applying polyfills`);
    if (!('path' in module)) {
        debug("overriding module.path");
        Object.defineProperty(Module.prototype, 'path', getPathDescriptor());
    }

    if (shouldOverride("_resolveLookupPaths") || hasArgument(Module._resolveLookupPaths, "newReturn")) {
        debug("overriding Module._resolveLookupPaths()");
        Module._resolveLookupPaths = poly_resolveLookupPaths(Module._resolveLookupPaths);
    }

    if (shouldOverride("_resolveFilename") || !hasArgument(Module._resolveFilename, "options")) {
        debug("overriding Module._resolveFilename()");
        Module._resolveFilename = poly_resolveFilename(Module._resolveFilename);
    }

    if (shouldOverride("createRequireFromPath") ||
        !requireTest(Module.createRequireFromPath, __filename, "./node-internals/module") ||
        !requireTest(Module.createRequireFromPath, path.join(__dirname,path.sep), "./node-internals/module")) {
        debug("overriding Module.createRequireFromPath()");
        Module.createRequireFromPath = createRequireFromPath;
    }

    if (shouldOverride("createRequire") ||
        !requireTest(Module.createRequire, __filename, "./node-internals/module") ||
        !requireTest(Module.createRequire, path.join(__dirname,path.sep), "./node-internals/module") ||
        !requireTest(Module.createRequire, new URL(`file://${__filename}`), "./node-internals/module")) {
        debug("overriding Module.createRequire()");
        Module.createRequire = createRequire as any;
    }

}