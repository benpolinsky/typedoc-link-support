import * as assert from 'assert';
import * as vscode from 'vscode';
import { resolveLink } from '../linkResolver';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Resolve valid link export', () => {
        const link = '{@link one!myExport}';
        const result = resolveLink(link);
        assert.strictEqual(result?.name, 'myExport', 'Expected export name to be "myExport"');
    });

    test('Resolve valid link export and member', () => {
        const link = '{@link one!myExport#myMember}';
        const result = resolveLink(link);
        assert.strictEqual(result?.name, 'myMember', 'Expected member name to be "myMember"');
    });

    test('Resolves export with modifier', () => {
        const link = '{@link one!Spacey:namespace}';
        const result = resolveLink(link);
        assert.strictEqual(result?.name, 'Spacey', 'Expected to resolve export name');
    });

    test('Resolves export with member after modifier', () => {
        const link = '{@link one!Spacey:namespace#star}';
        const result = resolveLink(link);
        assert.strictEqual(result?.name, 'star', 'Expected to resolve member name');
    });

    test('Resolves exports with same name via modifier', () => {
        const link = `{@link two!Quarterback:namespace}`;
        const namespaceResult = resolveLink(link);
        assert.strictEqual(namespaceResult?.name, 'Quarterback', 'Expected to resolve export name');
        assert.strictEqual(namespaceResult?.start, 168, 'Expected to resolve export start position');

        const classLink = `{@link two!Quarterback:class}`;
        const classResult = resolveLink(classLink);
        assert.strictEqual(classResult?.name, 'Quarterback', 'Expected to resolve export name');
        assert.strictEqual(classResult?.start, 0, 'Expected to resolve export start position');

        const interfaceLink = `{@link two!QuarterbackFactory:interface}`;
        const interfaceResult = resolveLink(interfaceLink);
        assert.strictEqual(interfaceResult?.name, 'QuarterbackFactory', 'Expected to resolve export name');
        assert.strictEqual(interfaceResult?.start, 655, 'Expected to resolve export start position');

        const classLink2 = `{@link two!QuarterbackFactory:class}`;
        const classResult2 = resolveLink(classLink2);
        assert.strictEqual(classResult2?.name, 'QuarterbackFactory', 'Expected to resolve export name');
        assert.strictEqual(classResult2?.start, 423, 'Expected to resolve export start position');

        const typeLink = `{@link two!QuarterbackType:type}`;
        const typeResult = resolveLink(typeLink);
        assert.strictEqual(typeResult?.name, 'QuarterbackType', 'Expected to resolve export name');
        assert.strictEqual(typeResult?.start, 737, 'Expected to resolve export start position');

        const namespaceLink2 = `{@link two!QuarterbackType:namespace}`;
        const namespaceResult2 = resolveLink(namespaceLink2);
        assert.strictEqual(namespaceResult2?.name, 'QuarterbackType', 'Expected to resolve export name');
        assert.strictEqual(namespaceResult2?.start, 833, 'Expected to resolve export start position');
    });

    test('Does not resolve invalid link format', () => {
        const link = '{@link invalidFormat}';
        const result = resolveLink(link);
        assert.strictEqual(result, null, 'Expected to return null for invalid link format');
    });

    test('Does not resolve non-existent package in same workspace as package with same export name', () => {
        const link = '{@link nonExistentPackage!myExport}';
        const result = resolveLink(link);
        assert.strictEqual(result, null, 'Expected to return null for non-existent module');
    });

    test("Does not resolve non-existent export in package", () => {
        const link = '{@link one!nonExistentExport}';
        const result = resolveLink(link);
        assert.strictEqual(result, null, 'Expected to return null for non-existent export name');
    });

    test('Does not resolve non-existent member in export', () => {
        const link = '{@link one!myExport#nonExistentMember}';
        const result = resolveLink(link);
        assert.strictEqual(result, null, 'Expected to return null for non-existent member');
    });

    test('Does not resolve export with non-existent modifier', () => {
        const link = '{@link one!myExport:NonExistentModifier}';
        const result = resolveLink(link);
        assert.strictEqual(result, null, 'Expected to return null for non-existent modifier');
    });
});
