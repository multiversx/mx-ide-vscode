import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { AnswersRepository } from './assistant/answersRepository';
import { AssistantFacade } from './assistant/assistantFacade';
import { AssistantGateway } from './assistant/assistantGateway';
import { AssistantTerms } from './assistant/assistantTerms';
import { AssistantViewProvider } from './assistant/assistantViewProvider';
import { BotInlineCompletionItemProvider } from './botCodeCompletion';
import { CodingSessionsRepository } from './codingSessions/codingSessionsRepository';
import { CodingSessionsTreeDataProvider } from './codingSessions/codingSessionsTreeDataProvider';
import { SmartContract, SmartContractsViewModel } from './contracts';
import * as errors from './errors';
import { Feedback } from './feedback';
import * as presenter from "./presenter";
import { Root } from './root';
import * as sdk from "./sdk";
import { MySettings } from './settings';
import { ContractTemplate, TemplatesViewModel } from './templates';
import { WelcomeViewProvider } from './welcome/welcomeViewProvider';
import * as workspace from "./workspace";
import path = require("path");

export async function activate(context: vscode.ExtensionContext) {
	Feedback.debug("MultiversXIDE.activate()");

	Root.ExtensionContext = context;

	const templatesViewModel = new TemplatesViewModel();
	const contractsViewModel = new SmartContractsViewModel();

	vscode.window.registerTreeDataProvider("contractTemplates", templatesViewModel);
	vscode.window.registerTreeDataProvider("smartContracts", contractsViewModel);

	vscode.commands.registerCommand("multiversx.setupWorkspace", setupWorkspace);
	vscode.commands.registerCommand("multiversx.installSdk", installSdk);
	vscode.commands.registerCommand("multiversx.installSdkModule", installSdkModule);
	vscode.commands.registerCommand("multiversx.installRustDebuggerPrettyPrinterScript", installRustDebuggerPrettyPrinterScript);
	vscode.commands.registerCommand("multiversx.gotoContract", gotoContract);
	vscode.commands.registerCommand("multiversx.buildContract", buildContract);
	vscode.commands.registerCommand("multiversx.runScenarios", runScenarios);
	vscode.commands.registerCommand("multiversx.runFreshTestnet", runFreshTestnet);
	vscode.commands.registerCommand("multiversx.resumeExistingTestnet", resumeExistingTestnet);
	vscode.commands.registerCommand("multiversx.stopTestnet", stopTestnet);

	vscode.commands.registerCommand("multiversx.cleanContract", cleanContract);
	vscode.commands.registerCommand("multiversx.refreshTemplates", async () => await refreshViewModel(templatesViewModel));
	vscode.commands.registerCommand("multiversx.newFromTemplate", newFromTemplate);
	vscode.commands.registerCommand("multiversx.refreshContracts", async () => await refreshViewModel(contractsViewModel));

	const assistantGateway = new AssistantGateway({
		baseUrl: MySettings.getAssistantApiUrl()
	});

	const assistantTerms = new AssistantTerms({
		memento: context.globalState
	});

	const codingSessionsRepository = new CodingSessionsRepository({ memento: context.globalState });

	const codingSessionsTreeDataProvider = new CodingSessionsTreeDataProvider({
		creator: assistantGateway,
		repository: codingSessionsRepository,
		memento: context.globalState
	});

	const answersRepository = new AnswersRepository({ memento: context.globalState });

	const assistantFacade = new AssistantFacade({
		gateway: assistantGateway,
		codingSessionProvider: {
			getCodingSession: () => codingSessionsTreeDataProvider.getSelectedCodingSession()
		},
		answersRepository: answersRepository
	});

	// Welcome
	const welcomeViewProvider = new WelcomeViewProvider({
		extensionUri: context.extensionUri,
		assistantTerms: assistantTerms
	});

	vscode.window.registerWebviewViewProvider("multiversx.welcome", welcomeViewProvider);

	// Coding sessions
	vscode.window.registerTreeDataProvider("multiversx.codingSessions", codingSessionsTreeDataProvider);
	await codingSessionsTreeDataProvider.refresh();

	vscode.commands.registerCommand("multiversx.refreshCodingSessions", async () => {
		await codingSessionsTreeDataProvider.refresh();
	});

	vscode.commands.registerCommand("multiversx.selectCodingSession", async (item: { identifier: string }) => {
		await codingSessionsTreeDataProvider.selectCodingSession(item.identifier);
	});

	vscode.commands.registerCommand("multiversx.createCodingSession", async () => {
		try {
			await codingSessionsTreeDataProvider.createCodingSession();
		} catch (error: any) {
			errors.caughtTopLevel(error);
		}
	});

	vscode.commands.registerCommand("multiversx.removeCodingSession", async (item: { identifier: string }) => {
		try {
			await codingSessionsTreeDataProvider.removeCodingSession(item.identifier);
			await answersRepository.removeAnswer({ codingSessionId: item.identifier });
		} catch (error: any) {
			errors.caughtTopLevel(error);
		}
	});

	// Asistant (chat)
	const assistantViewProvider = new AssistantViewProvider({
		extensionUri: context.extensionUri,
		assistant: assistantFacade,
	});

	vscode.window.registerWebviewViewProvider("multiversx.assistant", assistantViewProvider);

	vscode.commands.registerCommand("multiversx.refreshAssistant", async () => {
		await assistantViewProvider.refresh();
	});

	// Assistant: completion
	const completionProvider = vscode.languages.registerInlineCompletionItemProvider({
		pattern: "**/*",
	}, new BotInlineCompletionItemProvider());

	context.subscriptions.push(completionProvider);

	// Assistant: explain
	vscode.commands.registerCommand("multiversx.botExplainCode", async (uri: Uri) => {
		await botExplainCode(uri, assistantFacade);
	});
}

export function deactivate() {
	Feedback.debug("MultiversXIDE.deactivate()");
}

async function setupWorkspace() {
	if (!workspace.guardIsOpen()) {
		return;
	}

	await workspace.setup();
	await sdk.ensureInstalled();
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

async function installRustDebuggerPrettyPrinterScript() {
	try {
		await sdk.installRustDebuggerPrettyPrinterScript();
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
		errors.caughtTopLevel(error);
	}
}

async function runFreshTestnet(testnetToml: Uri) {
	try {
		await sdk.runFreshTestnet(testnetToml);
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function resumeExistingTestnet(testnetToml: Uri) {
	try {
		await sdk.resumeExistingTestnet(testnetToml);
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function stopTestnet(testnetToml: Uri) {
	try {
		await sdk.stopTestnet(testnetToml);
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}

async function ensureInstalledBuildchains() {
	let languages = workspace.getLanguages();
	await sdk.ensureInstalledBuildchains(languages);
}

async function botExplainCode(_uri: Uri, assistant: AssistantFacade) {
	try {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const document = editor.document;
		const selection = editor.selection;
		const code = selection.isEmpty ? document.getText() : document.getText(selection);
		const explanation = await assistant.explainCode({ code: code });

		// https://github.com/microsoft/vscode/issues/75612
		const renderedExplanation = await vscode.commands.executeCommand("markdown.api.render", explanation);

		const panel = vscode.window.createWebviewPanel(
			"multiversx",
			"Explanation",
			vscode.ViewColumn.Beside,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			}
		);

		panel.webview.html = `<pre style="white-space: pre-wrap;">${renderedExplanation}</pre>`;
	} catch (error) {
		errors.caughtTopLevel(error);
	}
}
