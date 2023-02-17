import { assert } from 'chai';
import { Version } from './version';

describe("test version", () => {
    it("should initialize properly", () => {
        assert.equal(Version.parse("v1.2.3").value, "v1.2.3");
        assert.equal(Version.parse("v1.2.3").vValue, "v1.2.3");
        assert.equal(Version.parse("v1.2.3").cleanedValue, "1.2.3");
        assert.equal(Version.parse("mxpy v1.2.3").value, "v1.2.3");
        assert.equal(Version.parse("mxpy v1.2.3").vValue, "v1.2.3");
        assert.equal(Version.parse("mxpy v1.2.3").cleanedValue, "1.2.3");
    });

    it("is newer or same as", async () => {
        assert.isTrue(Version.parse("mxpy 1.2.3").isSameAs(Version.parse("v1.2.3")));
        assert.isTrue(Version.parse("mxpy v1.2.3").isSameAs(Version.parse("1.2.3")));
        assert.isTrue(Version.parse("v1.2.3").isSameAs(Version.parse("v1.2.3")));

        assert.isFalse(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v1.2.4")));
        assert.isFalse(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v3.0.0")));
        assert.isTrue(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v1.2.3")));

        assert.isTrue(Version.parse("v6.0.0b5").isNewerOrSameAs(Version.parse("v5.0.0")));
        assert.isTrue(Version.parse("mxpy v7.0.0").isNewerOrSameAs(Version.parse("mxpy v5.0.0")));
    });
});
