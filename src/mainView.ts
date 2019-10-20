import * as vscode from 'vscode';
import { FsFacade } from './utils';
import { Root } from './root';
import { RestDebugger } from './debugger';
import { SmartContract, SmartContractsCollection } from './smartContract';
import eventBus from './eventBus';

export class MainView {
    panel: vscode.WebviewPanel;

    constructor() {
        this.forwardCoreEventsToWebview();
        this.listenToWebviewEvents();
    }

    private forwardCoreEventsToWebview() {
        const self = this;

        eventBus.on("builder:*", function (data, what) {
            self.talkToWebView(what, data);
        });

        eventBus.on("debugger:*", function (data, what) {
            self.talkToWebView(what, data);
        });

        eventBus.on("debugger-dialogue:*", function (data, what) {
            self.talkToWebView(what, data);
        });

        eventBus.on("smart-contract:*", function (data, what) {
            self.talkToWebView(what, data);
        });
    }

    private listenToWebviewEvents() {
        let self = this;

        eventBus.on("view-message:startDebugServer", function () {
            RestDebugger.startServer();
            self.doRefreshSmartContracts();
        });

        eventBus.on("view-message:stopDebugServer", function () {
            RestDebugger.stopServer().catch(() => {});
        });

        eventBus.on("view-message:refreshSmartContracts", function () {
            self.doRefreshSmartContracts();
        });

        eventBus.on("view-message:buildSmartContract", function (payload) {
            let contract: SmartContract = SmartContractsCollection.getById(payload.id);
            contract.build().then(() => { self.doRefreshSmartContracts() });
        });

        eventBus.on("view-message:deploySmartContract", function (payload) {
            let contract: SmartContract = SmartContractsCollection.getById(payload.id);
            contract.deployToDebugger(payload.senderAddress).then(() => { self.doRefreshSmartContracts() });
        });

        eventBus.on("view-message:runSmartContract", function (payload) {
            let contract: SmartContract = SmartContractsCollection.getById(payload.id);
            contract.runFunction(payload).then(() => { self.doRefreshSmartContracts() });
        });
    }

    private doRefreshSmartContracts() {
        SmartContractsCollection.syncWithWorkspace();
        this.talkToWebView("refreshSmartContracts", SmartContractsCollection.Items);
    }

    private talkToWebView(what: string, payload: any) {
        if (this.panel) {
            this.panel.webview.postMessage({ what: what, payload: payload });
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
                eventBus.emit(`view-message:${message.what}`, message.payload || {});
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
        html = html.replace("{{template.smartContractPanel.html}}", FsFacade.readFileInContent("template.smartContractPanel.html"));
        html = html.replace("{{template.vmOutput.html}}", FsFacade.readFileInContent("template.vmOutput.html"));
        return html;
    }

    private getBaseHref() {
        let pathToContent = FsFacade.getPathToContent();
        let uri = vscode.Uri.file(pathToContent);
        let baseHref = this.panel.webview.asWebviewUri(uri);
        return baseHref;
    }
}