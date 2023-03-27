import * as vscode from 'vscode';
import { AnswerStream } from "./answerStream";

export class AnswerPanelController {
	constructor() {
	}

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

		const answerParts: string[] = [];

		options.answerStream.onDidReceivePart(async data => {
			answerParts.push(data);
			panel.webview.html = await this.renderHtml(answerParts);
		});
	}

	private async renderHtml(answerParts: string[]): Promise<string> {
		const joined = answerParts.join("");

		// https://github.com/microsoft/vscode/issues/75612
		const rendered = await vscode.commands.executeCommand("markdown.api.render", joined);
		const html = `<pre style="white-space: pre-wrap;">${rendered}</pre>`;
		return html;
	}
}
