# Change Log

All notable changes to the extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release

## [0.3.8]

- Added **[erdpy](https://github.com/ElrondNetwork/erdpy)** as a required dependency.

- Added the extension [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb) as a dependency of Elrond IDE. This extension is required in order to enable the step-by-step Rust debugging experience.

- Removed command "Create smart contract from template (prototype)", since `erdpy new` provides this functionality in a more reasonable manner. `erdpy new` fetches the templates from GitHub - this is more maintainable than keeping the templates embedded (and updated) in the VSCODE extension. Furthermore, the UX controls to ask the desired template and the name of the new project were not always functioning properly in the extension - we assume this was due to a focus-related bug in VSCODE `quickPick` and `inputBox`, but we are not certain about it.

- Removed the stub user interface for "Build Options". This was only available for C projects, and only used to edit the exported functions of the smart contract. The user interface was somehow redundant, because editing can be done in the `*.exported` file. Since build options will get more complex, it is more maintainable to keep build options in specific files for the moment, without an associated user interface: `*.exported` for C exported functions, `Cargo.toml` for Rust's build options and so on.

- Removed "Build" button from user interface. Build is available via command (and we will also add the command in a contextual menu in a future release). This is more in the spirit of VSCODE extensions - rely less on webviews, rely more on commands, menus and shortcuts.

- Removed user interface and implementation for downloading dependencies (LLVM, Rust, Soll, Nodedebug). This has been replaced by `erdpy`'s automatic download mechanism.

- Building smart contracts has a new backend: `erdpy build`, which, in turn, delegates to LLVM, Rust / Cargo, SOLL (SOLL support isn't completely ported from the IDE to `erdpy` yet, but it will be soon). Solidity compilation is temporarily disabled, until we finish the migration of the build process to `erdpy` (and also update to latest **SOLL** compiler).

- Hide first tab (`Workspace`), not actually needed. It was a bit redundant, and the UX wasn't optimal.

- Remove commands to start and stop **nodedebug**. They were a bit problematic and also redundant. One can use `erdpy nodedebug` and `erdpy nodedebug --stop` commands.


## [Upcoming (TODO)]

- Only allow one project per workspace (otherwise Rust / Cargo build issues).