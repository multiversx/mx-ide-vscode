import * as vscode from "vscode";
import { Uri } from "vscode";
import { AnswerPanelController } from "./answerPanelController";
import { AnswerStream } from "./answerStream";
import { IAnswerFinished, IAskQuestionRequested, MessageType } from "./messages";
const mainHtml = require("./main.html");

interface IAssistant {
    askAnything(options: { question: string }): Promise<AnswerStream>;
}

export class AssistantViewProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri: Uri;
    private readonly assistant: IAssistant;
    private readonly answerPanelController: AnswerPanelController;
    private readonly messaging: Messaging;

    private _view?: vscode.WebviewView;

    constructor(options: {
        extensionUri: Uri;
        assistant: IAssistant
    }) {
        this.extensionUri = options.extensionUri;
        this.assistant = options.assistant;
        this.answerPanelController = new AnswerPanelController();
        this.messaging = new Messaging({
            webviewGetter: () => this._view?.webview
        });
    }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext<unknown>,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this._view = webviewView;

        this.messaging.onAskQuestionRequested(async question => {
            await this.askQuestion(question);
        });

        webviewView.webview.options = {
            enableScripts: true,
            enableForms: true,
            localResourceRoots: [this.extensionUri],
        };

        webviewView.webview.html = await this.getHtmlForWebview(webviewView.webview);
    }

    private async askQuestion(question: string): Promise<void> {
        const answerStream = await this.assistant.askAnything({ question: question });
        await this.answerPanelController.openPanel({ answerStream: answerStream });

        answerStream.onDidFinish(() => {
            this.messaging.sendAnswerFinished();
        });
    }

    private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        const uriJs = webview.asWebviewUri(Uri.joinPath(this.extensionUri, ...["dist", "assistant.js"]));
        const html = mainHtml.replace("{{uriJs}}", uriJs.toString());
        return html;
    }
}

class Messaging {
    private readonly getWebview: () => vscode.Webview;

    constructor(options: {
        webviewGetter: () => vscode.Webview;
    }) {
        this.getWebview = options.webviewGetter;
    }

    sendInitialize(_data: any) {
        if (!this.hasWebview()) {
            return;
        }

        // TODO:
    }

    onAskQuestionRequested(callback: (question: string) => void) {
        if (!this.hasWebview()) {
            return;
        }

        this.getWebview().onDidReceiveMessage((message: IAskQuestionRequested) => {
            if (message.type !== MessageType.askQuestionRequested) {
                return;
            }

            callback(message.value.question);
        });
    }

    async sendAnswerFinished() {
        if (!this.hasWebview()) {
            return;
        }

        const message: IAnswerFinished = {
            type: MessageType.answerFinished
        };

        await this.getWebview().postMessage(message);
    }

    private hasWebview(): boolean {
        return this.getWebview() ? true : false;
    }
}
