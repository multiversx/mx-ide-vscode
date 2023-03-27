import { Memento } from "vscode";
import { Answer, AnswerBody, AnswerHeader } from "./answer";

interface IAnswerHeaderRecord {
    codingSessionId: string;
    sourceStreamId: string;
    question: string;
}

interface IAnswerBodyRecord {
    text: string;
}

const answerHeadersKey = "assistant.answerHeaders";
const answerBodyKeyPrefix = "assistant.answerBody";

export class AnswersRepository {
    private readonly memento: Memento;

    constructor(options: { memento: Memento }) {
        this.memento = options.memento;
    }

    getHeadersByCodingSession(codingSessionId: string): AnswerHeader[] {
        const items = this.getAllHeaders();
        const filtered = items.filter(item => item.codingSessionId === codingSessionId);
        return filtered;
    }

    getBodyByHeader(header: { sourceStreamId: string }): AnswerBody {
        const key = this.createBodyKey(header);
        const body = this.memento.get<IAnswerBodyRecord>(key, new AnswerBody({ text: "" }));
        return body;
    }

    private getAllHeaders() {
        const records = this.memento.get<IAnswerHeaderRecord[]>(answerHeadersKey, []);
        const items = records.map(item => new AnswerHeader(item));
        return items;
    }

    async add(item: Answer) {
        const headers = this.getAllHeaders();

        await this.memento.update(answerHeadersKey, [...headers, item.header]);
        await this.memento.update(this.createBodyKey(item.header), item.body);
    }

    async removeByCodingSession(codingSessionId: string) {
        const items = this.getAllHeaders();
        const filtered = items.filter(item => item.codingSessionId !== codingSessionId);

        await this.memento.update(answerHeadersKey, filtered);
    }

    private createBodyKey(header: { sourceStreamId: string }) {
        return `${answerBodyKeyPrefix}.${header.sourceStreamId}`;
    }
}
