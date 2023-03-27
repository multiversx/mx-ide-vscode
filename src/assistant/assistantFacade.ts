import { Answer, AnswerHeader } from "./answer";
import { AnswerStream } from "./answerStream";

interface IAssistantGateway {
    explainCode(options: { sessionId: string, code: string }): Promise<string>;
    askAnything(options: { sessionId: string, question: string }): Promise<AnswerStream>;
}

interface ICodingSessionProvider {
    getCodingSession(): string;
}

interface IAnswersRepository {
    add(item: Answer): Promise<void>;
    getHeadersByCodingSession(codingSessionId: string): AnswerHeader[];
}

export class AssistantFacade {
    private readonly gateway: IAssistantGateway;
    private readonly codingSessionProvider: ICodingSessionProvider;
    private readonly answersRepository: IAnswersRepository;

    constructor(options: {
        gateway: IAssistantGateway,
        codingSessionProvider: ICodingSessionProvider,
        answersRepository: IAnswersRepository
    }) {
        this.gateway = options.gateway;
        this.codingSessionProvider = options.codingSessionProvider;
        this.answersRepository = options.answersRepository;
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

        // When the answer stream is finished, we save the answer.
        answerStream.onDidFinish(async (answer: Answer) => {
            await this.answersRepository.add(answer);
        });

        return answerStream;
    }

    getPreviousAnswers(): AnswerHeader[] {
        const codingSession = this.codingSessionProvider.getCodingSession();
        const headers = this.answersRepository.getHeadersByCodingSession(codingSession);
        return headers;
    }
}
