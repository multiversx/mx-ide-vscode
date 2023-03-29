import * as vscode from 'vscode';
import { AuthenticationSession } from "vscode";

export class NativeAuthenticationSession implements AuthenticationSession {
    readonly id: string;
    readonly accessToken: string;
    readonly expiresOn: number;
    readonly account: vscode.AuthenticationSessionAccountInformation;
    readonly scopes: string[] = [];

    constructor(id: string, accessToken: string, expiresOn: number) {
        let prettyExpirationDate = new Date(expiresOn * 1000).toLocaleString();

        this.id = id;
        this.accessToken = accessToken;
        this.expiresOn = expiresOn;
        this.account = { id: id, label: `Anonymous. Expires on: ${prettyExpirationDate}.` };
    }

    serialize(): string {
        return JSON.stringify(this);
    }

    isExpired() {
        let currentTime = new Date();
        let expiresOnTime = new Date(this.expiresOn * 1000);
        let expired = currentTime > expiresOnTime;
        return expired;
    }

    static deserialize(serialized: string) {
        let data = JSON.parse(serialized);
        return new NativeAuthenticationSession(data.id, data.accessToken, data.expiresOn);
    }
}
