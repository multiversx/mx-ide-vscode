# Change Log

All notable changes to the "vscode-elrond-c" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release

## [0.4.0]

- Removed command "Create smart contract from template (prototype)", since `erdpy new` provides this functionality in a more reasonable manner. `erdpy new` fetches the templates from GitHub - this is more maintainable than keeping the templates embedded (and updated) in the VSCODE extension. Furthermore, the UX controls to ask the desired template and the name of the new project were not always functioning properly in the extension - we assume this was due to a focus-related bug in VSCODE `quickPick` and `inputBox`, but we are not certain about it.

## Temporary code sandbox

```
if (!FsFacade.isWorkspaceOpen()) {
    Feedback.info("No folder open in your workspace. Please open a folder.");
    return;
}
```