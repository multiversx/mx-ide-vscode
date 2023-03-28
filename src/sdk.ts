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

const Mxpy = "mxpy";
const DefaultMxpyVersion = Version.parse("5.3.2");
const LatestMxpyReleaseUrl = "https://api.github.com/repos/multiversx/mx-sdk-py-cli/releases/latest";

export function getPath() {
    return Settings.getSdkPath();
}

function getPrettyPrinterPath() {
    return path.join(getPath(), "multiversx_sc_lldb_pretty_printers.py");
}

export async function reinstall() {
    let latestVersion = await getLatestKnownMxpyVersion();
    let version = await presenter.askMxpyVersion(latestVersion);
    if (!version) {
        return;
    }

    await reinstallMxpy(version);
}

/** 
 * Fetch the latest known version from Github, or fallback to the IDE-configured default version, if the fetch fails.
 */
async function getLatestKnownMxpyVersion(): Promise<Version> {
    try {
        let response = await axios.get(LatestMxpyReleaseUrl);
        return Version.parse(response.data.tag_name);
    } catch {
        return DefaultMxpyVersion;
    }
}

export async function ensureInstalled() {
    await ensureMxpy();
}

async function ensureMxpy() {
    let isEdpyInstalled = await isMxpyInstalled();
    if (isEdpyInstalled) {
        return;
    }

    let latestMxpyVersion = await getLatestKnownMxpyVersion();
    let answer = await presenter.askInstallMxpy(latestMxpyVersion);
    if (answer) {
        await reinstallMxpy(latestMxpyVersion);
    }
}

async function isMxpyInstalled(exactVersion?: Version): Promise<boolean> {
    let [cliVersionString, ok] = await getOneLineStdout(Mxpy, ["--version"]);
    if (!cliVersionString || !ok) {
        return false;
    }

    let installedVersion = Version.parse(cliVersionString);

    if (exactVersion) {
        return installedVersion.isSameAs(exactVersion);
    }

    // No exact version specified (desired).
    let latestKnownVersion = await getLatestKnownMxpyVersion();
    return installedVersion.isNewerOrSameAs(latestKnownVersion);
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

export async function reinstallMxpy(version: Version) {
    const mxpyUp = storage.getPathTo("mxpy-up.py");
    const mxpyUpUrl = getMxpyUpUrl(version);
    await downloadFile(mxpyUp, mxpyUpUrl);

    const isV6OrNewer = version.isNewerOrSameAs(Version.parse("6.0.0-alpha.0"));
    const mxpyUpCommand = isV6OrNewer ?
        `python3 "${mxpyUp}" --exact-version=${version.value} --not-interactive` :
        `python3 "${mxpyUp}" --no-modify-path --exact-version=${version}`;

    await runInTerminal("installer", mxpyUpCommand);

    Feedback.info("mxpy installation has been started. Please wait for installation to finish.");

    do {
        Feedback.debug("Waiting for the installer to finish.");
        await sleep(5000);
    } while ((!await isMxpyInstalled(version)));

    await Feedback.infoModal("mxpy has been installed. Please close all Visual Studio Code terminals and then reopen them (as needed).");
}

function getMxpyUpUrl(version: Version) {
    return `https://raw.githubusercontent.com/multiversx/mx-sdk-py-cli/${version.vValue}/mxpy-up.py`;
}

export async function fetchTemplates(cacheFile: string) {
    try {
        await ProcessFacade.execute({
            program: Mxpy,
            args: ["contract", "templates"],
            doNotDumpStdout: true,
            stdoutToFile: cacheFile
        });

        Feedback.debug(`Templates fetched, saved to ${cacheFile}.`);
    } catch (error: any) {
        throw new Error("Could not fetch templates", { cause: error });
    }
}

export async function newFromTemplate(folder: string, template: string, name: string) {
    try {
        await ProcessFacade.execute({
            program: Mxpy,
            args: ["contract", "new", "--directory", folder, "--template", template, name],
        });

        Feedback.info(`Smart Contract [${name}] created, based on template [${template}].`);
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

export async function ensureInstalledBuildchains(languages: string[]) {
    for (let i = 0; i < languages.length; i++) {
        await ensureInstalledMxpyGroup(languages[i]);
    }
}

async function ensureInstalledMxpyGroup(group: string) {
    if (await isMxpyGroupInstalled(group)) {
        return;
    }

    let answer = await presenter.askInstallMxpyGroup(group);
    if (answer) {
        await reinstallMxpyGroup(group, FreeTextVersion.unspecified());
    }
}

async function isMxpyGroupInstalled(group: string): Promise<boolean> {
    let [_, ok] = await getOneLineStdout(Mxpy, ["deps", "check", group]);
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
    Feedback.info(`Installation of ${group} has been started. Please wait for installation to finish.`);
    let tagArgument = version.isSpecified() ? `--tag=${version}` : "";
    await runInTerminal("installer", `${Mxpy} --verbose deps install ${group} --overwrite ${tagArgument}`);

    do {
        Feedback.debug("Waiting for the installer to finish.");
        await sleep(5000);
    } while ((!await isMxpyGroupInstalled(group)));

    await Feedback.infoModal(`${group} has been installed.`);
}

export async function buildContract(folder: string) {
    try {
        await runInTerminal("build", `${Mxpy} --verbose contract build "${folder}"`);
    } catch (error: any) {
        throw new Error("Could not build Smart Contract", { cause: error });
    }
}

export async function cleanContract(folder: string) {
    try {
        await runInTerminal("build", `${Mxpy} --verbose contract clean "${folder}"`);
    } catch (error: any) {
        throw new Error("Could not clean Smart Contract", { cause: error });
    }
}

export async function runScenarios(folder: string) {
    try {
        await ensureInstalledMxpyGroup("vmtools");
        await runInTerminal("scenarios", `run-scenarios "${folder}"`);
    } catch (error: any) {
        throw new Error("Could not run scenarios.", { cause: error });
    }
}

export async function runFreshTestnet(testnetToml: Uri) {
    try {
        let folder = path.dirname(testnetToml.fsPath);

        await ensureInstalledMxpyGroup("golang");
        await destroyTerminal("testnet");
        await runInTerminal("testnet", `${Mxpy} testnet clean`, null, folder);
        await runInTerminal("testnet", `${Mxpy} testnet prerequisites`);
        await runInTerminal("testnet", `${Mxpy} testnet config`);
        await runInTerminal("testnet", `${Mxpy} testnet start`);
    } catch (error: any) {
        throw new Error("Could not start testnet.", { cause: error });
    }
}

export async function resumeExistingTestnet(testnetToml: Uri) {
    try {
        let folder = path.dirname(testnetToml.fsPath);

        await destroyTerminal("testnet");
        await runInTerminal("testnet", `${Mxpy} testnet start`, null, folder);
    } catch (error: any) {
        throw Error("Could not start testnet.", { cause: error });
    }
}

export async function stopTestnet(_testnetToml: Uri) {
    try {
        await killRunningInTerminal("testnet");
    } catch (error: any) {
        throw new Error("Could not start testnet.", { cause: error });
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

    await Feedback.infoModal(`The rust debugger pretty printer script has been installed.`);
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
    Feedback.debug(`Downloaded file from ${url} to ${path}.`);
}

async function downloadRawData(url: string): Promise<string> {
    try {
        let response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to download ${url}\n${error}`);
    }
}
