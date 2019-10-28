var SmartContract = Backbone.Model.extend({
    idAttribute: "FriendlyId",

    initialize: function () {
    },

    build: function () {
        app.talkToVscode("buildSmartContract", { id: this.id });
    },

    deploy: function (deployOptions) {
        payload = deployOptions.toJSON();
        payload.id = this.id;
        app.talkToVscode("deploySmartContract", payload);
    },

    run: function (runOptions) {
        payload = runOptions.toJSON();
        payload.id = this.id;
        app.talkToVscode("runSmartContract", payload);
    }
});

var SmartContractDeployOptions = Backbone.Model.extend({
    validate: function (attrs, options) {
        if (attrs.onTestnet) {
            if (!attrs.privateKey) {
                return "When deploying on testnet, the private key is required.";
            }

            if (!attrs.testnetNodeEndpoint) {
                return "When deploying on testnet, the node endpoint (url) is required.";
            }
        }
        else {
            if (!attrs.senderAddress) {
                return "Sender address is required.";
            }
        }
    }
});

var SmartContractRunOptions = Backbone.Model.extend({
    validate: function (attrs, options) {
        if (!attrs.functionName) {
            return "Function name is required.";
        }

        if (attrs.onTestnet) {
            if (!attrs.privateKey) {
                return "When running on testnet, the private key is required.";
            }

            if (!attrs.testnetNodeEndpoint) {
                return "When running on testnet, the node endpoint (url) is required.";
            }
        }
        else {
            if (!attrs.senderAddress) {
                return "Sender address is required.";
            }
        }
    }
});

var SmartContractsCollection = Backbone.Collection.extend({
    model: SmartContract
});