import * as vscode from 'vscode';

export class MySettings {

    public static getRestDebuggerPort() {
        return MySettings.getConfigurationValue("restApi.port");
    }

    public static getIdeFolder() : string {
        return MySettings.getConfigurationValue("ideFolder").toString();
    }

    public static getDownloadMirrorUrl() : string {
        return MySettings.getConfigurationValue("downloadMirror").toString();
    }

    public static getTestnetUrl() : string {
        return MySettings.getConfigurationValue("testnetUrl").toString();
    }

    private static getConfigurationValue(key: string) {
        let configuration = vscode.workspace.getConfiguration("elrond");
        let value = configuration.get(key);
        return value;
    }
}