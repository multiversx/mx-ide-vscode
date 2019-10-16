import { FsFacade } from "./utils";
import { RestDebugger } from "./debugger";
import { Builder } from "./builder";
import _ = require("underscore");

export class SmartContract {
    public readonly FriendlyId: string;
    public readonly SourceFile: string;
    public BytecodeFile: string;
    public Address: string;

    constructor(sourceFile: string) {
        this.SourceFile = sourceFile;
        this.FriendlyId = FsFacade.removeExtension(FsFacade.getFilename(sourceFile));
    }

    public isBuilt(): boolean {
        return this.BytecodeFile ? true : false;
    }

    public build() {
        Builder.buildFile(this.SourceFile);
    }

    public deployToDebugger(senderAddress: string) {
        let self = this;
        let buffer = FsFacade.readBinaryFile(this.BytecodeFile);
        let hexCode = buffer.toString("hex");

        RestDebugger.deploySmartContract(senderAddress, hexCode, function(data: any) {
            self.Address = data.data;
        });
    }

    public runFunction(senderAddress: string, functionName: string, functionArgs: string[]) {
        
    }

    public syncWithWorkspace() {
        let bytecodeFileTest = `${FsFacade.removeExtension(this.SourceFile)}.wasm`;

        if (FsFacade.fileExists(bytecodeFileTest)) {
            this.BytecodeFile = bytecodeFileTest;
        }
    }
}

export class SmartContractsCollection {
    public static Items: SmartContract[] = [];

    public static syncWithWorkspace() {
        let sourceFilesNow = FsFacade.getFilesInWorkspaceByExtension(".c");
        let smartContractsNow = sourceFilesNow.map(e => new SmartContract(e));
        let smartContractsBefore = this.Items;

        // Keep data after sync.
        smartContractsNow.forEach(contractNow => {
            let contractBefore = smartContractsBefore.find(e => e.FriendlyId == contractNow.FriendlyId);
            
            if (contractBefore) {
                contractNow.Address = contractBefore.Address;
            }

            contractNow.syncWithWorkspace();
        });

        this.Items = smartContractsNow;
    }

    public static getById(id: string): SmartContract {
        let item = this.Items.find(e => e.FriendlyId == id);
        return item;
    }
}