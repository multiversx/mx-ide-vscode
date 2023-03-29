import { Answer, AnswerHeader } from "./answer";
import { AnswerStream } from "./answerStream";

interface IAssistantGateway {
    getOpenAIKey(options: { accessToken: string }): Promise<string>;
    setOpenAIKey(options: { key: string, accessToken: string }): Promise<void>;
    deleteOpenAIKey(options: { accessToken: string }): Promise<void>;

    explainCode(options: { sessionId: string, code: string, accessToken: string }): Promise<AnswerStream>;
    reviewCode(options: { sessionId: string, code: string, accessToken: string }): Promise<AnswerStream>;
    completeCode(options: { sessionId: string, code: string, accessToken: string }): Promise<string>;
    askAnything(options: { sessionId: string, question: string, accessToken: string }): Promise<AnswerStream>;
}

interface ICodingSessionProvider {
    getCodingSession(): string | undefined;
}

interface INativeAccessTokenProvider {
    getAccessToken(): string | undefined;
}

interface IAnswersRepository {
    add(item: Answer): Promise<void>;
    getAnswersHeaders(options: { codingSessionId: string }): AnswerHeader[];
    getAnswer(options: { sourceStreamId: string }): Answer;
}

export class AssistantFacade {
    private readonly gateway: IAssistantGateway;
    private readonly codingSessionProvider: ICodingSessionProvider;
    private readonly nativeAccessTokenProvider: INativeAccessTokenProvider;
    private readonly answersRepository: IAnswersRepository;

    constructor(options: {
        gateway: IAssistantGateway,
        codingSessionProvider: ICodingSessionProvider,
        nativeAccessTokenProvider: INativeAccessTokenProvider,
        answersRepository: IAnswersRepository
    }) {
        this.gateway = options.gateway;
        this.codingSessionProvider = options.codingSessionProvider;
        this.nativeAccessTokenProvider = options.nativeAccessTokenProvider;
        this.answersRepository = options.answersRepository;
    }

    async explainCode(options: { code: string }): Promise<AnswerStream> {
        const codingSession = this.getCodingSession();
        const accessToken = this.getAccessToken();

        const answerStream = await this.gateway.explainCode({
            sessionId: codingSession,
            code: options.code,
            accessToken: accessToken
        });

        return answerStream;
    }

    async reviewCode(options: { code: string }): Promise<AnswerStream> {
        const codingSession = this.getCodingSession();
        const accessToken = this.getAccessToken();

        const answerStream = await this.gateway.reviewCode({
            sessionId: codingSession,
            code: options.code,
            accessToken: accessToken
        });

        return answerStream;
    }

    async completeCode(options: { code: string }): Promise<string> {
        const codingSession = this.getCodingSession();
        const accessToken = this.getAccessToken();

        const completion = await this.gateway.completeCode({
            sessionId: codingSession,
            code: options.code,
            accessToken: accessToken
        });

        return completion;
    }

    async askAnything(options: { question: string }): Promise<AnswerStream> {
        const codingSession = this.getCodingSession();
        const accessToken = this.getAccessToken();

        const answerStream = await this.gateway.askAnything({
            sessionId: codingSession,
            question: options.question,
            accessToken: accessToken
        });

        // When the answer stream is finished, we save the answer.
        answerStream.onDidFinish(async (answer: Answer) => {
            await this.answersRepository.add(answer);
        });

        return answerStream;
    }

    getAnswersHeaders(): AnswerHeader[] {
        const codingSession = this.getCodingSession();
        const headers = this.answersRepository.getAnswersHeaders({ codingSessionId: codingSession });
        return headers;
    }

    getAnswer(options: { sourceStreamId: string }): Answer {
        const body = this.answersRepository.getAnswer(options);
        return body;
    }

    private getCodingSession(): string {
        const codingSession = this.codingSessionProvider.getCodingSession();
        if (!codingSession) {
            throw new Error("Please select a coding session first.");
        }

        return codingSession;
    }

    isAnyCodingSessionOpen(): boolean {
        const codingSession = this.codingSessionProvider.getCodingSession();
        return codingSession ? true : false;
    }

    private getAccessToken(): string {
        const accessToken = this.nativeAccessTokenProvider.getAccessToken();
        if (!accessToken) {
            throw new Error("Please sign in first.");
        }

        return accessToken;
    }
}
