import path = require('path');
import fs = require('fs');
import { MySettings } from './settings';
import { Syms } from "./syms";
import { ProcessFacade, FsFacade } from "./utils";
import { Feedback } from './feedback';

export class Builder {

    static async buildFile(filePath: string): Promise<any> {
        let filePathWithoutExtension = FsFacade.removeExtension(filePath);
        let filePath_ll = `${filePathWithoutExtension}.ll`;
        let filePath_o = `${filePathWithoutExtension}.o`;
        let filePath_wasm = `${filePathWithoutExtension}.wasm`;
        let filePath_export = `${filePathWithoutExtension}.export`;

        let toolsFolder = Builder.getToolsFolder();
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

        // extract exports
        let exportsRaw = new Array<String>();
        if (FsFacade.fileExists(filePath_export)) {
            exportsRaw = FsFacade.readFile(filePath_export).split(/\r?\n/);
        }

        function doWasm(): Promise<any> {
            let buildArgs = ["--verbose", "--no-entry", filePath_o, "-o", filePath_wasm, "--strip-all", `-allow-undefined-file=${symsFilePath}`];
            
            for (let exportRaw of exportsRaw) {
                let trimmed = exportRaw.trim();
                if (trimmed) {
                    buildArgs.push(`-export=${trimmed}`);
                }
            }

            return ProcessFacade.execute({
                program: wasmLdPath,
                args: buildArgs,
                eventTag: "builder"
            });
        }

        await doClang();
        await doLlc();
        await doWasm();
        
        Feedback.info("Build done.");
    }

    public static getToolsFolder() {
        let ideFolder = MySettings.getIdeFolder();
        let llvmFolder = path.join(ideFolder, "vendor-llvm");
        return llvmFolder;
    }
}