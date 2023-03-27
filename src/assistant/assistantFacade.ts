import { AnswerStream } from "./answerStream";

interface IAssistantGateway {
    explainCode(options: { sessionId: string, code: string }): Promise<string>;
    askAnything(options: { sessionId: string, question: string }): Promise<AnswerStream>;
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

    async askAnything(options: { question: string }): Promise<AnswerStream> {
        const codingSession = this.codingSessionProvider.getCodingSession();

        const answerStream = await this.gateway.askAnything({
            sessionId: codingSession,
            question: options.question
        });

        return answerStream;
    }
}
