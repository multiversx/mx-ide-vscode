import path = require("path");
import fs = require("fs");
import * as presenter from './presenter';
import * as workspace from './workspace';
import { window } from 'vscode';
import * as errors from './errors';


export async function runContractSnippet(folder: string) {
    let metadata = workspace.getMetadataObjectByFolder(folder);
    let snippetsFile = path.join(folder, "snippets.sh");

    if (!fs.existsSync(snippetsFile)) {
        throw new errors.MyError({ Message: `Snippets file is missing: ${snippetsFile}` });
    }

    let snippets = getSnippetsNames(snippetsFile);
    let choice = await presenter.askChoice(snippets);
    if (!choice) {
        return;
    }

    let terminalName = `Elrond snippets: ${metadata.ProjectName}`;
    let command = `source ${snippetsFile} && ${choice}`;
    await runInTerminal(terminalName, command, folder);
}

function getSnippetsNames(file: string): string[] {
    let content = fs.readFileSync(file, { encoding: "utf8" });
    const found = content.match(/([a-zA-Z_{1}][a-zA-Z0-9_]+)(?=\()/g);
    return found;
}

async function runInTerminal(terminalName: string, command: string, contractFolder: string) {
    let envTestnet = path.join(contractFolder, "testnet");
    let envWallets = path.join(envTestnet, "wallets");
    let envUsers = path.join(envWallets, "users");

    let terminal = window.terminals.find(item => item.name == terminalName);
    if (!terminal) {
        let env = { 
            PROJECT: contractFolder,
            TESTNET: envTestnet,
            WALLETS: envWallets,
            USERS: envUsers
        };
        terminal = window.createTerminal({ name: terminalName, env: env, cwd: contractFolder });
    }

    terminal.sendText(command);
    terminal.show(false);
}
