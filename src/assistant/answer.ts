export class AnswerHeader {
    readonly codingSessionId: string;
    readonly sourceStreamId: string;
    readonly question: string;

    constructor(options: {
        codingSessionId: string,
        sourceStreamId: string
        question: string,
    }) {
        this.codingSessionId = options.codingSessionId;
        this.question = options.question;
        this.sourceStreamId = options.sourceStreamId;
    }
}

export class AnswerBody {
    readonly text: string;

    constructor(options: { text: string }) {
        this.text = options.text;
    }
}

export class Answer {
    readonly header: AnswerHeader;
    readonly body: AnswerBody;

    constructor(options: { header: AnswerHeader, body: AnswerBody }) {
        this.header = options.header;
        this.body = options.body;
    }
}
