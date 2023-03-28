import * as vscode from 'vscode';
import { Answer } from './answer';
import { AnswerStream } from "./answerStream";

export class AnswerPanelController {
	async displayAnswerStream(options: { answerStream: AnswerStream }) {
		const question = options.answerStream.getAnswerUntilNow().header.question;

		const panel = vscode.window.createWebviewPanel(
			"multiversx",
			this.shortenTitle(question),
			vscode.ViewColumn.Beside,
			{
				enableScripts: false,
				retainContextWhenHidden: false
			}
		);

		options.answerStream.onDidReceivePart(async (answer: Answer) => {
			const answerText = answer.body.text;
			panel.webview.html = await this.renderHtml(question, answerText);
		});
	}

	async displayAnswer(options: { answer: Answer }) {
		const question = options.answer.header.question;

		const panel = vscode.window.createWebviewPanel(
			"multiversx",
			this.shortenTitle(question),
			vscode.ViewColumn.Beside,
			{
				enableScripts: false,
				retainContextWhenHidden: false
			}
		);

		const answerText = options.answer.body.text;
		panel.webview.html = await this.renderHtml(question, answerText);
	}

	private shortenTitle(title: string): string {
		const maxLength = 40;
		return title.length > maxLength ? title.substring(0, maxLength) + "..." : title;
	}

	private async renderHtml(question: string, answerMarkdown: string): Promise<string> {
		const markdown = `
## Question

${question}

## Answer

${answerMarkdown}
`;

		// https://github.com/microsoft/vscode/issues/75612
		const rendered = await vscode.commands.executeCommand("markdown.api.render", markdown);
		const html = `<pre style="white-space: pre-wrap;">${rendered}</pre>`;
		return html;
	}
}
