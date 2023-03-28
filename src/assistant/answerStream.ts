import { Event, EventEmitter } from "vscode";
import { Answer, AnswerBody, AnswerHeader } from "./answer";

interface IEventSource {
    addEventListener(event: string, callback: (event: any) => void): void;
    close(): void;
}

export class AnswerStream {
    private readonly answerHeader: AnswerHeader;
    private answerBodyParts: string[] = [];

    private readonly onDidOpenEmitter = new EventEmitter<void>();
    private readonly onDidReceivePartEmitter = new EventEmitter<Answer>();
    private readonly onDidFinishEmitter = new EventEmitter<Answer>();

    public readonly onDidOpen: Event<void> = this.onDidOpenEmitter.event;
    public readonly onDidReceivePart: Event<Answer> = this.onDidReceivePartEmitter.event;
    public readonly onDidFinish: Event<Answer> = this.onDidFinishEmitter.event;

    constructor(options: {
        answerHeader: AnswerHeader,
        source: IEventSource
        payloadEventName: string
    }) {
        this.answerHeader = options.answerHeader;

        const self = this;

        options.source.addEventListener(options.payloadEventName, (event: any) => {
            const data = event.data;

            if (!data) {
                options.source.close();
                self.emitFinish();
                return;
            }

            self.answerBodyParts.push(data);
            self.emitReceivedPart();
        });

        options.source.addEventListener("open", () => {
            self.answerBodyParts = [];
            self.onDidOpenEmitter.fire();
        });

        options.source.addEventListener("error", () => {
            options.source.close();
            self.emitFinish();
        });
    }

    private emitReceivedPart() {
        const answer = this.getAnswerUntilNow();
        this.onDidReceivePartEmitter.fire(answer);
    }

    private emitFinish() {
        const answer = this.getAnswerUntilNow();
        this.onDidFinishEmitter.fire(answer);
    }

    public getAnswerUntilNow(): Answer {
        const text = this.answerBodyParts.join("");
        const body = new AnswerBody({ text: text });
        return new Answer({ header: this.answerHeader, body: body });
    }
}
