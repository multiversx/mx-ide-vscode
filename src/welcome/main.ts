
import { provideVSCodeDesignSystem, vsCodeCheckbox, vsCodeLink } from "@vscode/webview-ui-toolkit";

interface VSCode {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
};

declare function acquireVsCodeApi(): VSCode;
declare const window: any;

async function main() {
    provideVSCodeDesignSystem().register(
        vsCodeLink(),
        vsCodeCheckbox()
    );

    const vscode = acquireVsCodeApi();
    const checkboxTermsOfService = window.document.getElementById("CheckboxAssistantTermsOfService");
    const checkboxPrivacyStatement = window.document.getElementById("CheckboxAssistantPrivacyStatement");

    checkboxTermsOfService.addEventListener("change", () => {
        vscode.postMessage({
            type: "setAssistantTermsOfService",
            value: checkboxTermsOfService.checked
        });
    });

    checkboxPrivacyStatement.addEventListener("change", () => {
        vscode.postMessage({
            type: "setAssistantPrivacyStatement",
            value: checkboxPrivacyStatement.checked
        });
    });
}

(async () => {
    await main();
})();
