import { Feedback } from './feedback';
import { ProcessFacade, RestFacade, sleep } from "./utils";
import { Terminal, Uri, window } from 'vscode';
import { MySettings } from './settings';
import * as storage from "./storage";
import * as errors from './errors';
import * as presenter from './presenter';
import { Environment } from './environment';
import {ErdpyVersionChecker} from './erdpyVersionChecker'
import path = require("path");

let Erdpy = "erdpy";

export function getPath() {
    return MySettings.getElrondSdk();
}

export async function reinstall() {
    let latestErdpyVersion = await ErdpyVersionChecker.getLatestERDPYVersion()

    let version = await presenter.askErdpyVersion(latestErdpyVersion);
    await reinstallErdpy(version);
}

export async function ensureInstalled() {
    await ensureErdpy();
}

async function ensureErdpy() {
    let isEdpyInstalled = await isErdpyInstalled()
    if (isEdpyInstalled) {
        return;
    }

    let latestErdpyVersion = await ErdpyVersionChecker.getLatestERDPYVersion()
    let answer = await presenter.askInstallErdpy(latestErdpyVersion);
    if (answer) {
        await reinstallErdpy(latestErdpyVersion);
    }
}

async function isErdpyInstalled(): Promise<boolean> {
    let [version, ok] = await getOneLineStdout(Erdpy, ["--version"]);
    if (!ok) {
        return false
    }

    let isOk = await ErdpyVersionChecker.isVersionOk(version)

    return isOk;
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

export async function reinstallErdpy(version: string) {
    let erdpyUp = storage.getPathTo("erdpy-up.py");
    await RestFacade.download({
        url: "https://raw.githubusercontent.com/ElrondNetwork/elrond-sdk/development/erdpy-up.py",
        destination: erdpyUp
    });

    let erdpyUpCommand = `python3 "${erdpyUp}" --no-modify-path --exact-version=${version}`;
    await runInTerminal("installer", erdpyUpCommand, Environment.old);

    Feedback.info("erdpy installation has been started. Please wait for installation to finish.");

    do {
        Feedback.debug("Waiting for the installer to finish.");
        await sleep(5000);
    } while ((!await isErdpyInstalled()));

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
    } catch (error) {
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
    } catch (error) {
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
        await reinstallErdpyGroup(group);
    }
}

async function isErdpyGroupInstalled(group: string, version: string = ""): Promise<boolean> {
    let [_, ok] = await getOneLineStdout(Erdpy, ["deps", "check", group]);
    return ok;
}

export async function reinstallModule(): Promise<void> {
    let module = await presenter.askChooseSdkModule(["arwentools", "rust", "clang", "cpp"]);
    let version = await presenter.askModuleVersion();
    await reinstallErdpyGroup(module, version);
}

async function reinstallErdpyGroup(group: string, version: string = "") {
    Feedback.info(`Installation of ${group} has been started. Please wait for installation to finish.`);
    let tagArgument = version ? `--tag=${version}` : "";
    await runInTerminal("installer", `${Erdpy} --verbose deps install ${group} --overwrite ${tagArgument}`);

    do {
        Feedback.debug("Waiting for the installer to finish.");
        await sleep(5000);
    } while ((!await isErdpyGroupInstalled(group, version)));

    await Feedback.infoModal(`${group} has been installed.`);
}

export async function buildContract(folder: string) {
    try {
        await runInTerminal("build", `${Erdpy} --verbose contract build "${folder}"`);
    } catch (error) {
        throw new errors.MyError({ Message: "Could not build Smart Contract", Inner: error });
    }
}

export async function cleanContract(folder: string) {
    try {
        await runInTerminal("build", `${Erdpy} --verbose contract clean "${folder}"`);
    } catch (error) {
        throw new errors.MyError({ Message: "Could not clean Smart Contract", Inner: error });
    }
}

export async function runMandosTests(folder: string) {
    try {
        await ensureInstalledErdpyGroup("arwentools");
        await runInTerminal("mandos", `mandos-test "${folder}"`);
    } catch (error) {
        throw new errors.MyError({ Message: "Could not run Mandos tests.", Inner: error });
    }
}

export async function runArwenDebugTests(folder: string) {
    try {
        await ensureInstalledErdpyGroup("arwentools");
        await ensureInstalledErdpyGroup("nodejs");
        Feedback.infoModal("Not yet implemented.");
    } catch (error) {
        throw new errors.MyError({ Message: "Could not run ArwenDebug tests.", Inner: error });
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
    } catch (error) {
        throw new errors.MyError({ Message: "Could not start testnet.", Inner: error });
    }
}

export async function resumeExistingTestnet(testnetToml: Uri) {
    try {
        let folder = path.dirname(testnetToml.fsPath);

        await destroyTerminal("testnet");
        await runInTerminal("testnet", `${Erdpy} testnet start`, null, folder);
    } catch (error) {
        throw new errors.MyError({ Message: "Could not start testnet.", Inner: error });
    }
}

export async function stopTestnet(testnetToml: Uri) {
    try {
        await killRunningInTerminal("testnet");
    } catch (error) {
        throw new errors.MyError({ Message: "Could not start testnet.", Inner: error });
    }
}
