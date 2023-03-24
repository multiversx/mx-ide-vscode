import * as vscode from 'vscode';

export class BotInlineCompletionItemProvider implements vscode.InlineCompletionItemProvider {
    provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.InlineCompletionItem[]> {
        if (context.triggerKind !== vscode.InlineCompletionTriggerKind.Invoke) {
            return [];
        }

        const line = document.lineAt(position.line).text;
        const language = document.languageId;
        const documentUri = document.uri.toString();

        console.debug("Position", "line", position.line, "character", position.character);

        token.onCancellationRequested(() => {
            console.log("Cancelled");
        });

        return [
            {
                insertText: "Completion 1",
                range: new vscode.Range(position, position.translate(0, 0))
            },
            {
                insertText: "Completion 2",
                range: new vscode.Range(position, position.translate(0, 0))
            },
        ];
    }
}
