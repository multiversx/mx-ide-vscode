import { FsFacade } from "./utils";
import { RestDebugger } from "./debugger";
import { Builder } from "./builder";
import _ = require("underscore");
import { MyError } from "./errors";
import path = require('path');
import { MyFile } from "./myfile";
import { CommentThreadCollapsibleState } from "vscode";

export class SmartContract {
    public readonly FriendlyId: string;
    public readonly SourceFile: MyFile;
    public BytecodeFile: MyFile;
    public ExportFile: MyFile;
    public readonly IsSourceC: boolean;
    public readonly IsSourceRust: boolean;

    public Address: string;
    public AddressTimestamp: Date;
    public AddressOnTestnet: string;
    public AddressOnTestnetTimestamp: Date;
    public LatestRun: SmartContractRun;

    constructor(sourceFile: MyFile) {
        this.SourceFile = sourceFile;
        this.FriendlyId = this.SourceFile.PathRelativeToWorkspace;
        this.LatestRun = new SmartContractRun();

        this.IsSourceC = this.SourceFile.Extension == ".c";
        this.IsSourceRust = this.SourceFile.Extension == ".rs";
    }

    public isBuilt(): boolean {
        return this.BytecodeFile ? true : false;
    }

    public async setBuildOptions(options: any): Promise<any> {
        if (this.IsSourceC) {
            let exportFilePath = `${this.SourceFile.PathWithoutExtension}.export`;
            FsFacade.writeFile(exportFilePath, options.exportedFunctions);
        }
    }

    public async build(): Promise<any> {
        await Builder.buildModule(this);
        this.syncWithWorkspace();
        this.createArwenFiles();
    }

    public createArwenFiles() {
        let wasmHexPath = `${this.BytecodeFile.PathWithoutExtension}.hex`;
        let wasmHexArwenPath = `${wasmHexPath}.arwen`;
        const ArwenTag = "0500";

        let wasmHex = this.BytecodeFile.readBinaryHex();
        let wasmHexArwen = `${wasmHex}@${ArwenTag}`;

        FsFacade.writeFile(wasmHexPath, wasmHex);
        FsFacade.writeFile(wasmHexArwenPath, wasmHexArwen);
    }

    public findHexArwenFile(): MyFile {
        let file = MyFile.findFirst({
            Folder: this.SourceFile.WorkspaceProject,
            Extensions: ["hex.arwen"],
            Recursive: true
        }, true)

        return file;
    }

    public async deployToDebugger(options: any): Promise<any> {
        let self = this;

        // Prepare transaction data.
        let transactionData = this.findHexArwenFile().readText();
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
        this.BytecodeFile = MyFile.findFirst({
            Folder: this.SourceFile.WorkspaceProject,
            Extensions: ["wasm"],
            Recursive: true
        });

        this.ExportFile = MyFile.findFirst({
            Folder: this.SourceFile.WorkspaceProject,
            Extensions: ["export"],
            Recursive: true
        });

        if (this.ExportFile) {
            this.ExportFile.readText();
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
                    throw new MyError({ Message: `Can't handle non-hex, non-number arguments yet: ${item}.` });
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
        let sourceFilesNow = MyFile.find({
            Folder: FsFacade.getPathToWorkspace(),
            Extensions: ["c", "rs"],
            Recursive: true
        });

        let smartContractsNow = sourceFilesNow.map(e => new SmartContract(e));
        let smartContractsBefore = this.Items;

        // Keep data after sync.
        smartContractsNow.forEach(contractNow => {
            let contractBefore = smartContractsBefore.find(e => e.FriendlyId == contractNow.FriendlyId);
            _.extendOwn(contractNow, contractBefore);
            contractNow.syncWithWorkspace();
        });

        this.Items = smartContractsNow;
    }

    public static getById(id: string): SmartContract {
        let item = this.Items.find(e => e.FriendlyId == id);
        return item;
    }

    public static getBySourceFile(filePath: string): SmartContract {
        let item = this.Items.find(e => e.SourceFile.Path == filePath);
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