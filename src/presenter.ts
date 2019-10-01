import * as vscode from 'vscode';
import { FsFacade } from './utils';

export class Presenter {
    public static showInfo(message: string) {
        vscode.window.showInformationMessage(message);
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
}