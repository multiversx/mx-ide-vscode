import * as vscode from 'vscode';

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
        if (context.triggerKind !== vscode.InlineCompletionTriggerKind.Invoke) {
            return [];
        }

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
