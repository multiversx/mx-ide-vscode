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
        return `[${this.Program}] said ${this.Message} (code = ${this.Code})`;
    }
}

export class CannotParseVersionError extends MyError {
    public version: string;

    public constructor(version: string) {
        super();
        this.version = version;
    }

    public getPretty(): string {
        return `Cannot parse version: ${this.version}`;
    }
}

export function caughtTopLevel(originalError: any) {
    if (originalError instanceof Error) {
        Feedback.error(originalError.message);
        return;
    }

    let chain: MyError[] = [];
    chain.push(originalError);

    let error = originalError;
    while (error.Inner) {
        error = error.Inner;
        chain.push(error);
    }

    let summary = originalError.getPretty();
    let detailedBuilder: string[] = [];

    chain.forEach(function (item) {
        let errorType = item.constructor.name;
        let pretty = item.getPretty();
        detailedBuilder.push(`[${errorType}]: ${pretty}`);
    });

    let detailed = detailedBuilder.join("...\n");
    Feedback.error(summary, detailed, ["default"]);
}
