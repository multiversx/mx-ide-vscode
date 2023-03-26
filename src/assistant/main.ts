
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDivider, vsCodeLink, vsCodeProgressRing, vsCodeTextArea } from "@vscode/webview-ui-toolkit";

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
        vsCodeTextArea(),
        vsCodeButton(),
        vsCodeDivider(),
        vsCodeProgressRing()
    );

    const vscode = acquireVsCodeApi();
    const state: State = vscode.getState() || {};

    const textAreaAsk = window.document.getElementById("TextAreaAsk");
    const buttonAsk = window.document.getElementById("ButtonAsk");

    buttonAsk.addEventListener("click", () => {
        vscode.postMessage({
            type: "ask",
            value: {
                question: textAreaAsk.value
            }
        });
    });

    window.addEventListener("message", async (event: any) => {
        const message = event.data;
    });
}

(async () => {
    await main();
})();
