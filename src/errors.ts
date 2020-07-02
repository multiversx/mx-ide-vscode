import { Feedback } from "./feedback";

export class MyError {
    public Message: string;
    public Code: string;
    public Inner: MyError;

    public constructor(init?: Partial<MyError>) {
        Object.assign(this, init);
    }

    public getPretty(): string {
        return this.Message;
    }
}

export class MyExecError extends MyError {
    public Program: string;

    public constructor(init?: Partial<MyExecError>) {
        super();
        Object.assign(this, init);
    }

    public getPretty(): string {
        return `${this.Program}, code = ${this.Code}, ${this.Message}`;
    }
}

export class MyHttpError extends MyError {
    public Url: string;
    public RequestError: Error;

    public constructor(init?: Partial<MyHttpError>) {
        super();
        Object.assign(this, init);
    }

    public getPretty(): string {
        let requestErrorPretty = this.RequestError ? this.RequestError.message : "";
        return `${this.Url}, code = ${this.Code}, ${this.Message}, ${requestErrorPretty}`;
    }
}

export class MySetupError extends MyError {
}

export function caughtTopLevel(error: any) {
    if (error instanceof Error) {
        Feedback.error(error.message);
        return;
    }

    let chain: MyError[] = [];
    chain.push(error);

    while (error.Inner) {
        error = error.Inner;
        chain.push(error);
    }

    let messageBuilder: string[] = [];

    chain.forEach(function (item) {
        let errorType = item.constructor.name;
        let pretty = item.getPretty();
        messageBuilder.push(errorType + ":");
        messageBuilder.push(pretty + ";");
    });

    let message = messageBuilder.join("\n");
    let channels = ["default"];

    if (chain.some((item: any) => item instanceof MyExecError)) {
        channels.push("exec");
    }

    if (chain.some((item: any) => item instanceof MyHttpError)) {
        channels.push("http");
    }

    Feedback.error(message, channels);
}