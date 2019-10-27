var EnvironmentView = Backbone.View.extend({
    events: {
        "click .btn-refresh": "onClickRefresh",
        "click .btn-install-build-tools": "onClickInstallBuildTools",
        "click .btn-install-go": "onClickInstallGo",
        "click .btn-install-debug-node": "onClickInstallDebugNode"
    },

    initialize: function () {
        this.downloadsProgress = {};
        this.listenTo(this.model, "change", this.onModelChange);
        this.listenTo(this.model, "change:downloading", this.onDownloadChange);
        this.doRefresh();
    },

    onModelChange: function () {
        this.$el.find(".configuration-ide-folder").text(this.model.get("IdeFolder"));
        this.$el.find(".configuration-download-mirror").text(this.model.get("DownloadMirror"));
    },

    onDownloadChange: function() {
        var downloading = this.model.get("downloading");
        var url = downloading.url;
        this.downloadsProgress[url] = downloading;
        this.renderDownloadProgress();
    },

    onClickRefresh: function () {
        this.doRefresh();
    },

    doRefresh() {
        app.talkToVscode("environment-refresh");
    },

    renderDownloadProgress: function() {
        var template = app.underscoreTemplates["TemplateDownloadsProgress"];
        var html = template({ downloads: this.downloadsProgress });
        this.$el.find(".downloads-progress").html(html);
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