import { Event, EventEmitter, Uri, UriHandler } from "vscode";
import { urlSegmentOnNativeAuthenticationReady } from "./constants";
import { Feedback } from "./feedback";

export class CustomUriHandler implements UriHandler {
    private readonly onDidAuthenticateEventEmitter = new EventEmitter<Uri>();

    public readonly onDidAuthenticate: Event<Uri> = this.onDidAuthenticateEventEmitter.event;

    public handleUri(uri: Uri) {
        Feedback.debug(`CustomUriHandler.handleUri: ${uri.toString(true)}`);

        if (uri.path === "/" + urlSegmentOnNativeAuthenticationReady) {
            this.onDidAuthenticateEventEmitter.fire(uri);
        }
    }
}

