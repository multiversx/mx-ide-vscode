import * as vscode from "vscode";
import { onTopLevelError } from "../errors";
import { Settings } from "../settings";

interface IAssistant {
    completeCode(options: { code: string }): Promise<string>;
}

export class InlineCompletionItemProvider implements vscode.InlineCompletionItemProvider {
    private readonly assistant: IAssistant;

    constructor(options: { assistant: IAssistant }) {
        this.assistant = options.assistant;
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        _token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        if (!Settings.isInlineCodeCompletionEnabled()) {
            return [];
        }

        // We only want to provide inline completion when the user explicitly requests it (e.g. "Alt" + "\")
        if (context.triggerKind !== vscode.InlineCompletionTriggerKind.Invoke) {
            return [];
        }

        try {
            return await this.doProvideInlineCompletionItems(document, position);
        } catch (error: any) {
            onTopLevelError(error);
            return [];
        }
    }

    private async doProvideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<vscode.InlineCompletionItem[]> {
        // Not used yet:
        const line = document.lineAt(position.line).text;
        const language = document.languageId;
        const documentUri = document.uri.toString();

        const rangeUpToPosition = new vscode.Range(new vscode.Position(0, 0), position);
        const code = document.getText(rangeUpToPosition);
        const completion = await this.assistant.completeCode({ code: code });

        return [
            {
                insertText: completion,
                range: new vscode.Range(position, position.translate(0, 0))
            }
        ];
    }
}
