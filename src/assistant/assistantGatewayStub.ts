import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "vscode";
import { AnswerStream } from "./answerStream";

export class AssistantGatewayStub {
    async createSession(): Promise<string> {
        return uuidv4().toString();
    }

    async explainCode(options: { code: string }): Promise<string> {
        return `
This is a **test**.

Your code was:

\`\`\`rust
${options.code}
\`\`\`

\`\`\`rust
fn main() {
    println!("Hello, world!");
}
\`\`\`
`;
    }

    async askAnything(options: {
        sessionId: string,
        question: string
    }): Promise<AnswerStream> {
        const answer = `
You've asked: ${options.question}.

This is a **test answer**.

It also contains some code:

\`\`\`rust
fn main() {
    println!("Hello, world!");
}
\`\`\`

Bye!
`;

        const parts = answer.split(" ");
        const eventSource = new EventSourceStub();
        const answerStream = new AnswerStream({
            source: eventSource,
            messageEventName: "chunk"
        });

        setTimeout(() => {
            eventSource.open();
        }, 1000);

        for (let i = 0; i < parts.length; i++) {
            setTimeout(() => {
                eventSource.emit({ type: "chunk", data: parts[i] });
            }, 2000 + i * 500);
        }

        return answerStream;
    }
}

class EventSourceStub {
    private readonly _onDidSomething = new EventEmitter<any>();

    open() {
        this._onDidSomething.fire({ type: "open" });
    }

    close() {
    }

    emit(event: any) {
        this._onDidSomething.fire(event);
    }

    addEventListener(eventName: string, handler: (event: any) => void) {
        this._onDidSomething.event(event => {
            if (event.type === eventName) {
                handler(event);
            }
        });
    }
}
