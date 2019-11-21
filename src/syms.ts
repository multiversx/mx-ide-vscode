export class Syms {
    public static getMainSymsAsText() {
        let mainSyms = [
            "getOwner",
            "getExternalBalance",
            "getBlockHash",
            "transfer",
            "getArgument",
            "getFunction",
            "getNumArguments",
            "storageStore",
            "storageLoad",
            "getCaller",
            "getCallValue",
            "writeLog",
            "finish",
            "signalError",
            "getGasLeft",
            "getBlockTimestamp",

            "int64getArgument",
            "int64storageStore",
            "int64storageLoad",
            "int64finish",

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
            "bigIntFinish",
            "bigIntStorageStore",
            "bigIntStorageLoad",
            "bigIntGetUnsignedArgument",
            "bigIntGetSignedArgument",
            "bigIntGetCallValue",
            "bigIntGetExternalBalance"
        ];

        return mainSyms.join("\n");
    }
}