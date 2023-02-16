const semver = require("semver");

/**
 * Utility class, useful for representing and manipulating version strings (e.g. of IDE dependencies).
 */
export class Version {
    public readonly value: string;
    public readonly vValue: string;
    public readonly cleanedValue: string;

    private constructor(value: string, cleanedValue: string) {
        this.value = value;
        this.vValue = value.startsWith("v") ? value : "v" + value;
        this.cleanedValue = cleanedValue;
    }

    static parse(versionString: string) {
        // Handle input such as "mxpy v1.2.3".
        const tokens = versionString.trim().split(" ");
        const version = tokens[tokens.length - 1].trim();
        // Handle both semver and PEP440 (at least, partially).
        const cleanedVersion = semver.clean(version, { loose: true });

        if (!cleanedVersion) {
            throw new Error(`Invalid version string: ${versionString}`);
        }

        return new Version(version, cleanedVersion);
    }

    isNewerOrSameAs(other: Version) {
        return semver.gte(this.cleanedValue, other.cleanedValue);
    }

    isSameAs(other: Version) {
        return semver.eq(this.cleanedValue, other.cleanedValue);
    }

    toString() {
        return this.value;
    }
}

export class FreeTextVersion {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static unspecified(): FreeTextVersion {
        return new FreeTextVersion("");
    }

    isSpecified(): boolean {
        return !this.isUnspecified();
    }

    isUnspecified(): boolean {
        return this.value.length == 0;
    }

    toString(): string {
        return this.value;
    }
}
