import child_process = require('child_process');
import fs = require('fs');
import os = require('os');
import path = require('path');
import { Locator } from './locator';

export class ProcessFacade {
    public static executeSync(command: string, silentOnError: boolean = false) {
        console.log(`ProcessFacade.execute():\n${command}`);

        var output;

        try {
            output = child_process.execSync(command).toString()
        } catch (error) {
            if (silentOnError) {
                output = error.toString();
            } else {
                throw error;
            }
        }

        console.log("ProcessFacade.execute(): done.");
        return output;
    }

    public static execute(options: any) {
        let program = options.program;
        let programName = FsFacade.getFilename(program);
        let args = options.args;
        let subprocess = child_process.spawn(program, args);

        subprocess.stdout.setEncoding('utf8');
        subprocess.stderr.setEncoding('utf8');

        subprocess.stdout.on("data", function (data) {
            console.log(`[${programName}] says: ${data}`);

            if (options.onOutput) {
                options.onOutput(data);
            }
        });

        subprocess.stderr.on("data", function (data) {
            console.error(`[${programName}] says: ${data}`);

            if (options.onError) {
                options.onError(data);
            }
        });

        subprocess.on("close", function (code) {
            console.log(`[${programName}] exits: ${code}`);

            if (options.onClose) {
                options.onClose(code);
            }
        });
    }
}

export class FsFacade {
    public static createTempFile(fileName: string, content: string) {
        let filePath = path.join(os.tmpdir(), fileName);
        fs.writeFileSync(filePath, content);
        return filePath;
    }

    public static removeExtension(filePath: string) {
        let parsedPath = path.parse(filePath);
        let withoutExtension = path.join(parsedPath.dir, parsedPath.name);
        return withoutExtension;
    }

    public static getFilename(filePath: string) {
        return path.basename(filePath);
    }

    public static readFile(filePath: string) {

        let content: string = fs.readFileSync(filePath, { encoding: "utf8" });
        return content;
    }

    public static readBundledFile(filePath: string) {
        let extensionPath = Locator.ExtensionContext.extensionPath;
        let absolutePath = path.join(extensionPath, "content", filePath);
        return FsFacade.readFile(absolutePath);
    }
}