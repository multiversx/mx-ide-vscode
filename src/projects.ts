import * as vscode from 'vscode';
import { FsFacade } from "./utils";
import path = require('path');
import { Feedback } from "./feedback";

export class Projects {
    static async createSmartContract() {
        if (!FsFacade.isWorkspaceOpen()) {
            Feedback.info("No folder open in your workspace. Please open a folder.");
            return;
        }

        let prototype = await Projects.askPrototype();

        if (!prototype) {
            return;
        }

        let name = await Projects.askName();

        if (!name) {
            Feedback.error("Smart contract name should not be empty. Please try again.");
            return;
        }

        Projects.createSubproject(name, prototype);
    }

    static async askPrototype() {
        let options = ["erc20-c", "erc20-c-old", "dummy-rust"];
        let prototype = await vscode.window.showQuickPick(options, { placeHolder: "Select prototype (template):" });
        return prototype;
    }

    static async askName(): Promise<string> {
        let name = await vscode.window.showInputBox({
            value: "Name of smart contract (subproject)",
            prompt: "Name of smart contract (subproject)"
        });

        return name;
    }

    static async createSubproject(name: string, prototypeName: string) {
        try {
            FsFacade.createFolderInWorkspace(name);

            let prototypePath = path.join(FsFacade.getPathToSnippets(), prototypeName);
            let subprojectPath = path.join(FsFacade.getPathToWorkspace(), name);

            FsFacade.copyFolder(prototypePath, subprojectPath)
            Feedback.info(`Please refresh workspace. Subproject ${name} (${prototypeName}) created.`);
        } catch (error) {
            Feedback.error(`Could not create subproject. Reason: ${error}`);
        }
    }
}