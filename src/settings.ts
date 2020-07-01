import * as vscode from "vscode";
const os = require("os");

export class MySettings {
    public static getElrondSdk() : string {
        let folder = MySettings.getConfigurationValue("elrondsdk").toString();
        return folder.replace("~", os.homedir);
    }

    private static getConfigurationValue(key: string) {
        let configuration = vscode.workspace.getConfiguration("elrond");
        let value = configuration.get(key);
        return value;
    }
}