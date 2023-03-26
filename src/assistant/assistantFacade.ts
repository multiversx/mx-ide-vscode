import { Memento } from "vscode";

export class AssistantFacade {
    private readonly memento: Memento;

    constructor(memento: Memento) {
        this.memento = memento;
    }

    async setAcceptTermsOfService(accept: boolean): Promise<void> {
        console.log("setAcceptTermsOfService", accept);
        await this.memento.update("assistant.acceptTermsOfService", accept);
    }

    async getAcceptTermsOfService(): Promise<boolean> {
        return this.memento.get("assistant.acceptTermsOfService", false);
    }

    async setAcceptPrivacyStatement(accept: boolean): Promise<void> {
        console.log("setAcceptPrivacyStatement", accept);
        await this.memento.update("assistant.acceptPrivacyStatement", accept);
    }

    async getAcceptPrivacyStatement(): Promise<boolean> {
        return this.memento.get("assistant.acceptPrivacyStatement", false);
    }
}
