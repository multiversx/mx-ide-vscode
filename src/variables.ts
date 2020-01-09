import { FsFacade } from "./utils";
import path = require('path');
import _ = require('underscore');
import { Feedback } from "./feedback";
import { parse } from "url";

export class Variables {
    public static save(json: string) {
        try {
            return Variables.trySave(json);
        } catch {
            Feedback.error(`Could not save json variables.`)
        }
    }

    private static trySave(json: string) {
        let parsed = JSON.parse(json);
        json = JSON.stringify(parsed, null, 4);
        let filePath = Variables.getFilePath();
        FsFacade.writeFile(filePath, json);
    }

    public static apply(str: string): string {
        try {
            return Variables.tryApply(str);
        } catch {
            Feedback.error(`Could not interpolate: ${str}.`)
        }
    }

    private static tryApply(str: string): string {
        let data = Variables.getParsed();

        _.each(data, function (value: any, key: string) {
            str = str.replace("$" + key, value);
        });

        return str;
    }

    public static getParsed() {
        let json = Variables.getSnapshot().json;
        let parsed = JSON.parse(json);
        return parsed;
    }

    public static getSnapshot(): any {
        Variables.initializeIfMissing();

        let filePath = Variables.getFilePath();
        let content = FsFacade.readFile(filePath);
        return { json: content };
    }

    private static getFilePath() {
        return path.join(FsFacade.getPathToWorkspace(), "variables.json");
    }

    private static initializeIfMissing() {
        let filePath = Variables.getFilePath();

        if (!FsFacade.fileExists(filePath)) {
            let defaultVariables = Variables.getDefault();
            let json = JSON.stringify(defaultVariables, null, 4);
            FsFacade.writeFile(filePath, json);
        }
    }

    private static getDefault(): any {
        return {
            alice: "010101",
            bob: "02020202",
            carol: "0303030"
        };
    }
}