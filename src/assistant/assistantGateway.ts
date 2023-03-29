/* eslint-disable @typescript-eslint/naming-convention */
import axios, { AxiosRequestConfig } from "axios";
import { AnswerHeader } from "./answer";
import { AnswerStream } from "./answerStream";
import EventSource = require("eventsource");

const authTokenHeaderName = "multiversx_token";
const eventTypeAMA = "ama-stream-chunk";
const eventTypeCodeReview = "code-review-stream-chunk";
const eventTypeCodeExplanation = "code-explanation-stream-chunk";
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

    async getOpenAIKey(options: { accessToken: string }): Promise<string> {
        const response = await this.doGet({
            url: `${this.baseUrl}/openai/get_key`,
            accessToken: options.accessToken
        });

        const key = response.key;
        return key;
    }

    async setOpenAIKey(options: { key: string, accessToken: string }): Promise<void> {
        await this.doPost({
            url: `${this.baseUrl}/openai/set_key`,
            payload: { openai_key: options.key },
            accessToken: options.accessToken
        });
    }

    async deleteOpenAIKey(options: { accessToken: string }): Promise<void> {
        await this.doDelete({
            url: `${this.baseUrl}/openai/delete_key`,
            accessToken: options.accessToken
        });
    }

    async createSession(): Promise<string> {
        const response = await this.doPost({
            url: `${this.baseUrl}/coding-sessions/create`,
            payload: {},
            accessToken: ""
        });

        const id = response.id;
        return id;
    }

    async explainCode(options: { sessionId: string, code: string, accessToken: string }): Promise<AnswerStream> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.code
        };

        const createStreamUrl = `${this.baseUrl}/coding-sessions/streaming-explanation/create`;
        const createStreamResponse = await this.doPost({
            url: createStreamUrl,
            payload: payload,
            accessToken: options.accessToken
        });

        const sourceStreamId = createStreamResponse.id;
        const streamUrl = `${this.baseUrl}/coding-sessions/streaming-explanation/start/${sourceStreamId}/`;
        const eventSource = this.openEventSource({
            url: streamUrl,
            accessToken: options.accessToken
        });

        const answerStream = new AnswerStream({
            answerHeader: new AnswerHeader({
                codingSessionId: options.sessionId,
                sourceStreamId: sourceStreamId,
                question: "Please explain this code."
            }),
            source: eventSource,
            payloadEventName: eventTypeCodeExplanation
        });

        return answerStream;
    }

    async reviewCode(options: { sessionId: string, code: string, accessToken: string }): Promise<AnswerStream> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.code
        };

        const createStreamUrl = `${this.baseUrl}/coding-sessions/streaming-review/create`;
        const createStreamResponse = await this.doPost({
            url: createStreamUrl,
            payload: payload,
            accessToken: options.accessToken
        });

        const sourceStreamId = createStreamResponse.id;
        const streamUrl = `${this.baseUrl}/coding-sessions/streaming-review/start/${sourceStreamId}/`;
        const eventSource = this.openEventSource({
            url: streamUrl,
            accessToken: options.accessToken
        });

        const answerStream = new AnswerStream({
            answerHeader: new AnswerHeader({
                codingSessionId: options.sessionId,
                sourceStreamId: sourceStreamId,
                question: "Please review this code."
            }),
            source: eventSource,
            payloadEventName: eventTypeCodeReview
        });

        return answerStream;
    }

    async completeCode(options: { sessionId: string, code: string, accessToken: string }): Promise<string> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.code
        };

        const response = await this.doPost({
            url: `${this.baseUrl}/coding-sessions/completion`,
            payload: payload,
            accessToken: options.accessToken
        });

        const reply = response.reply;
        return reply;
    }

    async askAnything(options: {
        sessionId: string,
        question: string
        accessToken: string
    }): Promise<AnswerStream> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.question
        };

        const createStreamUrl = `${this.baseUrl}/coding-sessions/streaming-ama/create`;
        const createStreamResponse = await this.doPost({
            url: createStreamUrl,
            payload: payload,
            accessToken: options.accessToken
        });

        const sourceStreamId = createStreamResponse.id;
        const streamUrl = `${this.baseUrl}/coding-sessions/streaming-ama/start/${sourceStreamId}/`;
        const eventSource = this.openEventSource({
            url: streamUrl,
            accessToken: options.accessToken
        });

        const answerStream = new AnswerStream({
            answerHeader: new AnswerHeader({
                codingSessionId: options.sessionId,
                sourceStreamId: sourceStreamId,
                question: options.question
            }),
            source: eventSource,
            payloadEventName: eventTypeAMA
        });

        return answerStream;
    }

    private async doGet(options: { url: string, accessToken?: string }): Promise<any> {
        const config = this.prepareConfig({ accessToken: options.accessToken });

        try {
            const response = await axios.get(options.url, config);
            return response.data;
        } catch (error) {
            this.handleApiError(error, options.url);
            throw error;
        }
    }

    private async doPost(options: { url: string, payload: any, accessToken?: string }): Promise<any> {
        const config = this.prepareConfig({ accessToken: options.accessToken });

        try {
            const response = await axios.post(options.url, options.payload, config);
            return response.data;
        } catch (error) {
            this.handleApiError(error, options.url);
            throw error;
        }
    }

    private async doDelete(options: { url: string, accessToken?: string }): Promise<any> {
        const config = this.prepareConfig({ accessToken: options.accessToken });

        try {
            const response = await axios.delete(options.url, config);
            return response.data;
        } catch (error) {
            this.handleApiError(error, options.url);
            throw error;
        }
    }

    private openEventSource(options: { url: string, accessToken?: string }): EventSource {
        const eventSource = new EventSource(options.url, {
            headers: {
                authTokenHeaderName: options.accessToken
            }
        });

        return eventSource;
    }

    private prepareConfig(options: { accessToken?: string } = {}): AxiosRequestConfig {
        const customHeaders: any = {};

        if (options.accessToken) {
            customHeaders[authTokenHeaderName] = options.accessToken;
        }

        return {
            ...this.config,
            headers: {
                "Content-Type": "application/json",
                ...customHeaders,
                ...this.config.headers,
            }
        };
    }

    private handleApiError(error: any, resourceUrl: string) {
        throw new Error(`Error while interacting with ${resourceUrl}: ${error.message}`);
    }
}
