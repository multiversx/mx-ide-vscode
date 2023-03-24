import axios, { AxiosRequestConfig } from "axios";


const DefaultTimeout = 10000;
const DefaultAxiosConfig: AxiosRequestConfig = {
    timeout: DefaultTimeout,
};

export class BotGateway {
    private readonly baseUrl: string;
    private readonly config: AxiosRequestConfig;

    constructor(options: { baseUrl: string, config?: AxiosRequestConfig }) {
        this.baseUrl = options.baseUrl;
        this.config = { ...DefaultAxiosConfig, ...options.config };
    }

    async explainCode(options: { code: string }): Promise<string> {
        const payload = { code: options.code };
        const response = await this.doPost(`${this.baseUrl}/explain-code`, payload);
        return response.data;
    }

    private async doPost(url: string, payload: any): Promise<any> {
        const config = {
            ...this.config,
            headers: {
                "Content-Type": "application/json",
                ...this.config.headers,
            }
        };

        const response = await axios.post(url, payload, config);
        return response.data;
    }
}

export class BotGatewayStub {
    async explainCode(options: { code: string }): Promise<string> {
        return `
# Explanation

\`\`\`rust
fn main() {
    println!("Hello, world!");
}
\`\`\`

This is a **test**.

Your code was:

\`\`\`rust
${options.code}
\`\`\`
`;
    }
}
