import { FsFacade } from "./utils";
import { RestDebugger } from "./debugger";
import { Builder } from "./builder";
import _ = require("underscore");

export class SmartContract {
    public readonly FriendlyId: string;
    public readonly SourceFile: string;
    public BytecodeFile: string;
    public Address: string;
    public LatestRun: SmartContractRun;

    constructor(sourceFile: string) {
        this.SourceFile = sourceFile;
        this.FriendlyId = FsFacade.removeExtension(FsFacade.getFilename(sourceFile));
        this.LatestRun = new SmartContractRun();
    }

    public isBuilt(): boolean {
        return this.BytecodeFile ? true : false;
    }

    public build(): Promise<any> {
        return Builder.buildFile(this.SourceFile);
    }

    public async deployToDebugger(senderAddress: string): Promise<any> {
        let self = this;
        let buffer = FsFacade.readBinaryFile(this.BytecodeFile);
        let hexCode = buffer.toString("hex");

        const response = await RestDebugger.deploySmartContract(senderAddress, hexCode);
        self.Address = response.data;
    }

    public async runFunction(options: any): Promise<any> {
        let self = this;
        this.LatestRun = new SmartContractRun();
        this.LatestRun.Options = options;

        options.scAddress = this.Address;

        try {
            const vmOutput = await RestDebugger.runSmartContract(options);
            self.LatestRun.VMOutput = vmOutput;
        } catch (e) {
            self.LatestRun.VMOutput = {};
        }
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
                contractNow.LatestRun = contractBefore.LatestRun;
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

class SmartContractRun {
    public Options: any;
    public VMOutput: any;

    constructor() {
        this.Options = {
            functionName: "nothing",
            functionArgs: [],
            value: 42,
            gasLimit: 5432,
            gasPrice: 1
        };

        this.VMOutput = {};
    }
}