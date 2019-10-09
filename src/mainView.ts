import * as vscode from 'vscode';
import { FsFacade } from './utils';
import { Root } from './root';
import { RestDebugger } from './debugger';
import { SmartContract, SmartContractsCollection } from './smartContract';
import { Builder } from './builder';

export class MainView {
    panel: vscode.WebviewPanel;

    constructor() {
        this.listenToDebuggerEvents();
        this.listenToWebViewEvents();
    }

    private listenToDebuggerEvents() {
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

    private listenToWebViewEvents() {
        let self = this;

        Root.EventBus.on("view-message:startDebugServer", function () {
            RestDebugger.startServer();
        });

        Root.EventBus.on("view-message:stopDebugServer", function () {
            RestDebugger.stopServer(null);
        });

        Root.EventBus.on("view-message:refreshSmartContracts", function () {
            SmartContractsCollection.syncWithWorkspace();
            self.talkToWebView("refreshSmartContracts", SmartContractsCollection.Items);
        });

        Root.EventBus.on("view-message:buildSmartContract", function (payload) {
            let contract: SmartContract = SmartContractsCollection.getById(payload.id);
            contract.build();
            self.talkToWebView("refreshSmartContracts", SmartContractsCollection.Items);
        });

        Root.EventBus.on("view-message:deploySmartContract", function (payload) {
            let contract: SmartContract = SmartContractsCollection.getById(payload.id);
            contract.deployToDebugger();
            self.talkToWebView("refreshSmartContracts", SmartContractsCollection.Items);
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

        this.startListeningToPanel();

        this.panel.webview.html = this.getHtmlContent();
    }

    private startListeningToPanel() {
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
}