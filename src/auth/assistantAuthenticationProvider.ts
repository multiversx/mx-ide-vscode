import { NativeAuthClient } from "@multiversx/sdk-native-auth-client";
import * as vscode from 'vscode';
import { AuthenticationProvider, AuthenticationProviderAuthenticationSessionsChangeEvent, AuthenticationSession, Event, EventEmitter, SecretStorage, Uri } from "vscode";
import { urlSegmentOnNativeAuthenticationReady } from "../constants";
import { Settings } from "../settings";
import * as textResources from "../textResources";

interface IOnDidAuthenticateEventEmitter {
    onDidAuthenticate: Event<Uri>;
}

interface IOpenAIKeysHolder {
    getOpenAIKey(options: { accessToken: string }): Promise<string>;
    setOpenAIKey(options: { key: string, accessToken: string }): Promise<void>;
    deleteOpenAIKey(options: { accessToken: string }): Promise<void>;
}

export class AssistantAuthenticationProvider implements AuthenticationProvider {
    static id = "MultiversXAssistant";
    static label = "MultiversX Assistant (Native Authentication)";
    static storageKeyOfSessions = "mx-assistant-auth-sessions";

    private readonly extensionId: string;
    private readonly secretStorage: SecretStorage;
    private readonly openAIKeysHolder: IOpenAIKeysHolder;
    private readonly onDidAuthenticateEventEmitter: IOnDidAuthenticateEventEmitter;

    private _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
    readonly onDidChangeSessions: Event<AuthenticationProviderAuthenticationSessionsChangeEvent> = this._onDidChangeSessions.event;

    constructor(options: {
        extensionId: string;
        secretStorage: SecretStorage;
        openAIKeysHolder: IOpenAIKeysHolder;
        onDidAuthenticateEventEmitter: IOnDidAuthenticateEventEmitter;
    }) {
        this.extensionId = options.extensionId;
        this.secretStorage = options.secretStorage;
        this.openAIKeysHolder = options.openAIKeysHolder;
        this.onDidAuthenticateEventEmitter = options.onDidAuthenticateEventEmitter;
    }

    async getSessions(_scopes?: readonly string[]): Promise<readonly AuthenticationSession[]> {
        const sessions = await this.loadSessions();
        return Object.values(sessions);
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
        const tokenPartEncoded = Buffer.from(tokenPart).toString("base64");

        const addressEncoded = Buffer.from(address).toString("base64");
        const authToken = `${addressEncoded}.${tokenPartEncoded}.${signature}`;

        const session: AuthenticationSession = {
            id: address,
            accessToken: authToken,
            account: { id: address, label: shortenAddress(address) },
            scopes: []
        };

        const sessions = await this.loadSessions();
        sessions[session.id] = session;
        await this.storeSessions(sessions);

        await this.connectOpenAISecretKey({ address, authToken });
        return session;
    }

    async connectOpenAISecretKey(options: { address: string, authToken: string }): Promise<void> {
        const existingKey = await this.openAIKeysHolder.getOpenAIKey({ accessToken: options.authToken });
        if (existingKey) {
            const answer = await askConfirmOverrideOpenAIKey(options.address);
            if (!answer) {
                return;
            }
        }

        const answer = await askConfirmConnectOpenAIKey(options.address);
        if (!answer) {
            return;
        }

        const key = await askOpenAISecretKey();
        if (!key) {
            return;
        }

        await this.openAIKeysHolder.setOpenAIKey({ key, accessToken: options.authToken });
        await vscode.window.showInformationMessage(`OpenAI key connected to ${options.address}`);
    }

    async removeSession(sessionId: string): Promise<void> {
        const address = sessionId;
        const sessions = await this.loadSessions();
        const sessionToRemove = sessions[address];
        delete sessions[address];

        await this.storeSessions(sessions);
        await vscode.window.showInformationMessage(`Signed out of ${sessionToRemove.account.label}`);
    }

    async login(): Promise<void> {
        const extensionBaseUrl = `${vscode.env.uriScheme}://${this.extensionId}`;

        const nativeAuthClient = new NativeAuthClient({
            origin: extensionBaseUrl,
            apiUrl: Settings.getNativeAuthApiUrl(),
            expirySeconds: Settings.getNativeAuthExpirySeconds()
        });

        const initData = await nativeAuthClient.initialize({
            timestamp: Date.now().valueOf()
        });

        const returnUriPayload = {
            tokenPart: initData
        };

        const returnUriPayloadEncoded = Buffer.from(JSON.stringify(returnUriPayload)).toString("hex");
        const returnUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${extensionBaseUrl}/${urlSegmentOnNativeAuthenticationReady}?payload=${returnUriPayloadEncoded}`));
        const returnUriEncoded = encodeURIComponent(returnUri.toString());
        const loginUrl = vscode.Uri.parse(`${Settings.getNativeAuthWalletUrl()}/hook/login?token=${initData}&callbackUrl=${returnUriEncoded}`);

        console.info("NativeAuthenticationProvider.returnUri", returnUriEncoded);
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

async function askConfirmOverrideOpenAIKey(address: string): Promise<boolean> {
    const answerYes = textResources.ConfirmOverrideOpenAIKey.answerYes;
    const answerNo = textResources.ConfirmOverrideOpenAIKey.answerNo;
    const question = textResources.ConfirmOverrideOpenAIKey.getMessage(shortenAddress(address));
    const answer = await vscode.window.showInformationMessage(question, { modal: true }, answerYes, answerNo);
    return answer === answerYes;
}

async function askConfirmConnectOpenAIKey(address: string): Promise<boolean> {
    const answerYes = textResources.ConfirmConnectOpenAIKey.answerYes;
    const answerNo = textResources.ConfirmConnectOpenAIKey.answerNo;
    const question = textResources.ConfirmConnectOpenAIKey.getMessage(shortenAddress(address));
    const answer = await vscode.window.showInformationMessage(question, { modal: true }, answerYes, answerNo);
    return answer === answerYes;
}

async function askOpenAISecretKey(): Promise<string> {
    const result = await vscode.window.showInputBox({
        prompt: textResources.EnterOpenAISecretKey.prompt,
        ignoreFocusOut: true,
        validateInput: text => {
            return text.length > 0 ? null : textResources.EnterOpenAISecretKey.validationShouldNotBeEmpty;
        }
    });

    if (result === undefined) {
        return null;
    }

    return result;
}

function shortenAddress(address: string): string {
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
}
