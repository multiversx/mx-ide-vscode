var app = {};

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
        this.collection.on("reset", this.render, this);
        this.render();
    },

    render: function () {
        this.collection.each(this.renderContract, this);
        return this;
    },

    renderContract: function (contract) {
        console.log("renderContract");
        console.log(contract);
    },

    onClickRefreshSmartContracts: function() {
        app.vscode.postMessage({
            command: "refreshSmartContracts"
        })
    }
});

var SmartContractPanelView = Backbone.View.extend({
    tagName: "div",

    events: {
    },

    initialize: function () {
        this.listenTo(this.model, "change", this.render);
    },

    render: function () {
        var template = underscoreTemplates["TemplateSmartContractPanel"];
        var html = template({ contract: this.model });
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
        app.vscode.postMessage({
            command: "startDebugServer"
        })
    },

    onClickStopDebugServer: function () {
        app.vscode.postMessage({
            command: "stopDebugServer"
        })
    }
});