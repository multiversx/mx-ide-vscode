import path = require('path');
import fs = require('fs');
import { MySettings } from './settings';
import { Syms } from "./syms";
import { ProcessFacade, FsFacade } from "./utils";
import { Feedback } from './feedback';
import { MyError } from './errors';

export class Builder {
    static async buildModule(filePath: string): Promise<any> {
        let extension = FsFacade.getExtension(filePath).toLowerCase();

        if (extension == ".c") {
            return Builder.buildCModule(filePath);
        } else if (extension == ".rs") {
            return Builder.buildRustModule(filePath);
        } else {
            throw new MyError({ Message: "Can't build file, unknown type." });
        }
    }

    private static async buildCModule(filePath: string): Promise<any> {
        let filePathWithoutExtension = FsFacade.removeExtension(filePath);
        let filePath_ll = `${filePathWithoutExtension}.ll`;
        let filePath_o = `${filePathWithoutExtension}.o`;
        let filePath_wasm = `${filePathWithoutExtension}.wasm`;
        let filePath_export = `${filePathWithoutExtension}.export`;

        let toolsFolder = Builder.getLlvmToolsFolder();
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

        function createArwenFiles() {
            let wasmHexPath = `${filePath_wasm}.hex`;
            let wasmHexArwenPath = `${wasmHexPath}.arwen`;
            const ArwenTag = "0500";

            let buffer = FsFacade.readBinaryFile(filePath_wasm);
            let wasmHex = buffer.toString("hex");
            let wasmHexArwen = `${wasmHex}@${ArwenTag}`;

            FsFacade.writeFile(wasmHexPath, wasmHex);
            FsFacade.writeFile(wasmHexArwenPath, wasmHexArwen);
        }

        await doClang();
        await doLlc();
        await doWasm();
        createArwenFiles();

        Feedback.info("Build done.");
    }

    private static async buildRustModule(filePath: string): Promise<any> {
        let toolsFolder = Builder.getRustToolsFolder();
        let RUSTUP_HOME = toolsFolder;
        let CARGO_HOME = toolsFolder;
        let PATH = `${path.join(toolsFolder, "bin")}:${process.env["PATH"]}`;

        await ProcessFacade.execute({
            program: "cargo",
            args: ["build", "--target=wasm32-unknown-unknown"],
            environment: {
                PATH: PATH,
                RUSTUP_HOME: RUSTUP_HOME,
                CARGO_HOME: CARGO_HOME
            }
            eventTag: "builder"
        });


    }

    public static getLlvmToolsFolder() {
        let ideFolder = MySettings.getIdeFolder();
        let llvmFolder = path.join(ideFolder, "vendor-llvm");
        return llvmFolder;
    }

    public static getRustToolsFolder() {
        let ideFolder = MySettings.getIdeFolder();
        let llvmFolder = path.join(ideFolder, "vendor-rust");
        return llvmFolder;
    }
}