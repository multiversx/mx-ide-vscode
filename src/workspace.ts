import * as vscode from "vscode";
import path = require("path");
import fs = require("fs");
import { Feedback } from "./feedback";
import { MySettings } from "./settings";
import _ = require('underscore');
import * as presenter from "./presenter";

export async function setup() {
    if (!isOpen()) {
        return;
    }

    ensureFolder(".vscode");
    await patchSettings();
}

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

function ensureFolder(folderName: string) {
    let folderPath = path.join(getPath(), folderName);
    if (fs.existsSync(folderPath)) {
        return;
    }

    fs.mkdirSync(folderPath);
}

async function patchSettings(): Promise<boolean> {
    let filePath = path.join(getPath(), ".vscode", "settings.json");
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}");
    }

    let json = fs.readFileSync(filePath, { encoding: "utf8" });
    let settings = JSON.parse(json);
    let sdkPath = MySettings.getElrondSdk();

    let env: any = {
        "PYTHONHOME": null,
        "PATH": path.join(sdkPath, "erdpy-venv", "bin") + ":" + "${env:PATH}",
        "VIRTUAL_ENV": path.join(sdkPath, "erdpy-venv")
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
        Feedback.info("No folder open in your workspace. Please open a folder.");
        return false;
    }

    return true;
}

export function patchLaunchAndTasks() {
    patchLaunch();
    patchTasks();
}

export function patchLaunch() {
    let filePath = path.join(getPath(), ".vscode", "launch.json");
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `{
    "version": "0.2.0",
    "configurations": []
}`);
    }

    let json = fs.readFileSync(filePath, { encoding: "utf8" });
    let launchObject = JSON.parse(json);
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
                "cwd": "${workspaceFolder}",
                // TODO: In erdpy, add symbolic links to /rust/bin, /arwentools/test etc.
                // TODO: That is, create symbolic links to skip the tags.
                // "env": {
                //     "PATH": "{{PATH_RUST_BIN}}:${env:PATH}",
                //     "RUSTUP_HOME": "{{RUSTUP_HOME}}",
                //     "CARGO_HOME": "{{CARGO_HOME}}"
                // }
            };

            // TODO: Check if not exists.
            launchObject["configurations"].push(debugProject);
        }
    });

    // TODO: Ask for permission.
    let content = JSON.stringify(launchObject, null, 4);
    fs.writeFileSync(filePath, content);
    Feedback.info("Updated launch.json.");
}

export function patchTasks() {
    let filePath = path.join(getPath(), ".vscode", "tasks.json");
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `{
            "version": "2.0.0",
            "tasks": []
        }`);
    }

    let json = fs.readFileSync(filePath, { encoding: "utf8" });
    let tasksObject = JSON.parse(json);
    let projects = getProjects();

    projects.forEach(project => {
        let language = getLanguage(project);
        if (language == "rust") {
            let buildTask: any = {
                "label": `${project}-debug-build`,
                "command": "cargo",
                "args": ["build"],
                "options": {
                    "cwd": "${workspaceFolder}/" + `${project}/debug`,
                    // "env": {
                    //     "PATH": "{{PATH_RUST_BIN}}:${env:PATH}",
                    //     "RUSTUP_HOME": "{{RUSTUP_HOME}}",
                    //     "CARGO_HOME": "{{CARGO_HOME}}"
                    // }
                },
                "type": "shell"
            };

            // TODO: Check if not exists already.
            tasksObject["tasks"].push(buildTask);
        }
    });

    // TODO: Ask for permission.
    let content = JSON.stringify(tasksObject, null, 4);
    fs.writeFileSync(filePath, content);
    Feedback.info("Updated tasks.json.");
}

export function getProjects(): string[] {
    return fs.readdirSync(getPath(), { withFileTypes: true })
        .filter(item => item.isDirectory())
        .filter(folder => folder.name != ".vscode")
        .map(folder => folder.name);
}

function getLanguage(project: string) {
    return getMetadata(project).language;
}

function getMetadata(project: string) {
    let filePath = path.join(getPath(), project, "elrond.json");
    let json = fs.readFileSync(filePath, { encoding: "utf8" });
    return JSON.parse(json);
}

// TODO: Adjust launch.json and tasks.json for each project (smart contract) in the workspace.
/*
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Debug {{PROJECT_NAME}}",
            "preLaunchTask": "{{PROJECT_NAME}}-debug-build",
            "program": "${workspaceFolder}/debug/target/debug/{{PROJECT_NAME}}-debug",
            "args": [],
            "cwd": "${workspaceFolder}",
            "env": {
                "PATH": "{{PATH_RUST_BIN}}:${env:PATH}",
                "RUSTUP_HOME": "{{RUSTUP_HOME}}",
                "CARGO_HOME": "{{CARGO_HOME}}"
            }
        }
    ]
}

{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "{{PROJECT_NAME}}-debug-build",
            "command": "cargo",
            "args": ["build"],
            "options": {
                "cwd": "${workspaceFolder}/debug",
                "env": {
                    "PATH": "{{PATH_RUST_BIN}}:${env:PATH}",
                    "RUSTUP_HOME": "{{RUSTUP_HOME}}",
                    "CARGO_HOME": "{{CARGO_HOME}}"
                }
            },
            "type": "shell"
        }
    ]
}

self._replace_in_files(
            [launch_path, tasks_path],
            [
                ("{{PROJECT_NAME}}", self.project_name),
                ("{{PATH_RUST_BIN}}", self.rust_bin_directory),
                ("{{RUSTUP_HOME}}", self.rust_directory),
                ("{{CARGO_HOME}}", self.rust_directory)
            ])
*/