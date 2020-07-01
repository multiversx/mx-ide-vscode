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

        delete process.env["PYTHONHOME"];
        process.env["PATH"] = `${erdpyBinFolder}:${process.env["PATH"]}`;
        process.env["VIRTUAL_ENV"] = erdpyEnvFolder;
    }

    private static saveOld() {
        Environment.old = {
            "PYTHONHOME": process.env["PYTHONHOME"],
            "PATH": process.env["PATH"],
            "VIRTUAL_ENV": process.env["VIRTUAL_ENV"]
        };
    }
}
