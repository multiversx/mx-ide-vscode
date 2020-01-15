import * as vscode from 'vscode';
import { MyError } from './errors';

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
        var url = MySettings.getConfigurationValue("testnetUrl").toString();
        if (!url) {
            throw new MyError({Message: `Bad testnet url: ${url}.`});
        }

        return url;
    }

    private static getConfigurationValue(key: string) {
        let configuration = vscode.workspace.getConfiguration("elrond");
        let value = configuration.get(key);
        return value;
    }
}