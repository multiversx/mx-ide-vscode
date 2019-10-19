var SmartContract = Backbone.Model.extend({
    initialize: function () {
    },

    build: function() {
        app.talkToVscode("buildSmartContract", { id: this.get("FriendlyId") });
    },

    deploy: function(payload) {
        payload.id = this.get("FriendlyId");
        app.talkToVscode("deploySmartContract", payload);
    },

    run: function(payload) {
        payload.id = this.get("FriendlyId");
        app.talkToVscode("runSmartContract", payload);
    }
});

var SmartContractsCollection = Backbone.Collection.extend({
    model: SmartContract
});