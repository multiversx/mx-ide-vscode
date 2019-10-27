import child_process = require('child_process');
import fs = require('fs');
import os = require('os');
import path = require('path');
import { Root } from './root';
import * as vscode from 'vscode';
import glob = require('glob');
import eventBus from './eventBus';
import request = require('request');
import _ = require('underscore');
import { Feedback } from './feedback';

export class ProcessFacade {
    public static execute(options: any): Promise<any> {
        var resolve: any, reject: any;
        let promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });

        let program = options.program;
        let programName = FsFacade.getFilename(program);
        let workingDirectory = options.workingDirectory;
        let args = options.args;
        let environment = options.environment;
        let eventTag = options.eventTag;

        let spawnOptions: child_process.SpawnOptions = {
            cwd: workingDirectory,
            env: environment
        };

        Feedback.debug(`Execute [${program}] with arguments ${JSON.stringify(args)}`, ["default", "exec"]);

        if (workingDirectory) {
            Feedback.debug(`Working directory: ${workingDirectory}`, ["default", "exec"]);
        }

        if (environment) {
            Feedback.debug(`Environment variables:`, ["default", "exec"]);
            Feedback.debug(JSON.stringify(environment, null, 4), ["default", "exec"]);
        }

        let subprocess = child_process.spawn(program, args, spawnOptions);

        subprocess.stdout.setEncoding('utf8');
        subprocess.stderr.setEncoding('utf8');

        if (eventTag) {
            eventBus.emit(`${eventTag}:started`, { program: program, args: args });
        }

        subprocess.stdout.on("data", function (data) {
            Feedback.debug(`[${programName}] says: ${data}`, ["exec"]);

            if (options.onOutput) {
                options.onOutput(data);
            }

            if (eventTag) {
                eventBus.emit(`${eventTag}:output`, data);
            }
        });

        subprocess.stderr.on("data", function (data) {
            Feedback.debug(`[${programName}] says (stderr): ${data}`, ["exec"]);

            if (options.onError) {
                options.onError(data);
            }

            if (eventTag) {
                eventBus.emit(`${eventTag}:error`, data);
            }
        });

        subprocess.on("close", function (code) {
            Feedback.debug(`[${programName}] exists, exit code = ${code}.`, ["default", "exec"]);

            if (options.onClose) {
                options.onClose(code);
            }

            if (eventTag) {
                eventBus.emit(`${eventTag}:close`, code);
            }

            if (code == 0) {
                resolve(code);
            } else {
                reject(code);
            }
        });

        return promise;
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

    public static getFolder(filePath: string) {
        return path.dirname(filePath);
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

    public static fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    public static readLatestFileInFolder(...pathParts: string[]): string {
        let latest = FsFacade.getLatestFileInFolder(...pathParts);
        let content = FsFacade.readFile(latest);
        return content;
    }

    public static getLatestFileInFolder(...pathParts: string[]): string {
        let folder = path.join(...pathParts);
        let files = fs.readdirSync(folder);
        let latest = _.max(files, function (fileName) {
            let fullpath = path.join(folder, fileName);
            return fs.statSync(fullpath).mtime;
        });

        let fullpath = path.join(folder, latest);
        return fullpath;
    }

    public static getModifiedOn(filePath: string): Date {
        return fs.statSync(filePath).mtime;
    }

    public static markAsExecutable(filePath: string) {
        Feedback.debug(`markAsExecutable(${filePath})`)
        fs.chmodSync(filePath, "755");
    }

    public static unzip(archivePath: string, destinationFolder: string): Promise<any> {
        Feedback.debug(`unzip ${archivePath} to ${destinationFolder}.`)

        return ProcessFacade.execute({
            program: "unzip",
            args: ["-o", archivePath, "-d", destinationFolder]
        });
    }

    public static untar(archivePath: string, destinationFolder: string): Promise<any> {
        Feedback.debug(`untar ${archivePath} to ${destinationFolder}.`)

        return ProcessFacade.execute({
            program: "tar",
            args: ["-C", destinationFolder, "-xzf", archivePath]
        });
    }

    public static createFolderIfNotExists(folderPath: string) {
        let parentFolder = path.dirname(folderPath);

        if (!fs.existsSync(parentFolder)) {
            throw new Error(`Parent folder ${parentFolder} does not exist.`);
        }

        if (!fs.existsSync(folderPath)) {
            Feedback.debug(`Creating folder: ${folderPath}`);
            fs.mkdirSync(folderPath);
        }
    }

    // https://stackoverflow.com/a/40686853/1475331
    public static mkDirByPathSync(targetDir: string) {
        const sep = path.sep;
        const initDir = path.isAbsolute(targetDir) ? sep : '';
        const baseDir = '.';

        return targetDir.split(sep).reduce((parentDir, childDir) => {
            const curDir = path.resolve(baseDir, parentDir, childDir);
            try {
                fs.mkdirSync(curDir);
            } catch (err) {
                if (err.code === 'EEXIST') { // curDir already exists!
                    return curDir;
                }

                // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
                if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                    throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
                }

                const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
                if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
                    throw err; // Throw if it's just the last created dir.
                }
            }

            return curDir;
        }, initDir);
    }

    public static copyFile(source: string, destination: string) {
        Feedback.debug(`copy: ${source} TO ${destination}`);
        fs.copyFileSync(source, destination);
    }
}

export class RestFacade {
    public static post(options: any): Promise<any> {
        var resolve: any, reject: any;
        let promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });

        let url = options.url;
        let data = options.data;
        let eventTag = options.eventTag;
        let requestOptions: any = {
            json: data
        };

        if (eventTag) {
            eventBus.emit(`${eventTag}:request`, { url: url, data: data });
        }

        Feedback.debug(`http post, ${url}`, ["default", "http"]);
        Feedback.debug(JSON.stringify(options, null, 4), ["http"]);

        request.post(url, requestOptions, function (error: any, response: any, body: any) {
            let statusCode = response ? response.statusCode : null;
            let isErrorneous = error || statusCode == 500;

            if (isErrorneous) {
                eventBus.emit(`${eventTag}:error`, { url: url, data: error });
                Feedback.error(`http error, status=${statusCode}, error=${error.toString()}`, ["default", "http"]);
                reject({ error: error, status: statusCode });
            } else {
                eventBus.emit(`${eventTag}:response`, { url: url, data: body });
                Feedback.debug(`http post, status=${statusCode}, response:`, ["http"]);
                Feedback.debug(JSON.stringify(body, null, 4), ["http"]);

                if (statusCode != 200) {
                    Feedback.error("Errorneous HTTP response, please check.");
                }

                resolve(body);
            }
        });

        return promise;
    }

    public static download(options: any): Promise<any> {
        const waitBeforeCloseStream = 500;

        var resolve: any, reject: any;
        let promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });

        let url = options.url;
        let destination = options.destination;
        let writeStream: fs.WriteStream = fs.createWriteStream(destination);

        Feedback.debug(`Downloading: ${url}`);
        Feedback.debug(`Destination: ${destination}`);

        let contentLength = Number.MAX_SAFE_INTEGER;
        let downloaded = 0;
        let progress = 0;
        let percentage = 0;
        let previousPercentage = -1;

        request.get(url)
            .on("response", function (response) {
                contentLength = parseInt(response.headers['content-length']);
            })
            .on("data", function (chunk) {
                downloaded += chunk.length;
                progress = downloaded / contentLength;
                percentage = Math.round(progress * 100);

                if (percentage != previousPercentage) {
                    eventBus.emit("download", {
                        url: url,
                        file: destination,
                        progress: progress,
                        percentage: percentage,
                        downloaded: downloaded,
                        length: contentLength
                    });
                }

                previousPercentage = percentage;
            })
            .on("error", function (error) {
                console.error(error);
                writeStream.close();
                reject({ error: error });
            })
            .on("complete", function (response) {
                setTimeout(function () {
                    writeStream.close();
                    Feedback.debug(`Downloaded: ${destination}.`);
                    resolve();
                }, waitBeforeCloseStream);

                eventBus.emit("download", {
                    url: url,
                    file: destination,
                    progress: 1.0,
                    percentage: 100,
                    downloaded: downloaded,
                    length: contentLength
                });
            })
            .pipe(writeStream);

        return promise;
    }
}