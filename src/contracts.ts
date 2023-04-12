import * as vscode from "vscode";
import { askOpenWorkspace } from "./presenter";
import * as workspace from "./workspace";
import path = require("path");

export class SmartContractsViewModel implements vscode.TreeDataProvider<SmartContract> {
    private _onDidChangeTreeData: vscode.EventEmitter<SmartContract | undefined> = new vscode.EventEmitter<SmartContract | undefined>();
    readonly onDidChangeTreeData?: vscode.Event<SmartContract> = this._onDidChangeTreeData.event;

    constructor() {
    }

    async refresh() {
        if (!workspace.isOpen()) {
            await askOpenWorkspace();
            return;
        }

        this._onDidChangeTreeData.fire(null);
    }

    getTreeItem(element: SmartContract): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    getChildren(element?: SmartContract): vscode.ProviderResult<SmartContract[]> {
        if (!workspace.isOpen()) {
            return [];
        }
        if (element) {
            return [];
        }

        const metadataObjects = workspace.getMetadataObjects();
        const contracts = metadataObjects.map(metadata => new SmartContract(metadata));
        return contracts;
    }
}

export class SmartContract {
    readonly metadata: workspace.ProjectMetadata;

    constructor(metadata: workspace.ProjectMetadata) {
        this.metadata = metadata;
    }

    getPath(): string {
        return this.metadata.ProjectPath;
    }

    getMetadataPath(): string {
        return this.metadata.Path;
    }

    getTreeItem(): vscode.TreeItem {
        let item = new vscode.TreeItem(this.metadata.ProjectName);
        item.contextValue = "contract";
        item.iconPath = this.getIcons();
        return item;
    }

    private getIcons() {
        let language = this.metadata.Language;
        let contentPath = path.join(__filename, "..", "..", "content");
        return {
            light: path.join(contentPath, "light", `lang-${language}.png`),
            dark: path.join(contentPath, "dark", `lang-${language}.png`)
        };
    }
}
