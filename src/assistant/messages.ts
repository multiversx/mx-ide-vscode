export enum MessageType {
    askQuestionRequested = "askQuestionRequested"
}

export interface IAskQuestionRequested {
    type: MessageType.askQuestionRequested;
    value: {
        question: string;
    };
}
