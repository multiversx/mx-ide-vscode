import { assert } from 'chai';
import { ErdpyVersionChecker } from '../erdpyVersionChecker';

describe("test compare local version with min version", () => {
    it("local version 'erdpy 1.0.2' should return false", async() => {
        let isOk = await ErdpyVersionChecker.isVersionOk('erdpy 1.0.2');
        assert.equal(isOk, false);
    });
    it("local version 'erdpy 1.0.9.1' should return false", async() => {
        let isOk = await ErdpyVersionChecker.isVersionOk('erdpy 1.0.9.1')
        assert.equal(isOk, false)
    })
    
    it("local version 'erdpy 1.0.10' should return false", async() => {
        let isOk = await ErdpyVersionChecker.isVersionOk('erdpy 1.0.10')
        assert.equal(isOk, true)
    })
    it("local version 'erdpy 1.0.11' should return true", async() => {
        let isOk = await ErdpyVersionChecker.isVersionOk('erdpy 1.0.11')
        assert.equal(isOk, true)
    })
    it("local version 'erdpy 1.0.10.1' should return true", async() => {
        let isOk = await ErdpyVersionChecker.isVersionOk('erdpy 1.0.10.1')
        assert.equal(isOk, true)
    })
});

describe("test min version is ok", () => {
    it("min version should be 1.0.10", async() => {
        let latersRelease = await ErdpyVersionChecker.getLatestERDPYVersion();
        // number of '.' chars from version should be greater or equal with 3
        assert.isTrue(latersRelease.split('.').length > 2)
    })
});

describe("test get latests release", () => {
    it ("should work", async() => {
        let latestVersion = await ErdpyVersionChecker.getLatestERDPYVersion();
        // number of '.' chars from version should be greater or equal with 3
        assert.isTrue(latestVersion.split('.').length > 2)
    })
});
