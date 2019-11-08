var SmartContractPanelView = Backbone.View.extend({
    tagName: "div",

    events: {
        "click .btn-build-contract": "onClickBuild",
        "click .btn-build-options": "onClickBuildOptions",
        "click .btn-deploy-contract": "onClickDeploy",
        "click .btn-deploy-contract-testnet": "onClickDeployOnTestnet",
        "click .btn-run-contract": "onClickRun",
        "click .btn-run-contract-testnet": "onClickRunTestnet",
        "click .btn-configure-watch": "onClickConfigureWatch",
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
        this.renderVMOutput();

        return this;
    },

    renderVMOutput: function () {
        if (this.vmOutputView) {
            this.vmOutputView.remove();
        }

        this.vmOutputView = new VMOutputView({
            el: this.$el.find(".vm-output-view"),
            model: this.model.get("LatestRun")
        });

        this.vmOutputView.render();
    },

    onClickBuild: function () {
        this.model.build();
    },

    onClickBuildOptions: function() {
        var dialog = new BuildOptionsDialog({
            model: this.model
        });

        dialog.show();
    },

    onClickDeploy: function () {
        var dialog = new DeployDialog({
            model: this.model
        });

        dialog.show();
    },

    onClickDeployOnTestnet: function () {
        var dialog = new DeployDialog({
            model: this.model,
            onTestnet: true
        });

        dialog.show();
    },

    onClickRun: function () {
        var dialog = new RunDialog({
            model: this.model
        });

        dialog.show();
    },

    onClickRunTestnet: function () {
        var dialog = new RunDialog({
            model: this.model,
            onTestnet: true
        });

        dialog.show();
    },

    onClickConfigureWatch: function() {
        var dialog = new ConfigureWatchDialog({
            model: this.model
        });

        dialog.show();
    }
});

var VMOutputView = Backbone.View.extend({
    tagName: "div",

    initialize: function () {
        this.render();
    },

    render: function () {
        var template = app.underscoreTemplates["TemplateVMOutput"];
        var html = template({ data: this.model.VMOutput || {} });
        this.$el.html(html);
        return this;
    },
});