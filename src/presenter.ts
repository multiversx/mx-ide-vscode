import * as vscode from 'vscode';

export class Presenter {
    public static showInfo(message: string) {
        vscode.window.showInformationMessage(message);
    }
}