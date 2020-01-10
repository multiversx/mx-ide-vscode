import _ = require("underscore");
import { Variables } from "./variables";
import { MyError } from "./errors";

export class Transaction {
    static HexPrefix = "0X";

    public static prepareSender(sender: string) {
        sender = Variables.apply(sender);

        if (sender.toUpperCase().startsWith(Transaction.HexPrefix)) {
            sender = sender.substring(Transaction.HexPrefix.length);
        }

        return sender;
    }

    public static prepareDeployTxData(code: string, args: string[]): string {
        let txData = code + Transaction.joinArguments(args);
        return txData;
    }

    public static prepareRunTxData(functionName: string, args: string[]): string {
        let txData = functionName + Transaction.joinArguments(args);
        return txData;
    }

    private static joinArguments(args: string[]): string {
        let result = "";

        _.each(args, function (item: string) {
            if (!item) {
                return;
            }

            result += "@" + Transaction.prepareArgument(item);
        });

        return result;
    }

    public static prepareArgument(argument: string): string {
        argument = Variables.apply(argument);

        if (argument.toUpperCase().startsWith(Transaction.HexPrefix)) {
            argument = argument.substring(Transaction.HexPrefix.length);
            return argument;
        } else {
            let argumentAsAny: any = argument;
            if (isNaN(argumentAsAny)) {
                throw new MyError({ Message: `Can't handle non-hex, non-number arguments yet: ${argument}.` });
            } else {
                let number = Number(argument);
                let hexString = number.toString(16);
                let hexStringLength = hexString.length % 2 == 0 ? hexString.length : hexString.length + 1;
                let paddedHexString = hexString.padStart(hexStringLength, "0");
                return paddedHexString;
            }
        }
    }
}

