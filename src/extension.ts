import * as vscode from 'vscode';
import { NodeDebug } from './nodeDebug';
import { Presenter } from './presenter';
import { Root } from './root';
import { Feedback } from './feedback';
import { Projects } from './projects';
import { SmartContractsCollection } from './smartContract';
import _ = require('underscore');
import { FsFacade } from './utils';

export function activate(context: vscode.ExtensionContext) {
	Root.ExtensionContext = context;

	registerCustomCommand(context, 'extension.openIDE', openIDE);
	registerCustomCommand(context, 'extension.buildCurrentFile', buildCurrentFile);
	registerCustomCommand(context, 'extension.startNodeDebug', startNodeDebug);
	registerCustomCommand(context, 'extension.stopNodeDebug', stopNodeDebug);
	registerCustomCommand(context, 'extension.createSmartContract', Projects.createSmartContract);

	Feedback.debug("ElrondIDE.activate()");
	initialize();
}

export function deactivate() {
	Feedback.debug("ElrondIDE.deactivate()");
}

function initialize() {
	initializeWorkspaceWatcher();
}

function initializeWorkspaceWatcher() {
	if (!guardIsWorkspaceOpen()) {
		return;
	}

	Root.FileSystemWatcher = vscode.workspace.createFileSystemWatcher("**/*");

	var onWatcherEventThrottled = _.throttle(onWatcherEvent, 1000);

	function onWatcherEvent() {
		SmartContractsCollection.syncWithWorkspace();
	}

	Root.FileSystemWatcher.onDidChange(onWatcherEventThrottled);
	Root.FileSystemWatcher.onDidCreate(onWatcherEventThrottled);
	Root.FileSystemWatcher.onDidDelete(onWatcherEventThrottled);

	SmartContractsCollection.syncWithWorkspace();
}

function registerCustomCommand(context: vscode.ExtensionContext, name: string, action: CallableFunction) {
	let disposable = vscode.commands.registerCommand(name, () => action());
	context.subscriptions.push(disposable);
}

function openIDE() {
	if (!guardIsWorkspaceOpen()) {
		return;
	}

	Presenter.showMainView();
}

function buildCurrentFile() {
	if (!guardIsWorkspaceOpen()) {
		return;
	}
	
	let filePath = Presenter.getActiveFilePath();
	let smartContract = SmartContractsCollection.getBySourceFile(filePath);
	smartContract.build();
}

function startNodeDebug() {
	NodeDebug.start();
}

function stopNodeDebug() {
	NodeDebug.stop();
}

function guardIsWorkspaceOpen(): boolean {
	if (!FsFacade.isWorkspaceOpen()) {
		Feedback.info("No folder open in your workspace. Please open a folder.");
		return false;
	}

	return true;
}