import * as vscode from 'vscode';

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

export async function askModifySettings(): Promise<boolean> {
    let answer = await askYesNo(`Allow Elrond IDE to modify this workspace's "settings.json"?
The changes include setting environment variables for the terminal integrated in Visual Studio Code.\n
For a better experience when debugging and building Smart Contracts, we recommed allowing this change.`);
    return answer;
}

export async function askModifyLaunchAndTasks(): Promise<boolean> {
    let answer = await askYesNo(`Allow Elrond IDE to modify this workspace's "launch.json" and "tasks.json"?\n
For a better experience when debugging Smart Contracts, we recommed allowing this change.`);
    return answer;
}

export async function askInstallErdpy(requiredVersion: string): Promise<boolean> {
    let answer = await askYesNo(`Elrond IDE requires erdpy ${requiredVersion} (part of Elrond SDK), which isn't available in your environment.
Do you agree to install it?`);
    return answer;
}

export async function askErdpyVersion(defaultVersion: string): Promise<string> {
    const result = await vscode.window.showInputBox({
        prompt: "Enter the erdpy version to install",
        value: defaultVersion,
        ignoreFocusOut: true,
        placeHolder: "For example: 1.0.0",
        validateInput: text => {
            return text.length > 0 ? null : "Should not be empty.";
        }
    });

    return result;
}

export async function askInstallErdpyGroup(group: string): Promise<boolean> {
    let answer = await askYesNo(`It seems that your workspace requires the dependency group "${group}", which isn't available in your erdpy environment.
Do you agree to install it?`);
    return answer;
}

export async function askChooseSdkModule(modules: string[]): Promise<string> {
    return await askChoice(modules);
}

export async function askModuleVersion(): Promise<string> {
    const result = await vscode.window.showInputBox({
        prompt: "Enter the module version to install (leave blank for default)",
        value: "",
        ignoreFocusOut: true,
        placeHolder: "For example: v1.2.3"
    });

    return result;
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
