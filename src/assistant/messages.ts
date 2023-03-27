export enum MessageType {
    askQuestionRequested = "askQuestionRequested",
    answerFinished = "answerFinished"
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
