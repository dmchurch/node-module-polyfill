const TestSequencer = require('@jest/test-sequencer').default;

module.exports = class InitSequencer extends TestSequencer {
    sort(tests) {
        const inits = tests.filter(t=>t.path.endsWith('/init.ts'));
        tests = tests.filter(t=>!t.path.endsWith('/init.ts'));
        tests = super.sort(tests);
        tests = inits.concat(tests);
        return tests;
    }
}