/* eslint-disable @typescript-eslint/naming-convention */
import axios, { AxiosRequestConfig } from "axios";
import { AnswerHeader } from "./answer";
import { AnswerStream } from "./answerStream";
import EventSource = require("eventsource");

const authTokenHeaderName = "token";
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
        try {
            const response = await this.doGet({
                url: `${this.baseUrl}/openai/get_key/`,
                accessToken: options.accessToken
            });

            return response.key;
        } catch (error: any) {
            if (this.isNotFoundError(error)) {
                return "";
            }

            throw error;
        }
    }

    async setOpenAIKey(options: { key: string, accessToken: string }): Promise<void> {
        await this.doPost({
            url: `${this.baseUrl}/openai/set_key?openai_key=${options.key}`,
            payload: {},
            accessToken: options.accessToken
        });
    }

    async deleteOpenAIKey(options: { accessToken: string }): Promise<void> {
        await this.doDelete({
            url: `${this.baseUrl}/openai/delete_key/`,
            accessToken: options.accessToken
        });
    }

    async createSession(options: { accessToken: string }): Promise<string> {
        const response = await this.doPost({
            url: `${this.baseUrl}/coding-sessions/create/`,
            payload: {},
            accessToken: options.accessToken
        });

        const id = response.id;
        return id;
    }

    async explainCode(options: { sessionId: string, code: string, accessToken: string }): Promise<AnswerStream> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.code
        };

        const createStreamUrl = `${this.baseUrl}/coding-sessions/streaming-explanation/create/`;
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

        const createStreamUrl = `${this.baseUrl}/coding-sessions/streaming-review/create/`;
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
            url: `${this.baseUrl}/coding-sessions/completion/`,
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

        const createStreamUrl = `${this.baseUrl}/coding-sessions/streaming-ama/create/`;
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
        } catch (error: any) {
            throw new Error(`Error on GET from ${options.url}: ${error.message}`, {
                cause: error,
            });
        }
    }

    private async doPost(options: { url: string, payload: any, accessToken?: string }): Promise<any> {
        const config = this.prepareConfig({ accessToken: options.accessToken });

        try {
            const response = await axios.post(options.url, options.payload, config);
            return response.data;
        } catch (error: any) {
            throw new Error(`Error on POST to ${options.url}: ${error.message}`, {
                cause: error,
            });
        }
    }

    private async doDelete(options: { url: string, accessToken?: string }): Promise<any> {
        const config = this.prepareConfig({ accessToken: options.accessToken });

        try {
            const response = await axios.delete(options.url, config);
            return response.data;
        } catch (error: any) {
            throw new Error(`Error on DELETE of ${options.url}: ${error.message}`, {
                cause: error,
            });
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

    private isNotFoundError(error: any): boolean {
        const originalError = error.cause || error;
        const status = originalError.response?.status;
        return status === 404;
    }
}
