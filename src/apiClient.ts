import { window } from "vscode";

export class ApiClient {
    constructor() {
    }

    public testAlive(): void {
        window.showInformationMessage("Alive?");
    }
}