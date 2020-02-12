import { Feedback } from './feedback';
import { ProcessFacade } from "./utils";

export class Erdpy {
    public static async require() {
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