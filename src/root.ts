import * as vscode from 'vscode';
import { EventEmitter } from 'events';

export class EventBus extends EventEmitter { }

export class MyExtension {
    public static ExtensionContext: vscode.ExtensionContext;
    public static EventBus: EventBus = new EventBus();
}