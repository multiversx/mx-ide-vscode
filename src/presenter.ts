import * as vscode from 'vscode';
import { FreeTextVersion, Version } from './version';

export function getActiveFilePath() {
    let activeTextEditor = vscode.window.activeTextEditor;

    if (!activeTextEditor) {
        throw new Error("Open a file!");
    }

    let path = activeTextEditor.document.uri.fsPath;
    return path;
}

export async function askContractName() {
    const result = await vscode.window.showInputBox({
        prompt: "Enter a name for your contract",
        value: "",
        ignoreFocusOut: true,
        placeHolder: "For example: mycontract",
        validateInput: text => {
            return text.length > 0 ? null : "Should not be empty.";
        }
    });

    return result;
}

export async function askModifyLaunchAndTasks(): Promise<boolean> {
    let answer = await askYesNo(`Allow MultiversX IDE to modify this workspace's "launch.json" and "tasks.json"?\n
For a better experience when debugging Smart Contracts, we recommed allowing this change.`);
    return answer;
}

export async function askInstallErdpy(requiredVersion: Version): Promise<boolean> {
    let answer = await askYesNo(`MultiversX IDE requires erdpy ${requiredVersion}, which isn't available in your environment.
Do you agree to install it?`);
    return answer;
}

export async function askErdpyVersion(defaultVersion: Version): Promise<Version> {
    const result = await vscode.window.showInputBox({
        prompt: "Enter the erdpy version to install",
        value: defaultVersion.toString(),
        ignoreFocusOut: true,
        placeHolder: "For example: 1.0.0",
        validateInput: text => {
            return text.length > 0 ? null : "Should not be empty.";
        }
    });

    if (result === undefined) {
        return null;
    }

    return Version.parse(result);
}

export async function askInstallErdpyGroup(group: string): Promise<boolean> {
    let answer = await askYesNo(`It seems that your workspace requires the dependency group "${group}", which isn't available in your erdpy environment.
Do you agree to install it?`);
    return answer;
}

export async function askChooseSdkModule(modules: string[]): Promise<string> {
    return await askChoice(modules);
}

export async function askModuleVersion(): Promise<FreeTextVersion> {
    const result = await vscode.window.showInputBox({
        prompt: "Enter the module version to install (leave blank for default)",
        value: "",
        ignoreFocusOut: true,
        placeHolder: "For example: v1.2.3"
    });

    if (result === undefined) {
        return null;
    }
    if (result == "") {
        return FreeTextVersion.unspecified();
    }

    return new FreeTextVersion(result);
}

export async function askYesNo(question: string): Promise<boolean> {
    let answerYes = "Yes";
    let answerNo = "No";
    let answer = await vscode.window.showInformationMessage(question, { modal: true }, answerYes, answerNo);
    return answer === answerYes;
}

export async function askChoice(choices: string[]): Promise<string> {
    return await vscode.window.showQuickPick(choices, { ignoreFocusOut: true });
}

export async function askChoiceTyped<T extends vscode.QuickPickItem>(choices: T[]): Promise<T> {
    return await vscode.window.showQuickPick<T>(choices, { ignoreFocusOut: true });
}

export async function askOpenFolder(title: string): Promise<string> {
    let uris: vscode.Uri[] = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: title
    });

    return uris ? uris[0]?.path : null;
}
