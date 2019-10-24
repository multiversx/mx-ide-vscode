import path = require('path');
import { MySettings } from './settings';
import { Syms } from "./syms";
import { ProcessFacade, FsFacade } from "./utils";
import { Presenter } from './presenter';

export class Builder {

    static async buildFile(filePath: string): Promise<any> {
        let filePathWithoutExtension = FsFacade.removeExtension(filePath);
        let filePath_ll = `${filePathWithoutExtension}.ll`;
        let filePath_o = `${filePathWithoutExtension}.o`;
        let filePath_wasm = `${filePathWithoutExtension}.wasm`;

        let toolsFolder = MySettings.getBuildToolsFolder();
        let clangPath: any = path.join(toolsFolder, "clang-9");
        let llcPath: any = path.join(toolsFolder, "llc");
        let wasmLdPath: any = path.join(toolsFolder, "wasm-ld");
        let symsFilePath = FsFacade.createTempFile("main.syms", Syms.getMainSymsAsText());

        function doClang(): Promise<any> {
            return ProcessFacade.execute({
                program: clangPath,
                args: ["-cc1", "-Ofast", "-emit-llvm", "-triple=wasm32-unknown-unknown-wasm", filePath],
                eventTag: "builder"
            });
        }

        function doLlc(): Promise<any> {
            return ProcessFacade.execute({
                program: llcPath,
                args: ["-O3", "-filetype=obj", filePath_ll, "-o", filePath_o],
                eventTag: "builder"
            });
        }

        // todo: ask for functions to export from UI.
        function doWasm(): Promise<any> {
            return ProcessFacade.execute({
                program: wasmLdPath,
                args: ["--verbose", "--no-entry", filePath_o, "-o", filePath_wasm, "--strip-all", `-allow-undefined-file=${symsFilePath}`, "-export=_main", "-export=do_balance", "-export=topUp", "-export=transfer"],
                eventTag: "builder"
            });
        }

        await doClang();
        await doLlc();
        await doWasm();
        
        Presenter.showInfo("Build done.");
    }
}