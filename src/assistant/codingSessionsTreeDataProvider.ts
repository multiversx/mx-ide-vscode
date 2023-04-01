import * as vscode from "vscode";
import { CodingSession } from "./codingSession";
import { askCodingSessionName } from "./codingSessionPresenter";
import { CodingSessionsTreeItem } from "./codingSessionsTreeItem";

interface IStorage {
    getAllCodingSessions(): CodingSession[];
    addCodingSession(item: CodingSession): Promise<void>;
    removeCodingSession(identifier: string): Promise<void>;
    setSelectedCodingSessionId(identifier: string | undefined): Promise<void>;
    getSelectedCodingSessionId(): string | undefined;
}

interface ICreator {
    createSession(): Promise<string>;
}

export class CodingSessionsTreeDataProvider implements vscode.TreeDataProvider<CodingSessionsTreeItem> {
    private readonly creator: ICreator;
    private readonly storage: IStorage;
    private models: CodingSession[] = [];

    private readonly _onDidChangeTreeData: vscode.EventEmitter<CodingSessionsTreeItem | undefined> = new vscode.EventEmitter<CodingSessionsTreeItem | undefined>();
    readonly onDidChangeTreeData?: vscode.Event<CodingSessionsTreeItem | undefined> = this._onDidChangeTreeData.event;

    constructor(options: {
        creator: ICreator,
        storage: IStorage,
    }) {
        this.creator = options.creator;
        this.storage = options.storage;
    }

    async refresh() {
        this.models = this.storage.getAllCodingSessions();
        await this.refreshSuperficially();
    }

    private async refreshSuperficially() {
        this._onDidChangeTreeData.fire(undefined);
    }

    async selectCodingSession(identifier: string) {
        await this.setSelected(identifier);
        await this.refreshSuperficially();
    }

    getTreeItem(element: CodingSessionsTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: CodingSessionsTreeItem): vscode.ProviderResult<CodingSessionsTreeItem[]> {
        if (element) {
            return [];
        }

        const selectedIdentifier = this.getSelectedCodingSession();

        return this.models.map(item => new CodingSessionsTreeItem({
            model: item,
            isSelected: item.identifier === selectedIdentifier
        }));
    }

    async createCodingSession(): Promise<CodingSession> {
        const name = await askCodingSessionName();
        if (!name) {
            return null;
        }

        const identifier = await this.creator.createSession();
        const session = new CodingSession({ name: name, identifier: identifier });
        await this.storage.addCodingSession(session);
        await this.setSelected(identifier);
        await this.refresh();

        return session;
    }

    async removeCodingSession(identifier: string) {
        const selectedIdentifier = this.getSelectedCodingSession();

        if (selectedIdentifier === identifier) {
            await this.resetSelected();
        }

        await this.storage.removeCodingSession(identifier);
        this.refresh();
    }

    private async resetSelected() {
        await this.storage.setSelectedCodingSessionId(undefined);
        await this.triggerRefreshAssistant();
    }

    private async setSelected(identifier: string) {
        await this.storage.setSelectedCodingSessionId(identifier);
        await this.triggerRefreshAssistant();
    }

    public getSelectedCodingSession(): string {
        return this.storage.getSelectedCodingSessionId();
    }

    private async triggerRefreshAssistant() {
        await vscode.commands.executeCommand("multiversx.refreshAssistant");
    }
}
