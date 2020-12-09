import path = require("path");
import fs = require("fs");
import * as presenter from './presenter';
import * as workspace from './workspace';
import { QuickPickItem, window } from 'vscode';
import * as errors from './errors';
import { waitForProcessInTerminal } from "./utils";
import { Feedback } from "./feedback";
import { glob } from "glob";


export async function runContractSnippet(folder: string) {
    let metadata = workspace.getMetadataObjectByFolder(folder);
    let pattern = `${folder}/**/*.snippets.sh`;
    let snippetsFiles = glob.sync(pattern, {});

    if (!snippetsFiles.length) {
        throw new errors.MyError({ Message: `No *.snippets.sh file found.` });
    }
    
    let allSnippets: Snippet[] = [];

    snippetsFiles.forEach(file => {
        let names = getSnippetsNames(file);
        let snippets = names.map(name => new Snippet(file, name));
        allSnippets.push(...snippets);
    });

    let snippetChoice = await presenter.askChoiceTyped(allSnippets);
    if (!snippetChoice) {
        return;
    }

    let terminalName = `Elrond snippets: ${metadata.ProjectName}`;
    let command = `source ${snippetChoice.file} && ${snippetChoice.name}`;
    await runInTerminal(terminalName, command, metadata);
    Feedback.info(`Snippet "${snippetChoice}" has been executed. Check output in Terminal.`);
}

function getSnippetsNames(file: string): string[] {
    let content = fs.readFileSync(file, { encoding: "utf8" });
    const found = content.match(/([a-zA-Z_{1}][a-zA-Z0-9_]+)(?=\()/g);
    return found;
}

async function runInTerminal(terminalName: string, command: string, metadata: workspace.ProjectMetadata) {
    let envTestnet = path.join(metadata.ProjectPath, "testnet");
    let envWallets = path.join(envTestnet, "wallets");
    let envUsers = path.join(envWallets, "users");

    let terminal = window.terminals.find(item => item.name == terminalName);
    if (!terminal) {
        let env = { 
            PROJECT: metadata.ProjectPath,
            PROJECT_NAME: metadata.ProjectName,
            TESTNET: envTestnet,
            WALLETS: envWallets,
            USERS: envUsers
        };
        terminal = window.createTerminal({ name: terminalName, env: env, cwd: metadata.ProjectPath });
    }

    terminal.sendText(command);
    terminal.show(false);
    await waitForProcessInTerminal(terminal);
}

export class Snippet implements QuickPickItem {
    readonly file: string;
    readonly name: string;
    readonly label: string;
    readonly description?: string;
    readonly detail?: string;
    readonly picked?: boolean;
    readonly alwaysShow?: boolean;
    
    constructor(file: string, name: string) {
        this.file = file;
        this.name = name;
        this.label = `${path.basename(file)}: ${name}`;
    }

    toString(): string {
        return this.label;
    }
}
