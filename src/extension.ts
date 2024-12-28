import * as vscode from 'vscode';
import { LinkHoverProvider } from './hoverProvider';
import { LinkDefinitionProvider } from './definitionProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ Extension activated');

    context.subscriptions.push(
        vscode.languages.registerHoverProvider({ scheme: "file", language: 'typescript' }, new LinkHoverProvider()),
        vscode.languages.registerDefinitionProvider({ scheme: "file", language: "typescript" }, new LinkDefinitionProvider())
    );
}

export function deactivate() { }