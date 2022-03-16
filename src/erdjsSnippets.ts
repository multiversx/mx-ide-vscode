import path = require("path");
import _ = require('underscore');
import glob = require("glob");
import { ensureFolder, getPath, writeFileIfMissing } from "./workspace";

export async function setup() {
    const erdjsVersion = "^9.2.0";
    const erdjsSnippetsVersion = "^1.0.0";

    ensureFolder("erdjs-snippets");

    let npmrcPath = path.join(getPath(), "erdjs-snippets", ".npmrc");
    let packageJsonPath = path.join(getPath(), "erdjs-snippets", "package.json");
    let tsconfigPath = path.join(getPath(), "erdjs-snippets", "tsconfig.json");
    let localnetSessionPath = path.join(getPath(), "erdjs-snippets", "localnet.session.json");
    let devnetSessionPath = path.join(getPath(), "erdjs-snippets", "devnet.session.json");

    writeFileIfMissing(npmrcPath, `package-lock=false`);

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
        "extension": [
        "ts"
        ],
        "require": "ts-node/register"
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
        "**/*"
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
}
