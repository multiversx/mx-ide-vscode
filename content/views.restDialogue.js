var RestDialogueListView = Backbone.View.extend({
    tagName: "div",

    initialize: function () {
        this.listenTo(this.collection, "add", this.onItemAdded);
        this.render();
    },

    render: function () {
        return this;
    },

    onItemAdded: function (item) {
        var itemView = new RestDialogueItemView({ model: item });
        this.$el.append(itemView.$el);
    }
});

var RestDialogueItemView = Backbone.View.extend({
    initialize: function () {
        this.listenTo(this.model, "change", this.render);
        this.render();
    },

    render: function () {
        var template = app.underscoreTemplates["TemplateRestDialogueItem"];
        var item = this.model.toJSON();
        var html = template({ item: item });
        this.$el.html(html);

        return this;
    },
});