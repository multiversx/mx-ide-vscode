import * as vscode from 'vscode';
import _ = require('underscore');

export class Feedback {
    private static OutputChannels: { [id: string]: vscode.OutputChannel; } = {};

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

    public static error(summary: string, detailed?: string, channels: string[] = ["default"]) {
        console.error(detailed);

        channels.forEach(function (tag) {
            Feedback.getChannel(tag).appendLine(`ERROR: ${detailed}`);
        });

        vscode.window.showErrorMessage(`${summary}. See the Output Channels for more details.`, { modal: true });
    }

    private static getChannel(tag: string): vscode.OutputChannel {
        let channelName: string = `Elrond: ${tag}`;

        if (!Feedback.OutputChannels[channelName]) {
            Feedback.OutputChannels[channelName] = vscode.window.createOutputChannel(channelName);
        }

        return Feedback.OutputChannels[channelName];
    }
}