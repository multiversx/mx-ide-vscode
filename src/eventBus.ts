import { EventEmitter } from 'events';

export class MyEventBus extends EventEmitter { 
    public emit(event: string | symbol, ...args: any[]): boolean {
        let globalWildcard = "*";
        let namespacedWildcard = `${event.toString().split(":")[0]}:*`;

        // Last argument will be event name, in all cases.
        args.push(event);

        super.emit(globalWildcard, ...args);
        super.emit(namespacedWildcard, ...args)
        return super.emit(event, ...args);
    }
}

let eventBus = new MyEventBus();
export default eventBus;
