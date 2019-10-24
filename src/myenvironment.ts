import path = require('path');
import { MySettings } from './settings';
import { ProcessFacade, FsFacade } from "./utils";
import { Presenter } from './presenter';

export class MyEnvironment {

    static async installBuildTools(): Promise<any> {
    }

    static async installDebugNode(): Promise<any> {
    }
}