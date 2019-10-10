import { EventEmitter } from 'events';

export class EventBus extends EventEmitter { }

let eventBus = new EventEmitter();
export default eventBus;
