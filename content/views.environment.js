var EnvironmentView = Backbone.View.extend({
    events: {
        "click .btn-refresh": "onClickRefresh",
        "click .btn-install-build-tools": "onClickInstallBuildTools",
        "click .btn-install-go": "onClickInstallGo",
        "click .btn-install-debug-node": "onClickInstallDebugNode"
    },

    initialize: function () {
        this.listenTo(this.model, "change", this.onModelChange);
        this.listenTo(this.model, "change:downloading", this.onDownloadChange);
        this.doRefresh();
    },

    onModelChange: function () {
        this.$el.find("input[name='ToolsFolder']").val(this.model.get("ToolsFolder"));
    },

    onDownloadChange: function() {
        var downloading = this.model.get("downloading");

        this.$el.find(".downloading-url").html(downloading.url);
        this.$el.find(".downloading-progress").html(`${downloading.percentage} %`);
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

    onClickInstallGo: function() {
        app.talkToVscode("environment-install-go");
    },

    onClickInstallDebugNode: function () {
        app.talkToVscode("environment-install-debug-node");
    }
});