import request = require('request');

export class ErdpyVersionChecker {
    static githubURLLastestRelease: string = "https://api.github.com/repos/ElrondNetwork/elrond-sdk/releases/latest"
    static githubElrondSDK: string = "https://raw.githubusercontent.com/ElrondNetwork/elrond-sdk"
    static defaultERDPYVersion: string = "v1.0.10"

    static async isVersionOk(versionWithSuffix: string): Promise<boolean> {
        let spittedLocal = versionWithSuffix.split(' ');
        if (spittedLocal.length != 2) {
            return false;
        }
        
        let locVer = spittedLocal[1].split('.');
        let latestVersionPromise = await this.getLatestERDPYVersion();
        let latestVersion = latestVersionPromise.toString();
        let latestVer = latestVersion.split('.');

        const k = Math.min(locVer.length, latestVer.length);
        for (let i = 0; i < k; ++ i) {
            let locV = parseInt(locVer[i], 10);
            let minV = parseInt(latestVer[i], 10);
            if (locV > minV) {
                return true;
            } else if (locV < minV) {
                return false;
            }
        }
        
        return locVer.length == latestVer.length ? true: (locVer.length >= latestVer.length);
    }

    static async getLatestERDPYVersion(): Promise<string> {
        let tagName = await this.getLatestRelease();
        let url = `${this.githubElrondSDK}/${tagName.toString()}/erdpy/_version.py`;

        let erdpyVersionResponse = await this.doGetRequest({
            url: url
        });
        if (erdpyVersionResponse.hasOwnProperty('error')) {
            return this.defaultERDPYVersion;
        }


        // remove spaces and quotes
        let erdpyVersionMessage: string = erdpyVersionResponse.toString().replace(/\s/g, '').replace(/['"]+/g, '')
        let erdpyVersionSpitted: string[] = erdpyVersionMessage.split('=');
        if (erdpyVersionSpitted.length > 1) {
            return erdpyVersionSpitted[1];
        }

        return this.defaultERDPYVersion;
    }

    static async getLatestRelease(): Promise<string> {
        let response = await this.doGetRequest({
            url: this.githubURLLastestRelease,
            headers: {
                'User-Agent': 'request'
            }
        });

        let obj = JSON.parse(response);
        if (obj.hasOwnProperty('tag_name')) {
            return obj.tag_name;
        }

        return "";
    }

    public static doGetRequest(options: any): Promise<any> {
        let resolve: any, reject: any;
        let promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });

        let url = options.url
        let requestOptions: any = {
            headers: options.headers
        };

        request.get(url, requestOptions, function (error: any, response: any, body: any) {
            let statusCode = response ? response.statusCode : null;
            let isErrorneous = error || statusCode == 500;
            if (isErrorneous || statusCode != 200) {
                resolve(`{"error":"cannot do request"}`);
            } else {
                resolve(body);
            }
        });

        return promise;
    }
}
