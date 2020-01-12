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
        } catch (e) {
            Feedback.error(`Could not interpolate: ${str}.`)
            throw e;
        }
    }

    private static tryApply(str: string): string {
        if (!str) {
            return "";
        }

        let data = Variables.getParsed();

        _.each(data, function (value: any, key: string) {
            str = str.replace("$" + key, value);
        });

        if (str.indexOf("$") >= 0) {
            throw new Error("Perhaps missing variable (alias)?");
        }

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
            Alice: "0xaaaaaaaa112233441122334411223344112233441122334411223344aaaaaaaa",
            Bob: "0xbbbbbbbb112233441122334411223344112233441122334411223344bbbbbbbb",
            Carol: "0xcccccccc112233441122334411223344112233441122334411223344cccccccc",
            David: "0xdddddddd112233441122334411223344112233441122334411223344dddddddd",
            Erin: "0xeeeeeeee112233441122334411223344112233441122334411223344eeeeeeee",
            Frank: "0xffffffff112233441122334411223344112233441122334411223344ffffffff"
        };
    }
}