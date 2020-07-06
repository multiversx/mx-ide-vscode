import * as vscode from 'vscode';
import fs = require("fs");
import { Feedback } from './feedback';
import path = require("path");
import * as workspace from "./workspace";

export class SmartContractsViewModel implements vscode.TreeDataProvider<SmartContract> {
    private _onDidChangeTreeData: vscode.EventEmitter<SmartContract | undefined> = new vscode.EventEmitter<SmartContract | undefined>();
    readonly onDidChangeTreeData?: vscode.Event<SmartContract> = this._onDidChangeTreeData.event;

    constructor() {
    }

    async refresh() {
        this._onDidChangeTreeData.fire(null);
    }

    getTreeItem(element: SmartContract): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    getChildren(element?: SmartContract): vscode.ProviderResult<SmartContract[]> {
        if (element) {
            return [];
        }

        let projects = workspace.getProjects();
        let contracts = projects.map(project => new SmartContract(project));
        return contracts;
    }
}

export class SmartContract {
    readonly name: string;
    readonly language: string;

    constructor(project: string) {
        let metadata = workspace.getMetadata(project);
        this.name = project;
        this.language = metadata.language;
    }

    getPath(): string {
        return workspace.getProjectPath(this.name);
    }

    getMetadataPath(): string {
        return workspace.getMetadataPath(this.name);
    }

    getTreeItem(): vscode.TreeItem {
        let item = new vscode.TreeItem(this.name);
        item.contextValue = "contract";
        item.iconPath = this.getIcons();
        return item;
    }

    private getIcons() {
        let contentPath = path.join(__filename, "..", "..", "content");
        return {
            light: path.join(contentPath, "light", `lang-${this.language}.png`),
            dark: path.join(contentPath, "dark", `lang-${this.language}.png`)
        };
    }
}
