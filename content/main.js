window.addEventListener("message", event => {
    console.log(event);
    console.log(event.data);
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