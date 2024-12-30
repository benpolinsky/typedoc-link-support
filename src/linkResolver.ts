import * as ts from 'typescript';
import { getTsProgram } from './programManager';

interface ResolvedLink {
    name: string
    start: number
    end: number
    sourceFile: ts.SourceFile
}

export function resolveLink(link: string): ResolvedLink | null {
    console.log('Resolving package-level link:', link);

    const regex = /{@link\s+([\w@/.-]+)(?:!([\w]+))?(?:#([\w]+))?(?::([\w]+))?(?:#([\w]+))?}/;
    const match = link.match(regex);

    if (!match) {
        console.warn('Invalid @link format:', link);
        return null;
    }

    const [_, modulePath, exportName, member, modifier, memberAfterModifier] = match;
    console.log('Parsed Link:', { modulePath, exportName, member, modifier, memberAfterModifier });

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
            console.log('Matched Package Symbol:', exportName);
            break;
        }
    }

    if (!resolvedSymbol) {
        console.warn(`Could not resolve package/module: ${modulePath}`);
        return null;
    }

    if (modifier) {
        const filteredDeclaration = resolvedSymbol.getDeclarations()?.find(declaration => {
            switch (modifier) {
                case 'class':
                    return declaration.kind === ts.SyntaxKind.ClassDeclaration;
                case 'namespace':
                    return declaration.kind === ts.SyntaxKind.ModuleDeclaration;
                case 'interface':
                    return declaration.kind === ts.SyntaxKind.InterfaceDeclaration;
                case 'function':
                    return declaration.kind === ts.SyntaxKind.FunctionDeclaration;
                case 'enum':
                    return declaration.kind === ts.SyntaxKind.EnumDeclaration;
                default:
                    return false;
            }
        });

        if (!filteredDeclaration) {
            console.warn(`No declaration found for modifier '${modifier}'`);
            return null;
        }

        console.log('Matched Declaration with Modifier:', modifier);
        // here we can have ether members or locals (exports) depending on the declaration type
        // i.e. namespaces have locals, classes have members
        const members = (filteredDeclaration as any).members as ts.Node[] | undefined;
        const locals = (filteredDeclaration as any).locals as ts.SymbolTable | undefined;
        if (members) {
            console.log('Declaration has locals. Checking for member...');

            if (memberAfterModifier) {
                const memberSymbol = members?.find((node) => (node as any).name.getText() === memberAfterModifier);
                if (!memberSymbol) {
                    console.warn(`Member '${memberAfterModifier}' not found in '${(filteredDeclaration as any).name?.getText()}' with modifier '${modifier}'`);
                    return null;
                }
                console.log('Member Resolved via members:', memberAfterModifier);
                return {
                    name: (memberSymbol as any).name.getText(),
                    start: memberSymbol.getStart(),
                    end: memberSymbol.getEnd(),
                    sourceFile: memberSymbol.getSourceFile()
                }
            }

            console.log('Returning Declaration based on members:', (filteredDeclaration as any).name?.getText());
            return {
                name: (filteredDeclaration as any).name?.getText() || 'UnnamedDeclaration',
                start: filteredDeclaration.getStart(),
                end: filteredDeclaration.getEnd(),
                sourceFile: filteredDeclaration.getSourceFile()
            }
        }

        if (locals) {
            console.log('Declaration has members. Checking for member...');

            if (memberAfterModifier) {
                const memberSymbol = locals.get(ts.escapeLeadingUnderscores(memberAfterModifier));
                if (!memberSymbol) {
                    console.warn(`Member '${memberAfterModifier}' not found in '${(filteredDeclaration as any).name?.getText()}' with modifier '${modifier}'`);
                    return null;
                }
                console.log('Member Resolved via locals:', memberAfterModifier);
                return {
                    name: memberSymbol.getName(),
                    start: memberSymbol.getDeclarations()![0].getStart(),
                    end: memberSymbol.getDeclarations()![0].getEnd(),
                    sourceFile: memberSymbol.getDeclarations()![0].getSourceFile()
                };
            }

            console.log('Returning Declaration based on locals:', (filteredDeclaration as any).name?.getText());
            return {
                name: (filteredDeclaration as any).name?.getText() || 'UnnamedDeclaration',
                start: filteredDeclaration.getStart(),
                end: filteredDeclaration.getEnd(),
                sourceFile: filteredDeclaration.getSourceFile()
            };
        }
    }

    console.log('Package Symbol Resolved:', resolvedSymbol.getName());


    // Step 3: Resolve Member (e.g., #connect)
    if (member) {
        const memberSymbol = resolvedSymbol.members?.get(ts.escapeLeadingUnderscores(member));
        if (!memberSymbol) {
            console.warn(`Member '${member}' not found in '${exportName || modulePath}'`);
            return null;
        }
        console.log('Member Symbol Resolved:', member);
        resolvedSymbol = memberSymbol;
    }

    console.log('Final Symbol Resolved:', resolvedSymbol.getName());
    return {
        name: resolvedSymbol.name,
        start: resolvedSymbol.valueDeclaration!.getStart(),
        end: resolvedSymbol.valueDeclaration!.getEnd(),
        sourceFile: (resolvedSymbol as any).getDeclarations()![0].getSourceFile()
    };
}