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

    public static error(message: string, channels: string[] = ["default"]) {
        console.error(message);

        channels.forEach(function (tag) {
            Feedback.getChannel(tag).appendLine(`ERROR: ${message}`);
        });

        vscode.window.showErrorMessage(message);
    }

    private static getChannel(tag: string): vscode.OutputChannel {
        let channelName: string = `Elrond: ${tag}`;

        if (!Feedback.OutputChannels[channelName]) {
            Feedback.OutputChannels[channelName] = vscode.window.createOutputChannel(channelName);
            //Feedback.OutputChannels[channelName].show();
        }

        return Feedback.OutputChannels[channelName];
    }
}