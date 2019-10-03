var vscode = acquireVsCodeApi();

window.addEventListener("message", event => {
    var eventData = event.data;
    var what = eventData.what;

    if (what == "debugger:output") {
        appendToOutput($("<div>").text(eventData.data));
    } else if (what == "debugger:error") {
        appendToOutput($("<div class='text-danger'>").text(eventData.data));
    }
});

function appendToOutput(element) {
    $("#DebuggerStdout .payload").append(element);
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
});