import * as vscode from 'vscode';

export class Feedback {
    private static outputChannels: { [id: string]: vscode.OutputChannel; } = {};

    public static programOutput(programName: string, output: string, channels: string[] = ["default"]) {
        let lines = output.split("\n");

        channels.forEach(function (tag) {
            lines.forEach(function (line) {
                if (line) {
                    Feedback.getChannel(tag).appendLine(`[${programName}]: ${line}`);
                }
            });
        });
    }

    public static debug(message: string, channels: string[] = ["default"]) {
        channels.forEach(function (tag) {
            Feedback.getChannel(tag).appendLine(`DEBUG: ${message}`);
        });
    }

    public static info(message: string, channels: string[] = ["default"]) {
        channels.forEach(function (tag) {
            Feedback.getChannel(tag).appendLine(`INFO: ${message}`);
        });

        vscode.window.showInformationMessage(message);
    }

    public static async infoModal(message: string, channels: string[] = ["default"]) {
        channels.forEach(function (tag) {
            Feedback.getChannel(tag).appendLine(`INFO: ${message}`);
        });

        await vscode.window.showInformationMessage(message, { modal: true });
    }

    public static error(error: Error, channels: string[] = ["default"]) {
        console.error(error);

        channels.forEach(function (tag) {
            Feedback.getChannel(tag).appendLine(`${error.stack}`);
        });

        vscode.window.showErrorMessage(error.message);
        vscode.window.showErrorMessage("See the Output Channels for more details about the error.");
    }

    private static getChannel(tag: string): vscode.OutputChannel {
        let channelName: string = `MultiversX: ${tag}`;

        if (!Feedback.outputChannels[channelName]) {
            Feedback.outputChannels[channelName] = vscode.window.createOutputChannel(channelName);
        }

        return Feedback.outputChannels[channelName];
    }

    public static reveal(tag: string) {
        let channel = Feedback.getChannel(tag);
        channel.show(true);
    }
}
