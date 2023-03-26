
import { provideVSCodeDesignSystem, vsCodeCheckbox, vsCodeLink } from "@vscode/webview-ui-toolkit";

interface VSCode {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
};

interface State {
}

declare function acquireVsCodeApi(): VSCode;
declare const window: any;

async function main() {
    provideVSCodeDesignSystem().register(
        vsCodeLink(),
        vsCodeCheckbox()
    );

    const vscode = acquireVsCodeApi();
    const state: State = vscode.getState() || {};
}

(async () => {
    await main();
})();
