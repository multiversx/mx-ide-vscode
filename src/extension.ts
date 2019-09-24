import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	let disposableCommandBuildCurrentFile = vscode.commands.registerCommand('extension.buildCurrentFile', buildCurrentFile);
	let disposableCommandRunCurrentFile = vscode.commands.registerCommand('extension.runCurrentFile', runCurrentFile);

	context.subscriptions.push(disposableCommandBuildCurrentFile);
	context.subscriptions.push(disposableCommandRunCurrentFile);
}

export function deactivate() {}

function buildCurrentFile() {
	vscode.window.showInformationMessage("Build.");
}

function runCurrentFile() {
	vscode.window.showInformationMessage("Run.");
}