import * as vscode from "vscode";
import { Uri } from "vscode";

export class HelpViewProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri: Uri;
    private _view?: vscode.WebviewView;

    constructor(extensionUri: Uri) {
        this.extensionUri = extensionUri;
    }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext<unknown>,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: false,
            localResourceRoots: [this.extensionUri],
        };

        webviewView.webview.html = await this.getHtmlForWebview(webviewView.webview);
    }

    private async getHtmlForWebview(_webview: vscode.Webview): Promise<string> {
        const markdown = `
# Test

This is a test
- foo
- bar

[DOCS](https://docs.multiversx.com)

- https://github.com/microsoft/vscode/issues/131508
- https://github.com/microsoft/vscode-docs/blob/vnext/release-notes/v1_58.md#inline-suggestions
- editor.inlineSuggest.enabled: true
- editor.inlineSuggest.showToolbar: true
        `;

        const html = await vscode.commands.executeCommand("markdown.api.render", markdown);
        return html.toString();
    }
}
