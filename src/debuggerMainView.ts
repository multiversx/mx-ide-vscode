import * as vscode from 'vscode';
import { FsFacade } from './utils';
import { MyExtension } from './root';

export class DebuggerMainView {
    panel: vscode.WebviewPanel;

    constructor() {
        this.listenToDebugger();
    }

    private listenToDebugger() {
        const self = this;

        MyExtension.EventBus.on("debugger:output", function (data) {
            self.postMessageToPanel({ what: "debugger:output", data: data });
        });

        MyExtension.EventBus.on("debugger:error", function (data) {
            self.postMessageToPanel({ what: "debugger:error", data: data });
        });

        MyExtension.EventBus.on("debugger:close", function (code) {
            self.postMessageToPanel({ what: "debugger:close", data: code });
        });
    }

    private postMessageToPanel(message: any) {
        if (this.panel) {
            this.panel.webview.postMessage(message);
        }
    }

    public show() {
        if (!this.panel) {
            this.initializePanel();
        }

        this.panel.reveal(vscode.ViewColumn.One);
    }

    private initializePanel() {
        let webViewOptions: any = {
            enableScripts: true
        };

        this.panel = vscode.window.createWebviewPanel(
            "debuggerMainView",
            "Smart Contract Debugger",
            undefined,
            webViewOptions
        );

        this.panel.onDidDispose(
            () => { this.panel = null; },
            null,
            MyExtension.ExtensionContext.subscriptions
        );

        this.panel.webview.html = this.getHtmlContent();
    }

    private getHtmlContent() {
        let html: string = FsFacade.readFileInContent("debuggerMainView.html");
        let baseHref = this.getBaseHref();
        html = html.replace("{{baseHref}}", baseHref.toString());
        return html;
    }

    private getBaseHref() {
        let pathToContent = FsFacade.getPathToContent();
        let uri = vscode.Uri.file(pathToContent);
        let baseHref = this.panel.webview.asWebviewUri(uri);
        return baseHref;
    }
}