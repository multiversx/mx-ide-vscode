var app = {};
app.events = _.extend({}, Backbone.Events);

$(function () {
    main();
});

function main() {
    app.vscode = acquireVsCodeApi();
    app.smartContracts = new SmartContractsCollection();
    app.restDialogue = new RestDialogueCollection();
    app.environment = new EnvironmentModel();
    initializeUnderscoreTemplates();
    listenToExtensionMessages();

    // Listen to vscode extension messages.
    window.addEventListener("message", event => {
        app.log("INCOMING MESSAGE: " + event.data.what);
        app.log(event.data.payload);
        app.events.trigger(`extension-message:${event.data.what}`, event.data.payload || {});
    });

    app.manageDebugServerView = new ManageDebugServerView({
        el: ".manage-debug-server-view"
    });

    app.configurationView = new ConfigurationView({
        el: ".configuration-view"
    });

    app.environmentView = new EnvironmentView({
        el: ".environment-view",
        model: app.environment
    });

    app.smartContractsListView = new SmartContractsListView({
        el: ".smart-contracts-list-view",
        collection: app.smartContracts
    });

    app.restDialogueListView = new RestDialogueListView({
        el: "#RestDialogue .payload",
        collection: app.restDialogue
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
    // Builder
    app.events.on("extension-message:builder:started", function (payload) {
        $("#BuilderStdout .payload").append($("<div class='text-warning'>").text(payload.program));
        $("#BuilderStdout .payload").append($("<div class='text-warning'>").text(JSON.stringify(payload.args)));
    });

    app.events.on("extension-message:builder:output", function (payload) {
        $("#BuilderStdout .payload").append($("<div>").text(payload));
    });

    app.events.on("extension-message:builder:error", function (payload) {
        $("#BuilderStdout .payload").append($("<div class='text-danger'>").text(payload));
    });

    // Debugger
    app.events.on("extension-message:debugger:output", function (payload) {
        $("#DebuggerStdout .payload").append($("<div>").text(payload));
    });

    app.events.on("extension-message:debugger:error", function (payload) {
        $("#DebuggerStdout .payload").append($("<div class='text-danger'>").text(payload));
    });

    // Others
    app.events.on("extension-message:refreshSmartContracts", function (payload) {
        onMessageRefreshSmartContracts(payload);
    });

    app.events.on("extension-message:refreshEnvironment", function (payload) {
        app.environment.set(payload);
    });
}

function onMessageRefreshSmartContracts(contracts) {
    app.smartContracts.set(contracts);
}

app.talkToVscode = function (what, payload) {
    app.log("OUTGOING MESSAGE: " + what);
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
