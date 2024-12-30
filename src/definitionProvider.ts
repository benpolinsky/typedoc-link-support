import * as vscode from 'vscode';
import { resolveLink } from './linkResolver';

export class LinkDefinitionProvider implements vscode.DefinitionProvider {
    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.Definition | null {
        // Match @link tag at the cursor position
        const range = document.getWordRangeAtPosition(position, /{@link\s+[\w@/.-]+(?:!([\w]+))?(?:#([\w]+))?(?::([\w]+))?(?:#([\w]+))?}/);
        if (!range) {
            console.log('No @link tag found at cursor position');
            return null;
        }

        const link = document.getText(range);
        console.log('🔗 Definition requested for link:', link);

        // Resolve the symbol
        const symbol = resolveLink(link);
        if (!symbol) {
            console.warn('❌ Symbol not found for link:', link);
            return null;
        }

        console.log('🔗 Resolved Symbol:', symbol.name);
        const { start, end, sourceFile } = symbol;
        const filePath = sourceFile.fileName;
        const startPos = sourceFile.getLineAndCharacterOfPosition(start);
        const endPos = sourceFile.getLineAndCharacterOfPosition(end);

        console.log('✅ Symbol Found at:', filePath, startPos, endPos);

        // Return the location of the declaration
        return new vscode.Location(
            vscode.Uri.file(filePath),
            new vscode.Range(
                new vscode.Position(startPos.line, startPos.character),
                new vscode.Position(endPos.line, endPos.character)
            )
        );
    }
}