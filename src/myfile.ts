import path = require('path');
import fs = require('fs');
import { FsFacade } from './utils';
import glob = require('glob');
import { MyError } from './errors';

export class MyFile {
    public readonly Path: string;
    public readonly PathWithoutExtension: string;
    public readonly Name: string;
    public readonly NameWithoutExtension: string;
    public readonly Extension: string;
    public readonly FolderPath: string;
    public readonly FolderName: string;
    public readonly ModifiedOn: Date;

    // Workspace-aware / extension-aware properties.
    public readonly PathRelativeToWorkspace: string;
    public readonly PathRelativeToContent: string;
    public readonly WorkspaceProject: string;
    public readonly WorkspaceProjectName: string;

    // Properties with lazy initialization.
    public Text: string;
    public Binary: Buffer;

    constructor(filePath: string) {
        this.Path = filePath;
        this.assertExists();

        let parsedPath = path.parse(filePath);

        this.PathWithoutExtension = path.join(parsedPath.dir, parsedPath.name);
        this.Name = path.basename(filePath);
        this.NameWithoutExtension = parsedPath.name;
        this.Extension = parsedPath.ext.toLowerCase();
        this.FolderPath = parsedPath.dir;
        this.FolderName = path.basename(parsedPath.dir);
        this.ModifiedOn = fs.statSync(filePath).mtime;

        // TODO: Perhaps remove not needed
        // this.PathRelativeToWorkspace = this.Path.replace(FsFacade.getPathToWorkspace(), "");
        // this.PathRelativeToContent = this.Path.replace(FsFacade.getPathToContent(), "");
        // this.WorkspaceProjectName = this.PathRelativeToWorkspace.split(path.sep).filter(item => item.length > 0)[0];
        // this.WorkspaceProject = path.join(FsFacade.getPathToWorkspace(), this.WorkspaceProjectName);
    }

    public static findFirst(query: MyFilesQuery, require: boolean = false): MyFile {
        let myFiles = MyFile.find(query);
        let myfile = myFiles[0];

        if (require && !myfile) {
            throw new MyError({ Message: `No file matching: ${JSON.stringify(query, null, 4)}` });
        }

        return myfile || null;
    }

    public static find(query: MyFilesQuery): MyFile[] {
        let files = [];
        let pattern = `${query.Folder}/`;

        if (query.Recursive) {
            pattern += "**/";
        }

        if (query.Extensions) {
            query.Extensions.forEach(extension => {
                let localPattern = pattern + `*.${extension}`;
                // The actual search:
                let localFiles = glob.sync(localPattern, {});
                files.push(...localFiles);
            });
        } else {
            let localPattern = pattern + "*";
            // The actual search:
            let localFiles = glob.sync(localPattern, {});
            files.push(...localFiles);
        }

        let myFiles = files.map(file => new MyFile(file));
        return myFiles;
    }

    public readText(): string {
        this.assertExists();

        this.Text = fs.readFileSync(this.Path, { encoding: "utf8" });
        return this.Text;
    }

    public readBinary(): Buffer {
        this.assertExists();

        this.Binary = fs.readFileSync(this.Path);
        return this.Binary;
    }

    public readBinaryHex(): string {
        let buffer = this.readBinary();
        let hex = buffer.toString("hex");
        return hex;
    }

    public assertExists() {
        if (!fs.existsSync(this.Path)) {
            throw new MyError({ Message: `Missing file: ${this.Path}` });
        }
    }
}

export interface MyFilesQuery {
    Folder: string;
    Extensions?: string[];
    Recursive?: boolean;
}