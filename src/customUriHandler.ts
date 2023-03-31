import { Event, EventEmitter, Uri, UriHandler } from "vscode";
import { urlSegmentOnNativeAuthenticationReady } from "./constants";

export class CustomUriHandler implements UriHandler {
    private readonly onDidAuthenticateEventEmitter = new EventEmitter<Uri>();

    public readonly onDidAuthenticate: Event<Uri> = this.onDidAuthenticateEventEmitter.event;

    public handleUri(uri: Uri) {
        if (uri.path === urlSegmentOnNativeAuthenticationReady) {
            this.onDidAuthenticateEventEmitter.fire(uri);
        }
    }
}

