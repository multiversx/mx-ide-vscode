import * as vscode from 'vscode';

export class MySettings {

    public static getRestDebuggerPort() {
        return MySettings.getConfigurationValue("restApi.port");
    }

    public static getRestDebuggerToolPath() : string {
        return MySettings.getConfigurationValue("restApi.toolPath").toString();
    }

    public static getRestDebuggerConfigPath() {
        return MySettings.getConfigurationValue("restApi.configPath");
    }

    public static getRestDebuggerGenesisPath() {
        return MySettings.getConfigurationValue("restApi.genesisPath");
    }

    public static getBuildToolsFolder() : string {
        return MySettings.getConfigurationValue("buildToolsFolder").toString();
    }

    private static getConfigurationValue(key: string) {
        let configuration = vscode.workspace.getConfiguration("elrond");
        let value = configuration.get(key);
        return value;
    }
}