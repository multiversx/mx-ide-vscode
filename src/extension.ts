import * as vscode from 'vscode';
import { NodeDebug } from './nodeDebug';
import { Presenter } from './presenter';
import { Root } from './root';
import { Feedback } from './feedback';
import { Projects } from './projects';
import { SmartContractsCollection } from './smartContract';
import _ = require('underscore');

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
	Presenter.showMainView();
}

function buildCurrentFile() {
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