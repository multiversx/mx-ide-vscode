import * as vscode from 'vscode';
import path = require('path');
import os = require('os');
import { RestDebugger } from './debugger';
import { Builder } from './builder';
import { Presenter } from './presenter';
import { Root } from './root';

export function activate(context: vscode.ExtensionContext) {
	Root.ExtensionContext = context;

	registerCustomCommand(context, 'extension.openIDE', openIDE);
	registerCustomCommand(context, 'extension.buildCurrentFile', buildCurrentFile);
	registerCustomCommand(context, 'extension.startDebugServer', startDebugServer);
}

export function deactivate() { }

function registerCustomCommand(context: vscode.ExtensionContext, name: string, action: CallableFunction) {
	let disposable = vscode.commands.registerCommand(name, wrapTry(action));
	context.subscriptions.push(disposable);
}

function wrapTry(action: CallableFunction) {
	return () => {
		try {
			action();
		} catch (error) {
			Presenter.showError(error.message);
		}
	};
}

function openIDE() {
	Presenter.showMainView();
}

function buildCurrentFile() {
	let filePath = Presenter.getActiveFilePath();
	Builder.buildFile(filePath);
}

function startDebugServer() {
	RestDebugger.startServer();
}