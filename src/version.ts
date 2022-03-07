/**
 * Utility class, useful for representing and manipulating version strings (e.g. of IDE dependencies).
 */
export class Version {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;

    constructor(major: number, minor: number, patch: number) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    static parse(versionString: string) {
        // Only keep numbers and dots.
        versionString = versionString.replace(/[^\d.]/g, "");
        let [major, minor, patch] = versionString.split(".");
        let version = new Version(parseInt(major), parseInt(minor), parseInt(patch));
        return version;
    }

    isNewerOrSameAs(other: Version) {
        return this.major >= other.major && this.minor >= other.minor && this.patch >= other.patch;
    }

    isNewerThan(other: Version) {
        return this.isNewerOrSameAs(other) && !this.isSameAs(other);
    }

    isOlderThan(other: Version) {
        return !this.isSameAs(other) && !this.isNewerThan(other);
    }

    isSameAs(other: Version) {
        return this.major == other.major && this.minor == other.minor && this.patch == other.patch;
    }

    toString(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }

    toStringWithPrefix(): string {
        return `v${this.toString()}`;
    }
}
