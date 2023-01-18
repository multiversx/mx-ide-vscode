import { assert } from 'chai';
import { Version } from './version';

describe("test version", () => {
    it("should parse", async () => {
        assert.deepEqual(Version.parse("mxpy 1.2.3"), new Version(1, 2, 3));
        assert.deepEqual(Version.parse("v1.2.3"), new Version(1, 2, 3));
        assert.deepEqual(Version.parse("1.2.3"), new Version(1, 2, 3));
    });

    it("is newer / older or same as", async () => {
        assert.isTrue(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v1.0.0")));
        assert.isTrue(Version.parse("v1.2.3").isNewerThan(Version.parse("v1.0.0")));
        assert.isTrue(Version.parse("v3.2.1").isNewerOrSameAs(Version.parse("v3.0.3")));
        assert.isTrue(Version.parse("v3.2.1").isNewerThan(Version.parse("v3.0.3")));
        assert.isTrue(Version.parse("v2.1.0").isNewerOrSameAs(Version.parse("v1.2.3")));
        assert.isTrue(Version.parse("v2.1.0").isNewerThan(Version.parse("v1.2.3")));

        assert.isFalse(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v1.2.4")));
        assert.isTrue(Version.parse("v1.2.3").isOlderThan(Version.parse("v1.2.4")));
        assert.isFalse(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v3.0.0")));
        assert.isTrue(Version.parse("v1.2.3").isOlderThan(Version.parse("v3.0.0")));
        assert.isTrue(Version.parse("v1.2.3").isOlderThan(Version.parse("v2.1.0")));

        assert.isTrue(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v1.2.3")));
        assert.isTrue(Version.parse("v1.2.3").isSameAs(Version.parse("v1.2.3")));
        assert.isTrue(Version.parse("v0.0.0").isSameAs(Version.parse("v0.0.0")));
    });
});
