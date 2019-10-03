import * as vscode from 'vscode';
import { FsFacade } from './utils';

export class DebuggerMainView {
    panel: vscode.WebviewPanel;

    constructor() {
    }

    public show() {
        if (this.panel == null) {
            let webViewOptions: any = {};

            this.panel = vscode.window.createWebviewPanel(
                "debuggerMainView",
                "Smart Contract Debugger",
                vscode.ViewColumn.One,
                webViewOptions
            );

            let html: string = FsFacade.readFileInContent("debuggerMainView.html");
            let baseHref = this.getBaseHref();
            html = html.replace("{{baseHref}}", baseHref.toString());
            this.panel.webview.html = html;
        }
    }
    
    private getBaseHref() {
        let pathToContent = FsFacade.getPathToContent();
        let uri = vscode.Uri.file(pathToContent);
        let baseHref = this.panel.webview.asWebviewUri(uri);
        return baseHref;
    }
}