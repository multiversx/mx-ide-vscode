import * as vscode from 'vscode';
import { MainView as MainView } from './mainView';

export class Presenter {
    static mainView : MainView = new MainView();

    public static showInfo(message: string) {
        vscode.window.showInformationMessage(message);
    }

    public static showError(message: string) {
        vscode.window.showErrorMessage(message);
    }

    public static getActiveFilePath() {
        let activeTextEditor = vscode.window.activeTextEditor;

        if (!activeTextEditor) {
            throw new Error("Open a file!");
        }

        let path = activeTextEditor.document.uri.fsPath;
        return path;
    }

    public static showMainView() {
        Presenter.mainView.show();
    }
}