import * as vscode from 'vscode';
import path = require('path');
import os = require('os');
import { SimpleDebugger, RestDebugger } from './debugger';
import { Builder } from './builder';
import { Presenter } from './presenter';

export function activate(context: vscode.ExtensionContext) {
	registerCustomCommand(context, 'extension.buildCurrentFile', buildCurrentFile);
	registerCustomCommand(context, 'extension.runCurrentFile', runCurrentFile);
	registerCustomCommand(context, 'extension.buildAndRunCurrentFile', buildAndRunCurrentFile);
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

function buildCurrentFile() {
	let filePath = Presenter.getActiveFilePath();
	Builder.buildFile(filePath);
}

function runCurrentFile() {
	let filePath = Presenter.getActiveFilePath();
	SimpleDebugger.debugFile(filePath);
}

function buildAndRunCurrentFile() {
	buildCurrentFile();
	runCurrentFile();
}

function startDebugServer() {
	RestDebugger.startServer();
}