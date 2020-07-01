import * as vscode from "vscode";
import path = require("path");
import fs = require("fs");
import { Feedback } from "./feedback";
import { MySettings } from "./settings";
import _ = require('underscore');

export function setup() {
    if (!isOpen()) {
        return;
    }

    ensureFolder(".vscode");
    upsertSettings();
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

function upsertSettings(): boolean {
    let filePath = path.join(getPath(), ".vscode", "settings.json");
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}");
    }

    let settingsJson = fs.readFileSync(filePath, { encoding: "utf8" });
    let settings = JSON.parse(settingsJson);
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
        "terminal.integrated.inheritEnv": true
    };

    let patched = false;
    for (const [key, value] of Object.entries(patch)) {
        if (!_.isEqual(settings[key], value)) {
            settings[key] = value;
            patched = true;
        }
    }

    if (patched) {
        let content = JSON.stringify(settings, null, 4);
        fs.writeFileSync(filePath, content);
        Feedback.info("Updated settings.json.");
    }

    return patched;
}

export function guardIsOpen(): boolean {
    if (!isOpen()) {
        Feedback.info("No folder open in your workspace. Please open a folder.");
        return false;
    }

    return true;
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


launch_file = package_path.joinpath("vscode_launch_rust.json")
tasks_file = package_path.joinpath("vscode_tasks_rust.json")
vscode_directory = path.join(self.directory, ".vscode")

logger.info("Creating directory [.vscode]...")
os.mkdir(vscode_directory)
logger.info("Adding files: [launch.json], [tasks.json]")
shutil.copy(launch_file, path.join(vscode_directory, "launch.json"))
shutil.copy(tasks_file, path.join(vscode_directory, "tasks.json"))

self._replace_in_files(
            [launch_path, tasks_path],
            [
                ("{{PROJECT_NAME}}", self.project_name),
                ("{{PATH_RUST_BIN}}", self.rust_bin_directory),
                ("{{RUSTUP_HOME}}", self.rust_directory),
                ("{{CARGO_HOME}}", self.rust_directory)
            ])
*/