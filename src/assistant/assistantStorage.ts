import { Memento } from "vscode";
import { Answer, AnswerBody, AnswerHeader } from "./answer";
import { CodingSession } from "./codingSession";

interface ICodingSessionRecord {
    name: string;
    identifier: string;
}

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
const codingSessionsKey = "assistant.codingSessions";
const selectedCodingSessionKey = "assistant.selectedCodingSession";

export class AssistantStorage {
    private readonly memento: Memento;

    constructor(options: { memento: Memento }) {
        this.memento = options.memento;
    }

    getAllCodingSessions(): CodingSession[] {
        const records = this.memento.get<ICodingSessionRecord[]>(codingSessionsKey) || [];
        const items = records.map(item => new CodingSession(item));
        return items;
    }

    async addCodingSession(item: CodingSession) {
        await this.memento.update(codingSessionsKey, [...this.getAllCodingSessions(), item]);
    }

    async removeCodingSession(identifier: string) {
        await this.memento.update(codingSessionsKey, this.getAllCodingSessions().filter(item => item.identifier !== identifier));
    }

    async removeAllCodingSessions() {
        await this.memento.update(codingSessionsKey, []);
    }

    getAnswersHeaders(options: { codingSessionId: string }): AnswerHeader[] {
        const items = this.getAllAnswersHeaders();
        const filtered = items.filter(item => item.codingSessionId === options.codingSessionId);
        return filtered;
    }

    getAnswer(options: { sourceStreamId: string }): Answer {
        const answerHeader = this.getAllAnswersHeaders().find(item => item.sourceStreamId === options.sourceStreamId);
        const bodyKey = this.createAnswerBodyKey(options);
        const body = this.memento.get<IAnswerBodyRecord>(bodyKey, new AnswerBody({ text: "" }));
        return new Answer({ header: answerHeader, body: body });
    }

    private getAllAnswersHeaders() {
        const records = this.memento.get<IAnswerHeaderRecord[]>(answerHeadersKey, []);
        const items = records.map(item => new AnswerHeader(item));
        return items;
    }

    async addAnswer(item: Answer) {
        const headers = this.getAllAnswersHeaders();

        await this.memento.update(answerHeadersKey, [...headers, item.header]);
        await this.memento.update(this.createAnswerBodyKey(item.header), item.body);
    }

    async removeAnswers(options: { codingSessionId?: string }) {
        const items = this.getAllAnswersHeaders();
        const itemsOfGivenCodingSession = items.filter(item => item.codingSessionId === options.codingSessionId);
        const itemsOfOtherCodingSessions = items.filter(item => item.codingSessionId !== options.codingSessionId);

        const itemsToKeep = itemsOfOtherCodingSessions;
        const itemsToRemove = itemsOfGivenCodingSession;

        await this.memento.update(answerHeadersKey, itemsToKeep);

        for (const item of itemsToRemove) {
            await this.memento.update(this.createAnswerBodyKey(item), undefined);
        }
    }

    async removeAllAnswers() {
        const items = this.getAllAnswersHeaders();

        await this.memento.update(answerHeadersKey, []);

        for (const item of items) {
            await this.memento.update(this.createAnswerBodyKey(item), undefined);
        }
    }

    async removeAll() {
        await this.removeAllCodingSessions();
        await this.removeAllAnswers();
    }

    private createAnswerBodyKey(options: { sourceStreamId: string }) {
        return `${answerBodyKeyPrefix}.${options.sourceStreamId}`;
    }

    async setSelectedCodingSessionId(identifier: string | undefined) {
        await this.memento.update(selectedCodingSessionKey, identifier);
    }

    getSelectedCodingSessionId(): string | undefined {
        return this.memento.get(selectedCodingSessionKey);
    }
}
