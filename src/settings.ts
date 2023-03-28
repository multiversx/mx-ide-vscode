import * as vscode from "vscode";
const os = require("os");

export class Settings {
    public static getSdkPath(): string {
        const folder = this.getConfiguration().get<string>("sdkPath");
        return folder.replace("~", os.homedir);
    }

    public static getSdkPathRelativeToHome(): string {
        return Settings.getSdkPath().replace(os.homedir, "");
    }

    public static getAssistantApiUrl(): string {
        return this.getConfiguration().get<string>("assistant.url");
    }

    public static isAskAnythingEnabled() {
        return this.getConfiguration().get<boolean>("assistant.askAnything.enabled");
    }

    public static isReviewCodeEnabled() {
        return this.getConfiguration().get<boolean>("assistant.reviewCode.enabled");
    }

    public static isExplainCodeEnabled() {
        return this.getConfiguration().get<boolean>("assistant.explainCode.enabled");
    }

    public static isInlineCodeCompletionEnabled() {
        return this.getConfiguration().get<boolean>("assistant.inlineCodeCompletion.enabled");
    }

    public static isAnyAssistantFeatureEnabled() {
        return this.isAskAnythingEnabled() ||
            this.isReviewCodeEnabled() ||
            this.isExplainCodeEnabled() ||
            this.isInlineCodeCompletionEnabled();
    }

    private static getConfiguration(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration("multiversx");
    }
}

