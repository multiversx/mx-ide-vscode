# Changelog

## Reference newest erdpy (28/10/2020)
 - Reference newest erdpy.
---

## Reference newest erdpy (27/10/2020)
- Reference newest erdpy.
---

## Reference newest erdpy (26/10/2020)
 - Reference newest erdpy.
---

## UX Improvements: local testnet, better snippets. Extra minor fixes. (26/10/2020)
 - Run local testnet (start, stop, start fresh) from contextual menu. Enhance terminals.
 - Snippets: skip running snippet if none chosen.
 - Snippets: pass extra (useful) variables into snippets.
 - Snippets. Integrate with `erdpy data`.
 - Snippets, wait for process in Terminal to finish.
 - Setup workspace - add `.gitignore` file if missing.
 - Reference newest erdpy.
---

## More robust procedure for setting up environment variables (14/10/2020)
 - Handle particularities of Rust extension (e.g. disable RLS at start-up, expect explicit start).
 - Pass `env` when running commands in the integrated terminal as well (instead of only relying on the content of `settings.json` - which the user may not accept, when asked).
 - Add debugging items in `launch.json`, `tasks.json` - dump environment variables; useful for debugging eventual bugs related to env vars.
 - Refactoring.

PR: https://github.com/ElrondNetwork/elrond-ide-vscode/pull/11
---

## Reference newest erdpy (09/10/2020)
 - Reference newest erdpy.
---

## Latest erdpy, minor fixes (14/09/2020)
 - Update reference to erdpy, fix some linting warnings
 - Fix listing of templates
 - Ask precise version of erdpy deps to install.

---

## New erdpy, fixes (13/07/2020)
 - Reference new erdpy
 - Handle `elrond.json` project files with missing language. 
---

## Fixes (09/07/2020)
 - Pass `CONTRACT_FOLDER` as env variable to snippets.
 - Reference new erdpy.
---

## Fixes and new features (09/07/2020)
 - Add Travis integration (to release to Visual Studio Code Marketplace)
 - Feature: run contract snippets (deploy, call, query)
 - Allow reinstall of precise, specified erdpy version (user is asked for input)
 - Reference new erdpy.
---

## Bugfixes (09/07/2020)
- Bugfix: quote path (didn't work on MacOS).
---

## New erdpy (09/07/2020)
 - Reference new erdpy beta.
---

## Fixes, shortcuts, clean project (09/07/2020)
- Bugfix - ignore folders without metadata.
- Extra shortcuts. Clean project.
- Run mandos directly, without "erdpy test".
---

## Re-written Elrond IDE (09/07/2020)
 - Dropped the deprecated form-based playground
 - Added erdpy as a backend
 - Added functionality to setup developer workspace (auto-managing `settings.json`, `launch.json`, `tasks.json`)
 - Auto-download dependencies via `erdpy-up` and `erdpy`.
 - Added shortcuts to compile, run tests.
 - Added templates view (with shortcut to create contract based on template)
 - Added contracts view (with shortcuts to build, run tests etc.).
---

## Fixes and new features (09/07/2020)
 - Feature: run mandos tests individually as well.
 - Fix: allow user to trigger "Setup (initialize) workspace".
 - Fix: enable support for non-multi-project workspaces.
 - Feature: allow one to clean & build with right click on elrond.json as well
---

## Bugfixes & a feature (09/07/2020)
Bugfixes & a feature:
 - install "arwentools" if missing (since mandos is called without the erdpy intermediary since latest version).
 - require precise / exact version of erdpy to be present.
 - allow user to explicitly reinstall sdk module if desired
---

## Fixes (06/07/2020)
 - Fix path-with-spaces issues.
---

## Using erdpy as a backend, other fixes (14/02/2020)

- Added **[erdpy](https://github.com/ElrondNetwork/erdpy)** as a required dependency.

- Added the extension [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb) as a dependency of Elrond IDE. This extension is required in order to enable the step-by-step Rust debugging experience.

- Removed command "Create smart contract from template (prototype)", since `erdpy new` provides this functionality in a more reasonable manner. `erdpy new` fetches the templates from GitHub - this is more maintainable than keeping the templates embedded (and updated) in the VSCODE extension. Furthermore, the UX controls to ask the desired template and the name of the new project were not always functioning properly in the extension - we assume this was due to a focus-related bug in VSCODE `quickPick` and `inputBox`, but we are not certain about it.

- Removed the stub user interface for "Build Options". This was only available for C projects, and only used to edit the exported functions of the smart contract. The user interface was somehow redundant, because editing can be done in the `*.exported` file. Since build options will get more complex, it is more maintainable to keep build options in specific files for the moment, without an associated user interface: `*.exported` for C exported functions, `Cargo.toml` for Rust's build options and so on.

- Removed "Build" button from user interface. Build is available via command (and we will also add the command in a contextual menu in a future release). This is more in the spirit of VSCODE extensions - rely less on webviews, rely more on commands, menus and shortcuts.

- Removed user interface and implementation for downloading dependencies (LLVM, Rust, Soll, Nodedebug). This has been replaced by `erdpy`'s automatic download mechanism.

- Building smart contracts has a new backend: `erdpy build`, which, in turn, delegates to LLVM, Rust / Cargo, SOLL (SOLL support isn't completely ported from the IDE to `erdpy` yet, but it will be soon). Solidity compilation is temporarily disabled, until we finish the migration of the build process to `erdpy` (and also update to latest **SOLL** compiler).

- Hide first tab (`Workspace`), not actually needed. It was a bit redundant, and the UX wasn't optimal.

- Remove commands to start and stop **nodedebug**. They were a bit problematic and also redundant. One can use `erdpy nodedebug` and `erdpy nodedebug --stop` commands.

---

## Layout fixes (03/02/2020)
Layout fix - more narrow menu / navigation bar.
---

## Extra samples and improved UX (16/01/2020)
Extra samples (templates / prototypes).
Improved error feedback.
Improved display of VM output.
---

## Testnet integration (15/01/2020)
Deploy contract and run function on testnet.
Query watched variables (improvements).
UX improvements.
---

## Preview (20/12/2019)
Updated logo.
---

## Preview (20/12/2019)
Updated description.
Bug fix for workspace not open (display info to open a folder).
---

## Preview (20/12/2019)
Logo and categories.
---

## Preview (20/12/2019)
Minor fixes, prepare manifest for publishing.
---

## Preview (17/12/2019)
Updated theme. Fixed, improved, simplified layout. Improved UX overall. 

Temporarily disabled some features (deploy & debug & query Testnet). Will be enabled back again very soon, after some more testing.
---

## Preview (29/11/2019)
Improve layout. Less clutter.
Download buildchain for Solidity (SOLL compiler) as well.
---

## Preview (28/11/2019)
Added support for Solidity, via https://github.com/second-state/soll compiler.
---

## Preview (11/11/2019)
Added support for RUST.
Allow customization of build (exported functions for C, for now).
Added support for watching smart contract variables.
Added support for "debug" variables (placeholders for deploy and run).
UX fixes, removed bootswatch theme - we'll use a prettier theme soon. 
---

## Preview for SF (31/10/2019)
Fix gas price defaults.