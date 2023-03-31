import * as vscode from "vscode";
import { CodingSession } from "./codingSession";

export class CodingSessionsTreeItem extends vscode.TreeItem {
    readonly model: CodingSession;
    readonly identifier: string;
    readonly isSelected: boolean;

    constructor(options: { model: CodingSession, isSelected: boolean }) {
        super(options.model.name);
        this.model = options.model;
        this.identifier = this.model.identifier;
        this.isSelected = options.isSelected;

        this.contextValue = "codingSession";
        this.tooltip = `Coding Session: ${this.model.name} (${this.model.identifier})`;
        this.iconPath = new vscode.ThemeIcon("code");

        if (this.isSelected) {
            this.description = "✔";
        }

        this.command = {
            command: "multiversx.selectCodingSession",
            title: "Select Coding Session",
            arguments: [this.model]
        };
    }
}
