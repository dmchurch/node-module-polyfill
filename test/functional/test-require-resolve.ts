import path from 'path';
import { doPolyfill, clearCache } from "../polyfill";
import Module from 'module';

const fixturesRelative = path.join("..","fixtures");
const fixturesAbsolute = path.resolve(__dirname, fixturesRelative);
const bazRelative = path.join(fixturesRelative,"baz")
const bazAbsolute = path.join(fixturesAbsolute,"baz.js");
const moduleRelative = "bazmodule";
const moduleAbsolute = path.join(fixturesAbsolute,"node_modules","bazmodule.js");

export default function defineRequireResolve() {
    let _require:NodeRequire;
    beforeAll(function() {
      doPolyfill(false);
      _require = Module.createRequire(__filename);
    });
  
    afterAll(clearCache);
  
    describe("require.resolve", function() {
        test("returns internal module name", function () {
            expect(_require.resolve("process")).toBe("process");
        });

        test("returns external module name", function() {
            expect(_require.resolve(bazRelative, {})).toBe(bazAbsolute);
        });

        test("resolves relative with custom path option", function() {
            expect(_require.resolve("./baz",{paths:[fixturesAbsolute]})).toBe(bazAbsolute);
        });

        test("resolves module with custom path option", function() {
            expect(_require.resolve(moduleRelative,{paths:[fixturesAbsolute]})).toBe(moduleAbsolute);
        });

        test("fails on non-string", function() {
            expect(()=>_require.resolve(null!)).toThrow("must be of type string");
        })
    });

    describe("require.resolve.paths", function() {
        test("returns null on internal modules", function() {
            expect(_require.resolve.paths("process")).toBeNull();
        })

        test("Has pwd in relative path lookup", function () {
            expect(_require.resolve.paths(bazRelative)).toContain(__dirname);
        });

        test("Does not have pwd in absolute path lookup", function () {
            expect(_require.resolve.paths(bazAbsolute)).not.toContain(__dirname);
        });

        test("Does not have pwd in module lookup", function () {
            expect(_require.resolve.paths(moduleRelative)).not.toContain(__dirname);
        });
    });
}