import * as vscode from 'vscode';
import { FsFacade } from './utils';
import { Root } from './root';
import { RestDebugger } from './debugger';

export class DebuggerMainView {
    panel: vscode.WebviewPanel;

    constructor() {
        this.listenToDebugger();
    }

    private listenToDebugger() {
        const self = this;

        Root.EventBus.on("debugger:output", function (data) {
            self.postMessageToPanel({ what: "debugger:output", data: data });
        });

        Root.EventBus.on("debugger:error", function (data) {
            self.postMessageToPanel({ what: "debugger:error", data: data });
        });

        Root.EventBus.on("debugger:close", function (code) {
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

        this.listenToPanel();

        this.panel.webview.html = this.getHtmlContent();
    }

    private listenToPanel() {
        this.panel.webview.onDidReceiveMessage(
            message => {
                var command = message.command;

                if (command == "startDebugServer") {
                    RestDebugger.startServer();
                } else if (command == "stopDebugServer") {
                    RestDebugger.stopServer(null);
                }
            },
            undefined,
            Root.ExtensionContext.subscriptions
        );

        this.panel.onDidDispose(
            () => { this.panel = null; },
            null,
            Root.ExtensionContext.subscriptions
        );
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