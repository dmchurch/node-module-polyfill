/// <reference path="../types/index.d.ts" />
/// <reference path="../src/node-internals/module.ts" />

import path from 'path';
import Module from 'module';

export type ModuleModule = typeof Module;

const origModule = shallowCopy(Module);
const origModulePrototype = Object.getOwnPropertyDescriptors(Module.prototype);
const distPath = path.resolve(__dirname,"../dist");

function debug(...args:any[]):void {
    if (false) {
        console.debug(...args);
    }
}

function shallowCopy(val:any):any {
    const copy:any = {};
    for (const key of Object.getOwnPropertyNames(val)) {
        copy[key] = val[key];
    }
    return copy;
}

export function getCurrent<K extends keyof ModuleModule>(propName: K):ModuleModule[K] {
    return Module[propName];
}

export function getOriginal<K extends keyof ModuleModule>(propName: K):ModuleModule[K] {
    return origModule[propName];
}

export function listOverrides():[keyof ModuleModule, boolean][] {
    const overrides:[keyof ModuleModule, boolean][] = [];
    const polyfills:(keyof ModuleModule)[] = [
        // These are in reverse order of polyfilling, because this is the order they will be
        // forced into place during testing
        'createRequire',
        'createRequireFromPath',
        '_resolveFilename',
        '_resolveLookupPaths',
    ];
    for (const propName of polyfills) {
        overrides.push([propName, getCurrent(propName) !== getOriginal(propName)]);
    }
    return overrides;
}

export function clearCache():void {
    debug("clearing cache");
    for (const id of Object.keys(require.cache)) {
        if (id.startsWith(distPath)) {
            delete require.cache[id];
        }
    }
    debug("origModule:",Object.keys(origModule));
    for (const key of (Object.getOwnPropertyNames(Module) as (keyof ModuleModule)[])) {
        if (Module[key] !== origModule[key]) {
            if (typeof origModule[key] === "undefined") {
                debug(`deleting ${key} from Module`);
                delete Module[key];
            } else {
                debug(`setting Module.${key} to ${origModule[key]}`);
                Module[key] = origModule[key];
            }
        }
    }
    const descriptors = Object.getOwnPropertyDescriptors(Module.prototype);
    for (const key of Object.keys(descriptors) as (keyof NodeModule)[]) {
        try {
            expect(descriptors[key]).toStrictEqual(origModulePrototype[key]);
        } catch (e) {
            if (typeof origModulePrototype[key] === "undefined") {
                debug(`deleting ${key} from Module.prototype`);
                delete Module.prototype[key];
            } else {
                debug(`setting Module.prototype.${key} to ${origModulePrototype[key]}`);
                Object.defineProperty(Module.prototype, key, origModulePrototype[key]);
            }
        }
    }
    jest.resetModuleRegistry();
}

export function doPolyfill(allowDebugOutput?:boolean|null, forcePolyfills?:string|false) {
    const origDebugFlag = process.env.DEBUG_NODE_MODULE_POLYFILL;
    const origForceFlag = process.env.FORCE_NODE_MODULE_POLYFILL;
    if (typeof allowDebugOutput === "boolean") {
        if (allowDebugOutput) {
            process.env.DEBUG_NODE_MODULE_POLYFILL = "1";
        } else {
            delete process.env.DEBUG_NODE_MODULE_POLYFILL;
        }
    }
    if (typeof forcePolyfills === "string") {
        process.env.FORCE_NODE_MODULE_POLYFILL = forcePolyfills;
    } else if (forcePolyfills === false) {
        delete process.env.FORCE_NODE_MODULE_POLYFILL;
    }
    try {
        require("../src/index");
    } finally {
        if (typeof origDebugFlag === "undefined") {
            delete process.env.DEBUG_NODE_MODULE_POLYFILL;
        } else {
            process.env.DEBUG_NODE_MODULE_POLYFILL = origDebugFlag;
        }
        if (typeof origForceFlag === "undefined") {
            delete process.env.FORCE_NODE_MODULE_POLYFILL;
        } else {
            process.env.FORCE_NODE_MODULE_POLYFILL = origForceFlag;
        }
    }
}