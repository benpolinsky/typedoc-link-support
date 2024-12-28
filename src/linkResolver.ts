import * as ts from 'typescript';
import { getTsProgram } from './programManager';


export function resolveLink(link: string): ts.Symbol | null {
    console.log('🔗 Resolving package-level link:', link);

    const regex = /{@link\s+([\w@/.-]+)(?:!([\w]+))?(?:#([\w]+))?(?::([\w]+))?}/;
    const match = link.match(regex);

    if (!match) {
        console.warn('❌ Invalid @link format:', link);
        return null;
    }

    const [_, modulePath, exportName, member, modifier] = match;
    console.log('📖 Parsed Link:', { modulePath, exportName, member, modifier });

    const program = getTsProgram();
    const checker = program.getTypeChecker();

    // Step 1: Resolve the export
    let resolvedSymbol: ts.Symbol | null = null;

    for (const sourceFile of program.getSourceFiles()) {
        if (sourceFile.isDeclarationFile) continue; // Skip declaration files

        const sourceSymbol = checker.getSymbolAtLocation(sourceFile);
        if (!sourceSymbol || !sourceSymbol.exports) continue;

        // Match the modulePath against imports or exports
        if (sourceSymbol.exports.has(ts.escapeLeadingUnderscores(exportName))) {
            resolvedSymbol = sourceSymbol.exports.get(ts.escapeLeadingUnderscores(exportName)) || null;
            console.log('✅ Matched Package Symbol:', exportName);
            break;
        }
    }

    if (!resolvedSymbol) {
        console.warn(`❌ Could not resolve package/module: ${modulePath}`);
        return null;
    }

    console.log('✅ Package Symbol Resolved:', resolvedSymbol.getName());


    // Step 3: Resolve Member (e.g., #connect)
    if (member) {
        const memberSymbol = resolvedSymbol.exports?.get(ts.escapeLeadingUnderscores(member));
        if (!memberSymbol) {
            console.warn(`❌ Member '${member}' not found in '${exportName || modulePath}'`);
            return null;
        }
        console.log('✅ Member Symbol Resolved:', member);
        resolvedSymbol = memberSymbol;
    }

    console.log('✅ Final Symbol Resolved:', resolvedSymbol.getName());
    return resolvedSymbol;
}