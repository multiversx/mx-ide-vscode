import { Feedback } from './feedback';
import { ProcessFacade } from "./utils";
import { window } from 'vscode';

export class ElrondSdk {
    public static async requireErdpy() {
        try {
            await ProcessFacade.execute({
                program: "erdpy",
                args: ["--version"]
            });
        } catch (e) {
            Feedback.error("erdpy isn't installed on your machine. Please go to https://github.com/ElrondNetwork/erdpy and follow the instructions.");
            throw e;
        }
    }
}