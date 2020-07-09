import { Feedback } from './feedback';
import { ProcessFacade, RestFacade } from "./utils";
import { window } from 'vscode';
import { MySettings } from './settings';
import path = require("path");
import * as storage from "./storage";
import * as errors from './errors';
import * as presenter from './presenter';
import { Environment } from './environment';


let MinErdpyVersion = "0.5.4b1";

export function getPath() {
    return MySettings.getElrondSdk();
}

export async function reinstall() {
    let version = await presenter.askErdpyVersion(MinErdpyVersion);
    await reinstallErdpy(version);
}

export async function ensureInstalled() {
    await ensureErdpy();
}

async function ensureErdpy() {
    if (await isErdpyInstalled()) {
        return;
    }

    let answer = await presenter.askInstallErdpy(MinErdpyVersion);
    if (answer) {
        await reinstallErdpy(MinErdpyVersion);
    }
}

async function isErdpyInstalled(): Promise<boolean> {
    let [version, ok] = await getOneLineStdout("erdpy", ["--version"]);
    let isNewer = version >= `erdpy ${MinErdpyVersion}`;
    return ok && isNewer;
}

async function getOneLineStdout(program: string, args: string[]): Promise<[string, boolean]> {
    try {
        let result = await ProcessFacade.execute({
            program: program,
            args: args
        });

        return [result.stdOut, true];
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
    await runInTerminal("installer", erdpyUpCommand, Environment.old, true);

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
            program: "erdpy",
            args: ["contract", "templates", "--json"],
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
            program: "erdpy",
            args: ["contract", "new", "--directory", folder, "--template", template, name],
        });

        Feedback.info(`Smart Contract [${name}] created, based on template [${template}].`);
    } catch (error) {
        throw new errors.MyError({ Message: "Could not create Smart Contract", Inner: error });
    }
}

async function runInTerminal(terminalName: string, command: string, env: any, renew: boolean = false) {
    let terminal = getOrCreateTerminal(terminalName, env, renew);
    terminal.sendText(command);
    terminal.show(false);
}

function getOrCreateTerminal(name: string, env: any, renew: boolean) {
    name = `Elrond: ${name}`;

    let terminal = window.terminals.find(item => item.name == name);

    if (terminal && renew) {
        terminal.hide();
        terminal.dispose();
        terminal = null;
    }

    if (!terminal) {
        terminal = window.createTerminal({ name: name, env: env });
    }

    return terminal;
}

async function sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
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

async function isErdpyGroupInstalled(group: string): Promise<boolean> {
    let [version, ok] = await getOneLineStdout("erdpy", ["deps", "check", group]);
    return ok;
}

export async function reinstallModule(): Promise<void> {
    let module = await presenter.askChooseSdkModule(["arwentools", "rust", "clang", "cpp"]);
    await reinstallErdpyGroup(module);
}

async function reinstallErdpyGroup(group: string) {
    Feedback.info(`Installation of ${group} has been started. Please wait for installation to finish.`);
    await runInTerminal("installer", `erdpy --verbose deps install ${group} --overwrite`, null, true);

    do {
        Feedback.debug("Waiting for the installer to finish.");
        await sleep(5000);
    } while ((!await isErdpyGroupInstalled(group)));

    await Feedback.infoModal(`${group} has been installed.`);
}

export async function buildContract(folder: string) {
    try {
        await runInTerminal("build", `erdpy --verbose contract build "${folder}"`, null);
    } catch (error) {
        throw new errors.MyError({ Message: "Could not build Smart Contract", Inner: error });
    }
}

export async function cleanContract(folder: string) {
    try {
        await runInTerminal("build", `erdpy --verbose contract clean "${folder}"`, null);
    } catch (error) {
        throw new errors.MyError({ Message: "Could not clean Smart Contract", Inner: error });
    }
}

export async function runMandosTests(path: string) {
    try {
        await ensureInstalledErdpyGroup("arwentools");
        await runInTerminal("mandos", `mandos-test "${path}"`, null);
    } catch (error) {
        throw new errors.MyError({ Message: "Could not run Mandos tests.", Inner: error });
    }
}

export async function runArwenDebugTests(folder: string) {
    try {
        await ensureInstalledErdpyGroup("arwentools");
        Feedback.infoModal("Not yet implemented.");
    } catch (error) {
        throw new errors.MyError({ Message: "Could not run Mandos tests.", Inner: error });
    }
}