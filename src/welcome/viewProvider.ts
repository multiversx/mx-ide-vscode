import * as vscode from "vscode";
import { Uri } from "vscode";
const html = require("./main.html");

interface IAssistant {
    setAcceptTermsOfService(accept: boolean): Promise<void>;
    getAcceptTermsOfService(): Promise<boolean>;
    setAcceptPrivacyStatement(accept: boolean): Promise<void>;
    getAcceptPrivacyStatement(): Promise<boolean>;
}

export class WelcomeViewProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri: Uri;
    private readonly assistant: IAssistant;

    private _view?: vscode.WebviewView;

    constructor(options: {
        extensionUri: Uri;
        assistant: IAssistant
    }) {
        this.extensionUri = options.extensionUri;
        this.assistant = options.assistant;
    }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext<unknown>,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            enableForms: true,
            localResourceRoots: [this.extensionUri],
        };

        webviewView.webview.html = await this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async data => {
            switch (data.type) {
                case "setAssistantTermsOfService":
                    await this.assistant.setAcceptTermsOfService(data.value);
                    return;
                case "setAssistantPrivacyStatement":
                    await this.assistant.setAcceptPrivacyStatement(data.value);
                    return;
            }
        });
    }

    private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        const webviewUri = webview.asWebviewUri(Uri.joinPath(this.extensionUri, ...["dist", "welcome.js"]));
        return html.replace("{{uriWelcomeJs}}", webviewUri.toString());
    }
}
