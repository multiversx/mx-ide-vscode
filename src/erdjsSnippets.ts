import path = require("path");
import { patchSettings } from "./workspace";
import { Feedback } from "./feedback";

export async function setup(destinationFolder: string) {
    let erdjsSnippetsFolder = path.join(destinationFolder);

    let patch = {
        "mochaExplorer.cwd": erdjsSnippetsFolder,
        "mochaExplorer.mochaPath": path.join(erdjsSnippetsFolder, "node_modules", "mocha")
    };

    let askText = `Allow Elrond IDE to modify this workspace's "settings.json"?
The changes include setting up the Mocha Test Explorer (and the mocha runner).\n
For a better experience when using erdjs-based "snippets", we recommed allowing this change.`;
    await patchSettings(patch, askText);

    Feedback.info(`"erdjs-snippets" have been set up at the following location: ${erdjsSnippetsFolder}.`);
}
