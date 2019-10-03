import defineModuleCreateRequire from "./test-module-create-require";
import defineModuleCreateRequireFromDirectory from "./test-module-create-require-from-directory";
import defineRequireResolve from "./test-require-resolve";

export function defineFunctionalTests() {
    defineModuleCreateRequire();
    defineModuleCreateRequireFromDirectory();
    defineRequireResolve();
}