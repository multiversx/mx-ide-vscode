import { assert } from 'chai';
import { ErdpyVersionChecker } from '../erdpyVersionChecker';

describe("test compare local version with min version", () => {
    it("local version 'erdpy 1.0.2' should return false", () => {
        let isOk = ErdpyVersionChecker.isVersionOk('erdpy 1.0.2')
        assert.equal(isOk, false)
    });
    it("local version 'erdpy 1.0.9.1' should return false", () => {
        let isOk = ErdpyVersionChecker.isVersionOk('erdpy 1.0.9.1')
        assert.equal(isOk, false)
    })

    it("local version 'erdpy 1.0.10' should return false", () => {
        let isOk = ErdpyVersionChecker.isVersionOk('erdpy 1.0.10')
        assert.equal(isOk, false)
    })
    it("local version 'erdpy 1.0.11' should return true", () => {
        let isOk = ErdpyVersionChecker.isVersionOk('erdpy 1.0.11')
        assert.equal(isOk, true)
    })
    it("local version 'erdpy 1.0.10.1' should return true", () => {
        let isOk = ErdpyVersionChecker.isVersionOk('erdpy 1.0.10.1')
        assert.equal(isOk, true)
    })
});

describe("test min version is ok", () => {
    it("min version should be 1.0.10", () => {
        let minVerion = ErdpyVersionChecker.minVersion
        assert.equal(minVerion, '1.0.10')
    })
})