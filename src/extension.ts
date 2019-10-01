import * as vscode from 'vscode';
import path = require('path');
import os = require('os');
import { Debugger } from './debugger';
import { MySettings } from './settings';
import { ProcessFacade, FsFacade } from './utils';
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
			vscode.window.showErrorMessage(error.message);
		}
	};
}

function buildCurrentFile() {
	let filePath = Presenter.getActiveFilePath();
	Builder.buildFile(filePath);
}

function runCurrentFile() {
	let filePath = Presenter.getActiveFilePath();
	
}

function buildAndRunCurrentFile() {
	buildCurrentFile();
	runCurrentFile();
}

function startDebugServer() {
	killServerIfRunning(function () {
		performStartDebugServer();
	});
}

function killServerIfRunning(callback: CallableFunction) {
	let port: any = MySettings.getRestApiPort();

	ProcessFacade.execute({
		program: "fuser",
		args: ["-k", `${port}/tcp`],
		onClose: callback
	});
}

function performStartDebugServer() {
	let toolPath: any = MySettings.getRestApiToolPath();
	let configPath: any = MySettings.getRestApiConfigPath();
	let port: any = MySettings.getRestApiConfigPath();

	ProcessFacade.execute({
		program: toolPath,
		args: ["--rest-api-port", port, "--config", configPath]
	});
}