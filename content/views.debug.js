var DebugView = Backbone.View.extend({
    events: {
    },

    initialize: function () {
        this.listenTo(this.collection, "update", this.render);
        this.render();
    },

    render: function () {
        this.renderListOfContracts();
    },

    renderListOfContracts: function () {
        var selectList = this.getListOfContractsElement();

        if (this.collection.length == 0) {
            selectList.prop("disabled", "disabled");
        } else {
            selectList.prop("disabled", false);
        }

        this.collection.each(function (model) {
            var contractFriendlyId = model.get("FriendlyId");
            var option = new Option(contractFriendlyId, contractFriendlyId);
            selectList.append(option);
        });
    },

    getListOfContractsElement() {
        return this.$el.find("[name='FocusedSmartContract']");
    },

    focusOnSmartContract: function(friendlyId) {
        this.getListOfContractsElement().val(friendlyId);
    }
});