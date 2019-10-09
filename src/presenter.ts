import * as vscode from 'vscode';
import { FsFacade } from './utils';
import { asyncErrorCatcher } from './errors';
import { MainView as MainView } from './mainView';

export class Presenter {
    static mainView : MainView = new MainView();

    public static showInfo(message: string) {
        vscode.window.showInformationMessage(message);
    }

    public static showError(message: string) {
        vscode.window.showErrorMessage(message);
    }

    public static displayContentInNewTab(content: string) {
        let tempFile = FsFacade.createTempFile("simple_output.txt", content);
        let uri = vscode.Uri.file(tempFile);
        vscode.window.showTextDocument(uri);
    }

    public static getActiveFilePath() {
        let activeTextEditor = vscode.window.activeTextEditor;

        if (!activeTextEditor) {
            throw new Error("Open a file!");
        }

        let path = activeTextEditor.document.uri.fsPath;
        return path;
    }

    public static askSimpleInput(options: any) {
        let inputBoxOptions: vscode.InputBoxOptions = {
            value: options.placeholder,
            prompt: options.title
        };

        vscode.window.showInputBox(inputBoxOptions)
            .then(options.onInput, asyncErrorCatcher)
            .then(() => { }, asyncErrorCatcher);
    }

    public static showMainView() {
        Presenter.mainView.show();
    }
}