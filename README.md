# Elrond IDE for Visual Studio Code

**This Visual Studio Code extension is under development: [CHANGELOG](https://github.com/ElrondNetwork/elrond-ide-vscode/releases)**

## What is it?

**Elrond IDE** is an extension for Visual Studio Code that offers development support for Elrond Smart Contracts. The extension uses [**erdpy**](https://github.com/ElrondNetwork/erdpy) as a backend for building smart contracts and download external dependencies.

Elrond IDE supports the following programming languages:

 - Rust - recommended. For Rust, the IDE also provides a step-by-step debugging experience, via [elrond-wasm-debug](https://crates.io/keywords/elrond) and [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb).
 - C / C++
 - Solidity - **note that version 0.3.8 has temporarily disabled support for building Solidity contracts, but this will be re-enabled soon, as we complete migration to latest SOLL compiler.**

## Main features

 - Build smart contracts to WASM, using the `erdpy` backend
 - Step-by-step debugging Rust smart contracts 
 - Deploy smart contracts on **node-debug** and Elrond Testnet
 - Execute exported functions of the smart contracts on **node-debug** and Elrond Testnet
 - Automatically download tools and dependencies (subset of LLVM, SOLL compiler, node-debug and so on), via `erdpy`

## How to get it

Elrond IDE can be installed from the Visual Studio Code Marketplace.

## Requirements and dependencies

### Operating system

 - **Linux** is supported
 - **Windows** is not supported yet
 - **MacOS** support is **temporarily disabled** in latest versions, and will be re-enabled soon

If you experience any issues, please let us know [on Github](https://github.com/ElrondNetwork/elrond-ide-vscode/issues) or [on Telegram](https://t.me/ElrondDevelopers).

### [erdpy](https://github.com/ElrondNetwork/erdpy)

**erdpy** is the backend of the Visual Studio Code extension. **erdpy** is **required** by the Elrond IDE. In order to install it, please follow [these steps](https://github.com/ElrondNetwork/erdpy).

### Other dependencies

The extension, via `erdpy`, will automatically download its external dependencies, so you do not have to worry much about setting up the development environment. These automatically installed dependencies are:

* `LLVM (clang, llc, wasm-ld etc.)`
* `RUST` buildchain
* [SOLL compiler](https://github.com/second-state/soll)
* [node-debug](https://github.com/ElrondNetwork/elrond-go-node-debug)


## Extension Settings

This extension contributes the following settings:

* `elrond.restApi.port`: port of the REST API (**node-debug**).
* `elrond.testnetUrl`: URL of the testnet.

## Extension Commands

This extension contributes the following commands (`Ctrl+Shift+P`):

* `openIDE`: opens the Elrond IDE Web View.
* `buildContract`: builds the smart contract to WASM bytecode.