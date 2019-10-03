var vscode = acquireVsCodeApi();

window.addEventListener("message", event => {
    var eventData = event.data;
    var what = eventData.what;

    if (what == "debugger:output") {
        appendToOutput($("<div>").text(eventData.data));
    } else if (what == "debugger:error") {
        appendToOutput($("<div class='text-danger'>").text(eventData.data));
    } else if (what == "refreshSmartContracts") {
        refreshSmartContracts(eventData.contracts);
    }
});

function appendToOutput(element) {
    $("#DebuggerStdout .payload").append(element);
}

function refreshSmartContracts(contracts) {
    $(".smart-contracts").html(JSON.stringify(contracts));
}

$(function () {
    $(".btn-start-debug-server").click(function () {
        vscode.postMessage({
            command: "startDebugServer"
        })
    });

    $(".btn-stop-debug-server").click(function () {
        vscode.postMessage({
            command: "stopDebugServer"
        })
    });

    $(".btn-refresh-smart-contracts").click(function () {
        vscode.postMessage({
            command: "refreshSmartContracts"
        })
    });
});