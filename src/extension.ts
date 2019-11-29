import * as vscode from 'vscode';
import { NodeDebug } from './nodeDebug';
import { Presenter } from './presenter';
import { Root } from './root';
import { Feedback } from './feedback';
import { Projects } from './projects';
import { SmartContractsCollection } from './smartContract';

export function activate(context: vscode.ExtensionContext) {
	Root.ExtensionContext = context;

	registerCustomCommand(context, 'extension.openIDE', openIDE);
	registerCustomCommand(context, 'extension.buildCurrentFile', buildCurrentFile);
	registerCustomCommand(context, 'extension.startNodeDebug', startNodeDebug);
	registerCustomCommand(context, 'extension.createSmartContract', Projects.createSmartContract);

	Feedback.debug(`NodeJS version: ${process.version}.`);
}

export function deactivate() { }

function registerCustomCommand(context: vscode.ExtensionContext, name: string, action: CallableFunction) {
	let disposable = vscode.commands.registerCommand(name, () => action());
	context.subscriptions.push(disposable);
}

function openIDE() {
	Presenter.showMainView();
}

function buildCurrentFile() {
	let filePath = Presenter.getActiveFilePath();
	SmartContractsCollection.syncWithWorkspace();
	let smartContract = SmartContractsCollection.getBySourceFile(filePath);
	smartContract.build();
}

function startNodeDebug() {
	NodeDebug.start();
}