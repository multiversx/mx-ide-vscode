import * as vscode from "vscode";
const os = require("os");

export class MySettings {
    public static getSdkPath(): string {
        const folder = MySettings.getConfigurationValue("sdkPath").toString();
        return folder.replace("~", os.homedir);
    }

    public static getSdkPathRelativeToHome(): string {
        return MySettings.getSdkPath().replace(os.homedir, "");
    }

    public static getAssistantApiUrl(): string {
        return MySettings.getConfigurationValue("assistantApiUrl").toString();
    }

    private static getConfigurationValue(key: string) {
        const configuration = vscode.workspace.getConfiguration("multiversx");
        const value = configuration.get(key);
        return value;
    }
}
