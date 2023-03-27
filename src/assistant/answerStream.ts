import { Event, EventEmitter } from "vscode";

interface IEventSource {
    addEventListener(event: string, callback: (event: any) => void): void;
    close(): void;
}

export class AnswerStream {
    private parts: string[] = [];

    private readonly onDidOpenEmitter = new EventEmitter<void>();
    private readonly onDidReceivePartEmitter = new EventEmitter<string>();
    private readonly onDidFinishEmitter = new EventEmitter<void>();

    public readonly onDidOpen: Event<void> = this.onDidOpenEmitter.event;
    public readonly onDidReceivePart: Event<string> = this.onDidReceivePartEmitter.event;
    public readonly onDidFinish: Event<void> = this.onDidFinishEmitter.event;

    constructor(options: {
        source: IEventSource
        messageEventName: string
    }) {
        const self = this;

        options.source.addEventListener(options.messageEventName, (event: any) => {
            const data = event.data;

            if (!data) {
                options.source.close();
                self.onDidFinishEmitter.fire();
                return;
            }

            self.parts.push(data);
            self.onDidReceivePartEmitter.fire(data);
        });

        options.source.addEventListener("open", () => {
            self.parts = [];
            self.onDidOpenEmitter.fire();
        });

        options.source.addEventListener("error", () => {
            options.source.close();
            self.onDidFinishEmitter.fire();
        });
    }

    getAnswerUntilNow(): string {
        return this.parts.join("");
    }
}
