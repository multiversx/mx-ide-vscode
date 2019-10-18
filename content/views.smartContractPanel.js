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

    renderVMOutput: function() {
        if (this.VMOutputView) {
            this.VMOutputView.remove();
        }

        this.VMOutputView = new VMOutputView({ 
            el: this.$el.find(".vm-output-view"),
            model: this.model.get("LatestRun")
        });

        this.VMOutputView.render();
    },

    onClickBuild: function () {
        app.talkToVscode("buildSmartContract", { id: this.model.get("FriendlyId") });
    },

    onClickDeploy: function () {
        var senderAddress = app.configurationView.getSenderAddress();

        app.talkToVscode("deploySmartContract", {
            id: this.model.get("FriendlyId"),
            senderAddress: senderAddress
        });
    },

    onClickRun: function () {
        var senderAddress = app.configurationView.getSenderAddress();
        var functionName = this.getFunctionName();
        var functionArgs = this.getFunctionArgs();
        var value = this.getRunValue();
        var gasLimit = this.getGasLimit();
        var gasPrice = this.getGasPrice();

        app.talkToVscode("runSmartContract", {
            id: this.model.get("FriendlyId"),
            senderAddress: senderAddress,
            functionName: functionName,
            functionArgs: functionArgs,
            value: value,
            gasLimit: gasLimit,
            gasPrice: gasPrice
        });
    },

    getFunctionName: function() {
        return this.$el.find("[name='FunctionName']").val();
    },

    getFunctionArgs: function() {
        var argsString = this.$el.find("[name='FunctionArgs']").val();
        var args = argsString.split("\n");
        return args;
    },

    getRunValue: function() {
        return this.$el.find("[name='Value']").val();
    },

    getGasLimit: function() {
        return Number(this.$el.find("[name='GasLimit']").val());
    },

    getGasPrice: function() {
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