import * as vscode from "vscode";
import * as errors from './errors';
import { Feedback } from "./feedback";
import path = require("path");
import fs = require("fs");
import _ = require('underscore');
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
        throw new errors.MyError({ Message: "Workspace not available." });
    }
}

export async function setup() {
    ensureWorkspaceDefinitionFile();
    setupGitignore();
}

export function ensureFolder(folderPath: string) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
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

export function getLanguages() {
    let metadataObjects = getMetadataObjects();
    let languagesInProject = metadataObjects.map(item => item.Language);
    languagesInProject = _.uniq(languagesInProject);
    return languagesInProject;
}

export function getMetadataObjects(): ProjectMetadata[] {
    let pattern = `${getPath()}/**/multiversx.json`;
    let paths = glob.sync(pattern, {});
    let result: ProjectMetadata[] = [];

    paths.forEach(item => {
        try {
            result.push(new ProjectMetadata(item));
        } catch (error) {
            errors.caughtTopLevel(error);
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
            throw new errors.MyError({ Message: `Bad project metadata: ${metadataFile}. Language not supported: ${this.Language}` });
        }
    }
}

function setupGitignore() {
    let gitignore = path.join(getPath(), ".gitignore");

    writeFileIfMissing(gitignore, `# MultiversX IDE
**/node_modules
**/output/**
**/testnet/**
**/wallets/**
**/mxpy.data-storage.json
**/*.interaction.json
`);
}

export function writeFileIfMissing(filePath: string, content: string) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
    }
}
