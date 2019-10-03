'use strict';
console.debug("in assert-throws-polyfill.js file");
const assert = require('assert');

function tryBlock(block) {
    try {
        block();
    } catch (e) {
        return e;
    }
}

function testThrows(throws) {
    try {
        assert.throws(() => {
            var e = new Error("test");
            e.code = "TEST_THROWS_ERROR";
            throw e;
        }, {
            code: "TEST_THROWS_ERROR"
        });
        return true;
    } catch (e) {
        return false;
    }
}

function poly_assertThrows(origAssertThrows) {
    function throws(block, expected, message) {
        var details = '';
        if (!expected || typeof expected === "function") {
            return origAssertThrows(block, expected, message);
        }
        const actual = tryBlock(block);
        if (actual === undefined) {
            assert.fail(actual, expected, `Missing expected exception`);
        }
        for (const k of Object.keys(expected)) {
            try {
                assert.deepStrictEqual(actual[k],expected[k]);
            } catch (e) {
                //console.log("actual/expected:", actual, expected);
                throw actual;
            }
        }
    }
    return throws;
}

if (!testThrows(assert.throws)) {
    assert.throws = poly_assertThrows(assert.throws);
}