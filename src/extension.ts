import * as vscode from 'vscode';
import child_process = require('child_process');

export function activate(context: vscode.ExtensionContext) {

	let disposableCommandBuildCurrentFile = vscode.commands.registerCommand('extension.buildCurrentFile', wrapTry(buildCurrentFile));
	let disposableCommandRunCurrentFile = vscode.commands.registerCommand('extension.runCurrentFile', wrapTry(runCurrentFile));

	context.subscriptions.push(disposableCommandBuildCurrentFile);
	context.subscriptions.push(disposableCommandRunCurrentFile);
}

export function deactivate() {}

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
	let path = getActiveFilePath();

	vscode.window.showInformationMessage(`Build: ${path}.`);

	let configuration = vscode.workspace.getConfiguration('elrond');
	let clangPath: any = configuration.get("clangPath");
	let llcPath: any = configuration.get("llcPath");
	let wasmLdPath: any = configuration.get("wasmLdPath");

	let command: string = `${clangPath} -cc1 -Ofast -emit-llvm -triple=wasm32-unknown-unknown-wasm ${path}`;
	executeChildProcess(command);

	vscode.window.showInformationMessage(`Build done.`);
}

function runCurrentFile() {
	let path = getActiveFilePath();
	vscode.window.showInformationMessage(`Run: ${path}.`);
}

function getActiveFilePath() {
	let activeTextEditor = vscode.window.activeTextEditor;

	if (!activeTextEditor) {
		throw new Error("Open a file!");
	}

	let path = activeTextEditor.document.uri.fsPath;
	return path;
}

function executeChildProcess(command: string) {
	console.log("Will execute child process:");
	console.log(command);

	child_process.exec(command, (error: any, stdout: any, stderr: any) => {
		if (error) {
			console.error(error);
			vscode.window.showErrorMessage(error || stdout || stderr);
		}

		console.log('STDOUT: ' + stdout);
		console.error('STDERR: ' + stderr);
	});
}

function getMainSyms() {
    return [
        "getOwner",
        "getExternalBalance",
        "blockHash",
        "transfer",
        "getArgument",
        "getArgumentAsInt64",
        "getFunction",
        "getNumArguments",
        "storageStore",
        "storageLoad",
        "storageStoreAsInt64",
        "storageLoadAsInt64",
        "getCaller",
        "getCallValue",
        "getCallValueAsInt64",
        "logMessage",
        "writeLog",
        "finish",
        "getBlockTimestamp",
        "signalError"
    ];
}