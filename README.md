# MultiversX IDE for Visual Studio Code

![Build Status](https://github.com/multiversx/mx-ide-vscode/actions/workflows/build.yml/badge.svg)

## What is it?

**MultiversX IDE** is an extension for Visual Studio Code that offers development support for MultiversX Smart Contracts.

MultiversX IDE supports the following programming languages:

 - Rust - recommended. For Rust, the IDE also provides a step-by-step debugging experience, via [mx-sc-debug](https://crates.io/keywords/multiversx).
 - C / C++

## Main features

 - Build Smart Contracts to WASM
 - Step-by-step debugging Rust smart contracts
 - Automatically download tools and dependencies
 - Rust debugger support for managed types - see [the installation guide](#installing-the-rust-debugger-pretty-printer-script)

## How to get it

MultiversX IDE can be installed from the Visual Studio Code Marketplace.

## Requirements and dependencies

### Operating system

 - **Linux** is supported
 - **Windows** is not supported yet
 - **MacOS** is supported

If you experience any issues, please let us know [on Github](https://github.com/multiversx/mx-ide-vscode/issues) or [on Telegram](https://t.me/MultiversXDevelopers).

### [erdpy](https://github.com/multiversx/mx-sdk-erdpy)

**erdpy** is the backend of the Visual Studio Code extension. **erdpy** is **required** by the MultiversX IDE. In order to install it, please follow [these steps](https://docs.multiversx.com/sdk-and-tools/erdpy/installing-erdpy).

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

## Installing the rust debugger pretty printer script

The rust debugger pretty printer script for LLDB allows proper viewing of managed types (BigUint, ManagedBuffer etc.) when debugging smart contract rust tests.

Prerequisites: First, make sure that the [CodeLLDB](https://github.com/vadimcn/vscode-lldb) extension is installed. This can be done directly from Visual Studio Code extensions menu.

Then, from Visual Studio Code open the command menu via `Ctrl+Shift+P` and run `MultiversX: Install the rust debugger pretty printer script`. If this option isn't present, make sure you have the latest version of the `MultiversX` Visual Studio Code extension.

You will be prompted for the repository, branch and path for the pretty printer script. Simply leave the options blank in order to install the latest version of the script from mx-sdk-rs.

## Contributors

### How to publish an update of the extension

1. Within a PR, bump the version in `package.json` and `package-lock.json`.
2. Open and merge the PR against the `main` (`master`) branch.
3. Trigger the Github Workflow called `Release`. This will also publish the extension on the Visual Studio Marketplace.
