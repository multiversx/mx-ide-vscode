import { FsFacade } from "./utils";

export class SmartContract {
    public CFile: string;
    public WasmFile: string;

    public isBuilt(): boolean {
        return this.WasmFile ? true : false;
    }

    public static getAll() {
        let files = FsFacade.getAllFilesInWorkspace();
        console.log(files);
        return files;
    }
}