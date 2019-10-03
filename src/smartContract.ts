import { FsFacade } from "./utils";
import { RestDebugger } from "./debugger";

export class SmartContract {
    public readonly SourceFile: string;
    public BytecodeFile: string;

    constructor(sourceFile: string) {
        this.SourceFile = sourceFile;
        
        let bytecodeFileTest = `${FsFacade.removeExtension(sourceFile)}.wasm`;

        if (FsFacade.fileExists(bytecodeFileTest)) {
            this.BytecodeFile = bytecodeFileTest;
        }
    }

    public static getAll() {
        let sourceFiles = FsFacade.getFilesInWorkspaceByExtension(".c");
        let contracts = sourceFiles.map(e => new SmartContract(e));
        return contracts;
    }

    public isBuilt(): boolean {
        return this.BytecodeFile ? true : false;
    }

    public deployToDebugger() {
        let buffer = FsFacade.readBinaryFile(this.BytecodeFile);
        let hexCode = buffer.toString("hex");
        RestDebugger.deploySmartContract(hexCode);
    }
}