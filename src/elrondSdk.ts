import { Feedback } from './feedback';
import { ProcessFacade } from "./utils";
import { window } from 'vscode';
import { MySettings } from './settings';

export class ElrondSdk {
    public static setupEnvironment() {
        let folder = MySettings.getElrondSdk();
        process.env["PATH"] = `${folder}:${process.env["PATH"]}`;

        // TODO: feedback, setup()
        // TODO: possibly create .env file to see if Terminal inherits vars?
    }

    public static async require() {
        //await ElrondSdk.requireErdpy();
    }

    private static async requireErdpy() {
        // try {
        //     await ProcessFacade.execute({
        //         program: "erdpy",
        //         args: ["--version"]
        //     });
        // } catch (e) {
        //     let answer = await askYesNo("erdpy isn't available in your environment. Do you agree to install it?")
        //     if (answer) {
        //         await ElrondSdk.installErdpy();
        //     }
        // }
    }

    public static async install() {
        await ElrondSdk.installErdpy();
    }

    public static async installErdpy() {
        // TODO: download to private storage
        // TODO: run with modify-path=false.
        //runInTerminal("wget -O - https://raw.githubusercontent.com/ElrondNetwork/elrond-sdk/development/erdpy-up.py | python3");
    }

    public static async getTemplates() {
        // run erdpy
        // source venv, activate, then run.
        await ProcessFacade.execute({
            program: "erdpy",
            args: ["--version"],
            channels: ["erdpy"]
        });
    }
}

async function askYesNo(question: string): Promise<Boolean> {
    let answerYes = "yes";
    let answerNo = "no";
    let answer = await window.showInformationMessage(question, { modal: true }, answerYes, answerNo);
    return answer === answerYes;
}

async function runInTerminal(command: string) {
    let terminal = window.createTerminal("elrond-sdk");
    terminal.sendText(command);
    terminal.show(false);
    //terminal.dispose();
}
