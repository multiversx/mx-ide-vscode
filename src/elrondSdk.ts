import { Feedback } from './feedback';
import { ProcessFacade } from "./utils";
import { window } from 'vscode';

export class ElrondSdk {
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
        runInTerminal("wget -O - https://raw.githubusercontent.com/ElrondNetwork/elrond-sdk/development/erdpy-up.py | python3");
    }
}

async function askYesNo(question: string): Promise<Boolean> {
    let answerYes = "yes";
    let answerNo = "no";
    let answer = await window.showInformationMessage(question, { modal: true}, answerYes, answerNo);
    return answer === answerYes;
}

async function runInTerminal(command: string) {
    let terminal = window.createTerminal("elrond-sdk");
    terminal.sendText(command);
    terminal.show(false);
    //terminal.dispose();
}
