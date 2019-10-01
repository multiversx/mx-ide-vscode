export class Syms {
    public static getMainSymsAsText() {
        let mainSyms = [
            "getOwner",
            "getExternalBalance",
            "blockHash",
            "transfer",
            "getArgument",
            "getArgumentAsInt64",
            "getFunction",
            "getNumArguments",
            "storageStore",
            "storageLoad",
            "storageStoreAsInt64",
            "storageLoadAsInt64",
            "getCaller",
            "getCallValue",
            "getCallValueAsInt64",
            "logMessage",
            "writeLog",
            "finish",
            "getBlockTimestamp",
            "signalError"
        ];

        return mainSyms.join("\n")
    }
}