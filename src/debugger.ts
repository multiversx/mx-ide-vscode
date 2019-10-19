import { FsFacade, ProcessFacade, RestFacade as RequestsFacade } from "./utils";
import { MySettings } from "./settings";
import { Presenter } from "./presenter";
import eventBus from "./eventBus";

export class RestDebugger {

    public static startServer() {
        RestDebugger.stopServer(function () {
            RestDebugger.performStartDebugServer();
        });
    }

    public static stopServer(callback: CallableFunction) {
        let port: any = MySettings.getRestDebuggerPort();

        ProcessFacade.execute({
            program: "fuser",
            args: ["-k", `${port}/tcp`],
            onClose: callback
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
            eventTag: "debugger",
            onClose: function (code: any) {
                Presenter.showInfo("Debug server stopped.");
            }
        });

        eventBus.emit("debugger:started");
        Presenter.showInfo("Debug server started.");
    }

    public static deploySmartContract(senderAddress: string, code: string) : Promise<any> {
        let url = RestDebugger.buildUrl("vm-values/deploy");

        return RequestsFacade.post({
            url: url,
            data: {
                "SndAddress": senderAddress,
                "Code": code,
                "Args": []
            },
            eventTag: "debugger-dialogue"
        });
    }

    public static runSmartContract(runOptions: any) : Promise<any> {
        let url = RestDebugger.buildUrl("vm-values/run");

        return RequestsFacade.post({
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
        }).then(data => {
            let vmOutput = RestDebugger.readTracedVMOutput(runOptions.scAddress);
            return vmOutput;
        });
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
