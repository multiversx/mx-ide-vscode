//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');

const defaultModuleRules = [
    {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
            {
                loader: 'ts-loader'
            }
        ]
    },
    {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
            esModule: false,
        },
    }
];

// For debbuging, use "inline-source-map".
const devTool = "source-map";

/**@type {import('webpack').Configuration}*/
const extensionConfig = {
    // Use "webworker" target for browser extension development.
    target: 'node', // vscode extensions run in webworker context for VS Code web 📖 -> https://webpack.js.org/configuration/target/#target

    entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
        // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    devtool: devTool,
    externals: {
        vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: {
        // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
        extensions: ['.ts', '.js'],
        alias: {
            // provides alternate implementation for node module and source files
        },
        fallback: {
            // Webpack 5 no longer polyfills Node.js core modules automatically.
            // see https://webpack.js.org/configuration/resolve/#resolvefallback
            // for the list of Node.js core module polyfills.
        }
    },
    module: {
        rules: defaultModuleRules
    }
};

/**
 * @param {{ entry: any; outputName: any; }} options
 */
function createWebViewConfig(options) {
    /**@type {import('webpack').Configuration}*/
    const webViewConfig = {
        target: ["web", "es2020"],

        entry: options.entry,
        // https://github.com/microsoft/vscode-webview-ui-toolkit-samples/blob/780dd005b820c00340fe72a76a50099c5d0ef952/default/hello-world-webpack/webpack.config.js
        experiments: { outputModule: true },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: options.outputName,
            libraryTarget: "module",
            chunkFormat: "module"
        },
        devtool: devTool,
        externals: {
            vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
        },
        resolve: {
            mainFields: ['browser', 'module', 'main'],
            extensions: ['.ts', '.js'],
            alias: {
                // provides alternate implementation for node module and source files
            },
            fallback: {
                // Webpack 5 no longer polyfills Node.js core modules automatically.
                // see https://webpack.js.org/configuration/resolve/#resolvefallback
                // for the list of Node.js core module polyfills.
            }
        },
        module: {
            rules: defaultModuleRules
        }
    };

    return webViewConfig;
}

const welcomeWebViewConfig = createWebViewConfig({
    entry: "./src/welcome/main.ts",
    outputName: "welcome.js"
});

const assistantWebViewConfig = createWebViewConfig({
    entry: "./src/assistant/main.ts",
    outputName: "assistant.js"
});

module.exports = [
    extensionConfig,
    welcomeWebViewConfig,
    assistantWebViewConfig
];
