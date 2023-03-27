
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDivider, vsCodeLink, vsCodeProgressRing, vsCodeTextArea } from "@vscode/webview-ui-toolkit";
import { IAskQuestionRequested, MessageType } from "./messages";

enum InternalEvent {
    askQuestionRequested = "askQuestionRequested",
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

    const askView = new AskView();

    askView.setup({
        element: window.document.querySelector("#ViewAsk")
    });

    onInternalEvent(InternalEvent.askQuestionRequested, async (event: any) => {
        askView.showProgressRing();
        messaging.sendAskQuestionRequested(event.detail);
    });
}

class Messaging {
    private vscode: VSCode;

    constructor(vscode: VSCode) {
        this.vscode = vscode;
    }

    sendAskQuestionRequested(question: string) {
        const message: IAskQuestionRequested = {
            type: MessageType.askQuestionRequested,
            value: { question: question }
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
