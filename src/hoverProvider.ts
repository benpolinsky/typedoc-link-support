import * as vscode from 'vscode';
import { resolveLink } from './linkResolver';

export class LinkHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
        const range = document.getWordRangeAtPosition(position, /{@link\s+[\w@/.-]+(?:!([\w]+))?(?:#([\w]+))?(?::([\w]+))?}/);
        if (!range) {
            console.warn('❌ No valid @link range detected');
            return null;
        }

        const link = document.getText(range);
        console.log('🔗 Hover detected on link:', link);

        // Step 1: Check if it's a package-level reference
        const regex = /{@link\s+([\w@/.-]+)(?:!([\w]+))?(?:#([\w]+))?(?::([\w]+))?}/;
        const match = link.match(regex);

        if (!match) {
            console.warn('❌ Invalid @link tag');
            return null;
        }

        const [_, modulePath, exportName, member, modifier] = match;

        if (modulePath.startsWith('@') || modulePath.includes('/')) {
            console.log('📦 Detected Package Reference:', modulePath);
            const symbol = resolveLink(link);

            if (symbol) {
                const markdown = new vscode.MarkdownString(`**Resolved Symbol:** ${symbol.getName()}`);
                markdown.isTrusted = true;
                return new vscode.Hover(markdown, range);
            } else {
                console.warn('❌ Failed to resolve package reference:', modulePath);
            }
        }

        // Defer to VS Code for local links
        console.log('↪️ Defering to VS Code for local resolution');
        return null;
    }
}