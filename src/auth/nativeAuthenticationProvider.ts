import { NativeAuthClient } from "@multiversx/sdk-native-auth-client";
import { v4 as uuidv4 } from "uuid";
import * as vscode from 'vscode';
import { AuthenticationProvider, AuthenticationProviderAuthenticationSessionsChangeEvent, AuthenticationSession, Event, EventEmitter, SecretStorage, Uri } from "vscode";
import { Settings } from "../settings";
import { NativeAuthenticationSession } from "./nativeAuthenticationSession";

interface IOnDidAuthenticateEventEmitter {
    onDidAuthenticate: Event<Uri>;
}

export class NativeAuthenticationProvider implements AuthenticationProvider {
    static id = "MultiversX";
    static label = "MultiversX Native Authentication";
    static storageKeyOfSession = "mx-native-auth-session";

    private readonly extensionId: string;
    private readonly secretStorage: SecretStorage;
    private readonly onDidAuthenticateEventEmitter: IOnDidAuthenticateEventEmitter;

    private _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
    readonly onDidChangeSessions: Event<AuthenticationProviderAuthenticationSessionsChangeEvent> = this._onDidChangeSessions.event;

    constructor(options: {
        extensionId: string;
        secretStorage: SecretStorage;
        onDidAuthenticateEventEmitter: IOnDidAuthenticateEventEmitter;
    }) {
        this.extensionId = options.extensionId;
        this.secretStorage = options.secretStorage;
        this.onDidAuthenticateEventEmitter = options.onDidAuthenticateEventEmitter;
    }

    async getSessions(_scopes?: readonly string[]): Promise<readonly AuthenticationSession[]> {
        let serializedSession = await this.secretStorage.get(NativeAuthenticationProvider.storageKeyOfSession);
        if (!serializedSession) {
            return [];
        }

        let session = NativeAuthenticationSession.deserialize(serializedSession);
        return [session];
    }

    async createSession(_scopes: readonly string[]): Promise<AuthenticationSession> {
        await this.login();

        const uri = await this.awaitAuthenticationRedirect();
        const query = new URLSearchParams(uri.query);
        const address = query.get("address");
        const signature = query.get("signature");
        const payloadEncoded = query.get("payload");
        const payload = JSON.parse(Buffer.from(payloadEncoded, "hex").toString("utf8"));
        const tokenPart = payload.tokenPart;

        const addressEncoded = Buffer.from(address).toString("base64");
        const authToken = `${addressEncoded}.${tokenPart}.${signature}`;

        const session = new NativeAuthenticationSession({
            id: uuidv4(),
            accessToken: authToken,
            address: address
        });

        const serializedSession = session.serialize();
        await this.secretStorage.store(NativeAuthenticationProvider.storageKeyOfSession, serializedSession);
        return session;
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

        const returnUriPayload = {
            tokenPart: initData
        };

        const returnUriPayloadEncoded = Buffer.from(JSON.stringify(returnUriPayload)).toString("hex");
        const returnUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${extensionBaseUrl}/on-native-authentication-ready&payload=${returnUriPayloadEncoded}`));
        const returnUriEncoded = returnUri.toString();
        const loginUrl = vscode.Uri.parse(`${Settings.getNativeAuthWalletUrl()}/hook/login?token=${initData}&callbackUrl=${returnUriEncoded}`);

        console.info("NativeAuthenticationProvider.returnUri", returnUri.toString(true));
        console.info("NativeAuthenticationProvider.loginUrl", loginUrl.toString(true));

        await vscode.env.openExternal(loginUrl);
    }

    private async awaitAuthenticationRedirect(): Promise<Uri> {
        return new Promise<Uri>(resolve => {
            this.onDidAuthenticateEventEmitter.onDidAuthenticate(uri => {
                resolve(uri);
            });
        });
    }
}
