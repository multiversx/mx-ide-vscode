export enum MessageType {
    refreshHistory = "initialize",
    askQuestionRequested = "askQuestionRequested",
    answerFinished = "answerFinished",
    displayAnswerRequested = "displayAnswerRequested"
}

export interface IInitialize {
    type: MessageType.refreshHistory;
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

export interface IDisplayAnswerRequested {
    type: MessageType.displayAnswerRequested;
    value: {
        item: any;
    };
}
