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

function functionalTest<T extends any[],R>(func:(...args:T)=>R, ...args:T):R|false {
    try {
        return func(...args);
    } catch (e) {
        return false;
    }
}

function requireTest(createRequire:((arg:any)=>(id:string)=>any)|undefined, requireArg:any,...moduleIds:string[]):boolean {
    if (!createRequire) {
        return false;
    }
    const requireFunc = functionalTest(createRequire, requireArg);
    if (requireFunc === false) return false;
    for (const moduleId of moduleIds) {
        if (functionalTest(requireFunc,moduleId) === false) return false;
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

    const packageDir_name = path.basename(path.dirname(__dirname));

    if (shouldOverride("_resolveFilename") ||
        !hasArgument(Module._resolveFilename, "options") ||
        functionalTest(Module._resolveFilename,`.${path.sep}${packageDir_name}${path.sep}package.json`,module,false,{paths:[path.resolve(__dirname,"..","..")]}) !== path.resolve(__dirname,"..","package.json")) {
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