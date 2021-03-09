export class ErdpyVersionChecker {
    static minVersion: string = "1.0.10"

    static isVersionOk(versionWithSuffix: string): boolean {
        let spittedLocal = versionWithSuffix.split(' ')
        if (spittedLocal.length != 2) {
            return false
        }
        
        let locVer = spittedLocal[1].split('.')
        let minVer = this.minVersion.split('.')

        const k = Math.min(locVer.length, minVer.length);
        for (let i = 0; i < k; ++ i) {
            let locV = parseInt(locVer[i], 10);
            let minV = parseInt(minVer[i], 10);
            if (locV > minV) {
                return true;
            } else if (locV < minV) {
                return false;
            }     
        }
        
        return locVer.length == minVer.length ? false: (locVer.length < minVer.length ? false : true);
    }
}
