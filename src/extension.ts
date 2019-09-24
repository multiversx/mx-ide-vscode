import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	let disposableCommandBuildCurrentFile = vscode.commands.registerCommand('extension.buildCurrentFile', wrapTry(buildCurrentFile));
	let disposableCommandRunCurrentFile = vscode.commands.registerCommand('extension.runCurrentFile', wrapTry(runCurrentFile));

	context.subscriptions.push(disposableCommandBuildCurrentFile);
	context.subscriptions.push(disposableCommandRunCurrentFile);
}

export function deactivate() {}

function buildCurrentFile() {
	let path = getActiveFilePath();
	vscode.window.showInformationMessage(`Build: ${path}.`);
}

function runCurrentFile() {
	let path = getActiveFilePath();
	vscode.window.showInformationMessage(`Run: ${path}.`);
}

function getActiveFilePath() {
	let activeTextEditor = vscode.window.activeTextEditor;

	if (!activeTextEditor) {
		throw new Error("Open a file!");
	}

	let path = activeTextEditor.document.uri.fsPath;
	return path;
}

function wrapTry(action: CallableFunction) {
	return () => {
		try {
			action();
		} catch (error) {
			vscode.window.showErrorMessage(error.message);
		}
	};
}