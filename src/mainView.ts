import * as vscode from 'vscode';
import { FsFacade } from './utils';
import { Root } from './root';
import { RestDebugger } from './debugger';
import { SmartContract } from './smartContract';

export class MainView {
    panel: vscode.WebviewPanel;

    constructor() {
        this.listenToDebugger();
        this.listenToWebView();
    }

    private listenToDebugger() {
        const self = this;

        Root.EventBus.on("debugger:output", function (data) {
            self.talkToWebView("debugger:output", data);
        });

        Root.EventBus.on("debugger:error", function (data) {
            self.talkToWebView("debugger:error", data);
        });

        Root.EventBus.on("debugger:close", function (code) {
            self.talkToWebView("debugger:close", code);
        });
    }

    private talkToWebView(what: string, payload: any) {
        if (this.panel) {
            this.panel.webview.postMessage({ what: what, payload: payload });
        }
    }

    private listenToWebView() {
        let self = this;

        Root.EventBus.on("view-message:startDebugServer", function (code) {
            RestDebugger.startServer();
        });

        Root.EventBus.on("view-message:stopDebugServer", function (code) {
            RestDebugger.stopServer(null);
        });

        Root.EventBus.on("view-message:refreshSmartContracts", function (code) {
            self.refreshSmartContracts();
        });
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
            "mainView",
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
                Root.EventBus.emit(`view-message:${message.what}`, message.payload || {});
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
        let html: string = FsFacade.readFileInContent("mainView.html");
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

    private refreshSmartContracts() {
        let contracts = SmartContract.getAll();
        this.talkToWebView("refreshSmartContracts", contracts);
    }
}