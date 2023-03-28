import * as vscode from "vscode";
import { onTopLevelError } from "./errors";
import { Feedback } from "./feedback";
import path = require("path");
import fs = require("fs");
import glob = require("glob");

let languages = ["rust"];

export function isOpen(): boolean {
    return getPath() ? true : false;
}

export function getPath() {
    let folders = vscode.workspace.workspaceFolders;
    let workspaceFolder: vscode.WorkspaceFolder = folders ? folders[0] : null;

    if (workspaceFolder) {
        return workspaceFolder.uri.fsPath;
    } else {
        throw new Error("Workspace not available.");
    }
}

export async function setup() {
    ensureWorkspaceDefinitionFile();
}

function ensureWorkspaceDefinitionFile() {
    const filePath = path.join(getPath(), "multiversx.workspace.json");
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}");
    }
}

export function guardIsOpen(): boolean {
    if (!isOpen()) {
        Feedback.infoModal("No folder open in your workspace. Please open a folder.");
        return false;
    }

    return true;
}

export function getLanguages(): string[] {
    const metadataObjects = getMetadataObjects();
    const languagesInProject = metadataObjects.map(item => item.Language);
    const set = new Set(languagesInProject);
    return [...set.values()];
}

export function getMetadataObjects(): ProjectMetadata[] {
    let pattern = `${getPath()}/**/multiversx.json`;
    let paths = glob.sync(pattern, {});
    let result: ProjectMetadata[] = [];

    paths.forEach(item => {
        try {
            result.push(new ProjectMetadata(item));
        } catch (error) {
            onTopLevelError(error);
        }
    });

    return result;
}

export function getMetadataObjectByFolder(folder: string): ProjectMetadata {
    const metadataPath = path.join(folder, "multiversx.json");
    return new ProjectMetadata(metadataPath);
}

export class ProjectMetadata {
    Path: string;
    ProjectPath: string;
    ProjectPathInWorkspace: string;
    ProjectName: string;
    Language: string;

    constructor(metadataFile: string) {
        let json = fs.readFileSync(metadataFile, { encoding: "utf8" });
        let parsed = JSON.parse(json);

        this.Path = metadataFile;
        this.Language = parsed.language;
        this.ProjectPath = path.dirname(metadataFile);
        this.ProjectPathInWorkspace = this.ProjectPath.replace(getPath(), "");
        this.ProjectName = path.basename(this.ProjectPath);

        if (!languages.includes(this.Language)) {
            throw new Error(`Bad project metadata: ${metadataFile}. Language not supported: ${this.Language}`);
        }
    }
}

