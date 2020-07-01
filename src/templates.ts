import * as vscode from 'vscode';
import { Feedback } from './feedback';
import path = require("path");
import { ElrondSdk } from './elrondSdk';

export class ContractTemplatesProvider implements vscode.TreeDataProvider<ContractTemplate> {
    private _onDidChangeTreeData: vscode.EventEmitter<ContractTemplate | undefined> = new vscode.EventEmitter<ContractTemplate | undefined>();
    readonly onDidChangeTreeData?: vscode.Event<ContractTemplate> = this._onDidChangeTreeData.event;

    constructor() {
    }

    refresh(): void {
        ElrondSdk.getTemplates();

        Feedback.info("Templates refreshed.");
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ContractTemplate): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    getChildren(element?: ContractTemplate): vscode.ProviderResult<ContractTemplate[]> {
        if (element) {
            return [];
        }

        return [
            new ContractTemplate("foo"),
            new ContractTemplate("bar"),
        ];
    }
}

export class ContractTemplate {
    constructor(public readonly label: string) {
    }

    getTreeItem(): vscode.TreeItem {
        let item = new vscode.TreeItem(this.label);
        item.contextValue = "template";
        item.iconPath = {
            light: path.join(__filename, "..", "..", "content", "light", "folder.svg"),
            dark: path.join(__filename, "..", "..", "content", "dark", "folder.svg"),
        };

        return item;
    }
}