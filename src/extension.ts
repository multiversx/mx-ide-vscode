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
	let filePathWithoutExtension = path.join(parsedPath.dir, parsedPath.name);
	let filePath_ll = `${filePathWithoutExtension}.ll`;
	let filePath_o = `${filePathWithoutExtension}.o`;
	let filePath_wasm = `${filePathWithoutExtension}.wasm`;

	let clangPath: any = getConfigurationValue("clangPath");
	let llcPath: any = getConfigurationValue("llcPath");
	let wasmLdPath: any = getConfigurationValue("wasmLdPath");
	let symsFilePath = createTemporaryMainSymsFile();

	// clang
	executeChildProcess(`${clangPath} -cc1 -Ofast -emit-llvm -triple=wasm32-unknown-unknown-wasm ${filePath}`);
	// llc
	executeChildProcess(`${llcPath} -O3 -filetype=obj "${filePath_ll}" -o "${filePath_o}"`);
	// wasm-ld
	executeChildProcess(`${wasmLdPath} --no-entry "${filePath_o}" -o "${filePath_wasm}" --strip-all -allow-undefined-file=${symsFilePath} -export=_main -export=do_balance -export=topUp -export=transfer`);

	vscode.window.showInformationMessage(`Build done.`);
}

function runCurrentFile() {
	let filePath = getActiveFilePath();
	let parsedPath = path.parse(filePath);
	let filePathWithoutExtension = path.join(parsedPath.dir, parsedPath.name);
	let filePath_wasm = `${filePathWithoutExtension}.wasm`;

	let elrondGoNodeDebugPath: any = getConfigurationValue("elrondGoNodeDebugPath");
	let txData = "";

	// simple debug
	let output = executeChildProcess(`${elrondGoNodeDebugPath} "${filePath_wasm}" ${txData}`);
	let outputFile = createTemporarySimpleOutputFile(output);

	let uri = vscode.Uri.file(outputFile);
	vscode.window.showTextDocument(uri);
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

	let output = child_process.execSync(command).toString()
	console.log("Executed.");
	return output;
}

function createTemporaryMainSymsFile() {
	let symsFilePath = path.join(os.tmpdir(), "elrond_main.syms");
	let symsFileContent = getMainSyms().join("\n");

	fs.writeFileSync(symsFilePath, symsFileContent);

	return symsFilePath;
}

function createTemporarySimpleOutputFile(content: string) {
	let filePath = path.join(os.tmpdir(), "elrond_main.syms");
	fs.writeFileSync(filePath, content);
	return filePath;
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

function getConfigurationValue(key: string) {
	let configuration = vscode.workspace.getConfiguration('elrond');
	let value = configuration.get(key);
	return value;
}