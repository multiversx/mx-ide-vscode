import * as vscode from "vscode";
const os = require("os");

export class Settings {
    public static getSdkPath(): string {
        const folder = this.getConfiguration().get<string>("sdkPath");
        return folder.replace("~", os.homedir);
    }

    public static getSdkPathRelativeToHome(): string {
        return Settings.getSdkPath().replace(os.homedir, "");
    }

    private static getConfiguration(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration("multiversx");
    }
}
