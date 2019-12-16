var SmartContractPanelView = Backbone.View.extend({
    tagName: "div",

    events: {
        "click .btn-build-contract": "onClickBuild",
        "click .btn-build-options": "onClickBuildOptions",
        "click .btn-goto-debug": "onClickGotoDebug",
        "click .btn-goto-debug-on-testnet": "onClickGotoDebugOnTestnet"
    },

    initialize: function () {
        this.listenTo(this.model, "change", this.onModelChange);
    },

    onModelChange: function () {
        this.render();
    },

    render: function () {
        var template = app.underscoreTemplates["TemplateSmartContractPanel"];
        var contract = this.model.toJSON();
        var html = template({ contract: contract });
        this.$el.html(html);

        return this;
    },

    onClickBuild: function () {
        this.model.build();
    },

    onClickBuildOptions: function () {
        var dialog = new BuildOptionsDialog({
            model: this.model
        });

        dialog.show();
    },

    onClickGotoDebug: function () {
        var friendlyId = this.model.get("FriendlyId");
        app.debugView.focusOnSmartContract(friendlyId);
        showView("Debug");
    },

    onClickGotoDebugOnTestnet: function () {
        var friendlyId = this.model.get("FriendlyId");
        app.debugOnTestnetView.focusOnSmartContract(friendlyId);
        showView("DebugOnTestnet");
    }
});