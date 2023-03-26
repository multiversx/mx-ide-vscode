export class CodingSession {
    readonly name: string;
    readonly identifier: string;

    constructor(options: { name: string, identifier: string }) {
        this.name = options.name;
        this.identifier = options.identifier;
    }
}
