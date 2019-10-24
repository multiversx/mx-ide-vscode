var ManageDebugServerView = Backbone.View.extend({
    events: {
        "click .btn-start-debug-server": "onClickStartDebugServer",
        "click .btn-stop-debug-server": "onClickStopDebugServer",
    },

    initialize: function () {
    },

    onClickStartDebugServer: function () {
        app.talkToVscode("startDebugServer");
    },

    onClickStopDebugServer: function () {
        app.talkToVscode("stopDebugServer");
    }
});

var ConfigurationView = Backbone.View.extend({
    events: {
    },

    initialize: function () {
    }
});

var EnvironmentView = Backbone.View.extend({
    events: {
        "click .btn-install-build-tools": "onClickInstallBuildTools",
        "click .btn-install-debug-node": "onClickInstallDebugNode"
    },

    initialize: function () {
    },

    onClickInstallBuildTools: function() {
        app.talkToVscode("environment-install-build-tools");
    },

    onClickInstallDebugNode: function() {
        app.talkToVscode("environment-install-debug-node");
    }
});