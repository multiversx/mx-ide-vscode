import * as vscode from 'vscode';
import path = require('path');
import os = require('os');
import { ApiClient } from './apiClient';
import { MySettings } from './settings';
import { ProcessFacade, FsFacade } from './utils';
import { Builder } from './builder';

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

function raisePromiseError(error: any) {
	vscode.window.showErrorMessage(error.message);
	throw error;
}

function buildCurrentFile() {
	let filePath = getActiveFilePath();
	Builder.buildFile(filePath);
}

function runCurrentFile() {
	let filePath = getActiveFilePath();
	let parsedPath = path.parse(filePath);
	let filePathWithoutExtension = path.join(parsedPath.dir, parsedPath.name);
	let filePath_wasm = `${filePathWithoutExtension}.wasm`;
	let simpleDebugToolPath: any = MySettings.getSimpleDebugToolPath();

	let options: vscode.InputBoxOptions = {
		value: "yourFunction param1 param2 param3",
		prompt: "Enter transaction data (function and parameters)"
	};

	vscode.window.showInputBox(options).then(onInputFulfilled, raisePromiseError).then(() => { }, raisePromiseError);

	function onInputFulfilled(userInput: any) {
		// simple debug
		let output = ProcessFacade.executeSync(`${simpleDebugToolPath} "${filePath_wasm}" ${userInput}`, true);
		let outputFile = FsFacade.createTempFile("simple_output.txt", output);

		let uri = vscode.Uri.file(outputFile);
		vscode.window.showTextDocument(uri);
	}
}

function buildAndRunCurrentFile() {
	buildCurrentFile();
	runCurrentFile();
}

function getActiveFilePath() {
	let activeTextEditor = vscode.window.activeTextEditor;

	if (!activeTextEditor) {
		throw new Error("Open a file!");
	}

	let path = activeTextEditor.document.uri.fsPath;
	return path;
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