import fs = require('fs');
import os = require('os');
import path = require('path');
import { MySettings } from './settings';
import { ProcessFacade, FsFacade, RestFacade } from "./utils";
import { Presenter } from './presenter';
import request = require('request');
import { RestDebugger } from './debugger';
import { Builder } from './builder';

export class MyEnvironment {
    static readonly ExtensionUrlRoot: string = "https://github.com/ElrondNetwork/vscode-elrond-c/releases/download/v0.0.1";
    static readonly DebugNodeArchiveUrl: string = "https://github.com/ElrondNetwork/elrond-go-node-debug/archive/master.zip";
    static readonly GoArchiveLinux: string = "https://dl.google.com/go/go1.13.3.linux-amd64.tar.gz";
    static readonly GoArchiveMacOS: string = "https://dl.google.com/go/go1.13.3.darwin-amd64.tar.gz";

    static async installBuildTools(): Promise<any> {
        let toolsFolder = Builder.getToolsFolder();
        FsFacade.createFolderIfNotExists(toolsFolder);

        const llvmLicenseUrl = `${MyEnvironment.ExtensionUrlRoot}/LLVM_LICENSE.TXT`;
        const clangBinUrl = `${MyEnvironment.ExtensionUrlRoot}/clang-9`;
        const llcBinUrl = `${MyEnvironment.ExtensionUrlRoot}/llc`;
        const wasmLdBinUrl = `${MyEnvironment.ExtensionUrlRoot}/wasm-ld`;

        let llvmLicensePath = path.join(toolsFolder, "LLVM_LICENSE.TXT");
        let clangBinPath = path.join(toolsFolder, "clang-9");
        let llcBinPath = path.join(toolsFolder, "llc");
        let wasmLdBinPath = path.join(toolsFolder, "wasm-ld");

        await RestFacade.download({
            url: llvmLicenseUrl,
            destination: llvmLicensePath
        });

        Presenter.showInfo("Downloaded license file.");

        await RestFacade.download({
            url: clangBinUrl,
            destination: clangBinPath
        });

        Presenter.showInfo("Downloaded clang.");

        await RestFacade.download({
            url: llcBinUrl,
            destination: llcBinPath
        });

        Presenter.showInfo("Downloaded llc.");

        await RestFacade.download({
            url: wasmLdBinUrl,
            destination: wasmLdBinPath
        });

        Presenter.showInfo("Downloaded wasm-ld.");

        FsFacade.markAsExecutable(clangBinPath);
        FsFacade.markAsExecutable(llcBinPath);
        FsFacade.markAsExecutable(wasmLdBinPath);
    }

    static async installDebugNode(): Promise<any> {
        let idePath = MySettings.getIdeFolder();
        let archivePath = path.join(idePath, "node-debug.zip");

        await RestFacade.download({
            url: MyEnvironment.DebugNodeArchiveUrl,
            destination: archivePath
        });

        let folder = RestDebugger.getFolderPath();
        FsFacade.createFolderIfNotExists(folder);
        await FsFacade.unzip(archivePath, folder);

        Presenter.showInfo("node-debug downloaded.");
    }

    static async installGo(): Promise<any> {
        let platform = os.platform();
        let release = os.release();
        let ideFolder = MySettings.getIdeFolder();
        let goArchivePath = path.join(ideFolder, "go-environment.tar.gz");
        let url = this.GoArchiveLinux;

        if (platform == "darwin") {
            url = this.GoArchiveMacOS;
        }

        await RestFacade.download({
            url: url,
            destination: goArchivePath
        });

        
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