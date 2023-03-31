import * as vscode from "vscode";

export async function askCodingSessionName() {
    const workspaceName = vscode.workspace.name;
    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    const defaultName = workspaceName || workspaceFolder?.name || "My Coding Session";

    return await vscode.window.showInputBox({
        prompt: "Enter a name for the new coding session",
        value: defaultName,
        ignoreFocusOut: true,
        placeHolder: "For example: 'My Coding Session'",
        validateInput: text => {
            return text.length > 0 ? null : "Should not be empty.";
        }
    });
}
