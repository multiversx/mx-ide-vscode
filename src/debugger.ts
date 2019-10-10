import { FsFacade, ProcessFacade, RestFacade as RequestsFacade } from "./utils";
import { MySettings } from "./settings";
import { Presenter } from "./presenter";
import * as request from "request";
import eventBus from "./eventBus";

export class SimpleDebugger {

    public static debugFile(filePath: string) {
        Presenter.askSimpleInput({
            title: "Enter transaction data (function and parameters)",
            placeholder: "yourFunction param1 param2 param3",
            onInput: function (input: string) {
                SimpleDebugger.debugFunction(filePath, input);
            }
        });
    }

    public static debugFunction(filePath: string, input: string) {
        let filePathWithoutExtension = FsFacade.removeExtension(filePath);
        let filePath_wasm = `${filePathWithoutExtension}.wasm`;
        let simpleDebugToolPath: any = MySettings.getSimpleDebugToolPath();
        let output = ProcessFacade.executeSync(`${simpleDebugToolPath} "${filePath_wasm}" ${input}`, true);

        Presenter.displayContentInNewTab(output);
    }
}

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
        let toolPath: any = MySettings.getRestDebuggerToolPath();
        let port: any = MySettings.getRestDebuggerConfigPath();
        let configPath: any = MySettings.getRestDebuggerConfigPath();
        let genesisPath: any = MySettings.getRestDebuggerGenesisPath();

        ProcessFacade.execute({
            program: toolPath,
            args: ["--rest-api-port", port, "--config", configPath, "--genesis-file", genesisPath],
            eventTag: "debugger",
            onClose: function (code: any) {
                Presenter.showInfo("Debug server stopped.");
            }
        });

        eventBus.emit("debugger:started");
        Presenter.showInfo("Debug server started.");
    }

    public static deploySmartContract(senderAddress: string, code: string) {
        let url = RestDebugger.buildUrl("vm-values/deploy");

        RequestsFacade.post({
            url: url,
            data: {
                "SndAddress": senderAddress,
                "Code": code,
                "Args": []
            },
            eventTag: "debugger-dialogue"
        });
    }

    private static buildUrl(relative: string) {
        let port: any = MySettings.getRestDebuggerPort();
        return `http://localhost:${port}/${relative}`;
    }
}
