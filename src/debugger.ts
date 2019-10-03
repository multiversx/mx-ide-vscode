import { FsFacade, ProcessFacade } from "./utils";
import { MySettings } from "./settings";
import { Presenter } from "./presenter";
import * as request from "request";
import { MyExtension } from "./root";

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
        RestDebugger.killServerIfRunning(function () {
            RestDebugger.performStartDebugServer();
        });
    }

    private static killServerIfRunning(callback: CallableFunction) {
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
            onOutput: function (data: any) {
                MyExtension.EventBus.emit("debugger:output", data);
            },
            onError: function (data: any) {
                MyExtension.EventBus.emit("debugger:error", data);
            },
            onClose: function (code: any) {
                MyExtension.EventBus.emit("debugger:close", code);
            }
        });
    }

    public static deploySmartContract() {
        let url = RestDebugger.buildUrl("deploy");
        let options: any = {
            json: {
                "SndAddress": "foobar",
                "Code": "base64(?)",
                "Args": []
            }
        };

        request.post(url, options, function (error: any, response: any, body: any) {
            console.error("error:", error);
            console.log("statusCode:", response && response.statusCode);
            console.log("body:", body);
        });
    }

    private static buildUrl(relative: string) {
        let port: any = MySettings.getRestDebuggerConfigPath();
        return `http://localhost:${port}/${relative}`;
    }
}
