# Elrond IDE

**This Visual Studio Code extension is still in development.**

The **Elrond IDE** is a VS Code extension with two components: (1) the UI within VS Code itself, and (2) a debugging variant of the Elrond Node, known as **node-debug**, that runs in the background and is managed by the Elrond IDE through a REST API. The **node-debug** deploys and executes SmartContracts on demand and provides debugging information to the IDE. Note that you can reconfigure the IDE to connect to the REST API of any other Elrond Node.

The IDE also assists with the build process of a SmartContract, from a high-level language (C, Rust or Solidity) to WASM bytecode.

## Features

 - List smart contracts in a Visual Studio Code workspace
 - Build smart contracts to WASM
 - Deploy smart contracts on **node-debug**
 - Execute exported functions of the smart contracts on the **node-debug**
 - Automatically prepare tools and dependencies (subset of LLVM, SOLL compiler, node-debug and so on)


## Requirements
The extension will download many of its dependencies and install them itself, so you do not have to worry much about setting up the development environment. These automatically installed dependencies are:

* `LLVM (clang, llc, wasm-ld etc.)`
* [SOLL compiler](https://github.com/second-state/soll)
* [node-debug](https://github.com/ElrondNetwork/elrond-go-node-debug)


In addition, the extension requires the following tools, which are **not** installed automatically:

* `untar` and `unzip` - you most probably already have them installed on your machine.

## How to install, uninstall and update the extension

### Installation
1. Download the [latest VSIX package](https://github.com/ElrondNetwork/vscode-elrond-c/releases/latest).
2. Install the extension in Visual Studio Code: 
    1. Go to the Extensions page of VS Code
    1. At the top of the left panel, click on the "···" menu, and select "Install from VSIX..."
    1. Navigate to the downloaded VSIX package and click on the "Install" button
3. Wait for the notification "Completed installing the extension Elrond IDE"

The installation can also be performed from Visual Studio Code's command-line interface, by running the following command in a terminal:

```
code --install-extension vscode-elrond-ide-{version}.vsix
```

### Uninstallation
1. Go to the Extensions page of VS Code
1. At the top of the left panel, click on the "···" menu, and select "Show Installed Extensions"
1. In the list of installed Extensions, locate "Elrond IDE" and click its "Manage" button (the cogwheel symbol)
1. Click "Uninstall"
1. Close and reopen VS Code to complete the uninstallation

### Update
Updating is simple:
1. Uninstall the extension
1. Perform the Installation steps anew, described above


## Extension Settings

This extension contributes the following settings:

* `elrond.ideFolder`: base folder for tools.
* `elrond.downloadMirror`: download mirror for tools and dependencies.
* `elrond.restApi.port`: port of the REST API (**node-debug**).
* `elrond.testnetUrl`: URL of the testnet.

## Extension Commands

This extension contributes the following commands (`Ctrl+Shift+P`):

* `openIDE`: opens the Elrond IDE Web View.
* `buildContract`: builds the smart contract to WASM bytecode.
* `startNodeDebug`: starts node-debug.
* `stopNodeDebug`: stops node-debug.