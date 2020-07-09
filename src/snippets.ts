import path = require("path");
import fs = require("fs");
import * as presenter from './presenter';
import { Feedback } from "./feedback";
import { window } from 'vscode';
import * as errors from './errors';


export async function runContractSnippet(folder: string) {
    let snippetsFile = path.join(folder, "snippets.sh");

    if (!fs.existsSync(snippetsFile)) {
        throw new errors.MyError({ Message: `Snippets file is missing: ${snippetsFile}` });
    }

    let snippets = getSnippetsNames(snippetsFile);
    let choice = await presenter.askChoice(snippets);
    await runInTerminal("snippets", `source ${snippetsFile} && ${choice}`);
}

function getSnippetsNames(file: string): string[] {
    let content = fs.readFileSync(file, { encoding: "utf8" });
    const found = content.match(/([a-zA-Z_{1}][a-zA-Z0-9_]+)(?=\()/g);
    return found;
}

async function runInTerminal(terminalName: string, command: string) {
    let terminal = getOrCreateTerminal(terminalName);
    terminal.sendText(command);
    terminal.show(false);
}

function getOrCreateTerminal(name: string) {
    name = `Elrond: ${name}`;

    let terminal = window.terminals.find(item => item.name == name);
    if (!terminal) {
        terminal = window.createTerminal({ name: name });
    }

    return terminal;
}