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
    app.queryTestnetFacade = new QueryTestnetFacade();
    app.variables = new VariablesModel();

    initializeNavigation();
    initializeUnderscoreTemplates();
    listenToExtensionMessages();

    // Listen to vscode extension messages.
    window.addEventListener("message", event => {
        app.log("INCOMING MESSAGE: " + event.data.what);
        app.log(event.data.payload);
        app.events.trigger(`extension-message:${event.data.what}`, event.data.payload || {});
    });

    app.manageNodeDebugView = new ManageNodeDebugView({
        el: ".manage-node-debug-view"
    });

    app.configurationView = new ConfigurationView({
        el: ".configuration-view"
    });

    app.debugView = new DebugView({
        el: ".debug-view",
        collection: app.smartContracts
    });

    app.environmentView = new EnvironmentView({
        el: ".environment-view",
        model: app.environment
    });

    app.queryTestnetView = new QueryTestnetView({
        el: ".query-testnet-view",
        model: app.queryTestnetFacade
    });

    app.variablesView = new VariablesView({
        el: ".variables-view",
        model: app.variables
    });

    app.smartContractsListView = new SmartContractsListView({
        el: ".smart-contracts-list-view",
        collection: app.smartContracts
    });

    app.restDialogueListView = new RestDialogueListView({
        el: "#RestDialogue",
        collection: app.restDialogue
    });
}

function initializeNavigation() {
    $(".nav-item .nav-link").click(function (event) {
        event.stopPropagation();
        
        var viewName = $(this).attr("data-view");
        showView(viewName);
    });
}

function showView(viewName) {
    var views = $(document).find(".views-container .view");
    var viewToShow = $(document).find(`#${viewName}`);
    var nav = $(document).find("nav");
    var navLinks = nav.find(".nav-link");
    var navLinkToActivate = nav.find(`[data-view='${viewName}']`);

    navLinks.removeClass("active");
    navLinkToActivate.addClass("active");
    views.addClass("d-none");
    viewToShow.removeClass("d-none");
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
    // Others
    app.events.on("extension-message:refreshSmartContracts", function (payload) {
        onMessageRefreshSmartContracts(payload);
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
};
