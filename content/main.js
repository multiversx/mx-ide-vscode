$(function () {
    main();
});

function main() {
    let vscode = acquireVsCodeApi();
    let iframeWindow = document.getElementById("ErdpyIframe").contentWindow;

    // Listen to messages from iframe, forward to vscode.
    // Listen to messages from vscode, forward to iframe.
    window.addEventListener("message", event => {
        let fromErdpy = event.source == iframeWindow;
        let data = event.data;
        let what = data.what;
        let payload = data.payload || {};
        let json = JSON.stringify(data);

        if (fromErdpy) {
            if (what == "log") {
                console.log(`[erdpy (log)]: ${JSON.stringify(payload)}`);
            } else {
                console.log(`[From erdpy to vscode]: ${json}`);
                vscode.postMessage({ what: what, payload: payload });
            }
        } else {
            console.log(`[From vscode to erdpy]: ${json}`);
            iframeWindow.postMessage({ what: what, payload: payload }, "*")
        }
    });
}