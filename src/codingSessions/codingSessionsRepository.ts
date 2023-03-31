import { Memento } from "vscode";
import { CodingSession } from "./codingSession";

interface ICodingSessionRecord {
    name: string;
    identifier: string;
}

export class CodingSessionsRepository {
    private readonly memento: Memento;

    constructor(options: { memento: Memento }) {
        this.memento = options.memento;
    }

    getAll(): CodingSession[] {
        const records = this.memento.get<ICodingSessionRecord[]>("codingSessions") || [];
        const items = records.map(item => new CodingSession(item));
        return items;
    }

    async add(item: CodingSession) {
        await this.memento.update("codingSessions", [...this.getAll(), item]);
    }

    async remove(identifier: string) {
        await this.memento.update("codingSessions", this.getAll().filter(item => item.identifier !== identifier));
    }

    async removeAll() {
        await this.memento.update("codingSessions", []);
    }
}
