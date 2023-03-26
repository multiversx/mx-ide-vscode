import * as vscode from "vscode";
import { Uri } from "vscode";
const mainHtml = require("./main.html");

interface IAssistant {
}

export class AssistantViewProvider implements vscode.WebviewViewProvider {
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

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.type) {
            }
        });

        await webviewView.webview.postMessage({
            type: "initialize",
            value: {
            }
        });
    }

    private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        const uriJs = webview.asWebviewUri(Uri.joinPath(this.extensionUri, ...["dist", "assistant.js"]));
        const html = mainHtml.replace("{{uriJs}}", uriJs.toString());
        return html;
    }
}
