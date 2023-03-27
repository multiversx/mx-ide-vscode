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

    getAnswersHeaders(options: { codingSessionId: string }): AnswerHeader[] {
        const items = this.getAllAnswersHeaders();
        const filtered = items.filter(item => item.codingSessionId === options.codingSessionId);
        return filtered;
    }

    getAnswer(options: { sourceStreamId: string }): Answer {
        const answerHeader = this.getAllAnswersHeaders().find(item => item.sourceStreamId === options.sourceStreamId);
        const bodyKey = this.createBodyKey(options);
        const body = this.memento.get<IAnswerBodyRecord>(bodyKey, new AnswerBody({ text: "" }));
        return new Answer({ header: answerHeader, body: body });
    }

    private getAllAnswersHeaders() {
        const records = this.memento.get<IAnswerHeaderRecord[]>(answerHeadersKey, []);
        const items = records.map(item => new AnswerHeader(item));
        return items;
    }

    async add(item: Answer) {
        const headers = this.getAllAnswersHeaders();

        await this.memento.update(answerHeadersKey, [...headers, item.header]);
        await this.memento.update(this.createBodyKey(item.header), item.body);
    }

    async removeAnswer(options: { codingSessionId: string }) {
        const items = this.getAllAnswersHeaders();
        const filtered = items.filter(item => item.codingSessionId !== options.codingSessionId);

        await this.memento.update(answerHeadersKey, filtered);

        for (const item of filtered) {
            await this.memento.update(this.createBodyKey(item), undefined);
        }
    }

    private createBodyKey(options: { sourceStreamId: string }) {
        return `${answerBodyKeyPrefix}.${options.sourceStreamId}`;
    }
}
