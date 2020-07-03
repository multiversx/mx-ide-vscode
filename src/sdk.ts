import { Feedback } from './feedback';
import { ProcessFacade, RestFacade } from "./utils";
import { window } from 'vscode';
import { MySettings } from './settings';
import path = require("path");
import * as storage from "./storage";
import * as errors from './errors';
import * as presenter from './presenter';
import { Environment } from './environment';


export function getPath() {
    return MySettings.getElrondSdk();
}

export async function reinstall() {
    await reinstallErdpy();
}

export async function ensureInstalled() {
    await ensureErdpy();
}

async function ensureErdpy() {
    if (await isErdpyInstalled()) {
        return;
    }

    let answer = await presenter.askInstallErdpy();
    if (answer) {
        await reinstallErdpy();
    }
}

async function isErdpyInstalled(): Promise<boolean> {
    try {
        await ProcessFacade.execute({
            program: "erdpy",
            args: ["--version"],
            channels: ["erdpy"]
        });

        return true;
    } catch (e) {
        return false;
    }
}

export async function reinstallErdpy() {
    let erdpyUp = storage.getPathTo("erdpy-up.py");
    await RestFacade.download({
        url: "https://raw.githubusercontent.com/ElrondNetwork/elrond-sdk/development/erdpy-up.py",
        destination: erdpyUp
    });

    let erdpyUpCommand = `python3 ${erdpyUp} --no-modify-path --exact-version=0.5.2b5`;
    await runInTerminal(erdpyUpCommand, Environment.old);

    Feedback.info("erdpy installation has been started. Please wait for installation to finish.");

    do {
        Feedback.debug("Waiting for the installer to finish.");
        await sleep(5000);
    } while ((!await isErdpyInstalled()));

    Feedback.infoModal("erdpy has been installed.");
}

export async function fetchTemplates(cacheFile: string) {
    try {
        await ProcessFacade.execute({
            program: "erdpy",
            args: ["contract", "templates", "--json"],
            channels: ["erdpy"],
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
            channels: ["erdpy"]
        });

        Feedback.info(`Smart Contract [${name}] created, based on template [${template}].`);
    } catch (error) {
        throw new errors.MyError({ Message: "Could not create Smart Contract", Inner: error });
    }
}

async function runInTerminal(command: string, env: any) {
    let terminal = window.createTerminal({ name: "elrond-sdk", env: env });
    terminal.sendText(command);
    terminal.show(false);
}

async function sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}