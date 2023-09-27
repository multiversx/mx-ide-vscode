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
        let args = options.args;
        let stdoutToFile = options.stdoutToFile;
        let spawnOptions: child_process.SpawnOptions = {};

        Feedback.debug({
            message: `Execute [${program}] with arguments ${JSON.stringify(args)}`,
        });

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
        });

        subprocess.stderr.on("data", function (data) {
            latestStderr = data;

            Feedback.debug({
                message: `stderr of ${programName}`,
                items: [data]
            });
        });

        subprocess.on("close", function (code) {
            Feedback.debug({
                message: `${programName} exited with code = ${code}`,
            });

            let stdout = (collectedStdout || latestStdout).trim();

            if (code === 0) {
                resolve({ code: code, stdout: stdout });
            } else {
                reject(new Error(`${programName} exited with code = ${code}.`, { cause: latestStderr || latestStdout }));
            }
        });

        return promise;
    }
}

export async function sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
