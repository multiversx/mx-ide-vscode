var SmartContract = Backbone.Model.extend({
    idAttribute: "FriendlyId",

    initialize: function () {
    },

    build: function() {
        app.talkToVscode("buildSmartContract", { id: this.id });
    },

    deploy: function(payload) {
        payload.id = this.id;
        app.talkToVscode("deploySmartContract", payload);
    },

    run: function(payload) {
        payload.id = this.id;
        app.talkToVscode("runSmartContract", payload);
    }
});

var SmartContractsCollection = Backbone.Collection.extend({
    model: SmartContract
});