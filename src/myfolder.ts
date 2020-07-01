import path = require('path');
import fs = require('fs');
import { FsFacade } from './utils';
import glob = require('glob');
import { MyError } from './errors';

export class MyFolder {
    public readonly Path: string;
    public readonly Name: string;
    public readonly ParentPath: string;

    // Workspace-aware / extension-aware properties.
    public readonly PathRelativeToWorkspace: string;

    constructor(folderPath: string) {
        this.Path = folderPath;
        this.assertExists();

        // let parsedPath = path.parse(filePath);

        // this.Name = path.basename(filePath);
        // this.PathRelativeToWorkspace = this.Path.replace(FsFacade.getPathToWorkspace(), "");
        // this.PathRelativeToContent = this.Path.replace(FsFacade.getPathToContent(), "");
        // this.WorkspaceProjectName = this.PathRelativeToWorkspace.split(path.sep).filter(item => item.length > 0)[0];
        // this.WorkspaceProject = path.join(FsFacade.getPathToWorkspace(), this.WorkspaceProjectName);
    }

    public assertExists() {
        if (!this.exists()) {
            throw new MyError({ Message: `Missing folder: ${this.Path}` });
        }
    }

    public exists(): boolean {
        return fs.existsSync(this.Path);
    }
}


export function findFirst(parent: string, recursive?: boolean, require: boolean = false): MyFolder {
    let myFiles = find(parent, recursive);
    let myfile = myFiles[0];

    if (require && !myfile) {
        throw new MyError({ Message: `No folder found` });
    }

    return myfile || null;
}

// TODO: Fix implementation
export function find(parent: string, recursive?: boolean): MyFolder[] {
    let folders = [];
    let pattern = `${parent}/`;

    if (recursive) {
        pattern += "**/";
    }

    // TODO: implement

    let localPattern = pattern + "*";
    // The actual search:
    let localFiles = glob.sync(localPattern, {});
    folders.push(...localFiles);

    return null;
}