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

    public static topLevelCatcher(error: any) {
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
        Feedback.error(message);
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
}

export class MySetupError extends MyError {
}