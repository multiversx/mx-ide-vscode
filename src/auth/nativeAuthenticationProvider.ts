import { NativeAuthClient } from "@multiversx/sdk-native-auth-client";
import * as vscode from 'vscode';
import { AuthenticationProvider, AuthenticationProviderAuthenticationSessionsChangeEvent, AuthenticationSession, Event, EventEmitter, SecretStorage, Uri } from "vscode";
import { Settings } from "../settings";
import { NativeAuthenticationSession } from "./nativeAuthenticationSessions";

interface IAuthenticationReadyEventSource {
    event: Event<Uri>;
}

export class NativeAuthenticationProvider implements AuthenticationProvider {
    static id = "MultiversX";
    static label = "MultiversX Native Authentication";
    static storageKeyOfSession = "mx-native-auth-session";

    private readonly extensionId: string;
    private readonly secretStorage: SecretStorage;

    private _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
    readonly onDidChangeSessions: Event<AuthenticationProviderAuthenticationSessionsChangeEvent> = this._onDidChangeSessions.event;

    constructor(options: {
        extensionId: string;
        secretStorage: SecretStorage;
        authenticationReadyEventSource: IAuthenticationReadyEventSource;
    }) {
        this.extensionId = options.extensionId;
        this.secretStorage = options.secretStorage;
    }

    async getSessions(_scopes?: readonly string[]): Promise<readonly AuthenticationSession[]> {
        let serializedSession = await this.secretStorage.get(NativeAuthenticationProvider.storageKeyOfSession);
        if (!serializedSession) {
            return [];
        }

        let session = NativeAuthenticationSession.deserialize(serializedSession);
        if (session.isExpired()) {
            return [];
        }

        return [session];
    }

    async createSession(_scopes: readonly string[]): Promise<AuthenticationSession> {
        await this.login();

        throw new Error("Not implemented");
    }

    async removeSession(_sessionId: string): Promise<void> {
        await this.secretStorage.delete(NativeAuthenticationProvider.storageKeyOfSession);
    }

    async login(): Promise<void> {
        const extensionBaseUrl = `${vscode.env.uriScheme}://${this.extensionId}`;

        const nativeAuthClient = new NativeAuthClient({
            origin: extensionBaseUrl,
            apiUrl: Settings.getNativeAuthApiUrl(),
            expirySeconds: Settings.getNativeAuthExpirySeconds()
        });

        const initData = await nativeAuthClient.initialize();
        const returnUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${extensionBaseUrl}/on-native-authentication-ready`));
        const loginUrl = vscode.Uri.parse(`${Settings.getNativeAuthWalletUrl()}/hook/login?token=${initData}&callbackUrl=${returnUri.toString(true)}`);

        console.info("NativeAuthenticationProvider.returnUri", returnUri.toString(true));
        console.info("NativeAuthenticationProvider.loginUrl", loginUrl.toString(true));

        await vscode.env.openExternal(loginUrl);
    }
}
