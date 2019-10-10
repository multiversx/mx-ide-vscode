import child_process = require('child_process');
import fs = require('fs');
import os = require('os');
import path = require('path');
import { Root } from './root';
import * as vscode from 'vscode';
import glob = require('glob');
import eventBus from './eventBus';
import request = require('request');

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
        let eventTag = options.eventTag;

        subprocess.stdout.setEncoding('utf8');
        subprocess.stderr.setEncoding('utf8');

        if (eventTag) {
            eventBus.emit(`${eventTag}:started`, { program: program, args: args });
        }
        
        subprocess.stdout.on("data", function (data) {
            console.log(`[${programName}] says: ${data}`);

            if (options.onOutput) {
                options.onOutput(data);
            }

            if (eventTag) {
                eventBus.emit(`${eventTag}:output`, data);
            }
        });

        subprocess.stderr.on("data", function (data) {
            console.error(`[${programName}] says: ${data}`);

            if (options.onError) {
                options.onError(data);
            }

            if (eventTag) {
                eventBus.emit(`${eventTag}:error`, data);
            }
        });

        subprocess.on("close", function (code) {
            console.log(`[${programName}] exits: ${code}`);

            if (options.onClose) {
                options.onClose(code);
            }

            if (eventTag) {
                eventBus.emit(`${eventTag}:close`, code);
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
        let text: string = fs.readFileSync(filePath, { encoding: "utf8" });
        return text;
    }

    public static readBinaryFile(filePath: string) {
        let buffer: Buffer = fs.readFileSync(filePath);
        return buffer;
    }

    public static readFileInContent(filePath: string) {
        filePath = FsFacade.getPathInContent(filePath);
        return FsFacade.readFile(filePath);
    }

    public static getPathInContent(filePath: string) {
        let absolutePath = path.join(FsFacade.getPathToContent(), filePath);
        return absolutePath;
    }

    public static getPathToContent() {
        let extensionPath = Root.ExtensionContext.extensionPath;
        return path.join(extensionPath, "content");
    }

    public static getPathToWorkspace() {
        let folders = vscode.workspace.workspaceFolders;
        let workspaceFolder: vscode.WorkspaceFolder = folders ? folders[0] : null;

        if (workspaceFolder) {
            return workspaceFolder.uri.fsPath;
        }
    }

    public static getFilesInWorkspaceByExtension(extension: string) {
        let folder: string = FsFacade.getPathToWorkspace();
        let files = glob.sync(`${folder}/**/*${extension}`, {});
        return files;
    }

    public static fileExists(filePath: string) : boolean {
        return fs.existsSync(filePath);
    }
}

export class RestFacade {
    public static post(options: any) {
        let url = options.url;
        let data = options.data;
        let eventTag = options.eventTag;

        let postOptions: any = {
            json: data
        };

        if (eventTag) {
            eventBus.emit(`${eventTag}:request`, { url: url, data: data });
        }

        request.post(url, postOptions, function (error: any, response: any, body: any) {
            eventBus.emit(`${eventTag}:response`, { url: url, data: body });
            console.log("url", url);
            console.error("error:", error);
            console.log("statusCode:", response && response.statusCode);
            console.log("body:", body);
        });
    }
}