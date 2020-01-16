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
import { Transaction } from "./transaction";
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
        options.senderAddress = Transaction.prepareSender(options.senderAddress);

        // Prepare transaction data, then deploy.
        let code = this.findHexArwenFile().readText();
        options.transactionData = Transaction.prepareDeployTxData(code, options.initArgs);
        const response = await NodeDebug.deploySmartContract(options);

        // Use response of deploy (scAddress).
        let properties = options.onTestnet ? this.PropertiesOnTestnet : this.PropertiesOnNodeDebug;
        properties.Address = response.Address;
        properties.AddressTimestamp = new Date();
    }

    public async runFunction(options: any): Promise<any> {
        let properties = options.onTestnet ? this.PropertiesOnTestnet : this.PropertiesOnNodeDebug;
        properties.LatestRun = new SmartContractRun();
        properties.LatestRun.Options = _.clone(options);

        options.senderAddress = Transaction.prepareSender(options.senderAddress);
        options.scAddress = properties.Address;

        // Prepare transaction data, then run and use response (vmOutput).
        options.transactionData = Transaction.prepareRunTxData(options.functionName, options.functionArgs);

        try {
            const vmOutput = await NodeDebug.runSmartContract(options);
            properties.LatestRun.VMOutput = vmOutput;
        } catch (e) {
            properties.LatestRun.VMOutput = {};
        }
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
        try {
            let properties = options.onTestnet ? this.PropertiesOnTestnet : this.PropertiesOnNodeDebug;
            let variables = properties.WatchedVariables;

            for (var i = 0; i < variables.length; i++) {
                let variable = variables[i];
                let variableValue = "N / A";

                options.scAddress = properties.Address;
                options.functionName = variable.FunctionName;
                options.arguments = _.map(variable.Arguments, Transaction.prepareArgument);

                let response = await NodeDebug.querySmartContract(options);

                if (response.data) {
                    let asBase64 = response.data.ReturnData[0];
                    let asHex = Buffer.from(asBase64, "base64").toString("hex");
                    var asInt = parseInt(asHex, 16);
                    variableValue = `${asBase64} / 0x${asHex} / ${asInt}`;
                }

                properties.WatchedVariablesValues[variable.Name] = variableValue;
            }
        } catch (error) {
            Feedback.error("Could not query watched variables.");
            Feedback.error(error.message);
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
}

class PropertiesOnNetwork {
    public Address: string;
    public AddressTimestamp: Date;
    public LatestRun: SmartContractRun;
    public WatchedVariables: WatchedVariable[];
    public WatchedVariablesValues: any;

    constructor() {
        this.LatestRun = new SmartContractRun();
        this.WatchedVariables = [];
        this.WatchedVariablesValues = {};
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

    constructor() {
        this.Options = {
            senderAddress: "",
            functionName: "your_function",
            functionArgs: [],
            value: 0,
            gasLimit: 500000000,
            gasPrice: 200000000000000
        };

        this.VMOutput = {};
    }
}

class WatchedVariable {
    public Name: string;
    public FunctionName: string;
    public Arguments: any[];
}