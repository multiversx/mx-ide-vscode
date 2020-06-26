import { ProcessFacade } from "./utils";
import { SmartContract } from './smartContract';
import { ElrondSdk } from "./elrondSdk";

export class Builder {
    static async buildModule(smartContract: SmartContract): Promise<any> {
        await ElrondSdk.require();

        let workspaceProject = smartContract.SourceFile.WorkspaceProject;

        return ProcessFacade.execute({
            program: "erdpy",
            args: ["build", workspaceProject],
            channels: ["builder"]
        });
    }
}