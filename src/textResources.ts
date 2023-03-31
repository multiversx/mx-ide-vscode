export class CommandsLabels {
    static connectOpenAISecretKey = "Connect OpenAI secret key";
    static disconnectOpenAISecretKey = "Disconnect OpenAI secret key";
}

export class ConfirmConnectOpenAIKey {
    static answerYes = "Yes, provide key";
    static answerNo = "Skip for now";

    static getMessage(address: string) {
        return `
Optionally, you can provide your OpenAI secret key (if you own one), and connect it with your MultiversX address: ${address}.

This OpenAI secret key will be sent to the server on which the MultiversX assistant is running, and it will be used to resolve the answers to your requests. 

The key will not be stored on this device.

Would you like to provide your OpenAI secret key, and connect it to your MultiversX address ${address}?

If you choose to skip this step, you can always provide the key later, by invoking the command "${CommandsLabels.connectOpenAISecretKey}".

Furthermore, if you provide the key now, you can remove it by invoking the command "${CommandsLabels.disconnectOpenAISecretKey}".
    `;
    }
}

export class ConfirmOverrideOpenAIKey {
    static answerYes = "Yes, override key";
    static answerNo = "No, keep existing key";

    static getMessage(address: string) {
        return `
It seems that you already have an OpenAI secret key connected to your MultiversX address ${address}.

Would you like to override the existing OpenAI key with the new one?
`;
    }
}

export class EnterOpenAISecretKey {
    static prompt = "Enter your OpenAI secret key";
    static validationShouldNotBeEmpty = "Should not be empty.";
}
