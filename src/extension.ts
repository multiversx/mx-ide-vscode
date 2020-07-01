import * as vscode from 'vscode';
import { Presenter } from './presenter';
import { Root } from './root';
import { Feedback } from './feedback';
import { SmartContractsCollection } from './smartContract';
import _ = require('underscore');
import * as sdk from "./sdk";
import { ContractTemplatesProvider } from './templates';
import * as workspace from "./workspace";

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
	sdk.setupEnvironment();
	sdk.ensureInstalled();
	workspace.setup();
	//initializeWorkspaceWatcher();
}

function initializeWorkspaceWatcher() {
	if (!workspace.guardIsOpen()) {
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

function installSdk() {
	sdk.reinstall();
}

function buildContract() {
	if (!workspace.guardIsOpen()) {
		return;
	}

	let filePath = Presenter.getActiveFilePath();
	let smartContract = SmartContractsCollection.getBySourceFile(filePath);
	smartContract.build();
}
