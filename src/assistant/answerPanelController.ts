import * as vscode from 'vscode';
import { Answer } from './answer';
import { AnswerStream } from "./answerStream";

export class AnswerPanelController {
	async displayAnswerStream(options: { answerStream: AnswerStream }) {
		const title = options.answerStream.getAnswerUntilNow().header.question;

		const panel = vscode.window.createWebviewPanel(
			"multiversx",
			this.shortenTitle(title),
			vscode.ViewColumn.Beside,
			{
				enableScripts: false,
				retainContextWhenHidden: false
			}
		);

		options.answerStream.onDidReceivePart(async (answer: Answer) => {
			const answerText = answer.body.text;
			panel.webview.html = await this.renderHtml(answerText);
		});
	}

	async displayAnswer(options: { answer: Answer }) {
		const title = options.answer.header.question;

		const panel = vscode.window.createWebviewPanel(
			"multiversx",
			this.shortenTitle(title),
			vscode.ViewColumn.Beside,
			{
				enableScripts: false,
				retainContextWhenHidden: false
			}
		);

		const answerText = options.answer.body.text;
		panel.webview.html = await this.renderHtml(answerText);
	}

	private shortenTitle(title: string): string {
		const maxLength = 40;
		return title.length > maxLength ? title.substring(0, maxLength) + "..." : title;
	}

	private async renderHtml(markdown: string): Promise<string> {
		// https://github.com/microsoft/vscode/issues/75612
		const rendered = await vscode.commands.executeCommand("markdown.api.render", markdown);
		const html = `<pre style="white-space: pre-wrap;">${rendered}</pre>`;
		return html;
	}
}
