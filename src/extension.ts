import * as vscode from 'vscode';
import child_process = require('child_process');
import path = require('path');
import os = require('os');
import fs = require('fs');

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
	let filePath = getActiveFilePath();
	let parsedPath = path.parse(filePath);
	let parentDirectory = parsedPath.dir;
	let filename = parsedPath.name;
	let fullPathWithoutExtension = path.join(parentDirectory, filename);

	vscode.window.showInformationMessage(`Build: ${filePath}.`);

	let configuration = vscode.workspace.getConfiguration('elrond');
	let clangPath: any = configuration.get("clangPath");
	let llcPath: any = configuration.get("llcPath");
	let wasmLdPath: any = configuration.get("wasmLdPath");

	let symsFilePath = path.join(os.tmpdir(), "elrond_main.syms");
	let symsFileContent = getMainSyms().join("\n");
	fs.writeFileSync(symsFilePath, symsFileContent);

	// clang
	executeChildProcess(`${clangPath} -cc1 -Ofast -emit-llvm -triple=wasm32-unknown-unknown-wasm ${filePath}`);
	// llc
	executeChildProcess(`${llcPath} -O3 -filetype=obj "${fullPathWithoutExtension}.ll" -o "${fullPathWithoutExtension}.o"`);
	// wasm-ld
	executeChildProcess(`${wasmLdPath} --no-entry "${fullPathWithoutExtension}.o" -o "${fullPathWithoutExtension}.wasm" --strip-all -allow-undefined-file=${symsFilePath} -export=_main -export=do_balance -export=topUp -export=transfer`);

	vscode.window.showInformationMessage(`Build done.`);
}

function runCurrentFile() {
	let filePath = getActiveFilePath();
	vscode.window.showInformationMessage(`Run: ${filePath}.`);
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

	child_process.execSync(command);
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