import * as vscode from 'vscode';
import { Root } from './root';
import { Feedback } from './feedback';
import _ = require('underscore');
import * as sdk from "./sdk";
import { TemplatesViewModel as TemplatesViewModel, ContractTemplate } from './templates';
import * as workspace from "./workspace";
import * as presenter from "./presenter";
import { Environment } from './environment';
import * as errors from './errors';
import { SmartContractsViewModel, SmartContract } from './contracts';
import { Uri } from 'vscode';
import path = require("path");


export async function activate(context: vscode.ExtensionContext) {
	Feedback.debug("ElrondIDE.activate()");

	Root.ExtensionContext = context;

	let templatesViewModel = new TemplatesViewModel();
	vscode.window.registerTreeDataProvider("contractTemplates", templatesViewModel);
	let contractsViewModel = new SmartContractsViewModel();
	vscode.window.registerTreeDataProvider("smartContracts", contractsViewModel);

	vscode.commands.registerCommand("elrond.setupWorkspace", setupWorkspace);
	vscode.commands.registerCommand("elrond.installSdk", installSdk);
	vscode.commands.registerCommand("elrond.installSdkModule", installSdkModule);
	vscode.commands.registerCommand("elrond.gotoContract", gotoContract);
	vscode.commands.registerCommand("elrond.buildContract", buildContract);
	vscode.commands.registerCommand("elrond.runMandosTests", runMandosTests);
	vscode.commands.registerCommand("elrond.runArwenDebugTests", runArwenDebugTests);

	vscode.commands.registerCommand("elrond.cleanContract", cleanContract);
	vscode.commands.registerCommand("elrond.refreshTemplates", async () => await refreshViewModel(templatesViewModel));
	vscode.commands.registerCommand("elrond.newFromTemplate", newFromTemplate);
	vscode.commands.registerCommand("elrond.refreshContracts", async () => await refreshViewModel(contractsViewModel));
}

export function deactivate() {
	Feedback.debug("ElrondIDE.deactivate()");
}

async function setupWorkspace() {
	if (!workspace.guardIsOpen()) {
		return;
	}

	Environment.set();
	await workspace.setup();
	await sdk.ensureInstalled();
	await workspace.patchLaunchAndTasks();
	await ensureInstalledBuildchains();
	await Feedback.infoModal("Workspace has been set up.");
}

async function installSdk() {
	try {
		await sdk.reinstall();
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function installSdkModule() {
	try {
		await sdk.reinstallModule();
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function refreshViewModel(viewModel: any) {
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
		await ensureInstalledBuildchains();
		vscode.commands.executeCommand("workbench.files.action.refreshFilesExplorer");
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function gotoContract(contract: SmartContract) {
	try {
		let uri = Uri.file(contract.getMetadataPath());
		await vscode.commands.executeCommand("vscode.open", uri);
		await vscode.commands.executeCommand("workbench.files.action.focusFilesExplorer");
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function buildContract(contract: any) {
	try {
		let folder = getContractFolder(contract);
		await sdk.buildContract(folder);
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function cleanContract(contract: any) {
	try {
		let folder = getContractFolder(contract);
		await sdk.cleanContract(folder);
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

function getContractFolder(contract: any): string {
	if (contract instanceof Uri) {
		let fsPath = (contract as Uri).fsPath;
		if (fsPath.includes("elrond.json")) {
			return path.dirname(fsPath);
		} else {
			return fsPath;
		}
	}

	return (contract as SmartContract).getPath();
}

async function runMandosTests(item: any) {
	try {
		if (item instanceof Uri) {
			await sdk.runMandosTests((item as Uri).fsPath);
		} else {
			await sdk.runMandosTests((item as SmartContract).getPath());
		}
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function runArwenDebugTests(contract: SmartContract) {
	try {
		let folder = getContractFolder(contract);
		await sdk.runArwenDebugTests(folder);
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function ensureInstalledBuildchains() {
	let languages = workspace.getLanguages();
	await sdk.ensureInstalledBuildchains(languages);
}