import fs = require('fs');
import os = require('os');
import path = require('path');
import { MySettings } from './settings';
import { ProcessFacade, FsFacade, RestFacade } from "./utils";
import request = require('request');
import { RestDebugger } from './debugger';
import { Builder } from './builder';
import { Feedback } from './feedback';
import { MySetupError } from './errors';

export class MyEnvironment {
    static readonly DebugNodeArchiveUrl: string = "https://github.com/ElrondNetwork/elrond-go-node-debug/archive/master.zip";
    static readonly DebugNodeModuleToBuild: string = "elrond-go-node-debug-master/cmd/debugWithRestApi";

    static async installBuildToolsForC(): Promise<any> {
        MyEnvironment.ensureFolderStructure();

        let ideFolder = MySettings.getIdeFolder();
        let toolsFolder = Builder.getLlvmToolsFolder();
        let downloadUrl = `${MyEnvironment.getLlvmDownloadUrl()}`;
        let archivePath = path.join(ideFolder, "vendor-llvm.tar.gz");

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

    static getLlvmDownloadUrl() {
        let urlRoot = `${MySettings.getDownloadMirrorUrl()}/vendor-llvm`;
        let urlLinux: string = `${urlRoot}/linux.tar.gz`;
        let urlMacOS: string = `${urlRoot}/macos.tar.gz`;

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

    static async installDebugNode(): Promise<any> {
        MyEnvironment.ensureFolderStructure();

        let downloadUrl = MyEnvironment.getNodeDebugDownloadUrl();
        let idePath = MySettings.getIdeFolder();
        let nodeDebugPath = RestDebugger.getFolderPath();
        let archivePath = path.join(idePath, "node-debug.tar.gz");

        await RestFacade.download({
            url: downloadUrl,
            destination: archivePath
        });

        Feedback.debug("node-debug downloaded.");

        await FsFacade.untar(archivePath, nodeDebugPath);
        FsFacade.markAsExecutable(path.join(nodeDebugPath, "debugWithRestApi"));

        Feedback.info("node-debug ready.");
    }

    static getNodeDebugDownloadUrl() {
        let urlRoot = `${MySettings.getDownloadMirrorUrl()}/node-debug`;
        let urlLinux: string = `${urlRoot}/linux-amd64.tar.gz`;
        let urlMacOS: string = `${urlRoot}/darwin-amd64.tar.gz`;

        let platform = os.platform();

        if (platform == "darwin") {
            return urlMacOS;
        }

        return urlLinux;
    }

    static getSnapshot(): EnvironmentSnapshot {
        let snapshot = new EnvironmentSnapshot();
        snapshot.IdeFolder = MySettings.getIdeFolder();
        snapshot.DownloadMirror = MySettings.getDownloadMirrorUrl();
        return snapshot;
    }

    static ensureFolderStructure() {
        let ide = MySettings.getIdeFolder();
        let llvmTools = Builder.getLlvmToolsFolder();
        let goCache = path.join(ide, "go-cache");
        let nodeDebug = RestDebugger.getFolderPath();
        let nodeDebugConfig = path.join(nodeDebug, "config");

        FsFacade.mkDirByPathSync(ide);

        FsFacade.createFolderIfNotExists(llvmTools);
        FsFacade.createFolderIfNotExists(goCache);
        FsFacade.createFolderIfNotExists(nodeDebug);
        FsFacade.createFolderIfNotExists(nodeDebugConfig);
    }
}

export class EnvironmentSnapshot {
    public IdeFolder: string;
    public DownloadMirror: string;
}