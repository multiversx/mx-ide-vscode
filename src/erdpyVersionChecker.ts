import axios from "axios";
import { Version } from "./version";

const DefaultVersion = new Version(1, 1, 0);
const LatestGithubReleaseUrl = "https://api.github.com/repos/ElrondNetwork/elrond-sdk-erdpy/releases/latest";

export class ErdpyVersionChecker {
    static async isVersionOk(cliVersionString: string): Promise<boolean> {
        try {
            let cliVersion = Version.parse(cliVersionString);
            let latestVersion = await this.getLatestGithubRelease();
            return cliVersion.isNewerOrSameAs(latestVersion);
        } catch {
            return false;
        }
    }

    static async getLatestGithubRelease(): Promise<Version> {
        try {
            let response = await axios.get(LatestGithubReleaseUrl);
            let payload = JSON.parse(response.data);
            let version = Version.parse(payload.tag_name);
            return version;
        } catch {
            return DefaultVersion;
        }
    }
}

