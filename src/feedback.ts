import * as vscode from 'vscode';
import _ = require('underscore');

export class Feedback {
    private static OutputChannel: vscode.OutputChannel;
    
    public static debug(message: string) {
        console.log(message);
        Feedback.getChannel().appendLine(`DEBUG: ${message}`);
    }

    public static info(message: string) {
        console.info(message);
        Feedback.getChannel().appendLine(`INFO: ${message}`);
        vscode.window.showInformationMessage(message);
    }

    public static error(message: string) {
        console.error(message);
        vscode.window.showErrorMessage(message);
        Feedback.getChannel().appendLine(`ERROR: ${message}`);
    }

    private static getChannel(): vscode.OutputChannel {
        const ChannelName: string = "ElrondIDE";

        if (!Feedback.OutputChannel) {
            Feedback.OutputChannel = vscode.window.createOutputChannel(ChannelName);
            Feedback.OutputChannel.show();
        }

        return Feedback.OutputChannel;
    }
}