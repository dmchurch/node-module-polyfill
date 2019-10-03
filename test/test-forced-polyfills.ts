import { listOverrides, clearCache } from "./polyfill";
import { defineFunctionalTests } from "./functional";

function performFunctionalTests():void {
    jest.isolateModules(() => {
        defineFunctionalTests();
    });
}

function createSuite(polyForces:string[]) {
    const forceVar = polyForces.join(":");
    const description = polyForces.length == 2 ?
        `Functional tests with ${polyForces[1]} overridden` :
        `... and with ${polyForces[polyForces.length-1]} overridden`;
    describe(description, function() {
        beforeAll(function() {
            clearCache();
            process.env.FORCE_NODE_MODULE_POLYFILL = forceVar;
        });
        performFunctionalTests();
    });
}

const overrides = listOverrides();
const originalForce = process.env.FORCE_NODE_MODULE_POLYFILL;
const polyForces:string[] = [originalForce||""];
for (const [polyfill,overridden] of overrides) {
    if (!overridden) {
        polyForces.push(polyfill);
        createSuite(polyForces);
    }
}