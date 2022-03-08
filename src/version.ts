import { CannotParseVersionError } from "./errors";

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

    static unspecified(): Version {
        return new Version(0, 0, 0);
    }

    static parse(versionString: string) {
        // Only keep numbers and dots.
        let normalizedVersionString = versionString.replace(/[^\d.]/g, "");
        let [major, minor, patch] = normalizedVersionString.split(".");
        let majorNumber = parseInt(major);
        let minorNumber = parseInt(minor);
        let patchNumber = parseInt(patch);

        if (isNaN(majorNumber) || isNaN(minorNumber) || isNaN(patchNumber)) {
            throw new CannotParseVersionError(versionString);
        }

        let version = new Version(majorNumber, minorNumber, patchNumber);
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

    isSpecified(): boolean {
        return !this.isUnspecified();
    }

    isUnspecified(): boolean {
        return this.major == 0 && this.minor == 0 && this.patch == 0;
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
