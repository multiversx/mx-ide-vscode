import { ProcessFacade } from "./utils";
import * as sdk from "./sdk";

export class Builder {
    static async buildModule(smartContract: any): Promise<any> {
        await sdk.ensureInstalled();

        // let workspaceProject = smartContract.SourceFile.WorkspaceProject;

        // return ProcessFacade.execute({
        //     program: "erdpy",
        //     args: ["build", workspaceProject],
        //     channels: ["builder"]
        // });
    }
}