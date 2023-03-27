export enum MessageType {
    initialize = "initialize",
    askQuestionRequested = "askQuestionRequested",
    answerFinished = "answerFinished"
}

export interface IInitialize {
    type: MessageType.initialize;
    value: {
        items: any[];
    };
}

export interface IAskQuestionRequested {
    type: MessageType.askQuestionRequested;
    value: {
        question: string;
    };
}

export interface IAnswerFinished {
    type: MessageType.answerFinished;
}
