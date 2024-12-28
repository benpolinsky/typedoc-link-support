import * as vscode from 'vscode';
import { resolveLink } from './linkResolver';

export class LinkDefinitionProvider implements vscode.DefinitionProvider {
    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.Definition | null {
        // Match @link tag at the cursor position
        const range = document.getWordRangeAtPosition(position, /{@link\s+[\w@/.-]+(?:!([\w]+))?(?:#([\w]+))?(?::([\w]+))?}/);
        if (!range) {
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

        const declarations = symbol.getDeclarations();
        if (!declarations || declarations.length === 0) {
            console.warn('❌ No declarations found for symbol:', symbol.getName());
            return null;
        }

        const declaration = declarations[0];
        const sourceFile = declaration.getSourceFile();
        const filePath = sourceFile.fileName;

        const start = declaration.getStart();
        const end = declaration.getEnd();

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