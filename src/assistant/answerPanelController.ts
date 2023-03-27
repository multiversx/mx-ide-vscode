import * as vscode from 'vscode';
import { AnswerStream } from "./answerStream";

export class AnswerPanelController {
	async openPanel(options: {
		answerStream: AnswerStream,
	}) {
		const panel = vscode.window.createWebviewPanel(
			"multiversx",
			"Answer",
			vscode.ViewColumn.Beside,
			{
				enableScripts: false,
				retainContextWhenHidden: false
			}
		);

		options.answerStream.onDidReceivePart(async () => {
			const answer = options.answerStream.getAnswerUntilNow();
			panel.webview.html = await this.renderHtml(answer);
		});
	}

	private async renderHtml(markdown: string): Promise<string> {
		// https://github.com/microsoft/vscode/issues/75612
		const rendered = await vscode.commands.executeCommand("markdown.api.render", markdown);
		const html = `<pre style="white-space: pre-wrap;">${rendered}</pre>`;
		return html;
	}
}
