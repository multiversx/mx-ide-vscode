import { FsFacade, ProcessFacade } from "./utils";
import { MySettings } from "./settings";
import { Presenter } from "./presenter";

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
            args: ["--rest-api-port", port, "--config", configPath, "--genesis-file", genesisPath]
        });
    }
}
