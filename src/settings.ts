import * as vscode from "vscode";
const os = require("os");

export class MySettings {
    public static getElrondSdk(): string {
        let folder = MySettings.getConfigurationValue("elrondsdk").toString();
        return folder.replace("~", os.homedir);
    }

    public static getElrondSdkRelativeToHome(): string {
        return MySettings.getElrondSdk().replace(os.homedir, "");
    }

    private static getConfigurationValue(key: string) {
        let configuration = vscode.workspace.getConfiguration("multiversx");
        let value = configuration.get(key);
        return value;
    }
}
