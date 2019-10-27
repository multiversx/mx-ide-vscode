import fs = require('fs');
import os = require('os');
import path = require('path');
import { MySettings } from './settings';
import { ProcessFacade, FsFacade, RestFacade } from "./utils";
import request = require('request');
import { RestDebugger } from './debugger';
import { Builder } from './builder';
import { Feedback } from './feedback';

export class MyEnvironment {
    static readonly DebugNodeArchiveUrl: string = "https://github.com/ElrondNetwork/elrond-go-node-debug/archive/master.zip";
    static readonly DebugNodeModuleToBuild: string = "elrond-go-node-debug-master/cmd/debugWithRestApi";

    static async installBuildTools(): Promise<any> {
        let toolsFolder = Builder.getToolsFolder();
        FsFacade.createFolderIfNotExists(toolsFolder);

        let downloadUrl = `${MyEnvironment.getLlvmDownloadUrl()}/bin`;
        let llvmLicenseUrl = `${downloadUrl}/LLVM_LICENSE.TXT`;
        let clangBinUrl = `${downloadUrl}/clang-9`;
        let llcBinUrl = `${downloadUrl}/llc`;
        let wasmLdBinUrl = `${downloadUrl}/wasm-ld`;
        let lldBinUrl = `${downloadUrl}/lld`;

        let llvmLicensePath = path.join(toolsFolder, "LLVM_LICENSE.TXT");
        let clangBinPath = path.join(toolsFolder, "clang-9");
        let llcBinPath = path.join(toolsFolder, "llc");
        let wasmLdBinPath = path.join(toolsFolder, "wasm-ld");
        let lldBinPath = path.join(toolsFolder, "lld");

        await RestFacade.download({
            url: llvmLicenseUrl,
            destination: llvmLicensePath
        });

        Feedback.debug("Downloaded license file.");

        await RestFacade.download({
            url: clangBinUrl,
            destination: clangBinPath
        });

        Feedback.debug("Downloaded clang.");

        await RestFacade.download({
            url: llcBinUrl,
            destination: llcBinPath
        });

        Feedback.debug("Downloaded llc.");

        await RestFacade.download({
            url: wasmLdBinUrl,
            destination: wasmLdBinPath
        });

        await RestFacade.download({
            url: lldBinUrl,
            destination: lldBinPath
        });

        Feedback.debug("Downloaded wasm-ld.");

        Feedback.debug("clang, llc and wasm-ld will be marked as executable (+x).");
        FsFacade.markAsExecutable(clangBinPath);
        FsFacade.markAsExecutable(llcBinPath);
        FsFacade.markAsExecutable(wasmLdBinPath);
        FsFacade.markAsExecutable(lldBinPath);

        Feedback.info("LLVM tools are ready to use.");
    }

    static getLlvmDownloadUrl() {
        let urlRoot = `${MySettings.getDownloadMirrorUrl()}/vendor-llvm`;
        let urlLinux: string = `${urlRoot}/linux`;
        let urlMacOS: string = `${urlRoot}/macos`;

        let platform = os.platform();

        if (platform == "darwin") {
            return urlMacOS;
        }

        return urlLinux;
    }

    static async installDebugNode(): Promise<any> {
        let idePath = MySettings.getIdeFolder();
        let archivePath = path.join(idePath, "node-debug.zip");

        await RestFacade.download({
            url: MyEnvironment.DebugNodeArchiveUrl,
            destination: archivePath
        });

        Feedback.debug("node-debug downloaded.");

        let goWorkspace = MyEnvironment.getGoWorkspaceFolder();
        let goFolder = MyEnvironment.getGoFolder();
        let goFolderBin = path.join(goFolder, "bin");
        let goFolderTools = path.join(goFolder, "pkg", "tool", "linux_amd64");
        FsFacade.createFolderIfNotExists(goWorkspace);
        await FsFacade.unzip(archivePath, goWorkspace);

        let moduleToBuild = path.join(goWorkspace, MyEnvironment.DebugNodeModuleToBuild);
        let builtFile = path.join(moduleToBuild, "debugWithRestApi");
        let currentPath = process.env["PATH"];
        let PATH = `${goFolderBin}:${goFolderTools}:${currentPath}`;
        let GOPATH = goWorkspace;
        let GOCACHE = path.join(idePath, "go-cache");
        FsFacade.createFolderIfNotExists(GOCACHE);

        await ProcessFacade.execute({
            program: "go",
            args: ["env"],
            environment: {
                PATH: PATH,
                GOPATH: GOPATH,
                GOCACHE: GOCACHE,
                //CC: "cgo"
            }
        });

        await ProcessFacade.execute({
            program: "go",
            args: ["build", "."],
            workingDirectory: moduleToBuild,
            environment: {
                PATH: PATH,
                GOPATH: GOPATH,
                GOCACHE: GOCACHE,
                //CC: "cgo"
            }
        });

        Feedback.info("node-debug built.");

        let moduleConfigFolder = path.join(moduleToBuild, "config");
        let nodeDebugFolder = RestDebugger.getFolderPath();
        let nodeDebugConfigFolder = path.join(nodeDebugFolder, "config");

        FsFacade.createFolderIfNotExists(nodeDebugFolder);
        FsFacade.createFolderIfNotExists(nodeDebugConfigFolder);
        FsFacade.copyFile(builtFile, RestDebugger.getToolPath());
        FsFacade.copyFile(path.join(moduleConfigFolder, "config.toml"), path.join(nodeDebugConfigFolder, "config.toml"));
        FsFacade.copyFile(path.join(moduleConfigFolder, "genesis.json"), path.join(nodeDebugConfigFolder, "genesis.json"));
    }

    static async installGo(): Promise<any> {
        let ideFolder = MySettings.getIdeFolder();
        let goArchivePath = path.join(ideFolder, "go-environment.tar.gz");
        let url = MyEnvironment.getGoDownloadUrl();

        await RestFacade.download({
            url: url,
            destination: goArchivePath
        });

        await FsFacade.untar(goArchivePath, ideFolder);
    }

    static getGoFolder(): string {
        let ideFolder = MySettings.getIdeFolder();
        return path.join(ideFolder, "go");
    }

    static getGoWorkspaceFolder(): string {
        let ideFolder = MySettings.getIdeFolder();
        return path.join(ideFolder, "go-workspace");
    }

    static getGoDownloadUrl(): string {
        let urlRoot = `${MySettings.getDownloadMirrorUrl()}/vendor-go`;
        let goArchiveLinux: string = `${urlRoot}/go1.13.3.linux-amd64.tar.gz`;
        let goArchiveMacOS: string = `${urlRoot}/go1.13.3.darwin-amd64.tar.gz`;

        let platform = os.platform();

        if (platform == "darwin") {
            return goArchiveMacOS;
        }

        return goArchiveLinux;
    }

    static getSnapshot(): EnvironmentSnapshot {
        let snapshot = new EnvironmentSnapshot();
        snapshot.ToolsFolder = MySettings.getIdeFolder();
        return snapshot;
    }
}

export class EnvironmentSnapshot {
    public ToolsFolder: string;
}