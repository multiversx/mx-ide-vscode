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

            this.panel.webview.html = FsFacade.readFile("debuggerMainView.html");
        }
    }
}