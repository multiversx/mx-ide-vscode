import os = require('os');
import { FsFacade, ProcessFacade, RestFacade as RequestsFacade } from "./utils";
import { MySettings } from "./settings";
import eventBus from "./eventBus";
import path = require('path');
import { Feedback } from "./feedback";

export class RestDebugger {

    public static start() {
        RestDebugger.stop()
            .catch(() => { })
            .finally(() => RestDebugger.performStart());
    }

    public static stop(): Promise<any> {
        let port: any = MySettings.getRestDebuggerPort();

        let platform = os.platform();

        if (platform == "darwin") {
            return RestDebugger.stopMacOs(port);
        }

        return ProcessFacade.execute({
            program: "fuser",
            args: ["-k", `${port}/tcp`]
        });
    }

    public static async stopMacOs(port :any): Promise<any> {
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
        let toolPathFolder = RestDebugger.getFolderPath();
        let toolPath = RestDebugger.getToolPath();
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
        let url = RestDebugger.buildUrl("vm-values/deploy");

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
            eventTag: "debugger-dialogue"
        }).catch(e => {
            Feedback.error(`Cannot deploy. Perhaps node-debug is stopped? ${e.error}`);
            throw e;
        });
    }

    public static async runSmartContract(runOptions: any): Promise<any> {
        let url = RestDebugger.buildUrl("vm-values/run");

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
            eventTag: "debugger-dialogue"
        }).catch(e => {
            Feedback.error(`Cannot run. Perhaps node-debug is stopped? ${e.error}`);
        });

        let vmOutput: any = {};

        if (runOptions.onTestnet) {
        } else {
            vmOutput = RestDebugger.readTracedVMOutput(runOptions.scAddress);
        }

        return vmOutput;
    }

    public static async querySmartContract(options: any): Promise<any> {
        let url = RestDebugger.buildUrl("vm-values/query");

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
            Feedback.error(`Cannot run. Perhaps node-debug is stopped? ${e.error}`);
        });
    }

    private static buildUrl(relative: string) {
        let port: any = MySettings.getRestDebuggerPort();
        return `http://localhost:${port}/${relative}`;
    }

    public static readTracedVMOutput(scAddress: string): any {
        let idePath = MySettings.getIdeFolder();
        let toolPathFolder = path.join(idePath, "node-debug");
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
        let subfolder = path.join(idePath, "node-debug");
        return subfolder;
    }

    public static getToolPath(): string {
        let toolPath = path.join(RestDebugger.getFolderPath(), "nodedebug");
        return toolPath;
    }
}
