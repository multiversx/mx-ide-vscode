import * as vscode from 'vscode';
import { FreeTextVersion } from './version';

export async function askOpenWorkspace() {
    const message = "No folder open in your workspace. Please open a folder.";
    await vscode.window.showInformationMessage(message, { modal: true });
}

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

export async function askInstallMxpy(minMxpyVersion: string): Promise<void> {
    const message = `MultiversX IDE requires mxpy ${minMxpyVersion} (or later), which isn't available in your environment.
  
  In order to install it, please follow:
  
  https://docs.multiversx.com/sdk-and-tools/sdk-py/installing-mxpy
  
  Alternatively, invoke the VSCode command "MultiversX: Install mxpy".
  `;

    await vscode.window.showInformationMessage(message, { modal: true });
}

export async function askInstallMxpyGroup(group: string): Promise<void> {
    const message = `It seems that your workspace requires the dependency group "${group}", which isn't available in your environment.
  
  In order to install it, run the following in your terminal:
  
  "mxpy deps install ${group}"
  
  Alternatively, invoke the VSCode command "MultiversX: Install Module or Dependency".
    `;

    await vscode.window.showInformationMessage(message, { modal: true });
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
