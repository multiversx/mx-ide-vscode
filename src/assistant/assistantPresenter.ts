import * as vscode from "vscode";
import { Uri } from "vscode";
import { onTopLevelError } from "../errors";
import { AnswerStream } from "./answerStream";

interface IAssistant {
    explainCode(options: { code: string }): Promise<AnswerStream>;
    reviewCode(options: { code: string }): Promise<AnswerStream>;
}

interface IAnswerPanelController {
    displayAnswerStream(options: { answerStream: AnswerStream }): Promise<void>;
}

export class AssistantPresenter {
    private readonly assistant: IAssistant;
    private readonly answerPanelController: IAnswerPanelController;

    constructor(options: {
        assistant: IAssistant;
        answerPanelController: IAnswerPanelController;
    }) {
        this.assistant = options.assistant;
        this.answerPanelController = options.answerPanelController;
    }

    async explainCode(_uri: Uri) {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const document = editor.document;
            const selection = editor.selection;
            const code = selection.isEmpty ? document.getText() : document.getText(selection);
            const answerStream = await this.assistant.explainCode({ code: code });

            await this.answerPanelController.displayAnswerStream({ answerStream: answerStream });
        } catch (error) {
            onTopLevelError(error);
        }
    }

    async reviewCode(_uri: Uri) {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const document = editor.document;
            const selection = editor.selection;
            const code = selection.isEmpty ? document.getText() : document.getText(selection);
            const answerStream = await this.assistant.reviewCode({ code: code });

            await this.answerPanelController.displayAnswerStream({ answerStream: answerStream });
        } catch (error) {
            onTopLevelError(error);
        }
    }
}
