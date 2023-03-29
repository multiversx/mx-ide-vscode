import * as vscode from 'vscode';
import { AuthenticationSession } from "vscode";

export class OpenAIAuthenticationSession implements AuthenticationSession {
    readonly id: string;
    readonly accessToken: string;
    readonly account: vscode.AuthenticationSessionAccountInformation;
    readonly scopes: string[] = [];

    constructor(options: {
        id: string;
        accessToken: string;
        address: string;
    }) {
        this.id = options.id;
        this.accessToken = options.accessToken;
        this.account = { id: options.address, label: options.address };
    }

    serialize(): string {
        return JSON.stringify(this);
    }

    static deserialize(serialized: string): OpenAIAuthenticationSession {
        const data = JSON.parse(serialized);
        return new OpenAIAuthenticationSession(data);
    }
}
