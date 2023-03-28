import child_process = require('child_process');
import fs = require('fs');
import path = require('path');
import { Feedback } from './feedback';

export class ProcessFacade {
    public static execute(options: any): Promise<any> {
        var resolve: any, reject: any;
        let promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });

        let program = options.program;
        let programName = path.basename(program);
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
            reject(new Error(`${programName} error = ${error.message}`, { cause: error }));
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
                reject(new Error(`${programName} exited with code = ${code}.`, { cause: latestStderr || latestStdout }));
            }
        });

        return promise;
    }
}

export async function sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
