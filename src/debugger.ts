import { FsFacade, ProcessFacade, RestFacade as RequestsFacade } from "./utils";
import { MySettings } from "./settings";
import { Presenter } from "./presenter";
import eventBus from "./eventBus";

export class RestDebugger {

    public static startServer() {
        RestDebugger.stopServer()
            .catch(() => { })
            .finally(() => RestDebugger.performStartDebugServer());
    }

    public static stopServer(): Promise<any> {
        let port: any = MySettings.getRestDebuggerPort();

        return ProcessFacade.execute({
            program: "fuser",
            args: ["-k", `${port}/tcp`]
        });
    }

    private static performStartDebugServer() {
        let toolPath = MySettings.getRestDebuggerToolPath();
        let toolPathFolder = FsFacade.getFolder(toolPath);
        let port: any = MySettings.getRestDebuggerConfigPath();
        let configPath: any = MySettings.getRestDebuggerConfigPath();
        let genesisPath: any = MySettings.getRestDebuggerGenesisPath();

        ProcessFacade.execute({
            program: toolPath,
            workingDirectory: toolPathFolder,
            args: ["--rest-api-port", port, "--config", configPath, "--genesis-file", genesisPath],
            eventTag: "debugger"
        })
            .catch(() => { })
            .finally(() => {
                Presenter.showInfo("Debug server stopped.");
            });

        eventBus.emit("debugger:started");
        Presenter.showInfo("Debug server started.");
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
                "Code": options.code,
                "Args": []
            },
            eventTag: "debugger-dialogue"
        }).catch(e => {
            Presenter.showError(`Cannot deploy. Perhaps debug server is stopped? ${e.error}`);
        });
    }

    public static async runSmartContract(runOptions: any): Promise<any> {
        let url = RestDebugger.buildUrl("vm-values/run");

        await RequestsFacade.post({
            url: url,
            data: {
                "SndAddress": runOptions.senderAddress,
                "ScAddress": runOptions.scAddress,
                "Value": runOptions.value.toString(),
                "GasLimit": runOptions.gasLimit,
                "GasPrice": runOptions.gasPrice,
                "FuncName": runOptions.functionName,
                "Args": runOptions.functionArgs
            },
            eventTag: "debugger-dialogue"
        }).catch(e => {
            Presenter.showError(`Cannot run. Perhaps debug server is stopped? ${e.error}`);
        });

        let vmOutput = RestDebugger.readTracedVMOutput(runOptions.scAddress);
        return vmOutput;
    }

    private static buildUrl(relative: string) {
        let port: any = MySettings.getRestDebuggerPort();
        return `http://localhost:${port}/${relative}`;
    }

    public static readTracedVMOutput(scAddress: string): any {
        let toolPath = MySettings.getRestDebuggerToolPath();
        let toolPathFolder = FsFacade.getFolder(toolPath);
        let tracePathParts = [toolPathFolder, "trace", "smart-contracts", scAddress]
        let traceJson = FsFacade.readLatestFileInFolder(...tracePathParts);
        let vmOutput = JSON.parse(traceJson);
        return vmOutput;
    }
}
