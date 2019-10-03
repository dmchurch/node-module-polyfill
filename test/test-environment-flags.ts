import mockConsole from 'jest-mock-console';
import semver from 'semver';
import { doPolyfill, clearCache, getOriginal, ModuleModule, getCurrent } from './polyfill';

describe("Polyfill verbosity", function() {
    test("Creates output when DEBUG_NODE_MODULE_POLYFILL is set", function() {
        clearCache();
        const restoreConsole = mockConsole("debug");
        doPolyfill(true);
        expect(console.debug).toBeCalled();
        restoreConsole();
    });

    test("Is silent when DEBUG_NODE_MODULE_POLYFILL is unset", function() {
        clearCache();
        const restoreConsole = mockConsole("debug");
        doPolyfill(false);
        expect(console.debug).not.toBeCalled();
        restoreConsole();
    });
});

describe("Forcing polyfills", function() {
    test("Override version check when FORCE_NODE_MODULE_POLYFILL is set", function() {
        clearCache();
        const restoreConsole = mockConsole("debug");
        doPolyfill(true, "1");
        expect(console.debug).toBeCalled();
        expect((console.debug as any).mock.calls[0][0]).toMatch(/applying polyfills$/);
        restoreConsole();
    });

    test("Do not override version check when FORCE_NODE_MODULE_POLYFILL is unset", function() {
        if (semver.lt(process.versions.node, "12.2.0")) {
            return;
        }
        clearCache();
        const restoreConsole = mockConsole("debug");
        doPolyfill(true, false);
        expect(console.debug).toBeCalled();
        expect((console.debug as any).mock.calls[0][0]).not.toMatch(/applying polyfills$/);
        restoreConsole();
    });

    test.each`
        method
        ${"_resolveLookupPaths"}
        ${"_resolveFilename"}
        ${"createRequireFromPath"}
        ${"createRequire"}
    `("Use polyfill for $method when FORCE_NODE_MODULE_POLYFILL includes it", function(args:{method:keyof ModuleModule}) {
        const method = args.method;
        clearCache();
        doPolyfill(false,`x:${method}:y`);
        expect(getCurrent(method)).not.toBe(getOriginal(method));
    });
});