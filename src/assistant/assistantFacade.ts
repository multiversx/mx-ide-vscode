import { Memento } from "vscode";

interface IAssistantGateway {
    explainCode(options: { code: string }): Promise<string>;
}

export class AssistantFacade {
    private readonly memento: Memento;
    private readonly gateway: IAssistantGateway;

    constructor(options: {
        memento: Memento,
        gateway: IAssistantGateway
    }) {
        this.memento = options.memento;
        this.gateway = options.gateway;
    }

    async acceptTerms(options: {
        acceptTermsOfService: boolean;
        acceptPrivacyStatement: boolean;
    }): Promise<void> {
        console.info("AssistantFacade.acceptTerms", options);
        await this.memento.update("assistant.acceptTerms", options);
    }

    async areTermsAccepted(): Promise<{
        acceptTermsOfService: boolean;
        acceptPrivacyStatement: boolean;
    }> {
        return this.memento.get("assistant.acceptTerms", {
            acceptTermsOfService: false,
            acceptPrivacyStatement: false
        });
    }

    async switchToSession(options: { sessionId: string }): Promise<void> {
        console.info("AssistantFacade.switchToSession", options);
        await this.memento.update("assistant.sessionId", options.sessionId);
    }

    async explainCode(options: { code: string }): Promise<string> {
        return this.gateway.explainCode(options);
    }
}
