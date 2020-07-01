import * as vscode from 'vscode';
import { Presenter } from './presenter';
import { Root } from './root';
import { Feedback } from './feedback';
import { SmartContractsCollection } from './smartContract';
import _ = require('underscore');
import { FsFacade } from './utils';
import { ElrondSdk } from './elrondSdk';
import { ContractTemplatesProvider } from './templates';

export function activate(context: vscode.ExtensionContext) {
	Feedback.debug("ElrondIDE.activate()");

	Root.ExtensionContext = context;

	let templatesProvider = new ContractTemplatesProvider();
	vscode.window.registerTreeDataProvider("contractTemplates", templatesProvider);

	registerCustomCommand(context, "elrond.installSdk", installSdk);
	registerCustomCommand(context, "elrond.buildContract", buildContract);
	registerCustomCommand(context, "elrond.refreshTemplates", () => templatesProvider.refresh());

	initialize();
}

export function deactivate() {
	Feedback.debug("ElrondIDE.deactivate()");
}

function initialize() {
	ElrondSdk.setupEnvironment();
	ElrondSdk.require();
	//initializeWorkspaceWatcher();
}

function initializeWorkspaceWatcher() {
	if (!guardIsWorkspaceOpen()) {
		return;
	}

	Root.FileSystemWatcher = vscode.workspace.createFileSystemWatcher("**/*");

	var onWatcherEventThrottled = _.throttle(onWatcherEvent, 1000);

	function onWatcherEvent() {
		//SmartContractsCollection.syncWithWorkspace();
	}

	Root.FileSystemWatcher.onDidChange(onWatcherEventThrottled);
	Root.FileSystemWatcher.onDidCreate(onWatcherEventThrottled);
	Root.FileSystemWatcher.onDidDelete(onWatcherEventThrottled);

	//SmartContractsCollection.syncWithWorkspace();
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

function installSdk() {
	ElrondSdk.install();
}

function buildContract() {
	if (!guardIsWorkspaceOpen()) {
		return;
	}

	let filePath = Presenter.getActiveFilePath();
	let smartContract = SmartContractsCollection.getBySourceFile(filePath);
	smartContract.build();
}

function guardIsWorkspaceOpen(): boolean {
	if (!FsFacade.isWorkspaceOpen()) {
		Feedback.info("No folder open in your workspace. Please open a folder.");
		return false;
	}

	return true;
}