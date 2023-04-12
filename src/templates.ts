import * as vscode from 'vscode';
import { askOpenWorkspace } from './presenter';
import * as sdk from "./sdk";
import * as storage from "./storage";
import * as workspace from "./workspace";
import fs = require("fs");
import path = require("path");

export class TemplatesViewModel implements vscode.TreeDataProvider<ContractTemplate> {
    private _onDidChangeTreeData: vscode.EventEmitter<ContractTemplate | undefined> = new vscode.EventEmitter<ContractTemplate | undefined>();
    readonly onDidChangeTreeData?: vscode.Event<ContractTemplate> = this._onDidChangeTreeData.event;

    constructor() {
    }

    async refresh() {
        if (!workspace.isOpen()) {
            await askOpenWorkspace();
            return;
        }

        const cacheFile = this.getCacheFile();
        await sdk.fetchTemplates(cacheFile);
        this._onDidChangeTreeData.fire(null);
    }

    getTreeItem(element: ContractTemplate): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    getChildren(element?: ContractTemplate): vscode.ProviderResult<ContractTemplate[]> {
        if (!workspace.isOpen()) {
            return [];
        }
        if (element) {
            return [];
        }

        const cacheFile = this.getCacheFile();
        if (!fs.existsSync(cacheFile)) {
            return [];
        }

        const templatesJson = fs.readFileSync(cacheFile, { encoding: "utf8" });
        const templatesPlain = JSON.parse(templatesJson) as any[];
        return templatesPlain.map(item => new ContractTemplate(item));
    }

    private getCacheFile(): string {
        return storage.getPathTo("templates.json");
    }
}

export class ContractTemplate {
    readonly name: string;
    readonly language: string;

    constructor(item: any) {
        this.name = item.name;
        this.language = item.language;
    }

    getTreeItem(): vscode.TreeItem {
        let item = new vscode.TreeItem(this.name);
        item.contextValue = "template";
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
