var app = {};
app.events = _.extend({}, Backbone.Events);

$(function () {
    main();
});

function main() {
    app.vscode = acquireVsCodeApi();
    app.smartContracts = new SmartContractsCollection();
    initializeUnderscoreTemplates();
    listenToVsCodeMessages();

    app.manageDebugServerView = new ManageDebugServerView({
        el: ".manage-debug-server-view"
    });

    app.smartContractsListView = new SmartContractsListView({
        el: ".smart-contracts-list-view",
        collection: app.smartContracts
    });
}

function initializeUnderscoreTemplates() {
    app.underscoreTemplates = {};

    $("script[type='text/template']").each(function () {
        var $this = $(this);
        var key = $this.attr("id");
        var htmlTemplate = $this.html();
        var compiledTemplate = _.template(htmlTemplate);

        app.underscoreTemplates[key] = compiledTemplate;
    });
}

function listenToVsCodeMessages() {
    window.addEventListener("message", event => {
        var eventData = event.data;
        var what = eventData.what;

        if (what == "debugger:output") {
            onMessageDebuggerOutput(eventData.data);
        } else if (what == "debugger:error") {
            onMessageDebuggerError(eventData.data);
        } else if (what == "refreshSmartContracts") {
            onMessageRefreshSmartContracts(eventData.contracts);
        }
    });
}

function onMessageDebuggerOutput(data) {
    appendToOutput($("<div>").text(data));
}

function onMessageDebuggerError(data) {
    appendToOutput($("<div class='text-danger'>").text(data));
}

function appendToOutput(element) {
    $("#DebuggerStdout .payload").append(element);
}

function onMessageRefreshSmartContracts(contracts) {
    app.smartContracts.reset(contracts);
}

var SmartContract = Backbone.Model.extend({
    initialize: function () {
    }
});

var SmartContractsCollection = Backbone.Collection.extend({
    model: SmartContract
});

var SmartContractsListView = Backbone.View.extend({
    tagName: "div",

    events: {
        "click .btn-refresh-smart-contracts": "onClickRefreshSmartContracts"
    },

    initialize: function () {
        this.childViews = [];
        this.listenTo(this.collection, "reset", this.render);
        this.render();
    },

    render: function () {
        this.removeChildViews();
        this.createChildViews();
        return this;
    },

    removeChildViews: function () {
        _.each(this.childViews, function (childView) {
            childView.remove();
        });

        this.childViews = [];
    },

    createChildViews: function () {
        this.collection.each(this.createChildView, this);
    },

    createChildView: function (contract) {
        var childView = new SmartContractPanelView({ model: contract });
        childView.render();
        this.$el.append(childView.$el);
        this.childViews.push(childView);
    },

    onClickRefreshSmartContracts: function () {
        app.tellVsCode({
            command: "refreshSmartContracts"
        })
    }
});

var SmartContractPanelView = Backbone.View.extend({
    tagName: "div",

    events: {
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
        return this;
    }
});

var ManageDebugServerView = Backbone.View.extend({
    events: {
        "click .btn-start-debug-server": "onClickStartDebugServer",
        "click .btn-stop-debug-server": "onClickStopDebugServer",
    },

    initialize: function () {
    },

    onClickStartDebugServer: function () {
        app.tellVsCode({
            command: "startDebugServer"
        })
    },

    onClickStopDebugServer: function () {
        app.tellVsCode({
            command: "stopDebugServer"
        })
    }
});

app.tellVsCode = function (message) {
    app.log(message);
    app.vscode.postMessage(message);
};

app.log = function (message) {
    console.log(message);

    if (typeof message !== "string") {
        message = JSON.stringify(message, null, 4);
    }

    var element = $("<div>").text(message);
    $("#ExtensionConsole .payload").append(element);
};