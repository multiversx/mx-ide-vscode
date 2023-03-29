import { AuthenticationProvider, AuthenticationProviderAuthenticationSessionsChangeEvent, AuthenticationSession, Event, EventEmitter, SecretStorage } from "vscode";
import { OpenAIAuthenticationSession } from "./openAIAuthenticationSession";


export class OpenAIAuthenticationProvider implements AuthenticationProvider {
    static id = "OpenAI";
    static label = "OpenAI (Secret Key)";
    static storageKeyOfSession = "open-ai-auth-session";

    private readonly secretStorage: SecretStorage;

    private _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
    readonly onDidChangeSessions: Event<AuthenticationProviderAuthenticationSessionsChangeEvent> = this._onDidChangeSessions.event;

    constructor(options: {
        secretStorage: SecretStorage;
    }) {
        this.secretStorage = options.secretStorage;
    }

    async getSessions(_scopes?: readonly string[]): Promise<readonly AuthenticationSession[]> {
        let serializedSession = await this.secretStorage.get(OpenAIAuthenticationProvider.storageKeyOfSession);
        if (!serializedSession) {
            return [];
        }

        let session = OpenAIAuthenticationSession.deserialize(serializedSession);
        return [session];
    }

    async createSession(_scopes: readonly string[]): Promise<AuthenticationSession> {
        throw new Error("Method not implemented.");
    }

    async removeSession(_sessionId: string): Promise<void> {
        await this.secretStorage.delete(OpenAIAuthenticationProvider.storageKeyOfSession);
    }
}
