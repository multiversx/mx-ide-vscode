import * as vscode from 'vscode';
import { Answer } from './answer';
import { AnswerStream } from "./answerStream";

export class AnswerPanelController {
	private currentPanelForDisplayAnswer: vscode.WebviewPanel | undefined;

	async displayAnswerStream(options: { answerStream: AnswerStream }) {
		const panel = vscode.window.createWebviewPanel(
			"multiversx",
			"Answer",
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
		if (this.currentPanelForDisplayAnswer) {
			this.currentPanelForDisplayAnswer.dispose();
		}

		const panel = vscode.window.createWebviewPanel(
			"multiversx",
			options.answer.header.question,
			vscode.ViewColumn.Beside,
			{
				enableScripts: false,
				retainContextWhenHidden: false
			}
		);

		const answerText = options.answer.body.text;
		panel.webview.html = await this.renderHtml(answerText);

		this.currentPanelForDisplayAnswer = panel;
	}

	private async renderHtml(markdown: string): Promise<string> {
		// https://github.com/microsoft/vscode/issues/75612
		const rendered = await vscode.commands.executeCommand("markdown.api.render", markdown);
		const html = `<pre style="white-space: pre-wrap;">${rendered}</pre>`;
		return html;
	}
}
