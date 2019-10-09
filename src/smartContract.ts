import { FsFacade } from "./utils";
import { RestDebugger } from "./debugger";
import { Builder } from "./builder";

export class SmartContract {
    public readonly FriendlyId: string;
    public readonly SourceFile: string;
    public BytecodeFile: string;
    public Address: string;

    constructor(sourceFile: string) {
        this.SourceFile = sourceFile;
        this.FriendlyId = FsFacade.removeExtension(FsFacade.getFilename(sourceFile));
        let bytecodeFileTest = `${FsFacade.removeExtension(sourceFile)}.wasm`;

        if (FsFacade.fileExists(bytecodeFileTest)) {
            this.BytecodeFile = bytecodeFileTest;
        }
    }

    public isBuilt(): boolean {
        return this.BytecodeFile ? true : false;
    }

    public build() {
        Builder.buildFile(this.SourceFile);
    }

    public deployToDebugger(senderAddress: string) {
        let buffer = FsFacade.readBinaryFile(this.BytecodeFile);
        let hexCode = buffer.toString("hex");
        RestDebugger.deploySmartContract(senderAddress, hexCode);
    }
}

export class SmartContractsCollection {
    public static Items: SmartContract[];

    public static syncWithWorkspace() {
        // todo: do a smarter sync, without loosing existing SmartContract objects.
        // or: keep global map of (friendlyId, scAddress) here.
        let sourceFiles = FsFacade.getFilesInWorkspaceByExtension(".c");
        this.Items = sourceFiles.map(e => new SmartContract(e));
    }

    public static getById(id: string): SmartContract {
        let item = this.Items.find(e => e.FriendlyId == id);
        return item;
    }
}