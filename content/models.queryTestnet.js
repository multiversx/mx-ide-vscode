var QueryTestnetFacade = Backbone.Model.extend({
    initialize: function () {
        var self = this;

        app.events.on("extension-message:testnetQueryResponse", function (payload) {
            self.set("valueResponse", payload);
        });

        app.events.on("extension-message:testnet-query:request", function (payload) {
            self.set("rawRequest", payload);
        });

        app.events.on("extension-message:testnet-query:response", function (payload) {
            self.set("rawResponse", payload);
        });
    },

    sendQuery: function(queryParams) {
        var payload = queryParams.toJSON();
        payload.correlationTag = Math.random().toString(32);
        app.talkToVscode("testnetQuerySendRequest", payload);
    }
});

var QueryTestnetParams = Backbone.Model.extend({
    validate: function (attrs, options) {
        if (!attrs.proxyUrl) {
            return "Proxy URL is not specified.";
        }

        if (!attrs.scAddress) {
            return "Smart contract address is not specified.";
        }

        if (!attrs.functionName) {
            return "Function name is not specified.";
        }

        if (!attrs.resultType) {
            return "Result type is not specified.";
        }
    }
});