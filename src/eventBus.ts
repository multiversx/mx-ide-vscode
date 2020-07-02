import { EventEmitter } from 'events';

export class MyEventBus extends EventEmitter { 
    public emit(event: string | symbol, ...args: any[]): boolean {
        let argsClone = Object.assign([], args);
        // Emit for "precise observers".
        super.emit(event, ...argsClone);

        let eventNamespace = event.toString().split(":")[0];
        if (eventNamespace) {
            let argsClone = Object.assign([], args);
            // Last argument will be the precise event identifier
            argsClone.push(event);
            // Emit for "wildcard observers".
            super.emit(`${eventNamespace}:*`, ...argsClone);
        }

        return true;
    }
}

let eventBus = new MyEventBus();
export default eventBus;
