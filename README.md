# Elrond IDE

**This Visual Studio Code extension is still in development.**

**Elrond IDE** starts as a tool to deploy and run smart contracts on a variant of the Elrond node - also known as **node-debug** - for development and debugging purpose. Deployment and execution is also possible on other nodes of your choice, as well.

The IDE also assists with the build process of a smart contract, from a high-level language (C) to WASM bytecode.

## Features

 - List smart contracts in a Visual Studio Code workspace
 - Build smart contracts to WASM
 - Deploy smart contracts on the **node-debug** or another node of your choice
 - Execute exported functions of the smart contract on the **debug-node** or another node of your choice
 - Gather and install tools and dependencies (a subset of LLVM, golang, node-debug and so on)


## Requirements

This extension depends on:

* `clang` - for build to WASM
* `llc` - for build to WASM
* `wasm-ld` - for build to WASM
* `golang` - to build **node-debug**
* [node-debug](https://github.com/ElrondNetwork/elrond-go-node-debug)

All these dependencies are downloaded and / or installed by the extension itself, so you do not have to worry much about setting up the development environment.

In addition, the extension requires the following tools, which are not installed automatically:

* `GCC` - required to build **node-debug** which depends on the Arwen Virtual Machine, whose compilation requires both a **go** and a **C** compiler.
* `untar` and `unzip` - you most probably already have them installed on your machine.

In order to install GCC (on Ubuntu):

```
sudo apt-get install build-essential
```

## Extension Settings

This extension contributes the following settings:

* `elrond.ideFolder`: base folder for tools.
* `elrond.downloadMirror`: download mirror for tools and dependencies.
* `elrond.restApi.port`: port of REST API (node-debug).

## How to build and / or install

Build the extension (you need vsce):

```
npm install -g vsce
cd vscode-elrond-c
npm install
vsce package
```

Install the extension in Visual Studio Code:

```
code --install-extension vscode-elrond-ide-{version}.vsix
```

The installation can also be performed from Visual Studio Code's user interface, by running the command `Install from VSIX`.