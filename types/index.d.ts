declare global {
    namespace NodeJS.Module {
        var createRequire: ((filename: string | URL) => ((path: string) => any));
    }
}
export {};
