import { Presenter } from "./presenter";
import { FsFacade } from "./utils";
import path = require('path');
import { Feedback } from "./feedback";

export class Projects {
    static async createErc20() {
        let name = await Projects.askName("myerc20");

        if (name) {
            Projects.createSubproject(name, "wrc20_arwen");
        }
    }

    static async createDummy() {
        let name = await Projects.askName("myexample");

        if (name) {
            Projects.createSubproject(name, "dummy");
        }
    }

    static async askName(placeholder: string) {
        let name = await Presenter.askSimpleInput({
            title: "Name of smart contract (subproject)",
            placeholder: placeholder
        });

        if (!name) {
            Feedback.error("Smart contract name should not be empty.");
        }

        return name;
    }

    static async createSubproject(name: string, prototypeName: string) {
        if (!FsFacade.isWorkspaceOpen()) {
            Feedback.info("No folder open in your workspace. Please open a folder.");
            return;
        }

        try {
            FsFacade.createFolderInWorkspace(name);
            let elrondScHeader = FsFacade.readFileInSnippets("elrond_sc.h");
            let cContent = FsFacade.readFileInSnippets(`${prototypeName}.c`);
            let exportContent = FsFacade.readFileInSnippets(`${prototypeName}.export`);

            FsFacade.writeFileToWorkspace(path.join(name, "elrond_sc.h"), elrondScHeader);
            FsFacade.writeFileToWorkspace(path.join(name, `${prototypeName}.c`), cContent);
            FsFacade.writeFileToWorkspace(path.join(name, `${prototypeName}.export`), exportContent);

            Feedback.info(`Please refresh workspace. Subproject ${name} (${prototypeName}) created.`);
        } catch (error) {
            Feedback.error(`Could not create subproject. Reason: ${error}`);
        }
    }
}