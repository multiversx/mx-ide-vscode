
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDivider, vsCodeLink, vsCodeProgressRing, vsCodeTextArea } from "@vscode/webview-ui-toolkit";
import { IAskQuestionRequested, IDisplayAnswerRequested, MessageType } from "./messages";

enum InternalEvent {
    askQuestionRequested = "askQuestionRequested",
    displayAnswerRequested = "displayAnswerRequested"
}

interface VSCode {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
};

interface State {
}

declare function acquireVsCodeApi(): VSCode;
declare const window: any;

async function main() {
    provideVSCodeDesignSystem().register(
        vsCodeLink(),
        vsCodeTextArea(),
        vsCodeButton(),
        vsCodeDivider(),
        vsCodeProgressRing()
    );

    const vscode = acquireVsCodeApi();
    const messaging = new Messaging(vscode);
    const state: State = vscode.getState() || {};

    const historyView = new HistoryView();
    const askView = new AskView();

    historyView.setup({
        element: window.document.querySelector("#ViewHistory")
    });

    askView.setup({
        element: window.document.querySelector("#ViewAsk")
    });

    messaging.onInitialize((items: any[]) => {
        items.forEach(item => {
            historyView.appendItem(item);
        });
    });

    onInternalEvent(InternalEvent.askQuestionRequested, async (event: any) => {
        const question = event.detail.question;
        askView.showProgressRing();
        messaging.sendAskQuestionRequested(question);
    });

    onInternalEvent(InternalEvent.displayAnswerRequested, async (event: any) => {
        const answer = event.detail;
        messaging.sendDisplayAnswerRequested(answer);
    });

    messaging.onMessageFinished(() => {
        askView.hideProgressRing();
    });
}

class Messaging {
    private vscode: VSCode;

    constructor(vscode: VSCode) {
        this.vscode = vscode;
    }

    onInitialize(callback: (items: any[]) => void) {
        window.addEventListener("message", (event: any) => {
            if (event.data.type !== MessageType.initialize) {
                return;
            }

            callback(event.data.value.items);
        });
    }

    sendAskQuestionRequested(question: string) {
        const message: IAskQuestionRequested = {
            type: MessageType.askQuestionRequested,
            value: { question: question }
        };

        this.vscode.postMessage(message);
    }

    onMessageFinished(callback: () => void) {
        window.addEventListener("message", (event: any) => {
            if (event.data.type !== MessageType.answerFinished) {
                return;
            }

            callback();
        });
    }

    sendDisplayAnswerRequested(item: any) {
        const message: IDisplayAnswerRequested = {
            type: MessageType.displayAnswerRequested,
            value: { item: item }
        };

        this.vscode.postMessage(message);
    }
}

class AskView {
    private element: any;
    private progressRingContainer: any;

    setup(options: { element: any }) {
        this.element = options.element;
        this.progressRingContainer = this.element.querySelector(".progress-ring-container");

        const textAreaAsk = this.element.querySelector("#TextAreaAsk");
        const buttonAsk = this.element.querySelector("#ButtonAsk");

        buttonAsk.addEventListener("click", () => {
            triggerInternalEvent(InternalEvent.askQuestionRequested, {
                question: textAreaAsk.value
            });
        });
    }

    showProgressRing() {
        this.progressRingContainer.classList.remove("hidden");
    }

    hideProgressRing() {
        this.progressRingContainer.classList.add("hidden");
    }
}

class HistoryView {
    private element: any;

    setup(options: { element: any }) {
        this.element = options.element;
    }

    appendItem(model: any) {
        const item = new HistoryViewItem();
        const element = item.render(model);
        this.element.appendChild(element);
    }
}

class HistoryViewItem {
    render(model: any) {
        const element = window.document.createElement("div");
        element.classList.add("history-item");

        const question = window.document.createElement("div");
        question.classList.add("question");
        question.textContent = model.question;
        element.appendChild(question);

        const answer = window.document.createElement("vscode-link");
        answer.classList.add("answer");
        answer.setAttribute("href", "#");
        answer.textContent = "See answer";
        element.appendChild(answer);

        answer.addEventListener("click", () => {
            triggerInternalEvent(InternalEvent.displayAnswerRequested, model);
        });

        const divider = window.document.createElement("vscode-divider");
        divider.setAttribute("role", "presentation");
        element.appendChild(divider);

        return element;
    }
}

function triggerInternalEvent(name: string, data: any) {
    window.document.dispatchEvent(new window.CustomEvent(name, { detail: data }));
}

export function onInternalEvent(name: string, callback: (event: any) => void) {
    window.document.addEventListener(name, callback);
}

(async () => {
    await main();
})();
