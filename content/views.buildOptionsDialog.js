var BuildOptionsDialog = Backbone.View.extend({
    tagName: "div",
    className: "modal",

    events: {
        "shown.bs.modal": "onBootstrapModalShown",
        "hidden.bs.modal": "onBootstrapModalHidden",
        "click .btn-submit": "onClickSubmit"
    },

    initialize: function (options) {
        this.render();
    },

    onModelChange: function () {
        this.render();
    },

    render: function () {
        var template = app.underscoreTemplates["TemplateBuildOptionsDialog"];
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

    onBootstrapModalShown: function () {
    },

    onBootstrapModalHidden: function () {
        this.$el.data('modal', null);
        this.remove();
    },

    onClickSubmit: function () {
        var options = {
            exportedFunctions: this.getExported()
        };

        this.model.setBuildOptions(options);
        this.close();
    },

    getExported: function () {
        var text = this.$el.find("[name='ExportedFunctions']").val();
        return text;
    },
});