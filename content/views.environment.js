var EnvironmentView = Backbone.View.extend({
    events: {
        "click .btn-refresh": "onClickRefresh",
        "click .btn-install-build-tools": "onClickInstallBuildTools",
        "click .btn-install-debug-node": "onClickInstallDebugNode"
    },

    initialize: function () {
        this.listenTo(this.model, "change", this.onModelChange);
        this.doRefresh();
    },

    onModelChange: function () {
        this.$el.find("input[name='ToolsFolder']").val(this.model.get("ToolsFolder"));
    },

    onClickRefresh: function () {
        this.doRefresh();
    },

    doRefresh() {
        app.talkToVscode("environment-refresh");
    },

    onClickInstallBuildTools: function () {
        app.talkToVscode("environment-install-build-tools");
    },

    onClickInstallDebugNode: function () {
        app.talkToVscode("environment-install-debug-node");
    }
});