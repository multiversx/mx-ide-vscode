var DebugOnTestnetView = Backbone.View.extend({
    events: {
        "change [name='FocusedSmartContract']": "onChangeFocusedContract"
    },

    initialize: function () {
        this.listenTo(this.collection, "update", this.render);
        this.render();
    },

    render: function () {
        this.renderListOfContracts();
        this.renderPanelForContract();
    },

    renderListOfContracts: function () {
        // todo: get selected

        var selectList = this.getListOfContractsElement();

        if (this.collection.length == 0) {
            selectList.prop("disabled", "disabled");
        } else {
            selectList.prop("disabled", false);
        }

        selectList.empty();
        
        this.collection.each(function (model) {
            var contractFriendlyId = model.get("FriendlyId");
            var option = new Option(contractFriendlyId, contractFriendlyId);
            selectList.append(option);
        });

        // todo: restore selected
    },

    getListOfContractsElement: function() {
        return this.$el.find("[name='FocusedSmartContract']");
    },

    renderPanelForContract: function() {
        var model = this.getFocusedContract();

        if (!model) {
            return;
        }

        var contract = model.toJSON();
        var template = app.underscoreTemplates["DebugOnTestnetPanelForContract"];
        var html = template({ contract: contract });
        this.$el.find(".debug-panel").html(html);
    },

    focusOnSmartContract: function(friendlyId) {
        this.getListOfContractsElement().val(friendlyId);
        this.onChangeFocusedContract();
    },

    onChangeFocusedContract: function() {
        this.renderPanelForContract();
    },

    getFocusedContract: function() {
        var friendlyId = this.getListOfContractsElement().val();
        
        if (!friendlyId) {
            return null;
        }

        var model = this.collection.get(friendlyId);
        return model;
    }
});