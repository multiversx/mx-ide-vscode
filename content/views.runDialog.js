var RunDialog = Backbone.View.extend({
    tagName: "div",
    className: "modal",

    events: {
        "shown.bs.modal": "onBootstrapModalShown",
        "hidden.bs.modal": "onBootstrapModalHidden",
        "click .btn-submit": "onClickSubmit"
    },

    initialize: function () {
        this.listenTo(this.model, "change", this.onModelChange);
        this.render();
    },

    onModelChange: function() {
        this.render();
    },

    render: function () {
        var template = app.underscoreTemplates["TemplateRunDialog"];
        var contract = this.model.toJSON();
        var html = template({ contract: contract });
        this.$el.html(html);

        if (!$.contains(document, this.el)) {
            this.$el.appendTo("body");
            this.$el.modal({ show: false });
        }

        return this;
    },

    show: function () {
        this.$el.modal("show");
    },

    close: function () {
        this.$el.modal("hide");
    },

    onBootstrapModalShown: function() {
    },

    onBootstrapModalHidden: function() {
        this.$el.data('modal', null);
        this.remove();
    },

    onClickSubmit: function() {
        var senderAddress = this.getSenderAddress();
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

    getSenderAddress() {
        return this.$el.find("[name='SenderAddress']").val();
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