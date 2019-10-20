var SmartContractPanelView = Backbone.View.extend({
    tagName: "div",

    events: {
        "click .btn-build-contract": "onClickBuild",
        "click .btn-deploy-contract": "onClickDeploy",
        "click .btn-run-contract": "onClickRun",
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

    onClickDeploy: function () {
        var deployDialog = new DeployDialog({
            model: this.model
        });

        deployDialog.show();
    },

    onClickRun: function () {
        var senderAddress = app.configurationView.getSenderAddress();
        var functionName = this.getFunctionName();
        var functionArgs = this.getFunctionArgs();
        var value = this.getRunValue();
        var gasLimit = this.getGasLimit();
        var gasPrice = this.getGasPrice();

        this.model.run({
            senderAddress: senderAddress,
            functionName: functionName,
            functionArgs: functionArgs,
            value: value,
            gasLimit: gasLimit,
            gasPrice: gasPrice
        });
    },

    getFunctionName: function () {
        return this.$el.find("[name='FunctionName']").val();
    },

    getFunctionArgs: function () {
        var argsString = this.$el.find("[name='FunctionArgs']").val();
        var args = argsString.split("\n");
        return args;
    },

    getRunValue: function () {
        return this.$el.find("[name='Value']").val();
    },

    getGasLimit: function () {
        return Number(this.$el.find("[name='GasLimit']").val());
    },

    getGasPrice: function () {
        return Number(this.$el.find("[name='GasPrice']").val());
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