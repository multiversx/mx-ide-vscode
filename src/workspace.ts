import * as vscode from "vscode";
import path = require("path");
import fs = require("fs");
import { Feedback } from "./feedback";
import { MySettings } from "./settings";
import _ = require('underscore');
import * as presenter from "./presenter";


export function isOpen(): boolean {
    return getPath() ? true : false;
}

export function getPath() {
    let folders = vscode.workspace.workspaceFolders;
    let workspaceFolder: vscode.WorkspaceFolder = folders ? folders[0] : null;

    if (workspaceFolder) {
        return workspaceFolder.uri.fsPath;
    }
}

export async function setup() {
    ensureFolder(".vscode");
    ensureWorkspaceDefinitionFile();
    await patchSettings();
}


function ensureFolder(folderName: string) {
    let folderPath = path.join(getPath(), folderName);
    if (fs.existsSync(folderPath)) {
        return;
    }

    fs.mkdirSync(folderPath);
}

function ensureWorkspaceDefinitionFile() {
    let filePath = path.join(getPath(), "elrond.workspace.json");
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}");
    }
}

async function patchSettings(): Promise<boolean> {
    let filePath = path.join(getPath(), ".vscode", "settings.json");
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}");
    }

    let json = fs.readFileSync(filePath, { encoding: "utf8" });
    let settings = JSON.parse(json);
    let sdkPath = path.join("${env:HOME}", MySettings.getElrondSdkRelativeToHome());
    let erdpyEnvFolder = path.join(sdkPath, "erdpy-venv");
    let erdpyBinFolder = path.join(erdpyEnvFolder, "bin");
    let rustFolder = path.join(sdkPath, "vendor-rust");
    let rustBinFolder = path.join(rustFolder, "bin");

    let env: any = {
        "PYTHONHOME": null,
        "PATH": rustBinFolder + ":" + erdpyBinFolder + ":" + "${env:PATH}",
        "VIRTUAL_ENV": erdpyEnvFolder,
        "RUSTUP_HOME": rustFolder,
        "CARGO_HOME": rustFolder
    };

    let patch = {
        "terminal.integrated.env.linux": env,
        "terminal.integrated.env.osx": env,
        "terminal.integrated.environmentChangesIndicator": "on",
        "terminal.integrated.inheritEnv": true,
        "workbench.dialogs.customEnabled": true
    };

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

    let allow = await presenter.askModifySettings();
    if (!allow) {
        return false;
    }

    let content = JSON.stringify(settings, null, 4);
    fs.writeFileSync(filePath, content);
    Feedback.info("Updated settings.json.");

    return true;
}

export function guardIsOpen(): boolean {
    if (!isOpen()) {
        Feedback.infoModal("No folder open in your workspace. Please open a folder.");
        return false;
    }

    return true;
}

export async function patchLaunchAndTasks() {
    let launchPath = path.join(getPath(), ".vscode", "launch.json");
    if (!fs.existsSync(launchPath)) {
        fs.writeFileSync(launchPath, `{
    "version": "0.2.0",
    "configurations": []
}`);
    }

    let tasksPath = path.join(getPath(), ".vscode", "tasks.json");
    if (!fs.existsSync(tasksPath)) {
        fs.writeFileSync(tasksPath, `{
    "version": "2.0.0",
    "tasks": []
}`);
    }

    let launchObject = JSON.parse(fs.readFileSync(launchPath, { encoding: "utf8" }));
    let tasksObject = JSON.parse(fs.readFileSync(tasksPath, { encoding: "utf8" }));
    let launchItems: any[] = launchObject["configurations"];
    let tasksItems: any[] = tasksObject["tasks"];
    let patched = false;

    let projects = getProjects();

    projects.forEach(project => {
        let language = getLanguage(project);
        if (language == "rust") {
            let debugProject: any = {
                "type": "lldb",
                "request": "launch",
                "name": `Debug ${project}`,
                "preLaunchTask": `${project}-debug-build`,
                "program": "${workspaceFolder}/" + `${project}/debug/target/debug/${project}-debug`,
                "args": [],
                "cwd": "${workspaceFolder}"
            };

            let buildTask: any = {
                "label": `${project}-debug-build`,
                "command": "cargo",
                "args": ["build"],
                "options": {
                    "cwd": "${workspaceFolder}/" + `${project}/debug`
                },
                "type": "shell"
            };

            let debugProjectExists = launchItems.find(item => item.name == debugProject.name) ? true : false;
            let buildTaskExists = tasksItems.find(item => item.label == buildTask.label) ? true : false;

            if (!debugProjectExists || !buildTaskExists) {
                launchItems.push(debugProject);
                tasksObject["tasks"].push(buildTask);
                patched = true;
            }
        }
    });

    if (!patched) {
        return false;
    }

    let allow = await presenter.askModifyLaunchAndTasks();
    if (!allow) {
        return false;
    }

    fs.writeFileSync(launchPath, JSON.stringify(launchObject, null, 4));
    fs.writeFileSync(tasksPath, JSON.stringify(tasksObject, null, 4));
    Feedback.info("Updated launch.json and tasks.json.");
}

export function getProjects(): string[] {
    return fs.readdirSync(getPath(), { withFileTypes: true })
        .filter(item => item.isDirectory())
        .filter(folder => fs.existsSync(getMetadataPath(folder.name)))
        .map(folder => folder.name);
}

export function getProjectPath(project: string) {
    let filePath = path.join(getPath(), project);
    return filePath;
}

export function getProjectPathByUri(uri: vscode.Uri): string {
    let project = getProjectByUri(uri);
    return path.join(getPath(), project);
}

export function getProjectByUri(uri: vscode.Uri): string {
    let fsPath = uri.fsPath;
    fsPath = fsPath.replace(getPath() + path.sep, "");
    let project = fsPath.split(path.sep)[0];
    return project;
}

function getLanguage(project: string) {
    return getMetadata(project).language;
}

export function getMetadata(project: string) {
    let filePath = getMetadataPath(project);
    let json = fs.readFileSync(filePath, { encoding: "utf8" });
    return JSON.parse(json);
}

export function getMetadataPath(project: string) {
    let filePath = path.join(getPath(), project, "elrond.json");
    return filePath;
}

export function getLanguages() {
    let languages = getProjects().map(item => getLanguage(item));
    languages = _.uniq(languages);
    return languages;
}