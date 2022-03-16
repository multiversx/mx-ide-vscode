import path = require("path");
import _ = require('underscore');
import glob = require("glob");
import { ensureFolder, patchSettings, writeFileIfMissing } from "./workspace";
import { Feedback } from "./feedback";

export async function setup(destinationFolder: string) {
    const erdjsVersion = "^9.2.0";
    const erdjsSnippetsVersion = "^1.0.0";

    let erdjsSnippetsFolder = path.join(destinationFolder, "erdjs-snippets");

    ensureFolder(erdjsSnippetsFolder);

    let packageJsonPath = path.join(erdjsSnippetsFolder, "package.json");
    let tsconfigPath = path.join(erdjsSnippetsFolder, "tsconfig.json");
    let localnetSessionPath = path.join(erdjsSnippetsFolder, "localnet.session.json");
    let devnetSessionPath = path.join(erdjsSnippetsFolder, "devnet.session.json");
    let gitignorePath = path.join(erdjsSnippetsFolder, ".gitignore");

    writeFileIfMissing(packageJsonPath, `{
    "name": "your-snippets",
    "files": [
        "out/**/*"
    ],
    "scripts": {
        "compile": "tsc -p tsconfig.json"
    },
    "dependencies": {
        "@elrondnetwork/erdjs": "${erdjsVersion}",
        "@elrondnetwork/erdjs-snippets": "${erdjsSnippetsVersion}",
        "bignumber.js": "9.0.2"
    },
    "devDependencies": {
        "@types/assert": "1.4.6",
        "@types/chai": "4.2.11",
        "@types/mocha": "9.1.0",
        "@types/node": "13.13.2",
        "typescript": "4.1.2",
        "chai": "4.2.0",
        "mocha": "9.2.1",
        "ts-node": "9.1.1"
    },
    "mocha": {
        "extension": ["ts"],
        "require": "ts-node/register",
        "spec": "**/*.spec.ts"
    }
}`);

    writeFileIfMissing(tsconfigPath, `{
    "compilerOptions": {
        "module": "CommonJS",
        "target": "es2015",
        "outDir": "out",
        "lib": [
            "ES2015"
        ],
        "sourceMap": true,
        "allowJs": true,
        "strict": true,
        "strictPropertyInitialization": true,
        "strictNullChecks": true,
        "skipLibCheck": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUnusedParameters": true,
        "esModuleInterop": true,
        "declaration": true,
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true
    },
    "include": [
        "**/*.ts"
    ],
    "exclude": [
        "node_modules",
        "out"
    ]
}`);

    writeFileIfMissing(localnetSessionPath, `{
    "proxyUrl": "http://localhost:7950",
    "whalePem": "~/elrondsdk/testwallets/alice.pem"
}`);

    writeFileIfMissing(devnetSessionPath, `{
    "proxyUrl": "https://devnet-gateway.elrond.com",
    "whalePem": "~/elrondsdk/testwallets/alice.pem"
}`);
    
    writeFileIfMissing(gitignorePath, `**/node_modules
package-lock.json
**/*.session.sqlite
out
`);

    let patch = {
        "mochaExplorer.cwd": erdjsSnippetsFolder,
        "mochaExplorer.mochaPath": path.join(erdjsSnippetsFolder, "node_modules", "mocha")
    };

    let askText = `Allow Elrond IDE to modify this workspace's "settings.json"?
The changes include setting up the Mocha Test Explorer (and the mocha runner).\n
For a better experience when using erdjs-snippets Smart Contracts, we recommed allowing this change.`;
    await patchSettings(patch, askText);

    Feedback.info(`"erdjs-snippets" have been set up at the following location: ${erdjsSnippetsFolder}.`);
}
