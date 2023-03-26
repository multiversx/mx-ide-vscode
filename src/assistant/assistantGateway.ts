/* eslint-disable @typescript-eslint/naming-convention */
import axios, { AxiosRequestConfig } from "axios";

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
        const response = await this.doGet(`${this.baseUrl}/coding-sessions/create`);
        const id = response.id;
        return id;
    }

    async explainCode(options: { sessionId: string, code: string }): Promise<string> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.code
        };

        const response = await this.doPost(`${this.baseUrl}/coding-sessions/explain`, payload);
        const reply = response.reply;
        return reply;
    }

    async askAnything(options: { sessionId: string, question: string }): Promise<string> {
        const payload = {
            coding_session_id: options.sessionId,
            content: options.question
        };

        const response = await this.doPost(`${this.baseUrl}/coding-sessions/ama`, payload);
        const reply = response.reply;
        return reply;
    }

    private async doGet(url: string): Promise<any> {
        const config = {
            ...this.config,
            headers: {
                "Content-Type": "application/json",
                ...this.config.headers,
            }
        };

        try {
            const response = await axios.get(url, config);
            return response.data;
        } catch (error) {
            this.handleApiError(error, url);
            throw error;
        }
    }

    private async doPost(url: string, payload: any): Promise<any> {
        const config = {
            ...this.config,
            headers: {
                "Content-Type": "application/json",
                ...this.config.headers,
            }
        };

        try {
            const response = await axios.post(url, payload, config);
            return response.data;
        } catch (error) {
            this.handleApiError(error, url);
            throw error;
        }
    }

    private handleApiError(error: any, resourceUrl: string) {
        throw new Error(`Error while accessing ${resourceUrl}: ${error.message}, code = ${error.code}`);
    }
}

export class AssistantGatewayStub {
    async explainCode(options: { code: string }): Promise<string> {
        return `
This is a **test**.

Your code was:

\`\`\`rust
${options.code}
\`\`\`

\`\`\`rust
fn main() {
    println!("Hello, world!");
}
\`\`\`
`;
    }
}
