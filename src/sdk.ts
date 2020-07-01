import { Feedback } from './feedback';
import { ProcessFacade } from "./utils";
import { window } from 'vscode';
import { MySettings } from './settings';
import path = require("path");


export function setupEnvironment() {
    let folder = MySettings.getElrondSdk();
    let erdpyEnvFolder = path.join(getPath(), "erdpy-venv");
    let erdpyBinFolder = path.join(erdpyEnvFolder, "bin");

    delete process.env["PYTHONHOME"];
    process.env["PATH"] = `${erdpyBinFolder}:${process.env["PATH"]}`;
    process.env["VIRTUAL_ENV"] = erdpyEnvFolder;
    process.env["ELROND_IDE"] = "true";
    Feedback.info(`Folder [${folder}] has been added to $PATH for the current session.`);
}

export function getPath() {
    return MySettings.getElrondSdk();
}

export async function reinstall() {
    await reinstallErdpy();
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
        let answer = await askYesNo("erdpy isn't available in your environment. Do you agree to install it?")
        if (answer) {
            await reinstallErdpy();
        }
    }
}

export async function reinstallErdpy() {
    // TODO: download to private storage
    // TODO: run with modify-path=false.
    runInTerminal("wget -O - https://raw.githubusercontent.com/ElrondNetwork/elrond-sdk/development/erdpy-up.py | python3");
}

export async function getTemplates() {
    // TODO: run erdpy, fetch templates
    await ProcessFacade.execute({
        program: "erdpy",
        args: ["--version"],
        channels: ["erdpy"]
    });
}

async function askYesNo(question: string): Promise<Boolean> {
    let answerYes = "yes";
    let answerNo = "no";
    let answer = await window.showInformationMessage(question, { modal: true }, answerYes, answerNo);
    return answer === answerYes;
}

async function runInTerminal(command: string) {
    let terminal = window.createTerminal("elrond-sdk");
    terminal.sendText(command);
    terminal.show(false);
}
