import path = require("path");
import { MySettings } from "./settings";

export class Environment {
    static old: { [key: string]: string | null };

    static set() {
        if (!Environment.old) {
            Environment.saveOld();
        }

        let sdkPath = MySettings.getSdkPath();
        let mxpyVenvFolder = path.join(sdkPath, "mxpy-venv");
        let mxpyBinFolder = path.join(mxpyVenvFolder, "bin");
        let vmToolsFolder = path.join(sdkPath, "vmtools");
        let rustFolder = path.join(sdkPath, "vendor-rust");
        let rustBinFolder = path.join(rustFolder, "bin");
        let nodeJsFolder = path.join(sdkPath, "nodejs", "latest");
        let nodeJsBinFolder = path.join(nodeJsFolder, "bin");

        // This is required for other VS Code extensions to work well and use the custom (Rust) environment.
        delete process.env["PYTHONHOME"];
        process.env["PATH"] = `${rustBinFolder}:${mxpyBinFolder}:${vmToolsFolder}:${nodeJsBinFolder}:${process.env["PATH"]}`;
        process.env["VIRTUAL_ENV"] = mxpyVenvFolder;
        process.env["RUSTUP_HOME"] = rustFolder;
        process.env["CARGO_HOME"] = rustFolder;
    }

    static getForVsCodeFiles(): any {
        let sdkPath = path.join("${env:HOME}", MySettings.getSdkPathRelativeToHome());
        let mxpyVenvFolder = path.join(sdkPath, "mxpy-venv");
        let mxpyBinFolder = path.join(mxpyVenvFolder, "bin");
        let vmToolsFolder = path.join(sdkPath, "vmtools");
        let rustFolder = path.join(sdkPath, "vendor-rust");
        let rustBinFolder = path.join(rustFolder, "bin");
        let nodeJsFolder = path.join(sdkPath, "nodejs", "latest");
        let nodeJsBinFolder = path.join(nodeJsFolder, "bin");

        return {
            "PATH": `${rustBinFolder}:${mxpyBinFolder}:${vmToolsFolder}:${nodeJsBinFolder}:\${env:PATH}`,
            "VIRTUAL_ENV": mxpyVenvFolder,
            "RUSTUP_HOME": rustFolder,
            "CARGO_HOME": rustFolder
        };
    }

    static getForTerminal(): any {
        let sdkPath = path.join("${env:HOME}", MySettings.getSdkPathRelativeToHome());
        let mxpyVenvFolder = path.join(sdkPath, "mxpy-venv");
        let mxpyBinFolder = path.join(mxpyVenvFolder, "bin");
        let vmToolsFolder = path.join(sdkPath, "vmtools");
        let rustFolder = path.join(sdkPath, "vendor-rust");
        let rustBinFolder = path.join(rustFolder, "bin");
        let nodeJsFolder = path.join(sdkPath, "nodejs", "latest");
        let nodeJsBinFolder = path.join(nodeJsFolder, "bin");

        return {
            "PYTHONHOME": null,
            "PATH": `${rustBinFolder}:${mxpyBinFolder}:${vmToolsFolder}:${nodeJsBinFolder}:${process.env["PATH"]}`,
            "VIRTUAL_ENV": mxpyVenvFolder,
            "RUSTUP_HOME": rustFolder,
            "CARGO_HOME": rustFolder
        };
    }

    private static saveOld() {
        Environment.old = {
            "PYTHONHOME": process.env["PYTHONHOME"],
            "PATH": process.env["PATH"],
            "VIRTUAL_ENV": process.env["VIRTUAL_ENV"],
            "RUSTUP_HOME": process.env["RUSTUP_HOME"],
            "CARGO_HOME": process.env["CARGO_HOME"]
        };
    }
}
