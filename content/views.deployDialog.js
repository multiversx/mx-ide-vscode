var DeployDialog = Backbone.View.extend({
    tagName: "div",
    className: "modal",

    events: {
        "shown.bs.modal": "onBootstrapModalShown",
        "hidden.bs.modal": "onBootstrapModalHidden",
        "click .btn-submit": "onClickSubmit"
    },

    initialize: function () {
        this.render();
    },

    render: function () {
        var template = app.underscoreTemplates["TemplateDeployDialog"];
        var html = template({});
        this.$el.html(html);
        this.$el.modal({ show: false });
        this.$el.appendTo("body");

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
        this.model.deploy({ senderAddress: senderAddress });
    },

    getSenderAddress() {
        return this.$el.find("[name='SenderAddress']").val();
    }
});