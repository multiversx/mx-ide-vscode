
import { provideVSCodeDesignSystem, vsCodeCheckbox, vsCodeLink } from "@vscode/webview-ui-toolkit";

interface VSCode {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
};

interface State {
    terms: AcceptTerms;
}

interface AcceptTerms {
    acceptTermsOfService: boolean;
    acceptPrivacyStatement: boolean;
}

declare function acquireVsCodeApi(): VSCode;
declare const window: any;

class TermsView {
    readonly checkboxTermsOfService: any;
    readonly checkboxPrivacyStatement: any;

    constructor() {
        this.checkboxTermsOfService = window.document.getElementById("CheckboxAssistantTermsOfService");
        this.checkboxPrivacyStatement = window.document.getElementById("CheckboxAssistantPrivacyStatement");
    }

    render(terms?: AcceptTerms) {
        this.checkboxTermsOfService.checked = terms?.acceptTermsOfService || false;
        this.checkboxPrivacyStatement.checked = terms?.acceptPrivacyStatement || false;
    }
}

async function main() {
    provideVSCodeDesignSystem().register(
        vsCodeLink(),
        vsCodeCheckbox()
    );

    const vscode = acquireVsCodeApi();
    const state: State = vscode.getState() || {};
    const termsView = new TermsView();
    termsView.render(state.terms);

    function onTermsViewChange() {
        const isAcceptedTermsOfService = termsView.checkboxTermsOfService.checked;
        const isAcceptedPrivacyStatement = termsView.checkboxPrivacyStatement.checked;

        vscode.postMessage({
            type: "acceptTerms",
            value: {
                acceptTermsOfService: isAcceptedTermsOfService,
                acceptPrivacyStatement: isAcceptedPrivacyStatement
            }
        });

        holdState();
    }

    termsView.checkboxTermsOfService.addEventListener("change", () => {
        onTermsViewChange();
    });

    termsView.checkboxPrivacyStatement.addEventListener("change", () => {
        onTermsViewChange();
    });

    window.addEventListener("message", async (event: any) => {
        const message = event.data;

        switch (message.type) {
            case "initialize":
                const value: State = message.value;
                termsView.render(value.terms);
                holdState();
                return;
        }
    });

    function holdState() {
        vscode.setState({
            terms: {
                acceptTermsOfService: termsView.checkboxTermsOfService.checked,
                acceptPrivacyStatement: termsView.checkboxPrivacyStatement.checked
            }
        });
    }
}

(async () => {
    await main();
})();
