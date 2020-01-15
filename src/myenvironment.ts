import fs = require('fs');
import os = require('os');
import path = require('path');
import { MySettings } from './settings';
import { ProcessFacade, FsFacade, RestFacade } from "./utils";
import request = require('request');
import { NodeDebug } from './nodeDebug';
import { Builder } from './builder';
import { Feedback } from './feedback';
import { MySetupError } from './errors';

export class MyEnvironment {
    static readonly NodeDebugVersion = "v003";

    static async installBuildToolsForC(): Promise<any> {
        MyEnvironment.ensureFolderStructure();

        let ideFolder = MySettings.getIdeFolder();
        let toolsFolder = Builder.getLlvmToolsFolder("v9");
        let downloadUrl = `${MyEnvironment.getLlvmDownloadUrl("v9")}`;
        let archivePath = path.join(ideFolder, "vendor-llvm.v9.tar.gz");

        await RestFacade.download({
            url: downloadUrl,
            destination: archivePath
        });

        Feedback.debug("Downloaded LLVM subset archive.");

        await FsFacade.untar(archivePath, toolsFolder);

        Feedback.debug("clang, llc and wasm-ld will be marked as executable (+x).");
        FsFacade.markAsExecutable(path.join(toolsFolder, "clang-9"));
        FsFacade.markAsExecutable(path.join(toolsFolder, "llc"));
        FsFacade.markAsExecutable(path.join(toolsFolder, "lld"));
        FsFacade.markAsExecutable(path.join(toolsFolder, "wasm-ld"));

        Feedback.info("LLVM tools are ready to use.");
    }

    static getLlvmDownloadUrl(version: string) {
        let urlRoot = `${MySettings.getDownloadMirrorUrl()}/vendor-llvm/${version}`;
        let urlLinux: string = `${urlRoot}/linux-amd64.tar.gz`;
        let urlMacOS: string = `${urlRoot}/darwin-amd64.tar.gz`;

        let platform = os.platform();

        if (platform == "darwin") {
            return urlMacOS;
        }

        return urlLinux;
    }

    static async installBuildToolsForRust(): Promise<any> {
        MyEnvironment.ensureFolderStructure();

        let ideFolder = MySettings.getIdeFolder();
        let toolsFolder = Builder.getRustToolsFolder();
        let downloadUrl = "https://sh.rustup.rs";
        let scriptPath = path.join(ideFolder, "rustup.sh");

        await RestFacade.download({
            url: downloadUrl,
            destination: scriptPath
        });

        FsFacade.markAsExecutable(scriptPath);

        let RUSTUP_HOME = toolsFolder;
        let CARGO_HOME = toolsFolder;

        try {
            await ProcessFacade.execute({
                program: scriptPath,
                args: ["--verbose", "--default-toolchain", "nightly", "--profile", "minimal", "--target", "wasm32-unknown-unknown", "--no-modify-path", "-y"],
                environment: {
                    RUSTUP_HOME: RUSTUP_HOME,
                    CARGO_HOME: CARGO_HOME
                }
            });
        } catch (error) {
            throw new MySetupError({ Message: "Could not install rust.", Inner: error });
        }

        Feedback.info("Rust tools are ready to use.");
    }

    static async uninstallBuildToolsForRust(): Promise<any> {
        let toolsFolder = Builder.getRustToolsFolder();

        let RUSTUP_HOME = toolsFolder;
        let CARGO_HOME = toolsFolder;
        let PATH = `${path.join(toolsFolder, "bin")}:${process.env["PATH"]}`;

        try {
            await ProcessFacade.execute({
                program: "rustup",
                args: ["self", "uninstall", "-y"],
                environment: {
                    PATH: PATH,
                    RUSTUP_HOME: RUSTUP_HOME,
                    CARGO_HOME: CARGO_HOME
                }
            });
        } catch (error) {
            throw new MySetupError({ Message: "Could not uninstall rust.", Inner: error });
        }

        Feedback.info("Rust tools are not uninstalled.");
    }

    static async installBuildToolsForSolidity(): Promise<any> {
        MyEnvironment.ensureFolderStructure();

        let ideFolder = MySettings.getIdeFolder();
        let solFolder = Builder.getSolidityToolsFolder();
        let llvmFolder = Builder.getLlvmToolsFolder("v8");

        let solArchivePath = path.join(ideFolder, "vendor-soll.tar.gz");
        let llvmArchivePath = path.join(ideFolder, "vendor-llvm.v8.tar.gz");

        await RestFacade.download({
            url: MyEnvironment.getSOLLDownloadUrl(),
            destination: solArchivePath
        });

        Feedback.debug("Downloaded SOLL (Second State) compiler.");

        await RestFacade.download({
            url: MyEnvironment.getLlvmDownloadUrl("v8"),
            destination: llvmArchivePath
        });

        Feedback.debug("Downloaded LLVM subset archive.");

        await FsFacade.untar(solArchivePath, solFolder);
        await FsFacade.untar(llvmArchivePath, llvmFolder);

        FsFacade.markAsExecutable(path.join(solFolder, "soll"));
        FsFacade.markAsExecutable(path.join(llvmFolder, "llc"));
        FsFacade.markAsExecutable(path.join(llvmFolder, "lld"));
        FsFacade.markAsExecutable(path.join(llvmFolder, "llvm-link"));
        FsFacade.markAsExecutable(path.join(llvmFolder, "opt"));
        FsFacade.markAsExecutable(path.join(llvmFolder, "wasm-ld"));
        
        Feedback.info("Solidity tools are ready to use.");
    }

    static getSOLLDownloadUrl() {
        let urlRoot = `${MySettings.getDownloadMirrorUrl()}/vendor-soll`;
        let urlLinux: string = `${urlRoot}/linux-amd64.tar.gz`;
        let urlMacOS: string = `${urlRoot}/darwin-amd64.tar.gz`;

        let platform = os.platform();

        if (platform == "darwin") {
            return urlMacOS;
        }

        return urlLinux;
    }

    static async installDebugNode(): Promise<any> {
        MyEnvironment.ensureFolderStructure();

        let downloadUrl = MyEnvironment.getNodeDebugDownloadUrl();
        let idePath = MySettings.getIdeFolder();
        let nodeDebugPath = NodeDebug.getFolderPath();
        let archivePath = path.join(idePath, `nodedebug-${MyEnvironment.NodeDebugVersion}.tar.gz`);

        await RestFacade.download({
            url: downloadUrl,
            destination: archivePath
        });

        Feedback.debug("node-debug downloaded.");

        await FsFacade.untar(archivePath, nodeDebugPath);
        FsFacade.markAsExecutable(path.join(nodeDebugPath, "nodedebug"));

        Feedback.info("node-debug ready.");
    }

    static getNodeDebugDownloadUrl() {
        let platform = os.platform();
        let archive = platform == "darwin" ? "darwin-amd64.tar.gz" : "linux-amd64.tar.gz"; 
        let url = `${MySettings.getDownloadMirrorUrl()}/nodedebug/${MyEnvironment.NodeDebugVersion}/${archive}?t=${new Date().getTime()}`;
        return url;
    }

    static getSnapshot(): EnvironmentSnapshot {
        let snapshot = new EnvironmentSnapshot();
        snapshot.IdeFolder = MySettings.getIdeFolder();
        snapshot.DownloadMirror = MySettings.getDownloadMirrorUrl();
        return snapshot;
    }

    static ensureFolderStructure() {
        let ide = MySettings.getIdeFolder();
        let llvmTools = Builder.getLlvmToolsFolder("");
        let llvmTools9 = Builder.getLlvmToolsFolder("v9");
        let llvmTools8 = Builder.getLlvmToolsFolder("v8");
        let solTools = Builder.getSolidityToolsFolder();
        let nodeDebug = NodeDebug.getFolderPath();
        let nodeDebugConfig = path.join(nodeDebug, "config");

        FsFacade.mkDirByPathSync(ide);

        FsFacade.createFolderIfNotExists(llvmTools);
        FsFacade.createFolderIfNotExists(llvmTools9);
        FsFacade.createFolderIfNotExists(llvmTools8);
        FsFacade.createFolderIfNotExists(solTools);
        FsFacade.createFolderIfNotExists(nodeDebug);
        FsFacade.createFolderIfNotExists(nodeDebugConfig);
    }
}

export class EnvironmentSnapshot {
    public IdeFolder: string;
    public DownloadMirror: string;
}