import fs = require('fs');
import os = require('os');
import path = require('path');
import { MySettings } from './settings';
import { ProcessFacade, FsFacade, RestFacade } from "./utils";
import { Presenter } from './presenter';
import request = require('request');

export class MyEnvironment {

    static async installBuildTools(): Promise<any> {
        const llvmLicense = "https://github.com/ElrondNetwork/vscode-elrond-c/releases/download/v0.0.1/LLVM_LICENSE.TXT";

        await RestFacade.download({
            url: llvmLicense,
            destination: "/home/.../Elrond/bin/LLVM_LICENSE.txt"
        });

        Presenter.showInfo("Downloaded.");
    }

    static async installDebugNode(): Promise<any> {
    }
}