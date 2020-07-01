import fs = require("fs");
import path = require("path");
import { Root } from "./root";

export function getPathTo(fileName: string): string {
    return path.join(getPath(), fileName);
}

function getPath(): string {
    let storagePath = Root.ExtensionContext.storagePath;
    if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath);
    }

    return storagePath;
}