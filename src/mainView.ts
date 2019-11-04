import * as vscode from 'vscode';
import { FsFacade } from './utils';
import { Root } from './root';
import { RestDebugger } from './debugger';
import { SmartContract, SmartContractsCollection } from './smartContract';
import eventBus from './eventBus';
import { MyEnvironment } from './myenvironment';
import { MyError, MyErrorCatcher } from './errors';
import { TestnetFacade } from './testnetFacade';
import { MyFile } from './myfile';

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

        eventBus.on("testnet-query:*", function (data, what) {
            self.talkToWebView(what, data);
        });

        eventBus.on("smart-contract:*", function (data, what) {
            self.talkToWebView(what, data);
        });

        eventBus.on("download", function (data, what) {
            self.talkToWebView(what, data);
        });
    }

    private listenToWebviewEvents() {
        let self = this;

        eventBus.on("view-message:startNodeDebug", function () {
            RestDebugger.start();
            self.doRefreshSmartContracts();
        });

        eventBus.on("view-message:stopNodeDebug", function () {
            RestDebugger.stop().catch(() => { });
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

        // eventBus.on("view-message:environment-install-go", function (payload) {
        //     MyEnvironment.installGo().catch(MyErrorCatcher.topLevel);
        // });

        eventBus.on("view-message:environment-install-debug-node", function (payload) {
            MyEnvironment.installDebugNode().catch(MyErrorCatcher.topLevel);
        });

        eventBus.on("view-message:testnetQuerySendRequest", function (payload) {
            TestnetFacade.query(payload)
                .then(payload => self.talkToWebView("testnetQueryResponse", payload))
                .catch(MyErrorCatcher.topLevel);
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