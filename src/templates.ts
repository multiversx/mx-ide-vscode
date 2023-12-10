import * as vscode from 'vscode';
import path = require("path");

// Contract templates cannot be fetched from mxpy v8 easily, since the stdout of "mxpy contract templates" includes non-JSON data.
// Here, we hardcode the list of templates, in expectation of the new way to get the templates (e.g. via "sc-meta" or directly from a file on GitHub).
const CONTRACT_TEMPLATES = [
    {
        "name": "adder",
        "language": "rust"
    },
    {
        "name": "crypto-zombies",
        "language": "rust"
    },
    {
        "name": "empty",
        "language": "rust"
    },
    {
        "name": "ping-pong-egld",
        "language": "rust"
    }
];

export class TemplatesViewModel implements vscode.TreeDataProvider<ContractTemplate> {
    private _onDidChangeTreeData: vscode.EventEmitter<ContractTemplate | undefined> = new vscode.EventEmitter<ContractTemplate | undefined>();
    readonly onDidChangeTreeData?: vscode.Event<ContractTemplate> = this._onDidChangeTreeData.event;

    constructor() {
    }

    async refresh() {
        this._onDidChangeTreeData.fire(null);
    }

    getTreeItem(element: ContractTemplate): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    getChildren(element?: ContractTemplate): vscode.ProviderResult<ContractTemplate[]> {
        if (element) {
            return [];
        }

        return CONTRACT_TEMPLATES.map(item => new ContractTemplate(item));
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
