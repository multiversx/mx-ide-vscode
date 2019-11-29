import os = require('os');
import { FsFacade, ProcessFacade, RestFacade as RequestsFacade } from "./utils";
import { MySettings } from "./settings";
import eventBus from "./eventBus";
import path = require('path');
import { Feedback } from "./feedback";

export class NodeDebug {

    public static start() {
        NodeDebug.stop()
            .catch(() => { })
            .finally(() => NodeDebug.performStart());
    }

    public static stop(): Promise<any> {
        let port: any = MySettings.getRestDebuggerPort();

        let platform = os.platform();

        if (platform == "darwin") {
            return NodeDebug.stopMacOs(port);
        }

        return ProcessFacade.execute({
            program: "fuser",
            args: ["-k", `${port}/tcp`]
        });
    }

    public static async stopMacOs(port: any): Promise<any> {
        let lsof: any;
        try {
            lsof = await ProcessFacade.execute({
                program: "lsof",
                args: ["-nti", `:${port}`]
            });
        } catch (e) {
            throw e;
        }

        return ProcessFacade.execute({
            program: "kill",
            args: [lsof.stdOut, "-9"]
        });
    }

    private static performStart() {
        let toolPathFolder = NodeDebug.getFolderPath();
        let toolPath = NodeDebug.getToolPath();
        let port: any = MySettings.getRestDebuggerPort();
        let configPath: any = path.join(toolPathFolder, "config", "config.toml");
        let genesisPath: any = path.join(toolPathFolder, "config", "genesis.json");

        let LD_LIBRARY_PATH = process.env["LD_LIBRARY_PATH"] || "/usr/lib";
        LD_LIBRARY_PATH = `${LD_LIBRARY_PATH}:${toolPathFolder}`;

        ProcessFacade.execute({
            program: toolPath,
            workingDirectory: toolPathFolder,
            args: ["--rest-api-port", port, "--config", configPath, "--genesis-file", genesisPath],
            eventTag: "debugger",
            channels: ["debugger"],
            environment: {
                LD_LIBRARY_PATH: LD_LIBRARY_PATH
            }
        })
            .catch(() => { })
            .finally(() => {
                Feedback.info("node-debug stopped.");
            });

        eventBus.emit("debugger:started");
        Feedback.info("node-debug started.");
    }

    public static deploySmartContract(options: any): Promise<any> {
        let url = NodeDebug.buildUrl("vm-values/deploy");

        return RequestsFacade.post({
            url: url,
            data: {
                "OnTestnet": options.onTestnet,
                "PrivateKey": options.privateKey,
                "TestnetNodeEndpoint": options.testnetNodeEndpoint,
                "SndAddress": options.senderAddress,
                "Value": options.value.toString(),
                "GasLimit": options.gasLimit,
                "GasPrice": options.gasPrice,
                "TxData": options.transactionData
            },
            eventTag: "debugger-dialogue",
            channels: ["debugger-dialogue"]
        }).catch(e => {
            Feedback.error(`Cannot deploy. Perhaps node-debug is stopped?`);
            throw e;
        });
    }

    public static async runSmartContract(runOptions: any): Promise<any> {
        let url = NodeDebug.buildUrl("vm-values/run");

        await RequestsFacade.post({
            url: url,
            data: {
                "OnTestnet": runOptions.onTestnet,
                "PrivateKey": runOptions.privateKey,
                "TestnetNodeEndpoint": runOptions.testnetNodeEndpoint,
                "SndAddress": runOptions.senderAddress,
                "ScAddress": runOptions.scAddress,
                "Value": runOptions.value.toString(),
                "GasLimit": runOptions.gasLimit,
                "GasPrice": runOptions.gasPrice,
                "TxData": runOptions.transactionData
            },
            eventTag: "debugger-dialogue",
            channels: ["debugger-dialogue"]
        }).catch(e => {
            Feedback.error(`Cannot run. Perhaps node-debug is stopped?`);
            throw e;
        });

        let vmOutput: any = {};

        if (runOptions.onTestnet) {
        } else {
            vmOutput = NodeDebug.readTracedVMOutput(runOptions.scAddress);
        }

        return vmOutput;
    }

    public static async querySmartContract(options: any): Promise<any> {
        let url = NodeDebug.buildUrl("vm-values/query");

        return await RequestsFacade.post({
            url: url,
            data: {
                "OnTestnet": options.onTestnet,
                "TestnetNodeEndpoint": options.testnetNodeEndpoint,
                "ScAddress": options.scAddress,
                "FuncName": options.functionName,
                "Args": options.arguments
            },
            eventTag: "debugger-dialogue"
        }).catch(e => {
            Feedback.error(`Cannot run. Perhaps node-debug is stopped?`);
            throw e;
        });
    }

    private static buildUrl(relative: string) {
        let port: any = MySettings.getRestDebuggerPort();
        return `http://localhost:${port}/${relative}`;
    }

    public static readTracedVMOutput(scAddress: string): any {
        let idePath = MySettings.getIdeFolder();
        let toolPathFolder = path.join(idePath, "nodedebug");
        let tracePathParts = [toolPathFolder, "trace", "smart-contracts", scAddress]
        let traceJson = FsFacade.readLatestFileInFolder(...tracePathParts);
        let vmOutput = JSON.parse(traceJson);

        let outputAccounts: any[] = vmOutput.OutputAccounts || [];

        outputAccounts.forEach(function (account: any) {
            account.Address = Buffer.from(account.Address, "base64").toString("hex");

            let storageUpdates: any[] = account.StorageUpdates || [];

            storageUpdates.forEach(function (update) {
                update.DataHex = Buffer.from(update.Data, "base64").toString("hex");
                update.DataDecimal = parseInt(update.DataHex, 16);
                update.Offset = Buffer.from(update.Offset, "base64").toString("hex");
            });
        });

        return vmOutput;
    }

    public static getFolderPath(): string {
        let idePath = MySettings.getIdeFolder();
        let subfolder = path.join(idePath, "nodedebug");
        return subfolder;
    }

    public static getToolPath(): string {
        let toolPath = path.join(NodeDebug.getFolderPath(), "nodedebug");
        return toolPath;
    }
}
