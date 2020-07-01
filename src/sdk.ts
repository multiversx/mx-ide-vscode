import { Feedback } from './feedback';
import { ProcessFacade, RestFacade } from "./utils";
import { window } from 'vscode';
import { MySettings } from './settings';
import path = require("path");
import * as storage from "./storage";
import { MyErrorCatcher } from './errors';
import { Environment } from './environment';


export function getPath() {
    return MySettings.getElrondSdk();
}

export async function reinstall() {
    try {
        await reinstallErdpy();
    } catch (error) {
        MyErrorCatcher.topLevel(error);
    }
}

export async function ensureInstalled() {
    ensureErdpy();
}

async function ensureErdpy() {
    try {
        await ProcessFacade.execute({
            program: "erdpy",
            args: ["--version"]
        });
    } catch (e) {
        let answer = await askYesNo("erdpy isn't available in your environment. Do you agree to install it?");
        if (answer) {
            await reinstallErdpy();
        }
    }
}

export async function reinstallErdpy() {
    let erdpyUp = storage.getPathTo("erdpy-up.py");
    await RestFacade.download({
        url: "https://raw.githubusercontent.com/ElrondNetwork/elrond-sdk/development/erdpy-up.py",
        destination: erdpyUp
    });

    let erdpyUpCommand = `python3 ${erdpyUp} --no-modify-path --exact-version=0.5.2b3`;
    await runInTerminal(erdpyUpCommand, Environment.old);
}

export async function fetchTemplates(cacheFile: string) {
    await ProcessFacade.execute({
        program: "erdpy",
        args: ["contract", "templates", "--json"],
        channels: ["erdpy"],
        doNotDumpStdout: true,
        stdoutToFile: cacheFile
    });
    
    Feedback.debug(`Templates fetched, saved to ${cacheFile}`);
}

async function askYesNo(question: string): Promise<Boolean> {
    let answerYes = "yes";
    let answerNo = "no";
    let answer = await window.showInformationMessage(question, { modal: true }, answerYes, answerNo);
    return answer === answerYes;
}

async function runInTerminal(command: string, env: any) {
    let terminal = window.createTerminal({ name: "elrond-sdk", env: env });
    terminal.sendText(command);
    terminal.show(false);
}
