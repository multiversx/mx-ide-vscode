import { assert } from 'chai';
import { Version } from './version';

describe("test version", () => {
    it("should parse", async () => {
        assert.deepEqual(Version.parse("erdpy 1.2.3"), new Version(1, 2, 3));
        assert.deepEqual(Version.parse("v1.2.3"), new Version(1, 2, 3));
        assert.deepEqual(Version.parse("1.2.3"), new Version(1, 2, 3));
    });

    it("is newer or same as", async () => {
        assert.isTrue(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v1.2.3")));
        assert.isTrue(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v1.0.0")));

        assert.isFalse(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v1.2.4")));
        assert.isFalse(Version.parse("v1.2.3").isNewerOrSameAs(Version.parse("v3.0.0")));
    });
});
