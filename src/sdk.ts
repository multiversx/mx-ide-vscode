import { Feedback } from './feedback';
import { ProcessFacade, sleep } from "./utils";
import { Terminal, Uri, window } from 'vscode';
import { MySettings } from './settings';
import axios from "axios";
import * as storage from "./storage";
import * as errors from './errors';
import * as presenter from './presenter';
import { Environment } from './environment';
import path = require("path");
import { FreeTextVersion, Version } from './version';
import fs = require('fs');

const Erdpy = "erdpy";
const DefaultErdpyVersion = new Version(1, 1, 0);
const LatestErdpyReleaseUrl = "https://api.github.com/repos/ElrondNetwork/elrond-sdk-erdpy/releases/latest";
const ErdpyUpUrl = "https://raw.githubusercontent.com/ElrondNetwork/elrond-sdk-erdpy/main/erdpy-up.py";

export function getPath() {
    return MySettings.getElrondSdk();
}

export async function reinstall() {
    let latestErdpyVersion = await getLatestKnownErdpyVersion();
    let version = await presenter.askErdpyVersion(latestErdpyVersion);
    if (!version) {
        return;
    }

    await reinstallErdpy(version);
}

/** 
 * Fetch the latest known version from Github, or fallback to the IDE-configured default version, if the fetch fails.
 */
async function getLatestKnownErdpyVersion(): Promise<Version> {
    try {
        let response = await axios.get(LatestErdpyReleaseUrl);
        return Version.parse(response.data.tag_name);
    } catch {
        return DefaultErdpyVersion;
    }
}

export async function ensureInstalled() {
    await ensureErdpy();
}

async function ensureErdpy() {
    let isEdpyInstalled = await isErdpyInstalled();
    if (isEdpyInstalled) {
        return;
    }

    let latestErdpyVersion = await getLatestKnownErdpyVersion();
    let answer = await presenter.askInstallErdpy(latestErdpyVersion);
    if (answer) {
        await reinstallErdpy(latestErdpyVersion);
    }
}

async function isErdpyInstalled(exactVersion?: Version): Promise<boolean> {
    let [cliVersionString, ok] = await getOneLineStdout(Erdpy, ["--version"]);
    if (!ok) {
        return false;
    }

    let installedVersion = Version.parse(cliVersionString);

    if (exactVersion) {
        return installedVersion.isSameAs(exactVersion);
    }

    // No exact version specified (desired).
    let latestKnownVersion = await getLatestKnownErdpyVersion();
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

export async function reinstallErdpy(version: Version) {
    let erdpyUp = storage.getPathTo("erdpy-up.py");
    let response = await axios.get(ErdpyUpUrl);
    fs.writeFileSync(erdpyUp, response.data);
    Feedback.debug(`Downloaded: ${ErdpyUpUrl} to ${erdpyUp}.`);

    let erdpyUpCommand = `python3 "${erdpyUp}" --no-modify-path --exact-version=${version}`;
    await runInTerminal("installer", erdpyUpCommand, Environment.old);

    Feedback.info("erdpy installation has been started. Please wait for installation to finish.");

    do {
        Feedback.debug("Waiting for the installer to finish.");
        await sleep(5000);
    } while ((!await isErdpyInstalled(version)));

    await Feedback.infoModal("erdpy has been installed. Please close all Visual Studio Code terminals and then reopen them (as needed).");
}

export async function fetchTemplates(cacheFile: string) {
    try {
        await ProcessFacade.execute({
            program: Erdpy,
            args: ["contract", "templates"],
            doNotDumpStdout: true,
            stdoutToFile: cacheFile
        });

        Feedback.debug(`Templates fetched, saved to ${cacheFile}.`);
    } catch (error: any) {
        throw new errors.MyError({ Message: "Could not fetch templates", Inner: error });
    }
}

export async function newFromTemplate(folder: string, template: string, name: string) {
    try {
        await ProcessFacade.execute({
            program: Erdpy,
            args: ["contract", "new", "--directory", folder, "--template", template, name],
        });

        Feedback.info(`Smart Contract [${name}] created, based on template [${template}].`);
    } catch (error: any) {
        throw new errors.MyError({ Message: "Could not create Smart Contract", Inner: error });
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
    return `Elrond: ${name}`;
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
        await ensureInstalledErdpyGroup(languages[i]);
    }
}

async function ensureInstalledErdpyGroup(group: string) {
    if (await isErdpyGroupInstalled(group)) {
        return;
    }

    let answer = await presenter.askInstallErdpyGroup(group);
    if (answer) {
        await reinstallErdpyGroup(group, FreeTextVersion.unspecified());
    }
}

async function isErdpyGroupInstalled(group: string): Promise<boolean> {
    let [_, ok] = await getOneLineStdout(Erdpy, ["deps", "check", group]);
    return ok;
}

export async function reinstallModule(): Promise<void> {
    let module = await presenter.askChooseSdkModule(["vmtools", "rust", "clang", "cpp"]);
    if (!module) {
        return;
    }

    let version = await presenter.askModuleVersion();
    if (!version) {
        return;
    }

    await reinstallErdpyGroup(module, version);
}

async function reinstallErdpyGroup(group: string, version: FreeTextVersion) {
    Feedback.info(`Installation of ${group} has been started. Please wait for installation to finish.`);
    let tagArgument = version.isSpecified() ? `--tag=${version}` : "";
    await runInTerminal("installer", `${Erdpy} --verbose deps install ${group} --overwrite ${tagArgument}`);

    do {
        Feedback.debug("Waiting for the installer to finish.");
        await sleep(5000);
    } while ((!await isErdpyGroupInstalled(group)));

    await Feedback.infoModal(`${group} has been installed.`);
}

export async function buildContract(folder: string) {
    try {
        await runInTerminal("build", `${Erdpy} --verbose contract build "${folder}"`);
    } catch (error: any) {
        throw new errors.MyError({ Message: "Could not build Smart Contract", Inner: error });
    }
}

export async function cleanContract(folder: string) {
    try {
        await runInTerminal("build", `${Erdpy} --verbose contract clean "${folder}"`);
    } catch (error: any) {
        throw new errors.MyError({ Message: "Could not clean Smart Contract", Inner: error });
    }
}

export async function runMandosTests(folder: string) {
    try {
        await ensureInstalledErdpyGroup("vmtools");
        await runInTerminal("mandos", `mandos-test "${folder}"`);
    } catch (error: any) {
        throw new errors.MyError({ Message: "Could not run Mandos tests.", Inner: error });
    }
}

export async function runWasmVMDebugTests(_folder: string) {
    try {
        await ensureInstalledErdpyGroup("vmtools");
        await ensureInstalledErdpyGroup("nodejs");
        Feedback.infoModal("Not yet implemented.");
    } catch (error: any) {
        throw new errors.MyError({ Message: "Could not run Wasm VM tests.", Inner: error });
    }
}

export async function runFreshTestnet(testnetToml: Uri) {
    try {
        let folder = path.dirname(testnetToml.fsPath);

        await ensureInstalledErdpyGroup("golang");
        await destroyTerminal("testnet");
        await runInTerminal("testnet", `${Erdpy} testnet clean`, null, folder);
        await runInTerminal("testnet", `${Erdpy} testnet prerequisites`);
        await runInTerminal("testnet", `${Erdpy} testnet config`);
        await runInTerminal("testnet", `${Erdpy} testnet start`);
    } catch (error: any) {
        throw new errors.MyError({ Message: "Could not start testnet.", Inner: error });
    }
}

export async function resumeExistingTestnet(testnetToml: Uri) {
    try {
        let folder = path.dirname(testnetToml.fsPath);

        await destroyTerminal("testnet");
        await runInTerminal("testnet", `${Erdpy} testnet start`, null, folder);
    } catch (error: any) {
        throw new errors.MyError({ Message: "Could not start testnet.", Inner: error });
    }
}

export async function stopTestnet(_testnetToml: Uri) {
    try {
        await killRunningInTerminal("testnet");
    } catch (error: any) {
        throw new errors.MyError({ Message: "Could not start testnet.", Inner: error });
    }
}
