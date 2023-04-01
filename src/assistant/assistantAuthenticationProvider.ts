import { NativeAuthClient } from "@multiversx/sdk-native-auth-client";
import * as vscode from 'vscode';
import { AuthenticationProvider, AuthenticationProviderAuthenticationSessionsChangeEvent, AuthenticationSession, Event, EventEmitter, SecretStorage, Uri } from "vscode";
import { urlSegmentOnNativeAuthenticationReady } from "../constants";
import { Feedback } from "../feedback";
import { Settings } from "../settings";
import { AssistantAuthenticationPresenter, shortenAddress } from "./assistantAuthenticationPresenter";

interface IStorage {
    removeAll(): Promise<void>;
}

interface IOpenAIKeysHolder {
    getOpenAIKey(options: { accessToken: string }): Promise<string>;
    setOpenAIKey(options: { key: string, accessToken: string }): Promise<void>;
    deleteOpenAIKey(options: { accessToken: string }): Promise<void>;
}

interface IOnDidAuthenticateEventEmitter {
    onDidAuthenticate: Event<Uri>;
}

export class AssistantAuthenticationProvider implements AuthenticationProvider {
    static id = "MultiversXAssistant";
    static label = "MultiversX Assistant (Native Authentication)";
    static storageKeyOfSessions = "mx-assistant-auth-sessions";

    private readonly extensionId: string;
    private readonly secretStorage: SecretStorage;
    private readonly storage: IStorage;
    private readonly openAIKeysHolder: IOpenAIKeysHolder;
    private readonly onDidAuthenticateEventEmitter: IOnDidAuthenticateEventEmitter;
    private readonly presenter: AssistantAuthenticationPresenter;

    private _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
    readonly onDidChangeSessions: Event<AuthenticationProviderAuthenticationSessionsChangeEvent> = this._onDidChangeSessions.event;

    constructor(options: {
        extensionId: string;
        secretStorage: SecretStorage;
        storage: IStorage;
        openAIKeysHolder: IOpenAIKeysHolder;
        onDidAuthenticateEventEmitter: IOnDidAuthenticateEventEmitter;
    }) {
        this.extensionId = options.extensionId;
        this.secretStorage = options.secretStorage;
        this.storage = options.storage;
        this.openAIKeysHolder = options.openAIKeysHolder;
        this.onDidAuthenticateEventEmitter = options.onDidAuthenticateEventEmitter;
        this.presenter = new AssistantAuthenticationPresenter();
    }

    async getSessions(_scopes?: readonly string[]): Promise<readonly AuthenticationSession[]> {
        const sessions = await this.loadSessions();
        return Object.values(sessions);
    }

    async createSession(_scopes: readonly string[]): Promise<AuthenticationSession> {
        const confirmTerms = await this.presenter.askConfirmTerms();
        if (!confirmTerms) {
            return Promise.reject("User declined to accept terms of service.");
        }

        await this.login();

        const uri = await this.awaitAuthenticationRedirect();
        const query = new URLSearchParams(uri.query);
        const address = query.get("address");
        const signature = query.get("signature");
        const payloadEncoded = query.get("payload");
        const payload = JSON.parse(Buffer.from(payloadEncoded, "hex").toString("utf8"));
        const tokenPart = payload.tokenPart;
        const tokenPartEncoded = Buffer.from(tokenPart).toString("base64");

        const addressEncoded = Buffer.from(address).toString("base64");
        const authToken = `${addressEncoded}.${tokenPartEncoded}.${signature}`;

        const session: AuthenticationSession = {
            id: address,
            accessToken: authToken,
            account: {
                id: address,
                label: shortenAddress(address)
            },
            scopes: []
        };

        const sessions = await this.loadSessions();
        sessions[session.id] = session;
        await this.storeSessions(sessions);

        try {
            await this.linkOpenAISecretKey({ address, authToken });
        } catch (error: any) {
            // Not a critical error, session is created anyway.
            await Feedback.error(error);
        }

        return session;
    }

    async login(): Promise<void> {
        const extensionBaseUrl = `${vscode.env.uriScheme}://${this.extensionId}`;

        const nativeAuthClient = new NativeAuthClient({
            origin: extensionBaseUrl,
            apiUrl: Settings.getNativeAuthApiUrl(),
            expirySeconds: Settings.getNativeAuthExpirySeconds()
        });

        const timestamp = Date.now().valueOf();
        const initData = await nativeAuthClient.initialize({ timestamp });
        const returnUriPayload = { tokenPart: initData };
        const returnUriPayloadEncoded = Buffer.from(JSON.stringify(returnUriPayload)).toString("hex");
        const returnUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${extensionBaseUrl}/${urlSegmentOnNativeAuthenticationReady}?payload=${returnUriPayloadEncoded}`));
        const returnUriEncoded = encodeURIComponent(returnUri.toString());
        const loginUrl = vscode.Uri.parse(`${Settings.getNativeAuthWalletUrl()}/hook/login?token=${initData}&callbackUrl=${returnUriEncoded}`);

        await Feedback.debug(`NativeAuthenticationProvider.returnUri: ${returnUriEncoded}`);
        await Feedback.debug(`NativeAuthenticationProvider.loginUrl: ${loginUrl.toString(true)}`);

        await vscode.env.openExternal(loginUrl);
    }

    private async awaitAuthenticationRedirect(): Promise<Uri> {
        return new Promise<Uri>(resolve => {
            this.onDidAuthenticateEventEmitter.onDidAuthenticate(uri => {
                resolve(uri);
            });
        });
    }

    async linkOpenAISecretKey(options: { address: string, authToken: string }): Promise<void> {
        const existingKey = await this.openAIKeysHolder.getOpenAIKey({ accessToken: options.authToken });
        if (existingKey) {
            const answer = await this.presenter.askConfirmOverrideOpenAIKey(options.address);
            if (!answer) {
                return;
            }
        }

        const answer = await this.presenter.askConfirmConnectOpenAIKey(options.address);
        if (!answer) {
            return;
        }

        const key = await this.presenter.askOpenAISecretKey();
        if (!key) {
            return;
        }

        await this.openAIKeysHolder.setOpenAIKey({ key, accessToken: options.authToken });

        await Feedback.info(`OpenAI key connected to ${options.address}`);
    }

    async removeSession(sessionId: string): Promise<void> {
        const address = sessionId;
        const sessions = await this.loadSessions();

        // At the moment, we only support one session anyway.
        const sessionToRemove = sessions[address];

        if (!sessionToRemove) {
            // Unexpected condition, let's just clear everything.
            await this.storeSessions({});
            await this.storage.removeAll();
            return;
        }

        // If the user has previously linked an OpenAI key,
        // she will get additional information in the confirmation dialog (below).
        const openAIKeyPreview = await this.openAIKeysHolder.getOpenAIKey({
            accessToken: sessionToRemove.accessToken
        });

        const answer = await this.presenter.askConfirmSignOut({
            address: address,
            openAIKeyPreview: openAIKeyPreview
        });

        if (!answer) {
            throw new Error("User cancelled");
        }

        await this.storeSessions({});
        await this.storage.removeAll();
    }

    private async loadSessions(): Promise<Record<string, AuthenticationSession>> {
        const serialized = await this.secretStorage.get(AssistantAuthenticationProvider.storageKeyOfSessions);
        if (!serialized) {
            return {};
        }

        const obj = JSON.parse(serialized);
        return obj;
    }

    private async storeSessions(obj: Record<string, AuthenticationSession>): Promise<void> {
        const serialized = JSON.stringify(obj);
        await this.secretStorage.store(AssistantAuthenticationProvider.storageKeyOfSessions, serialized);
    }
}

