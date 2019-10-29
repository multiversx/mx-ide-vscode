import * as vscode from 'vscode';
import { RestDebugger } from './debugger';
import { Builder } from './builder';
import { Presenter } from './presenter';
import { Root } from './root';
import { Feedback } from './feedback';
import { FsFacade } from './utils';

export function activate(context: vscode.ExtensionContext) {
	Root.ExtensionContext = context;

	registerCustomCommand(context, 'extension.openIDE', openIDE);
	registerCustomCommand(context, 'extension.buildCurrentFile', buildCurrentFile);
	registerCustomCommand(context, 'extension.startNodeDebug', startNodeDebug);
	registerCustomCommand(context, 'extension.createSmartContractErc20', createSmartContractErc20);
	registerCustomCommand(context, 'extension.createSmartContractDummy', createSmartContractDummy);

	Feedback.debug(`Node version: ${process.version}.`);
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
	Builder.buildFile(filePath);
}

function startNodeDebug() {
	RestDebugger.start();
}

async function createSmartContractErc20() {
	let name = await Presenter.askSimpleInput({
		title: "Name of smart contract",
		placeholder: "myerc20"
	});

	if (!name) {
		return;
	}

	let path = require('path');

	FsFacade.createFolderInWorkspace(name);
	let elrondScHeader = FsFacade.readFileInSnippets("elrond_sc.h");
	let cContent = FsFacade.readFileInSnippets("wrc20_arwen.c");
	let exportContent = FsFacade.readFileInSnippets("wrc20_arwen.export");

	FsFacade.writeFileToWorkspace(path.join(name, "elrond_sc.h"), elrondScHeader);
	FsFacade.writeFileToWorkspace(path.join(name, "wrc20_arwen.c"), cContent);
	FsFacade.writeFileToWorkspace(path.join(name, "wrc20_arwen.export"), exportContent);
}

async function createSmartContractDummy() {
	let name = await Presenter.askSimpleInput({
		title: "Name of smart contract",
		placeholder: "myexample"
	});

	if (!name) {
		return;
	}

	let path = require('path');

	FsFacade.createFolderInWorkspace(name);
	let elrondScHeader = FsFacade.readFileInSnippets("elrond_sc.h");
	let cContent = FsFacade.readFileInSnippets("dummy.c");
	let exportContent = FsFacade.readFileInSnippets("dummy.export");

	FsFacade.writeFileToWorkspace(path.join(name, "elrond_sc.h"), elrondScHeader);
	FsFacade.writeFileToWorkspace(path.join(name, "dummy.c"), cContent);
	FsFacade.writeFileToWorkspace(path.join(name, "dummy.export"), exportContent);
}