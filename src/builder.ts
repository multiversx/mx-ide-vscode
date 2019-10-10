import path = require('path');
import { MySettings } from './settings';
import { Syms } from "./syms";
import { ProcessFacade, FsFacade } from "./utils";
import { Presenter } from './presenter';

export class Builder {

    static buildFile(filePath: string) {
        let filePathWithoutExtension = FsFacade.removeExtension(filePath);
        let filePath_ll = `${filePathWithoutExtension}.ll`;
        let filePath_o = `${filePathWithoutExtension}.o`;
        let filePath_wasm = `${filePathWithoutExtension}.wasm`;

        let clangPath: any = MySettings.getClangPath();
        let llcPath: any = MySettings.getLlcPath();
        let wasmLdPath: any = MySettings.getWasmLdPath();
        let symsFilePath = FsFacade.createTempFile("main.syms", Syms.getMainSymsAsText());

        continueWithClang();

        function continueWithClang() {
            ProcessFacade.execute({
                program: clangPath,
                args: ["-cc1", "-Ofast", "-emit-llvm", "-triple=wasm32-unknown-unknown-wasm", filePath],
                eventTag: "builder",
                onClose: continueWithLlc
            });           
        }

        function continueWithLlc() {
            ProcessFacade.execute({
                program: llcPath,
                args: ["-O3", "-filetype=obj", filePath_ll, "-o", filePath_o],
                eventTag: "builder",
                onClose: continueWithWasmLd
            });
        }

        // todo: ask for functions to export from UI.
        function continueWithWasmLd() {
            ProcessFacade.execute({
                program: wasmLdPath,
                args: ["--verbose", "--no-entry", filePath_o, "-o", filePath_wasm, "--strip-all", `-allow-undefined-file=${symsFilePath}`, "-export=_main", "-export=do_balance", "-export=topUp", "-export=transfer"],
                eventTag: "builder",
                onClose: continueWithDone
            });
        }

        function continueWithDone() {
            Presenter.showInfo("Build done.");
        }
    }
}