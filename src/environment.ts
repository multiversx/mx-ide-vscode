import path = require("path");
import { Settings } from "./settings";

export class Environment {
    static getForTerminal(): any {
        let sdkPath = path.join("${env:HOME}", Settings.getSdkPathRelativeToHome());
        let vmToolsFolder = path.join(sdkPath, "vmtools");
        return {
            "PATH": `${sdkPath}:${vmToolsFolder}:${process.env["PATH"]}`
        };
    }
}
