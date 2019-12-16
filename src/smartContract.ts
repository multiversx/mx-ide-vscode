import { FsFacade } from "./utils";
import { NodeDebug } from "./nodeDebug";
import { Builder } from "./builder";
import _ = require("underscore");
import { MyError } from "./errors";
import path = require('path');
import { MyFile } from "./myfile";
import { Feedback } from "./feedback";
import { Variables } from "./variables";
import eventBus from "./eventBus";
const assert = require('assert').strict;

export class SmartContract {
    public readonly FriendlyId: string;
    public readonly SourceFile: MyFile;
    public BytecodeFile: MyFile;
    public ExportFile: MyFile;
    public readonly IsSourceC: boolean;
    public readonly IsSourceRust: boolean;
    public readonly IsSourceSol: boolean;

    public readonly PropertiesOnNodeDebug: PropertiesOnNetwork;
    public readonly PropertiesOnTestnet: PropertiesOnNetwork;

    constructor(sourceFile: MyFile) {
        this.SourceFile = sourceFile;
        this.IsSourceC = this.SourceFile.Extension == ".c";
        this.IsSourceRust = this.SourceFile.Extension == ".rs";
        this.IsSourceSol = this.SourceFile.Extension == ".sol";
        this.FriendlyId = this.SourceFile.PathRelativeToWorkspace;

        this.PropertiesOnNodeDebug = new PropertiesOnNetwork();
        this.PropertiesOnTestnet = new PropertiesOnNetwork();
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
        assert.ok(this.BytecodeFile, "BytecodeFile nok.");

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
        options.senderAddress = Variables.apply(options.senderAddress);

        // Prepare transaction data, then deploy.
        let transactionData = this.findHexArwenFile().readText();
        options.transactionData = this.appendArgsToTxData(options.initArgs, transactionData);
        const response = await NodeDebug.deploySmartContract(options);

        // Use response of deploy (scAddress).
        let properties = options.onTestnet ? this.PropertiesOnTestnet : this.PropertiesOnNodeDebug;
        properties.Address = response.data;
        properties.AddressTimestamp = new Date();

        await this.queryWatchedVariables({ onTestnet: options.onTestnet });
    }

    public async runFunction(options: any): Promise<any> {
        let properties = options.onTestnet ? this.PropertiesOnTestnet : this.PropertiesOnNodeDebug;
        properties.LatestRun = new SmartContractRun();
        properties.LatestRun.Options = _.clone(options);

        options.senderAddress = Variables.apply(options.senderAddress);
        options.scAddress = properties.Address;

        // Prepare transaction data, then run and use response (vmOutput).
        let transactionData = options.functionName;
        options.transactionData = this.appendArgsToTxData(options.functionArgs, transactionData);

        try {
            const vmOutput = await NodeDebug.runSmartContract(options);
            properties.LatestRun.VMOutput = vmOutput;
        } catch (e) {
            properties.LatestRun.VMOutput = {};
        }

        await this.queryWatchedVariables({ onTestnet: options.onTestnet });
    }

    public setWatchedVariables(options: any) {
        let variables: WatchedVariable[] = options.variables;
        let properties = options.onTestnet ? this.PropertiesOnTestnet : this.PropertiesOnNodeDebug;
        properties.WatchedVariables.length = 0;
        properties.WatchedVariables.push(...variables);

        this.storeWatchedVariables();
    }

    private storeWatchedVariables() {
        let folder = this.SourceFile.FolderPath;
        FsFacade.writeFile(path.join(folder, "watched.json"), JSON.stringify(this.PropertiesOnNodeDebug.WatchedVariables, null, 4));
        FsFacade.writeFile(path.join(folder, "watched.testnet.json"), JSON.stringify(this.PropertiesOnTestnet.WatchedVariables, null, 4));
    }

    private loadWatchedVariables() {
        let filePath = (path.join(this.SourceFile.FolderPath, "watched.json"));

        if (FsFacade.fileExists(filePath)) {
            this.PropertiesOnNodeDebug.WatchedVariables = JSON.parse(FsFacade.readFile(filePath));
        }

        filePath = (path.join(this.SourceFile.FolderPath, "watched.testnet.json"));

        if (FsFacade.fileExists(filePath)) {
            this.PropertiesOnTestnet.WatchedVariables = JSON.parse(FsFacade.readFile(filePath));
        }
    }

    public async queryWatchedVariables(options: any): Promise<any> {
        let properties = options.onTestnet ? this.PropertiesOnTestnet : this.PropertiesOnNodeDebug;
        let variables = properties.WatchedVariables;

        for (var i = 0; i < variables.length; i++) {
            let variable = variables[i];

            options.scAddress = properties.Address;
            options.functionName = variable.FunctionName;
            options.arguments = variable.Arguments;

            let response = await NodeDebug.querySmartContract(options);
            let returnData = response.data.ReturnData[0];

            properties.LatestRun.Variables[variable.Name] = returnData;
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

        this.loadWatchedVariables();
    }

    private appendArgsToTxData(args: string[], transactionData: string): string {
        const hexPrefix = "0X";

        _.each(args, function (item: string) {
            item = Variables.apply(item);

            if (item === "") {
                return;
            }

            transactionData += "@";

            if (item.toUpperCase().startsWith(hexPrefix)) {
                item = item.substring(hexPrefix.length);
                transactionData += item;
            } else {
                let itemAsAny: any = item;
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

class PropertiesOnNetwork {
    public Address: string;
    public AddressTimestamp: Date;
    public LatestRun: SmartContractRun;
    public WatchedVariables: WatchedVariable[];

    constructor() {
        this.LatestRun = new SmartContractRun();
        this.WatchedVariables = [];
    }
}

export class SmartContractsCollection {
    public static Items: SmartContract[] = [];

    public static syncWithWorkspace() {
        Feedback.debug("SmartContractsCollection.syncWithWorkspace()");

        let sourceFilesNow = MyFile.find({
            Folder: FsFacade.getPathToWorkspace(),
            Extensions: ["c", "rs", "sol"],
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
        eventBus.emit("workspace:sync", this.Items);
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
    public Variables: any;

    constructor() {
        this.Options = {
            senderAddress: "",
            functionName: "your_function",
            functionArgs: [],
            value: 0,
            gasLimit: 50000,
            gasPrice: 10
        };

        this.VMOutput = {};
        this.Variables = {};
    }
}

class WatchedVariable {
    public Name: string;
    public FunctionName: string;
    public Arguments: any[];
}