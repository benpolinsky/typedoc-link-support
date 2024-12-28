import * as ts from 'typescript';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let cachedProgram: ts.Program | null = null;

/**
 * Creates or retrieves a cached ts.Program instance.
 */

export function getTsProgram(): ts.Program {
    if (cachedProgram) {
        console.log('✅ Using cached ts.Program');
        return cachedProgram;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        throw new Error('No workspace detected.');
    }

    console.log('🔍 Workspace Root:', workspaceRoot);

    const rootConfigPath = ts.findConfigFile(workspaceRoot, ts.sys.fileExists, 'tsconfig.json');
    if (!rootConfigPath) {
        throw new Error('Could not find root tsconfig.json');
    }

    console.log('🛠️ Found Root tsconfig.json at:', rootConfigPath);

    // Parse root tsconfig
    const rootConfig = ts.readConfigFile(rootConfigPath, ts.sys.readFile);
    if (rootConfig.error) {
        throw new Error(`Error reading root tsconfig.json: ${rootConfig.error.messageText}`);
    }

    const parsedRootConfig = ts.parseJsonConfigFileContent(rootConfig.config, ts.sys, workspaceRoot);

    let allFiles: string[] = [...parsedRootConfig.fileNames];

    // Handle Project References
    if (parsedRootConfig.projectReferences) {
        console.log('🔗 Found Project References:', parsedRootConfig.projectReferences.map(ref => ref.path));

        for (const ref of parsedRootConfig.projectReferences) {
            const refPath = path.resolve(workspaceRoot, ref.path, 'tsconfig.json');

            if (!fs.existsSync(refPath)) {
                console.warn('❌ Reference tsconfig not found:', refPath);
                continue;
            }

            console.log('✅ Parsing Reference tsconfig:', refPath);

            const refConfig = ts.readConfigFile(refPath, ts.sys.readFile);
            if (refConfig.error) {
                console.warn(`❌ Error reading reference tsconfig at ${refPath}: ${refConfig.error.messageText}`);
                continue;
            }

            const parsedRefConfig = ts.parseJsonConfigFileContent(refConfig.config, ts.sys, path.dirname(refPath));
            allFiles.push(...parsedRefConfig.fileNames);
        }
    }

    // Remove duplicates
    allFiles = Array.from(new Set(allFiles));

    console.log('📚 Aggregated Files for Program:', allFiles);

    cachedProgram = ts.createProgram(allFiles, parsedRootConfig.options);

    console.log('✅ Program Created. Total Files:', cachedProgram.getSourceFiles().length);

    return cachedProgram;
}