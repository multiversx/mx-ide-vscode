import * as vscode from 'vscode';
import { withoutEndingPeriod } from './text';

/**
 * Utility class for writing messages to the console and to a VSCode "output channel".
 * Optionally, messages are also displayed to the user, as simple VSCode notifications or as modal dialogs.
 */
export class Feedback {
    private static outputChannels: { [id: string]: vscode.OutputChannel; } = {};

    public static async debug(options: { message: string, items?: any[] }) {
        const items = options.items || [];

        console.debug(options.message, ...items);

        this.appendLogMessage("DEBUG", options.message);
        this.writeArbitraryItems(items);
    }

    public static async info(options: { message: string, items?: any[], display?: boolean, modal?: boolean }) {
        const items = options.items || [];

        console.info(options.message, ...items);

        this.appendLogMessage("INFO", options.message);
        this.writeArbitraryItems(items);

        if (options.display) {
            await vscode.window.showInformationMessage(options.message, { modal: options.modal || false });
        }
    }

    public static async error(options: { message: string, error: any, items?: any[], display?: boolean }) {
        const items = options.items || [];

        console.error(options.message, options.error, ...items);

        this.appendLogMessage("ERROR", options.message);
        this.writeArbitraryItems([options.error, ...items]);

        if (options.display) {
            const message = `
${withoutEndingPeriod(options.message)}.
To see more details, pick "MultiversX" in vscode's "Output" panels.
`;
            const messageOptions: vscode.MessageOptions = {};
            await vscode.window.showErrorMessage(message, messageOptions, "Got it!");
        }
    }

    private static appendLogMessage(level: string, message: string) {
        const time = new Date().toISOString();
        this.getChannel().appendLine(`${level} [${time}]: ${message}`);
    }

    private static getChannel(): vscode.OutputChannel {
        const channelName = `MultiversX`;

        if (!this.outputChannels[channelName]) {
            this.outputChannels[channelName] = vscode.window.createOutputChannel(channelName);
        }

        return this.outputChannels[channelName];
    }

    private static writeArbitraryItems(items: any[]) {
        const channel = this.getChannel();

        for (const item of items) {
            const line = this.itemToString(item);
            channel.appendLine(line);
        }
    }

    private static itemToString(item: any): string {
        if (item instanceof Error) {
            return item.stack;
        }

        if (item instanceof Object) {
            return JSON.stringify(item, null, 4);
        }

        return item.toString();
    }
}
