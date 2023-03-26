
interface IAssistantGateway {
    explainCode(options: { sessionId: string, code: string }): Promise<string>;
}

interface ICodingSessionProvider {
    getCodingSession(): string;
}

export class AssistantFacade {
    private readonly gateway: IAssistantGateway;
    private readonly codingSessionProvider: ICodingSessionProvider;

    constructor(options: {
        gateway: IAssistantGateway,
        codingSessionProvider: ICodingSessionProvider
    }) {
        this.gateway = options.gateway;
        this.codingSessionProvider = options.codingSessionProvider;
    }

    async explainCode(options: { code: string }): Promise<string> {
        const codingSession = this.codingSessionProvider.getCodingSession();
        const explanation = await this.gateway.explainCode({ sessionId: codingSession, code: options.code });
        return explanation;
    }
}
