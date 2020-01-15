import * as vscode from 'vscode';
import { FsFacade } from './utils';
import { Root } from './root';
import { NodeDebug } from './nodeDebug';
import { SmartContract, SmartContractsCollection } from './smartContract';
import eventBus from './eventBus';
import { MyEnvironment } from './myenvironment';
import { MyError, MyErrorCatcher } from './errors';
import { MyFile } from './myfile';
import { Variables } from './variables';

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

        eventBus.on("download", function (data, what) {
            self.talkToWebView(what, data);
        });

        eventBus.on("workspace:sync", function (data, what) {
            self.talkToWebView("refreshSmartContracts", data);
        });
    }

    private listenToWebviewEvents() {
        let self = this;

        eventBus.on("view-message:startNodeDebug", function () {
            NodeDebug.start();
            self.doRefreshSmartContracts();
        });

        eventBus.on("view-message:stopNodeDebug", function () {
            NodeDebug.stop().catch(() => { });
        });

        eventBus.on("view-message:refreshSmartContracts", function () {
            self.doRefreshSmartContracts();
        });

        eventBus.on("view-message:buildSmartContract", function (payload) {
            let contract: SmartContract = SmartContractsCollection.getById(payload.id);
            contract.build()
                .then(() => { self.doRefreshSmartContracts() })
                .catch(MyErrorCatcher.topLevel);
        });

        eventBus.on("view-message:setSmartContractBuildOptions", function (payload) {
            let contract: SmartContract = SmartContractsCollection.getById(payload.id);
            contract.setBuildOptions(payload)
                .then(() => { self.doRefreshSmartContracts() })
                .catch(MyErrorCatcher.topLevel);
        });

        eventBus.on("view-message:deploySmartContract", function (payload) {
            let contract: SmartContract = SmartContractsCollection.getById(payload.id);
            contract.deployToDebugger(payload)
                .then(() => { self.doRefreshSmartContracts() })
                .catch(MyErrorCatcher.topLevel);
        });

        eventBus.on("view-message:runSmartContract", function (payload) {
            let contract: SmartContract = SmartContractsCollection.getById(payload.id);
            contract.runFunction(payload)
                .then(() => { self.doRefreshSmartContracts() })
                .catch(MyErrorCatcher.topLevel);
        });

        eventBus.on("view-message:setWatchedVariables", function (payload) {
            let contract: SmartContract = SmartContractsCollection.getById(payload.id);
            contract.setWatchedVariables(payload);
        });

        eventBus.on("view-message:environment-refresh", function () {
            self.doRefreshEnvironment();
        });

        eventBus.on("view-message:environment-install-build-tools-c", function (payload) {
            MyEnvironment.installBuildToolsForC().catch(MyErrorCatcher.topLevel);
        });

        eventBus.on("view-message:environment-install-build-tools-rust", function (payload) {
            MyEnvironment.installBuildToolsForRust().catch(MyErrorCatcher.topLevel);
        });

        eventBus.on("view-message:environment-uninstall-build-tools-rust", function (payload) {
            MyEnvironment.uninstallBuildToolsForRust().catch(MyErrorCatcher.topLevel);
        });

        eventBus.on("view-message:environment-install-build-tools-sol", function (payload) {
            MyEnvironment.installBuildToolsForSolidity().catch(MyErrorCatcher.topLevel);
        });

        eventBus.on("view-message:environment-install-debug-node", function (payload) {
            MyEnvironment.installDebugNode().catch(MyErrorCatcher.topLevel);
        });

        eventBus.on("view-message:variables-refresh", function () {
            self.talkToWebView("variables-refresh", Variables.getSnapshot());
        });

        eventBus.on("view-message:variables-save", function (payload) {
            Variables.save(payload.json);
            self.talkToWebView("variables-refresh", Variables.getSnapshot());
        });
    }

    private doRefreshSmartContracts() {
        SmartContractsCollection.syncWithWorkspace();
        this.talkToWebView("refreshSmartContracts", SmartContractsCollection.Items);
    }

    private doRefreshEnvironment() {
        this.talkToWebView("refreshEnvironment", MyEnvironment.getSnapshot());
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
            enableScripts: true,
            retainContextWhenHidden: true
        };

        this.panel = vscode.window.createWebviewPanel(
            "mainView",
            "Elrond IDE",
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

        // Include partial views and templates.
        MyFile
            .find({
                Folder: FsFacade.getPathToContent(),
                Extensions: ["html"]
            })
            .filter(file => file.Name.startsWith("template") || file.Name.startsWith("partial"))
            .forEach(file => {
                html = html.replace("{{" + file.Name + "}}", file.readText());
            });

        return html;
    }

    private getBaseHref() {
        let pathToContent = FsFacade.getPathToContent();
        let uri = vscode.Uri.file(pathToContent);
        let baseHref = this.panel.webview.asWebviewUri(uri);
        return baseHref;
    }
}