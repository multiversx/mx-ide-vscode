import * as vscode from 'vscode';
import { Root } from './root';
import { Feedback } from './feedback';
import { SmartContractsCollection } from './smartContract';
import _ = require('underscore');
import * as sdk from "./sdk";
import { TemplatesViewModel as TemplatesViewModel, ContractTemplate } from './templates';
import * as workspace from "./workspace";
import * as presenter from "./presenter";
import { Environment } from './environment';
import * as errors from './errors';


export async function activate(context: vscode.ExtensionContext) {
	Feedback.debug("ElrondIDE.activate()");

	Root.ExtensionContext = context;

	let templatesViewModel = new TemplatesViewModel();
	vscode.window.registerTreeDataProvider("contractTemplates", templatesViewModel);

	vscode.commands.registerCommand("elrond.installSdk", installSdk);
	vscode.commands.registerCommand("elrond.buildContract", buildContract);
	vscode.commands.registerCommand("elrond.refreshTemplates", async () => await refreshTemplates(templatesViewModel));
	vscode.commands.registerCommand("elrond.newFromTemplate", newFromTemplate);

	await initialize();
}

export function deactivate() {
	Feedback.debug("ElrondIDE.deactivate()");
}

async function initialize() {
	Environment.set();
	await workspace.setup();
	await sdk.ensureInstalled();
	await workspace.patchLaunchAndTasks();

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

async function installSdk() {
	try {
		await sdk.reinstall();
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function refreshTemplates(viewModel: TemplatesViewModel) {
	try {
		await viewModel.refresh();
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function newFromTemplate(template: ContractTemplate) {
	try {
		let parentFolder = workspace.getPath();
		let templateName = template.name;
		let contractName = await presenter.askContractName();

		await sdk.newFromTemplate(parentFolder, templateName, contractName);
		await workspace.patchLaunchAndTasks();
		vscode.commands.executeCommand("workbench.files.action.refreshFilesExplorer");
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

function buildContract() {
	try {
		if (!workspace.guardIsOpen()) {
			return;
		}

		let filePath = presenter.getActiveFilePath();
		let smartContract = SmartContractsCollection.getBySourceFile(filePath);
		smartContract.build();
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}
