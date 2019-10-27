var ManageNodeDebugView = Backbone.View.extend({
    events: {
        "click .btn-start-node-debug": "onClickStartNodeDebug",
        "click .btn-stop-node-debug": "onClickStopNodeDebug",
    },

    initialize: function () {
    },

    onClickStartNodeDebug: function () {
        app.talkToVscode("startNodeDebug");
    },

    onClickStopNodeDebug: function () {
        app.talkToVscode("stopNodeDebug");
    }
});

var ConfigurationView = Backbone.View.extend({
    events: {
    },

    initialize: function () {
    }
});