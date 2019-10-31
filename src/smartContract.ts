import { FsFacade } from "./utils";
import { RestDebugger } from "./debugger";
import { Builder } from "./builder";
import _ = require("underscore");
import { MyError } from "./errors";

export class SmartContract {
    public readonly FriendlyId: string;
    public readonly SourceFile: string;
    public SourceFileTimestamp: Date;
    public BytecodeFile: string;
    public BytecodeFileTimestamp: Date;
    public Address: string;
    public AddressTimestamp: Date;
    public AddressOnTestnet: string;
    public AddressOnTestnetTimestamp: Date;
    public LatestRun: SmartContractRun;

    constructor(sourceFile: string) {
        this.SourceFile = sourceFile;
        this.FriendlyId = FsFacade.getPathRelativeToWorkspace(sourceFile);
        this.LatestRun = new SmartContractRun();
    }

    public isBuilt(): boolean {
        return this.BytecodeFile ? true : false;
    }

    public build(): Promise<any> {
        return Builder.buildFile(this.SourceFile);
    }

    public async deployToDebugger(options: any): Promise<any> {
        let self = this;

        // Prepare transaction data.
        let transactionData = FsFacade.readFile(`${this.BytecodeFile}.hex.arwen`);
        options.transactionData = this.appendArgsToTxData(options.initArgs, transactionData);

        const response = await RestDebugger.deploySmartContract(options);

        if (options.onTestnet) {
            self.AddressOnTestnet = response.data;
            self.AddressOnTestnetTimestamp = new Date();
        } else {
            self.Address = response.data;
            self.AddressTimestamp = new Date();
        }
    }

    public async runFunction(options: any): Promise<any> {
        let self = this;
        this.LatestRun = new SmartContractRun();
        this.LatestRun.Options = options;

        if (options.onTestnet) {
            options.scAddress = this.AddressOnTestnet;
        } else {
            options.scAddress = this.Address;
        }

        // Prepare transaction data.
        let transactionData = options.functionName;
        options.transactionData = this.appendArgsToTxData(options.functionArgs, transactionData);
        
        try {
            const vmOutput = await RestDebugger.runSmartContract(options);
            self.LatestRun.VMOutput = vmOutput;
        } catch (e) {
            self.LatestRun.VMOutput = {};
        }
    }

    public syncWithWorkspace() {
        this.SourceFileTimestamp = FsFacade.getModifiedOn(this.SourceFile);

        let bytecodeFileTest = `${FsFacade.removeExtension(this.SourceFile)}.wasm`;

        if (FsFacade.fileExists(bytecodeFileTest)) {
            this.BytecodeFile = bytecodeFileTest;
            this.BytecodeFileTimestamp = FsFacade.getModifiedOn(this.BytecodeFile);
        }
    }

    private appendArgsToTxData(args: string[], transactionData: string): string {
        const hexPrefix = "0X";

        _.each(args, function (item: string) {
            var itemAsAny: any = item;

            if (item === "") {
                return;
            }

            transactionData += "@";

            if (item.toUpperCase().startsWith(hexPrefix)) {
                item = item.substring(hexPrefix.length);
                transactionData += item;
            } else {
                if (isNaN(itemAsAny)) {
                    throw new MyError({Message: `Can't handle non-hex, non-number arguments yet: ${item}.`});    
                } else {
                    let number = Number(item);
                    let hexString = number.toString(16);
                    transactionData += hexString;
                }
            }
        });

        return transactionData;
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
                contractNow.AddressTimestamp = contractBefore.AddressTimestamp;
                contractNow.AddressOnTestnet = contractBefore.AddressOnTestnet;
                contractNow.AddressOnTestnetTimestamp = contractBefore.AddressOnTestnetTimestamp;
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
            senderAddress: "",
            functionName: "your_function",
            functionArgs: [],
            value: 0,
            gasLimit: 2000,
            gasPrice: 10
        };

        this.VMOutput = {};
    }
}