import { EventEmitter, Uri, UriHandler } from "vscode";

export class CustomUriHandler extends EventEmitter<Uri> implements UriHandler {
    public handleUri(uri: Uri) {
        this.fire(uri);
    }
}

