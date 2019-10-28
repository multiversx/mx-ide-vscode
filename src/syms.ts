export class Syms {
    public static getMainSymsAsText() {
        let mainSyms = [
            "loadFunctionName",
            "getNumArguments",
            "loadArgumentAsBigInt",
            "loadArgumentAsBytes",
            "getArgumentAsInt64",

            "loadOwner",
            "loadCaller",
            "loadCallValue",
            "loadBalance",
            "getGasLeft",
            "loadBlockHash",
            "getBlockTimestamp",

            "sendTransaction",

            "storageStoreAsBytes",
            "storageLoadAsBytes",
            "storageStoreAsBigInt",
            "storageLoadAsBigInt",
            "storageStoreAsInt64",
            "storageLoadAsInt64",

            "returnBigInt",
            "returnInt32",
            "signalError",
            "writeLog",

            "bigIntNew",
            "bigIntByteLength",
            "bigIntGetBytes",
            "bigIntSetBytes",
            "bigIntIsInt64",
            "bigIntGetInt64",
            "bigIntSetInt64",
            "bigIntAdd",
            "bigIntSub",
            "bigIntMul",
            "bigIntCmp",

            "debugPrintBigInt",
            "debugPrintInt32",
            "debugPrintBytes",
            "debugPrintString"
        ];

        return mainSyms.join("\n");
    }
}