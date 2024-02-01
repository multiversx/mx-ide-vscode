import axios from "axios";
import { ConfigurationTarget, InputBoxOptions, Terminal, Uri, window, workspace } from 'vscode';
import { Environment } from './environment';
import { Feedback } from './feedback';
import * as presenter from './presenter';
import { Settings } from './settings';
import * as storage from "./storage";
import { ProcessFacade, sleep } from "./utils";
import { FreeTextVersion, Version } from './version';
import path = require("path");
import fs = require('fs');

const minMxpyVersion = Version.parse("9.4.1");
const mxpyUpUrl = "https://raw.githubusercontent.com/multiversx/mx-sdk-py-cli/main/mxpy-up.py";

export function getPath() {
    return Settings.getSdkPath();
}

function getMxpyPath() {
    // If mxpy is installed using pipx or mxpy-up, it should be in the PATH.
    // If mxpy is installed using the extension, it's in ~/multiversx-sdk, which is also added to the PATH - see "environment.ts".
    return "mxpy";
}

function getPrettyPrinterPath() {
    return path.join(getPath(), "multiversx_sc_lldb_pretty_printers.py");
}

export async function reinstall() {
    await reinstallMxpy();
}

export async function ensureInstalled() {
    await ensureMxpy();
}

export async function ensureMxpy(): Promise<boolean> {
    let [cliVersionString, ok] = await getOneLineStdout(getMxpyPath(), ["--version"]);
    if (!cliVersionString || !ok) {
        return false;
    }

    let installedVersion = Version.parse(cliVersionString);
    let isInstalled = installedVersion.isNewerOrSameAs(minMxpyVersion);
    if (isInstalled) {
        return true;
    }

    await presenter.askInstallMxpy(minMxpyVersion.vValue);
    return false;
}

async function getOneLineStdout(program: string, args: string[]): Promise<[string, boolean]> {
    try {
        let result = await ProcessFacade.execute({
            program: program,
            args: args
        });

        return [result.stdout, true];
    } catch (e) {
        return ["", false];
    }
}

export async function reinstallMxpy() {
    const mxpyUp = storage.getPathTo("mxpy-up.py");
    await downloadFile(mxpyUp, mxpyUpUrl);

    const mxpyUpCommand = `python3 "${mxpyUp}" --not-interactive`;

    await runInTerminal("installer", mxpyUpCommand);

    Feedback.info({
        message: `"mxpy" installation has been started.
Please wait for installation to finish.
Once finished, please close all Visual Studio Code terminals and then reopen them (as needed).`,
        display: true
    });
}

export async function newFromTemplate(folder: string, template: string, name: string) {
    try {
        await ProcessFacade.execute({
            program: getMxpyPath(),
            args: ["contract", "new", "--path", folder, "--template", template, "--name", name],
        });

        Feedback.info({
            message: `Smart Contract [${name}] created, based on template [${template}].`,
            display: true
        });
    } catch (error: any) {
        throw new Error("Could not create Smart Contract", { cause: error });
    }
}

async function runInTerminal(terminalName: string, command: string, env: any = null, cwd: string = "") {
    if (!env) {
        env = Environment.getForTerminal();
    }

    let terminal = await getOrCreateTerminal(terminalName, env, cwd);
    terminal.sendText(command);
    terminal.show(false);
}

async function getOrCreateTerminal(name: string, env: any, cwd: string) {
    let terminal = findTerminal(name);
    if (!terminal) {
        terminal = window.createTerminal({ name: patchTerminalName(name), env: env, cwd: cwd });
    }

    return terminal;
}

function findTerminal(name: string): Terminal {
    let terminal = window.terminals.find(item => item.name == patchTerminalName(name));
    return terminal;
}

function patchTerminalName(name: string): string {
    return `MultiversX: ${name}`;
}

async function destroyTerminal(name: string) {
    let terminal = findTerminal(name);
    if (!terminal) {
        return;
    }

    terminal.hide();
    terminal.dispose();
    await sleep(500);
}

async function killRunningInTerminal(name: string) {
    let terminal = findTerminal(name);
    if (!terminal) {
        return;
    }

    terminal.sendText("\u0003");
}

async function ensureInstalledMxpyGroup(group: string): Promise<boolean> {
    if (await isMxpyGroupInstalled(group)) {
        return true;
    }

    await presenter.askInstallMxpyGroup(group);
    return false;
}

async function isMxpyGroupInstalled(group: string): Promise<boolean> {
    let [_, ok] = await getOneLineStdout(getMxpyPath(), ["deps", "check", group]);
    return ok;
}

export async function reinstallModule(): Promise<void> {
    let module = await presenter.askChooseSdkModule(["vmtools", "rust"]);
    if (!module) {
        return;
    }

    let version = await presenter.askModuleVersion();
    if (!version) {
        return;
    }

    await reinstallMxpyGroup(module, version);
}

async function reinstallMxpyGroup(group: string, version: FreeTextVersion) {
    Feedback.info({
        message: `Installation of ${group} has been started. Please wait for installation to finish.`,
        display: true
    });

    let tagArgument = version.isSpecified() ? `--tag=${version}` : "";
    await runInTerminal("installer", `${getMxpyPath()} --verbose deps install ${group} --overwrite ${tagArgument}`);
}

export async function buildContract(folder: string) {
    if (!await ensureMxpy()) {
        return;
    }

    try {
        await runInTerminal("build", `${getMxpyPath()} contract build --path "${folder}"`);
    } catch (error: any) {
        throw new Error("Could not build Smart Contract", { cause: error });
    }
}

export async function cleanContract(folder: string) {
    if (!await ensureMxpy()) {
        return;
    }

    try {
        await runInTerminal("build", `${getMxpyPath()} --verbose contract clean --path "${folder}"`);
    } catch (error: any) {
        throw new Error("Could not clean Smart Contract", { cause: error });
    }
}

export async function runScenarios(folder: string) {
    if (!await ensureMxpy()) {
        return;
    }

    // This will change very soon, once "mx-scenarios-go" (installable by "sc-meta") is released.
    if (!await ensureInstalledMxpyGroup("vmtools")) {
        return;
    }

    try {
        await ensureInstalledMxpyGroup("vmtools");
        await runInTerminal("scenarios", `run-scenarios "${folder}"`);
    } catch (error: any) {
        throw new Error("Could not run scenarios.", { cause: error });
    }
}

export async function runFreshLocalnet(localnetToml: Uri) {
    if (!await ensureMxpy()) {
        return;
    }

    try {
        let folder = path.dirname(localnetToml.fsPath);

        await ensureInstalledMxpyGroup("golang");
        await destroyTerminal("localnet");
        await runInTerminal("localnet", `${getMxpyPath()} localnet setup`, null, folder);
        await runInTerminal("localnet", `${getMxpyPath()} localnet start`);
    } catch (error: any) {
        throw new Error("Could not start localnet.", { cause: error });
    }
}

export async function resumeExistingLocalnet(localnetToml: Uri) {
    if (!await ensureMxpy()) {
        return;
    }

    try {
        let folder = path.dirname(localnetToml.fsPath);

        await destroyTerminal("localnet");
        await runInTerminal("localnet", `${getMxpyPath()} localnet start`, null, folder);
    } catch (error: any) {
        throw Error("Could not start localnet.", { cause: error });
    }
}

export async function stopLocalnet(_localnetToml: Uri) {
    try {
        await killRunningInTerminal("localnet");
    } catch (error: any) {
        throw new Error("Could not start localnet.", { cause: error });
    }
}

export async function installRustDebuggerPrettyPrinterScript() {
    let repository = await showInputBoxWithDefault({
        title: "Github repository",
        prompt: "The github repository containing the rust debugger pretty printer script.",
        defaultInput: "multiversx/mx-sdk-rs",
        ignoreFocusOut: true,
    });
    let branch = await showInputBoxWithDefault({
        title: "Branch",
        prompt: "The branch to use.",
        defaultInput: "master",
        ignoreFocusOut: true,
    });
    let inputPath = await showInputBoxWithDefault({
        title: "File path",
        prompt: "File path to the pretty printer script.",
        defaultInput: "tools/rust-debugger/pretty-printers/multiversx_sc_lldb_pretty_printers.py",
        ignoreFocusOut: true,
    });

    let url = `https://raw.githubusercontent.com/${repository}/${branch}/${inputPath}`;
    let prettyPrinterPath = getPrettyPrinterPath();
    await downloadFile(prettyPrinterPath, url);

    let lldbConfig = workspace.getConfiguration("lldb");
    let commands = [`command script import ${prettyPrinterPath}`];
    await lldbConfig.update("launch.initCommands", commands, ConfigurationTarget.Global);

    await Feedback.info({
        message: "The rust debugger pretty printer script has been installed.",
        display: true,
        modal: true
    });
}

async function showInputBoxWithDefault(options: InputBoxOptions & { defaultInput: string }) {
    let input = await window.showInputBox({
        ...options,
        prompt: `${options.prompt} Leave empty to accept the default.`,
        placeHolder: `Default: ${options.defaultInput}`
    });
    if (input) {
        return input;
    }
    return options.defaultInput;
}

async function downloadFile(path: fs.PathLike, url: string) {
    let fileData = await downloadRawData(url);
    fs.writeFileSync(path, fileData);

    Feedback.debug({
        message: `Downloaded file from ${url} to ${path}.`
    });
}

async function downloadRawData(url: string): Promise<string> {
    try {
        let response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to download ${url}\n${error}`);
    }
}
