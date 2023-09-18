import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { SmartContract, SmartContractsViewModel } from './contracts';
import { onTopLevelError } from "./errors";
import { Feedback } from './feedback';
import * as presenter from "./presenter";
import { Root } from './root';
import * as sdk from "./sdk";
import { ContractTemplate, TemplatesViewModel } from './templates';
import * as workspace from "./workspace";
import path = require("path");

export async function activate(context: vscode.ExtensionContext) {
	Feedback.debug({ message: "MultiversX extension activated." });

	Root.ExtensionContext = context;

	let templatesViewModel = new TemplatesViewModel();
	vscode.window.registerTreeDataProvider("contractTemplates", templatesViewModel);
	let contractsViewModel = new SmartContractsViewModel();
	vscode.window.registerTreeDataProvider("smartContracts", contractsViewModel);

	vscode.commands.registerCommand("multiversx.setupWorkspace", setupWorkspace);
	vscode.commands.registerCommand("multiversx.installSdk", installSdk);
	vscode.commands.registerCommand("multiversx.installSdkModule", installSdkModule);
	vscode.commands.registerCommand("multiversx.installRustDebuggerPrettyPrinterScript", installRustDebuggerPrettyPrinterScript);
	vscode.commands.registerCommand("multiversx.gotoContract", gotoContract);
	vscode.commands.registerCommand("multiversx.buildContract", buildContract);
	vscode.commands.registerCommand("multiversx.runScenarios", runScenarios);
	vscode.commands.registerCommand("multiversx.runFreshLocalnet", runFreshLocalnet);
	vscode.commands.registerCommand("multiversx.resumeExistingLocalnet", resumeExistingLocalnet);
	vscode.commands.registerCommand("multiversx.stopLocalnet", stopLocalnet);

	vscode.commands.registerCommand("multiversx.cleanContract", cleanContract);
	vscode.commands.registerCommand("multiversx.refreshTemplates", async () => await refreshViewModel(templatesViewModel));
	vscode.commands.registerCommand("multiversx.newFromTemplate", newFromTemplate);
	vscode.commands.registerCommand("multiversx.refreshContracts", async () => await refreshViewModel(contractsViewModel));
}

export function deactivate() {
	Feedback.debug({ message: "MultiversX extension deactivated." });
}

async function setupWorkspace() {
	if (!workspace.isOpen()) {
		await presenter.askOpenWorkspace();
		return;
	}

	await workspace.setup();
	await sdk.ensureInstalled();
	await ensureInstalledBuildchains();

	await Feedback.info({
		message: "Workspace has been set up.",
		display: true
	});
}

async function installSdk() {
	try {
		await sdk.reinstall();
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function installSdkModule() {
	try {
		await sdk.reinstallModule();
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function installRustDebuggerPrettyPrinterScript() {
	try {
		await sdk.installRustDebuggerPrettyPrinterScript();
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function refreshViewModel(viewModel: any) {
	try {
		await viewModel.refresh();
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function newFromTemplate(template: ContractTemplate) {
	try {
		let parentFolder = workspace.getPath();
		let templateName = template.name;
		let contractName = await presenter.askContractName();

		await sdk.newFromTemplate(parentFolder, templateName, contractName);
		await ensureInstalledBuildchains();
		vscode.commands.executeCommand("workbench.files.action.refreshFilesExplorer");
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function gotoContract(contract: SmartContract) {
	try {
		let uri = Uri.file(contract.getMetadataPath());
		await vscode.commands.executeCommand("vscode.open", uri);
		await vscode.commands.executeCommand("workbench.files.action.focusFilesExplorer");
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function buildContract(contract: any) {
	try {
		let folder = getContractFolder(contract);
		await sdk.buildContract(folder);
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function cleanContract(contract: any) {
	try {
		let folder = getContractFolder(contract);
		await sdk.cleanContract(folder);
	} catch (error) {
		await onTopLevelError(error);
	}
}

function getContractFolder(contract: any): string {
	if (contract instanceof Uri) {
		let fsPath = contract.fsPath;
		if (fsPath.includes("multiversx.json")) {
			return path.dirname(fsPath);
		} else if (fsPath.includes("snippets.sh")) {
			return path.dirname(fsPath);
		} else {
			return fsPath;
		}
	}

	return (contract as SmartContract).getPath();
}

async function runScenarios(item: any) {
	try {
		if (item instanceof Uri) {
			await sdk.runScenarios(item.fsPath);
		} else {
			await sdk.runScenarios((item as SmartContract).getPath());
		}
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function runFreshLocalnet(localnetToml: Uri) {
	try {
		await sdk.runFreshLocalnet(localnetToml);
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function resumeExistingLocalnet(localnetToml: Uri) {
	try {
		await sdk.resumeExistingLocalnet(localnetToml);
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function stopLocalnet(localnetToml: Uri) {
	try {
		await sdk.stopLocalnet(localnetToml);
	} catch (error) {
		await onTopLevelError(error);
	}
}

async function ensureInstalledBuildchains() {
	let languages = workspace.getLanguages();
	await sdk.ensureInstalledBuildchains(languages);
}
