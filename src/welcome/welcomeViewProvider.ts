import * as vscode from "vscode";
import { Uri } from "vscode";
const mainHtml = require("./main.html");

interface IAssistantTerms {
    acceptTerms(options: {
        acceptTermsOfService: boolean;
        acceptPrivacyStatement: boolean;
    }): Promise<void>;

    areTermsAccepted(): Promise<{
        acceptTermsOfService: boolean;
        acceptPrivacyStatement: boolean;
    }>;
}

export class WelcomeViewProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri: Uri;
    private readonly assistantTerms: IAssistantTerms;

    private _view?: vscode.WebviewView;

    constructor(options: {
        extensionUri: Uri;
        assistantTerms: IAssistantTerms
    }) {
        this.extensionUri = options.extensionUri;
        this.assistantTerms = options.assistantTerms;
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

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.type) {
                case "acceptTerms":
                    await this.assistantTerms.acceptTerms(message.value);
                    break;
            }
        });

        webviewView.webview.postMessage({
            type: "initialize",
            value: {
                terms: await this.assistantTerms.areTermsAccepted()
            }
        });
    }

    private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        const uriJs = webview.asWebviewUri(Uri.joinPath(this.extensionUri, ...["dist", "welcome.js"]));
        const html = mainHtml.replace("{{uriJs}}", uriJs.toString());
        return html;
    }
}
