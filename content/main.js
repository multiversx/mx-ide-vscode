var app = {};
app.events = _.extend({}, Backbone.Events);

$(function () {
    main();
});

function main() {
    app.vscode = acquireVsCodeApi();
    app.smartContracts = new SmartContractsCollection();
    initializeUnderscoreTemplates();
    listenToExtensionMessages();

    // Listen to vscode extension messages.
    window.addEventListener("message", event => {
        app.events.trigger(`extension-message:${event.data.what}`, event.data.payload || {});
    });

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

function listenToExtensionMessages() {
    app.events.on("extension-message:debugger:output", function (payload) {
        onMessageDebuggerOutput(payload);
    });

    app.events.on("extension-message:debugger:error", function (payload) {
        onMessageDebuggerError(payload);
    });

    app.events.on("extension-message:refreshSmartContracts", function (payload) {
        onMessageRefreshSmartContracts(payload);
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
        app.talkToVscode("refreshSmartContracts");
    }
});

var SmartContractPanelView = Backbone.View.extend({
    tagName: "div",

    events: {
        "click .btn-build-contract": "onClickBuild",
        "click .btn-deploy-contract": "onClickDeploy",
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
    },

    onClickBuild: function () {

    },

    onClickDeploy: function () {
        app.talkToVscode("deploySmartContract", { });
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
        app.talkToVscode("startDebugServer");
    },

    onClickStopDebugServer: function () {
        app.talkToVscode("stopDebugServer");
    }
});

app.talkToVscode = function (what, payload) {
    app.log(what);
    app.log(payload);
    app.vscode.postMessage({ what: what, payload: payload });
};

app.log = function (message) {
    console.log(message);

    if (typeof message !== "string") {
        message = JSON.stringify(message, null, 4);
    }

    var element = $("<div>").text(message);
    $("#ExtensionConsole .payload").append(element);
};