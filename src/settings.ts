import * as vscode from 'vscode';

export class MySettings {

    public static getRestDebuggerPort() {
        return MySettings.getConfigurationValue("restApi.port");
    }

    public static getRestDebuggerToolPath() {
        return MySettings.getConfigurationValue("restApi.toolPath");
    }

    public static getRestDebuggerConfigPath() {
        return MySettings.getConfigurationValue("restApi.configPath");
    }

    public static getRestDebuggerGenesisPath() {
        return MySettings.getConfigurationValue("restApi.genesisPath");
    }

    public static getSimpleDebugToolPath() {
        return MySettings.getConfigurationValue("simpleDebugToolPath");
    }

    public static getClangPath() {
        return MySettings.getConfigurationValue("clangPath");
    }

    public static getLlcPath() {
        return MySettings.getConfigurationValue("llcPath");
    }

    public static getWasmLdPath() {
        return MySettings.getConfigurationValue("wasmLdPath");
    }

    private static getConfigurationValue(key: string) {
        let configuration = vscode.workspace.getConfiguration("elrond");
        let value = configuration.get(key);
        return value;
    }
}