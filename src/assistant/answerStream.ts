import { Event, EventEmitter } from "vscode";

interface IEventSource {
    addEventListener(event: string, callback: (event: any) => void): void;
    close(): void;
}

export class AnswerStream {
    private readonly _onDidOpen = new EventEmitter<void>();
    private readonly _onDidReceivePart = new EventEmitter<string>();
    private readonly _onDidFinish = new EventEmitter<void>();

    public readonly onDidOpen: Event<void> = this._onDidOpen.event;
    public readonly onDidReceivePart: Event<string> = this._onDidReceivePart.event;
    public readonly onDidFinish: Event<void> = this._onDidFinish.event;

    constructor(options: {
        source: IEventSource
        messageEventName: string
    }) {
        const self = this;

        options.source.addEventListener(options.messageEventName, (event: any) => {
            const data = event.data;

            if (!data) {
                options.source.close();
                self._onDidFinish.fire();
                return;
            }

            self._onDidReceivePart.fire(data);
        });

        options.source.addEventListener("open", () => {
            self._onDidOpen.fire();
        });

        options.source.addEventListener("error", () => {
            options.source.close();
            self._onDidFinish.fire();
        });
    }
}
