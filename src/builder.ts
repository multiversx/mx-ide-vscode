import path = require('path');
import fs = require('fs');
import { MySettings } from './settings';
import { Syms } from "./syms";
import { ProcessFacade, FsFacade } from "./utils";
import { Feedback } from './feedback';
import { MyError } from './errors';
import { SmartContract } from './smartContract';

export class Builder {
    static async buildModule(smartContract: SmartContract): Promise<any> {
        if (smartContract.IsSourceC) {
            return Builder.buildCModule(smartContract);
        } else if (smartContract.IsSourceRust) {
            return Builder.buildRustModule(smartContract);
        } else if (smartContract.IsSourceSol) {
            return Builder.buildSolModule(smartContract);
        } else {
            throw new MyError({ Message: "Can't build file, unknown type." });
        }
    }

    private static async buildCModule(smartContract: SmartContract): Promise<any> {
        let filePath = smartContract.SourceFile.Path;
        let filePathWithoutExtension = smartContract.SourceFile.PathWithoutExtension;
        let filePath_ll = `${filePathWithoutExtension}.ll`;
        let filePath_o = `${filePathWithoutExtension}.o`;
        let filePath_wasm = `${filePathWithoutExtension}.wasm`;
        let filePath_export = `${filePathWithoutExtension}.export`;

        let toolsFolder = Builder.getLlvmToolsFolder("v9");
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

    private static async buildRustModule(smartContract: SmartContract): Promise<any> {
        let toolsFolder = Builder.getRustToolsFolder();
        let RUSTUP_HOME = toolsFolder;
        let CARGO_HOME = toolsFolder;
        let PATH = `${path.join(toolsFolder, "bin")}:${process.env["PATH"]}`;

        await ProcessFacade.execute({
            program: "cargo",
            args: ["build", "--target=wasm32-unknown-unknown"],
            workingDirectory: smartContract.SourceFile.WorkspaceProject,
            environment: {
                PATH: PATH,
                RUSTUP_HOME: RUSTUP_HOME,
                CARGO_HOME: CARGO_HOME
            },
            eventTag: "builder"
        });
    }

    private static async buildSolModule(smartContract: SmartContract): Promise<any> {
        let filePath = smartContract.SourceFile.Path;
        let filePathWithoutExtension = smartContract.SourceFile.PathWithoutExtension;
        let filePath_ll = `${filePathWithoutExtension}.ll`;
        let filePath_functions = `${filePathWithoutExtension}.functions`;
        let filePath_main_ll = `${filePathWithoutExtension}.main.ll`;
        let filePath_bc = `${filePathWithoutExtension}.bc`;
        let filePath_o = `${filePathWithoutExtension}.o`;
        let filePath_wasm = `${filePathWithoutExtension}.wasm`;

        let toolsFolder = Builder.getSolidityToolsFolder();
        let llvmToolsFolder = Builder.getLlvmToolsFolder("v8");

        let sollPath: string = path.join(toolsFolder, "soll");
        let llvmLinkPath: string = path.join(llvmToolsFolder, "llvm-link");
        let llvmOptPath: string = path.join(llvmToolsFolder, "opt");
        let llvmLlcPath: string = path.join(llvmToolsFolder, "llc");
        let wasmLdPath: any = path.join(llvmToolsFolder, "wasm-ld");

        let mainLlContent = `
source_filename = "${smartContract.SourceFile.Name}"
target datalayout = "e-m:e-p:32:32-i64:64-n32:64-S128"
target triple = "wasm32-unknown-unknown-wasm"
declare void @solidity.main()
define void @main() {
    tail call void @solidity.main()
    ret void
}`;

        function emitLLVM(): Promise<any> {
            return ProcessFacade.execute({
                program: sollPath,
                args: ["-action", "EmitLLVM", filePath],
                stdoutToFile: filePath_ll,
                eventTag: "builder"
            });
        }

        function emitFuncSig(): Promise<any> {
            return ProcessFacade.execute({
                program: sollPath,
                args: ["-action", "EmitFuncSig", filePath],
                stdoutToFile: filePath_functions,
                eventTag: "builder"
            });
        }

        function llvmLink(): Promise<any> {
            return ProcessFacade.execute({
                program: llvmLinkPath,
                args: [filePath_ll, filePath_main_ll, "-o", filePath_bc],
                eventTag: "builder"
            });
        }

        function llvmOpt(): Promise<any> {
            return ProcessFacade.execute({
                program: llvmOptPath,
                args: ["-std-link-opts", "-Oz", "-polly", filePath_bc, "-o", filePath_bc],
                eventTag: "builder"
            });
        }

        function doLlc(): Promise<any> {
            return ProcessFacade.execute({
                program: llvmLlcPath,
                args: ["-O3", "-filetype=obj", filePath_bc, "-o", filePath_o],
                eventTag: "builder"
            });
        }

        function doWasmLd(): Promise<any> {
            return ProcessFacade.execute({
                program: wasmLdPath,
                args: ["--entry", "main", /* "--gc-sections", */ "--demangle", "--no-gc-sections", "--export-all", "--allow-undefined", "--verbose", filePath_o, "-o", filePath_wasm],
                eventTag: "builder"
            });
        }

        FsFacade.writeFile(filePath_main_ll, mainLlContent)
        await emitLLVM();
        await emitFuncSig();
        await llvmLink();
        await llvmOpt();
        await doLlc();
        await doWasmLd();
    }

    public static getLlvmToolsFolder(version: string) {
        let ideFolder = MySettings.getIdeFolder();
        let llvmFolder = path.join(ideFolder, "vendor-llvm", version);
        return llvmFolder;
    }

    public static getRustToolsFolder() {
        let ideFolder = MySettings.getIdeFolder();
        let llvmFolder = path.join(ideFolder, "vendor-rust");
        return llvmFolder;
    }

    public static getSolidityToolsFolder() {
        let ideFolder = MySettings.getIdeFolder();
        let sollFolder = path.join(ideFolder, "vendor-soll");
        return sollFolder;
    }
}