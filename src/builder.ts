import { ProcessFacade, FsFacade } from "./utils";
import { SmartContract } from './smartContract';

export class Builder {
    static async buildModule(smartContract: SmartContract): Promise<any> {
        let workspaceProject = smartContract.SourceFile.WorkspaceProject;

        return ProcessFacade.execute({
            program: "erdpy",
            args: ["build", workspaceProject],
            channels: ["builder"]
        });
    }
}