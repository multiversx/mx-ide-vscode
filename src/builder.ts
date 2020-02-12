import { ProcessFacade } from "./utils";
import { SmartContract } from './smartContract';
import { Erdpy } from "./erdpy";

export class Builder {
    static async buildModule(smartContract: SmartContract): Promise<any> {
        await Erdpy.require()

        let workspaceProject = smartContract.SourceFile.WorkspaceProject;

        return ProcessFacade.execute({
            program: "erdpy",
            args: ["build", workspaceProject],
            channels: ["builder"]
        });
    }
}