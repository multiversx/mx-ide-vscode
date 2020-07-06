import path = require("path");
import { MySettings } from "./settings";

export class Environment {
    static old: { [key: string]: string | null };

    static set() {
        if (!Environment.old) {
            Environment.saveOld();
        }

        let sdkPath = MySettings.getElrondSdk();
        let erdpyEnvFolder = path.join(sdkPath, "erdpy-venv");
        let erdpyBinFolder = path.join(erdpyEnvFolder, "bin");
        let arwentoolsFolder = path.join(sdkPath, "arwentools");
        let rustFolder = path.join(sdkPath, "vendor-rust");
        let rustBinFolder = path.join(rustFolder, "bin");

        delete process.env["PYTHONHOME"];
        process.env["PATH"] = `${rustBinFolder}:${erdpyBinFolder}:${arwentoolsFolder}:${process.env["PATH"]}`;
        process.env["VIRTUAL_ENV"] = erdpyEnvFolder;
        process.env["RUSTUP_HOME"] = rustFolder;
        process.env["CARGO_HOME"] = rustFolder;
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
