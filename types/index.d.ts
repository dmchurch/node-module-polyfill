declare global {
    namespace NodeJS.Module {
        var createRequire: ((filename: string | URL) => NodeRequire);
    }
}
export {};
