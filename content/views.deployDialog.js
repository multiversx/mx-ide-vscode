var DeployDialog = Backbone.View.extend({
    tagName: "div",
    className: "modal",

    events: {
        "shown.bs.modal": "onBootstrapModalShown",
        "hidden.bs.modal": "onBootstrapModalHidden",
        "click .btn-submit": "onClickSubmit",
        "change input[name='PrivateKeyFile']": "onChangePrivateKey"
    },

    initialize: function (options) {
        this.onTestnet = options.onTestnet;
        this.listenTo(this.model, "change", this.onModelChange);
        this.render();
    },

    onModelChange: function () {
        this.render();
    },

    render: function () {
        var template = app.underscoreTemplates["TemplateDeployDialog"];
        var contract = this.model.toJSON();
        var html = template({ contract: contract, onTestnet: this.onTestnet });
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

    onBootstrapModalShown: function () {
    },

    onBootstrapModalHidden: function () {
        this.$el.data('modal', null);
        this.remove();
    },

    onChangePrivateKey: function (event) {
        var self = this;
        var file = event.currentTarget.files[0];
        var reader = new FileReader();

        reader.onload = function (onloadEvent) {
            self.privateKey = onloadEvent.target.result;
        };

        reader.readAsText(file);
    },

    onClickSubmit: function () {
        var testnetNodeEndpoint = this.getTestnetNodeEndpoint();
        var senderAddress = this.getSenderAddress();

        var deployOptions = new SmartContractDeployOptions({
            testnetNodeEndpoint: testnetNodeEndpoint,
            privateKey: this.privateKey,
            senderAddress: senderAddress,
            onTestnet: this.onTestnet
        });

        this.clearValidationErrors();

        if (deployOptions.isValid()) {
            this.model.deploy(deployOptions);
        } else {
            this.displayValidationErrors(deployOptions.validationError);
        }
    },

    clearValidationErrors: function () {
        this.$el.find(".validation-errors-container").addClass("d-none").empty();
    },

    displayValidationErrors: function (validationError) {
        this.$el.find(".validation-errors-container").removeClass("d-none").text(validationError);
    },

    getTestnetNodeEndpoint() {
        return this.$el.find("[name='TestnetNodeEndpoint']").val();
    },

    getSenderAddress() {
        return this.$el.find("[name='SenderAddress']").val();
    }
});