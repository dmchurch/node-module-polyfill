import { doPolyfill, clearCache } from "./polyfill"

test("Polyfill loads without error", function() {
    doPolyfill(); // This will be the only time the loading output actually displays
    clearCache();
})