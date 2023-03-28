/* eslint-disable @typescript-eslint/naming-convention */
import axios, { AxiosRequestConfig } from "axios";
import { AnswerHeader } from "./answer";
import { AnswerStream } from "./answerStream";
import EventSource = require("eventsource");

const defaultTimeout = 60000;
const defaultAxiosConfig: AxiosRequestConfig = {
    timeout: defaultTimeout,
};

export class AssistantGateway {
    private readonly baseUrl: string;
    private readonly config: AxiosRequestConfig;

    constructor(options: { baseUrl: string, config?: AxiosRequestConfig }) {
        this.baseUrl = options.baseUrl;
        this.config = { ...defaultAxiosConfig, ...options.config };
    }

    async createSession(): Promise<string> {
        const response = await this.doPost(`${this.baseUrl}/coding-sessions/create`, {});
        const id = response.id;
        return id;
    }

    async explainCode(options: { sessionId: string, code: string }): Promise<AnswerStream> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.code
        };

        const createStreamUrl = `${this.baseUrl}/coding-sessions/streaming-explanation/create`;
        const createStreamResponse = await this.doPost(createStreamUrl, payload);
        const sourceStreamId = createStreamResponse.id;
        const streamUrl = `${this.baseUrl}/coding-sessions/streaming-explanation/start/${sourceStreamId}/`;
        const eventSource = new EventSource(streamUrl);

        const answerStream = new AnswerStream({
            answerHeader: new AnswerHeader({
                codingSessionId: options.sessionId,
                sourceStreamId: sourceStreamId,
                question: "Please explain this code."
            }),
            source: eventSource,
            payloadEventName: "code-explanation-stream-chunk"
        });

        return answerStream;
    }

    async reviewCode(options: { sessionId: string, code: string }): Promise<AnswerStream> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.code
        };

        const createStreamUrl = `${this.baseUrl}/coding-sessions/streaming-review/create`;
        const createStreamResponse = await this.doPost(createStreamUrl, payload);
        const sourceStreamId = createStreamResponse.id;
        const streamUrl = `${this.baseUrl}/coding-sessions/streaming-review/start/${sourceStreamId}/`;
        const eventSource = new EventSource(streamUrl);

        const answerStream = new AnswerStream({
            answerHeader: new AnswerHeader({
                codingSessionId: options.sessionId,
                sourceStreamId: sourceStreamId,
                question: "Please review this code."
            }),
            source: eventSource,
            payloadEventName: "code-review-stream-chunk"
        });

        return answerStream;
    }

    async completeCode(options: { sessionId: string, code: string }): Promise<string> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.code
        };

        const response = await this.doPost(`${this.baseUrl}/coding-sessions/completion`, payload);
        const reply = response.reply;
        return reply;
    }

    async askAnything(options: {
        sessionId: string,
        question: string
    }): Promise<AnswerStream> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.question
        };

        const createStreamUrl = `${this.baseUrl}/coding-sessions/streaming-ama/create`;
        const createStreamResponse = await this.doPost(createStreamUrl, payload);
        const sourceStreamId = createStreamResponse.id;
        const streamUrl = `${this.baseUrl}/coding-sessions/streaming-ama/start/${sourceStreamId}/`;
        const eventSource = new EventSource(streamUrl);

        const answerStream = new AnswerStream({
            answerHeader: new AnswerHeader({
                codingSessionId: options.sessionId,
                sourceStreamId: sourceStreamId,
                question: options.question
            }),
            source: eventSource,
            payloadEventName: "ama-stream-chunk"
        });

        return answerStream;
    }

    private async doGet(url: string): Promise<any> {
        const config = this.prepareConfig();

        try {
            const response = await axios.get(url, config);
            return response.data;
        } catch (error) {
            this.handleApiError(error, url);
            throw error;
        }
    }

    private async doPost(url: string, payload: any): Promise<any> {
        const config = this.prepareConfig();

        try {
            const response = await axios.post(url, payload, config);
            return response.data;
        } catch (error) {
            this.handleApiError(error, url);
            throw error;
        }
    }

    private prepareConfig() {
        return {
            ...this.config,
            headers: {
                "Content-Type": "application/json",
                ...this.config.headers,
            }
        };
    }

    private handleApiError(error: any, resourceUrl: string) {
        throw new Error(`Error while accessing ${resourceUrl}: ${error.message}, code = ${error.code}`);
    }
}
