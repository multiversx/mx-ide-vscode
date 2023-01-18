import * as vscode from "vscode";
const os = require("os");

export class MySettings {
    public static getSdkPath(): string {
        let folder = MySettings.getConfigurationValue("sdkPath").toString();
        return folder.replace("~", os.homedir);
    }

    public static getSdkPathRelativeToHome(): string {
        return MySettings.getSdkPath().replace(os.homedir, "");
    }

    private static getConfigurationValue(key: string) {
        let configuration = vscode.workspace.getConfiguration("multiversx");
        let value = configuration.get(key);
        return value;
    }
}
