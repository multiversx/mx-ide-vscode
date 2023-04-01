import * as vscode from 'vscode';

export class Feedback {
    private static outputChannels: { [id: string]: vscode.OutputChannel; } = {};

    public static async debug(message: string) {
        console.debug(message);
        this.getChannel().appendLine(`DEBUG: ${message}`);
    }

    public static async info(message: string) {
        console.info(message);
        this.getChannel().appendLine(`INFO: ${message}`);

        await vscode.window.showInformationMessage(message);
    }

    public static async infoModal(message: string) {
        console.info(message);
        this.getChannel().appendLine(`INFO: ${message}`);

        await vscode.window.showInformationMessage(message, { modal: true });
    }

    public static async error(error: Error) {
        console.error(error);
        this.getChannel().appendLine(`${error.stack}`);

        await vscode.window.showErrorMessage(error.message);
        await vscode.window.showErrorMessage(`In the Visual Studio Code "Output" panels, pick "MultiversX" for more details about the error.`);
    }

    private static getChannel(): vscode.OutputChannel {
        const channelName = `MultiversX`;

        if (!this.outputChannels[channelName]) {
            this.outputChannels[channelName] = vscode.window.createOutputChannel(channelName);
        }

        return this.outputChannels[channelName];
    }
}
