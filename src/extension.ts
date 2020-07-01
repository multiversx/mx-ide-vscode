import * as vscode from 'vscode';
import { Presenter } from './presenter';
import { Root } from './root';
import { Feedback } from './feedback';
import { SmartContractsCollection } from './smartContract';
import _ = require('underscore');
import * as sdk from "./sdk";
import { ContractTemplatesProvider, ContractTemplate } from './templates';
import * as workspace from "./workspace";
import { Environment } from './environment';

export function activate(context: vscode.ExtensionContext) {
	Feedback.debug("ElrondIDE.activate()");

	Root.ExtensionContext = context;

	let templatesProvider = new ContractTemplatesProvider();
	vscode.window.registerTreeDataProvider("contractTemplates", templatesProvider);

	vscode.commands.registerCommand("elrond.installSdk", installSdk);
	vscode.commands.registerCommand("elrond.buildContract", buildContract);
	vscode.commands.registerCommand("elrond.refreshTemplates", () => templatesProvider.refresh());
	vscode.commands.registerCommand("elrond.newFromTemplate", (item: ContractTemplate) => vscode.window.showInformationMessage(`New from template ${JSON.stringify(item)}`));

	initialize();
}

export function deactivate() {
	Feedback.debug("ElrondIDE.deactivate()");
}

function initialize() {
	Environment.set();
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
