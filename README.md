# Elrond IDE for Visual Studio Code

[![Build Status](https://travis-ci.com/ElrondNetwork/elrond-ide-vscode.svg?branch=master)](https://travis-ci.com/ElrondNetwork/elrond-ide-vscode)

**This Visual Studio Code extension is under development: [CHANGELOG](https://github.com/ElrondNetwork/elrond-ide-vscode/releases)**

## What is it?

**Elrond IDE** is an extension for Visual Studio Code that offers development support for Elrond Smart Contracts.

Elrond IDE supports the following programming languages:

 - Rust - recommended. For Rust, the IDE also provides a step-by-step debugging experience, via [elrond-wasm-debug](https://crates.io/keywords/elrond).
 - C / C++

## Main features

 - Build Smart Contracts to WASM
 - Step-by-step debugging Rust smart contracts
 - Automatically download tools and dependencies

## How to get it

Elrond IDE can be installed from the Visual Studio Code Marketplace.

## Requirements and dependencies

### Operating system

 - **Linux** is supported
 - **Windows** is not supported yet
 - **MacOS** is supported

If you experience any issues, please let us know [on Github](https://github.com/ElrondNetwork/elrond-ide-vscode/issues) or [on Telegram](https://t.me/ElrondDevelopers).

### [erdpy](https://github.com/ElrondNetwork/erdpy)

**erdpy** is the backend of the Visual Studio Code extension. **erdpy** is **required** by the Elrond IDE. In order to install it, please follow [these steps](https://github.com/ElrondNetwork/erdpy).

### Other dependencies

The extension, via `erdpy`, will automatically download its external dependencies, so you do not have to worry much about setting up the development environment. These automatically installed dependencies include:

* `RUST` buildchain
* `VM Tools` (e.g. Mandos framework)
* `LLVM (clang, llc, wasm-ld etc.)`

## Extension Commands

This extension contributes the following commands (`Ctrl+Shift+P`):

* `newFromTemplate`
* `buildContract`
* `cleanContract`
* `runMandosTests`
* `runContractSnippet`

## Contributors

### How to publish an update of the extension

1. Bump version in `package.json` and `package-lock.json`
2. Push to GitHub
3. Publish release on Github, add release notes
4. Update changelog via `make changelog`, commit & push (message = "Update changelog."). Make sure [gren](https://github.com/github-tools/github-release-notes#installation) is installed beforehand.
5. Publish to VSCode Marketplace via `make publish`
