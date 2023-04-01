import * as vscode from 'vscode';
import * as text from "../text";

export class AssistantAuthenticationPresenter {
    async askConfirmTerms(): Promise<boolean> {
        const answerYes = text.ConfirmTerms.answerYes;
        const answerNo = text.ConfirmTerms.answerNo;
        const question = text.ConfirmTerms.getMessage();
        const answer = await vscode.window.showInformationMessage(question, { modal: true }, answerYes, answerNo);
        return answer === answerYes;
    }

    async askConfirmConnectOpenAIKey(address: string): Promise<boolean> {
        const answerYes = text.ConfirmConnectOpenAIKey.answerYes;
        const answerNo = text.ConfirmConnectOpenAIKey.answerNo;
        const question = text.ConfirmConnectOpenAIKey.getMessage(shortenAddress(address));
        const answer = await vscode.window.showInformationMessage(question, { modal: true }, answerYes, answerNo);
        return answer === answerYes;
    }

    async askOpenAISecretKey(): Promise<string> {
        const result = await vscode.window.showInputBox({
            prompt: text.EnterOpenAISecretKey.prompt,
            ignoreFocusOut: true,
            validateInput: input => {
                return input.length > 0 ? null : text.EnterOpenAISecretKey.validationShouldNotBeEmpty;
            }
        });

        if (result === undefined) {
            return null;
        }

        return result;
    }

    async askConfirmOverrideOpenAIKey(address: string): Promise<boolean> {
        const answerYes = text.ConfirmOverrideOpenAIKey.answerYes;
        const answerNo = text.ConfirmOverrideOpenAIKey.answerNo;
        const question = text.ConfirmOverrideOpenAIKey.getMessage(shortenAddress(address));
        const answer = await vscode.window.showInformationMessage(question, { modal: true }, answerYes, answerNo);
        return answer === answerYes;
    }

    async askConfirmSignOut(options: { address: string, openAIKeyPreview: string }): Promise<boolean> {
        const answerYes = text.ConfirmSignOut.answerYes;
        const answerNo = text.ConfirmSignOut.answerNo;
        const question = text.ConfirmSignOut.getMessage({
            address: shortenAddress(options.address),
            openAIKeyPreview: options.openAIKeyPreview
        });

        const answer = await vscode.window.showInformationMessage(question, { modal: true }, answerYes, answerNo);
        return answer === answerYes;
    }
}

export function shortenAddress(address: string): string {
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
}
