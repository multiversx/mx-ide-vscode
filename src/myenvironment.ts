import fs = require('fs');
import os = require('os');
import path = require('path');
import { MySettings } from './settings';
import { ProcessFacade, FsFacade, RestFacade } from "./utils";
import { Presenter } from './presenter';
import request = require('request');

export class MyEnvironment {

    static async installBuildTools(): Promise<any> {
        let toolsFolder = MySettings.getBuildToolsFolder();

        const downloadUrlRoot = "https://github.com/ElrondNetwork/vscode-elrond-c/releases/download/v0.0.1";
        const llvmLicenseUrl = `${downloadUrlRoot}/LLVM_LICENSE.TXT`;
        const clangBinUrl = `${downloadUrlRoot}/clang-9`;
        const llcBinUrl = `${downloadUrlRoot}/llc`;
        const wasmLdBinUrl = `${downloadUrlRoot}/wasm-ld`;

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
    }

    static getSnapshot(): EnvironmentSnapshot {
        let snapshot = new EnvironmentSnapshot();
        snapshot.ToolsFolder = MySettings.getBuildToolsFolder();
        return snapshot;
    }
}

export class EnvironmentSnapshot {
    public ToolsFolder: string;
}