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
    static readonly DebugNodeArchiveUrl: string = "https://github.com/ElrondNetwork/elrond-go-node-debug/archive/master.zip";

    static async installBuildTools(): Promise<any> {
        let toolsFolder = Builder.getToolsFolder();
        FsFacade.createFolderIfNotExists(toolsFolder);

        let downloadUrl = MyEnvironment.getLlvmDownloadUrl();
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

        await RestFacade.download({
            url: lldBinUrl,
            destination: lldBinPath
        });

        Presenter.showInfo("Downloaded wasm-ld.");

        FsFacade.markAsExecutable(clangBinPath);
        FsFacade.markAsExecutable(llcBinPath);
        FsFacade.markAsExecutable(wasmLdBinPath);
        FsFacade.markAsExecutable(lldBinPath);
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

        let folder = RestDebugger.getFolderPath();
        FsFacade.createFolderIfNotExists(folder);
        await FsFacade.unzip(archivePath, folder);

        Presenter.showInfo("node-debug downloaded.");
    }

    static async installGo(): Promise<any> {
        let ideFolder = MySettings.getIdeFolder();
        let goArchivePath = path.join(ideFolder, "go-environment.tar.gz");
        let url = MyEnvironment.getGoDownloadUrl();

        await RestFacade.download({
            url: url,
            destination: goArchivePath
        });
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