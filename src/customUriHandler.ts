import { Event, EventEmitter, Uri, UriHandler } from "vscode";

export class CustomUriHandler implements UriHandler {
    private readonly onDidAuthenticateEventEmitter = new EventEmitter<Uri>();

    public readonly onDidAuthenticate: Event<Uri> = this.onDidAuthenticateEventEmitter.event;

    public handleUri(uri: Uri) {
        if (uri.path === "/on-native-authentication-ready") {
            this.onDidAuthenticateEventEmitter.fire(uri);
        }
    }
}

