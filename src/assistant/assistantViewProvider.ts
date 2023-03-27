import * as vscode from "vscode";
import { Uri } from "vscode";
import { AnswerStream } from "./answerStream";
import { IAskQuestionRequested, MessageType } from "./messages";
const mainHtml = require("./main.html");

interface IAssistant {
    askAnything(options: { question: string }): Promise<AnswerStream>;
}

export class AssistantViewProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri: Uri;
    private readonly assistant: IAssistant;

    private _view?: vscode.WebviewView;

    constructor(options: {
        extensionUri: Uri;
        assistant: IAssistant
    }) {
        this.extensionUri = options.extensionUri;
        this.assistant = options.assistant;
    }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext<unknown>,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this._view = webviewView;

        const messaging = new Messaging({
            webview: webviewView.webview
        });

        messaging.onAskQuestionRequested(async question => {
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

        answerStream.onDidReceivePart(async data => {
            console.log("data", data);
            await vscode.window.showInformationMessage(data);
        });
    }

    private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        const uriJs = webview.asWebviewUri(Uri.joinPath(this.extensionUri, ...["dist", "assistant.js"]));
        const html = mainHtml.replace("{{uriJs}}", uriJs.toString());
        return html;
    }
}

class Messaging {
    private readonly webview: vscode.Webview;

    constructor(options: {
        webview: vscode.Webview
    }) {
        this.webview = options.webview;
    }

    sendInitialize(data: any) {
        this.webview.postMessage({
            type: "initialize",
            value: data
        });
    }

    onAskQuestionRequested(callback: (question: string) => void) {
        this.webview.onDidReceiveMessage((message: IAskQuestionRequested) => {
            if (message.type !== MessageType.askQuestionRequested) {
                return;
            }

            callback(message.value.question);
        });
    }
}
