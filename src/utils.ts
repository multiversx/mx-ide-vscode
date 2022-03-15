import child_process = require('child_process');
import fs = require('fs');
import path = require('path');
import _ = require('underscore');
import { Feedback } from './feedback';
import { MyExecError, MyError } from './errors';
import { Terminal } from 'vscode';
const psList = require('ps-list');

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
        let channels = options.channels || ["default"];
        let stdoutToFile = options.stdoutToFile;
        let doNotDumpStdout = options.doNotDumpStdout;
        let collectStdOut = options.collectStdOut;

        let spawnOptions: child_process.SpawnOptions = {
            cwd: workingDirectory,
            env: environment
        };

        Feedback.debug(`Execute [${program}] with arguments ${JSON.stringify(args)}`, channels);

        if (workingDirectory) {
            Feedback.debug(`Working directory: ${workingDirectory}`, channels);
        }

        if (environment) {
            Feedback.debug(`Environment variables:`, channels);
            Feedback.debug(JSON.stringify(environment, null, 4), channels);
        }

        let subprocess = child_process.spawn(program, args, spawnOptions);

        subprocess.on("error", function (error) {
            reject(new MyExecError({ Program: programName, Message: error.message }));
        });

        let latestStdout = "";
        let collectedStdout = "";
        let latestStderr = "";
        subprocess.stdout.setEncoding('utf8');
        subprocess.stderr.setEncoding('utf8');

        if (stdoutToFile) {
            let writeStream: fs.WriteStream = fs.createWriteStream(stdoutToFile);
            subprocess.stdout.pipe(writeStream);
        }

        subprocess.stdout.on("data", function (data) {
            latestStdout = data;

            if (collectStdOut) {
                collectedStdout += data;
            }

            if (!doNotDumpStdout) {
                Feedback.programOutput(programName, data, channels);
            }

            if (options.onOutput) {
                options.onOutput(data);
            }
        });

        subprocess.stderr.on("data", function (data) {
            latestStderr = data;
            Feedback.programOutput(programName, data, channels);

            if (options.onError) {
                options.onError(data);
            }
        });

        subprocess.on("close", function (code) {
            Feedback.debug(`[${programName}] exists, exit code = ${code}.`, channels);

            let stdout = (collectedStdout || latestStdout).trim();

            if (options.onClose) {
                options.onClose(code, stdout);
            }

            if (code == 0) {
                resolve({ code: code, stdout: stdout });
            } else {
                reject(new MyExecError({ Program: programName, Message: latestStderr, Code: code.toString() }));
            }
        });

        return promise;
    }
}

export class FsFacade {
    public static getFilename(filePath: string) {
        return path.basename(filePath);
    }

    public static readFile(filePath: string) {
        if (!FsFacade.fileExists(filePath)) {
            throw new MyError({ Message: `Missing file: ${filePath}` });
        }

        let text: string = fs.readFileSync(filePath, { encoding: "utf8" });
        return text;
    }

    public static writeFile(filePath: string, content: string) {
        fs.writeFileSync(filePath, content);
    }

    public static fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }
}

export async function waitForProcessInTerminal(terminal: Terminal): Promise<void> {
    let pid = await terminal.processId;

    try {
        while (true) {
            await sleep(250);

            let result: any[] = await psList({ all: true });
            let hasChildren = result.some(item => item.ppid == pid);

            // No more child processes running in the Terminal.
            if (!hasChildren) {
                break;
            }
        }
    } catch (error) {
        if (error instanceof MyExecError) {
            // On empty stdout, an error code might be returned as well.
            if (error.Message.length == 0 && Number(error.Code) == 1) {
                return;
            }
        }

        throw error;
    }
}

export async function sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
