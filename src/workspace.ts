import * as vscode from "vscode";
import { Environment } from "./environment";
import * as errors from './errors';
import { Feedback } from "./feedback";
import * as presenter from "./presenter";
import { MySettings } from "./settings";
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
    migrateOldWorkspace();
    ensureFolder(path.join(getPath(), ".vscode"));
    ensureWorkspaceDefinitionFile();
    await patchSettingsForSdk();
    setupGitignore();
}

function migrateOldWorkspace() {
    const oldFilePath = path.join(getPath(), "elrond.workspace.json");
    if (fs.existsSync(oldFilePath)) {
        fs.renameSync(oldFilePath, path.join(getPath(), "multiversx.workspace.json"));
    }

    // Also rename project metadata files:
    const pattern = `${getPath()}/**/elrond.json`;
    const paths = glob.sync(pattern, {});
    for (const filePath of paths) {
        const parentOfFilePath = path.dirname(filePath);
        fs.renameSync(filePath, path.join(parentOfFilePath, "multiversx.json"));
    }

    // In .vscode, replace "elrondsdk" with "multiversx-sdk":
    const vscodeFiles = glob.sync(`${getPath()}/.vscode/*.json`, {});

    for (const filePath of vscodeFiles) {
        const oldContent = fs.readFileSync(filePath, { encoding: "utf8" });
        const newContent = oldContent.replace(/elrondsdk/g, "multiversx-sdk");
        fs.writeFileSync(filePath, newContent);
    }
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

async function patchSettingsForSdk(): Promise<boolean> {
    let env = Environment.getForVsCodeFiles();
    let sdkPath = path.join("${env:HOME}", MySettings.getSdkPathRelativeToHome());
    let rustFolder = path.join(sdkPath, "vendor-rust");
    let rustBinFolder = path.join(rustFolder, "bin");

    let patch = {
        "terminal.integrated.env.linux": env,
        "terminal.integrated.env.osx": env,
        "terminal.integrated.environmentChangesIndicator": "on",
        "terminal.integrated.inheritEnv": true,
        "workbench.dialogs.customEnabled": true,
        "rust-client.rustupPath": path.join(rustBinFolder, "rustup"),
        "rust-client.rlsPath": path.join(rustBinFolder, "rls"),
        "rust-client.disableRustup": true,
        "rust-client.autoStartRls": false
    };

    let askText = `Allow MultiversX IDE to modify this workspace's "settings.json"?
The changes include setting environment variables for the terminal integrated in Visual Studio Code.\n
For a better experience when debugging and building Smart Contracts, we recommed allowing this change.`;

    let localSettingsJsonPath = path.join(getPath(), ".vscode", "settings.json");
    return await promptThenPatchSettings(patch, localSettingsJsonPath, askText);
}

export async function promptThenPatchSettings(patch: any, filePath: string, askText: string): Promise<boolean> {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}");
    }

    let settingsJson = fs.readFileSync(filePath, { encoding: "utf8" });
    let settings = JSON.parse(settingsJson);

    let patched = false;
    for (const [key, value] of Object.entries(patch)) {
        if (!_.isEqual(settings[key], value)) {
            settings[key] = value;
            patched = true;
        }
    }

    if (!patched) {
        return false;
    }

    // Patch has been applied in-memory, and now we have to update the file (settings.json).
    // Ask for permission.
    let allow = await presenter.askYesNo(askText);
    if (!allow) {
        return false;
    }

    let content = JSON.stringify(settings, null, 4);
    fs.writeFileSync(filePath, content);
    Feedback.info(`Updated ${filePath}.`);

    return true;
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
