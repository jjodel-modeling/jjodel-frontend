/**
 * The textual entry in the toolbar viewpoint picker (R-TXT-23, slice T2b, P-2026-11-02-0040).
 *
 * The vocabulary lives in `dataManagerOption.ts`, which imports nothing, and is exercised as a real unit: the sentinel,
 * its predicate, and the label (the language's name, the metamodel's by default). `Toolbar.tsx` does not import under
 * the `node` environment (it reaches `../../joiner`, see dataManagerPicker.test.ts), so the two routing claims below
 * are asserted on its source; the mutation each one dies on is in its name, the bench in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    DATA_MANAGER_OPTION_VALUE,
    TEXTUAL_OPTION_FALLBACK_LABEL,
    TEXTUAL_OPTION_VALUE,
    isDataManagerOption,
    isTextualOption,
    textualOptionLabel,
} from '../dataManagerOption';

const TSX = readFileSync(resolve(__dirname, '../Toolbar.tsx'), 'utf8');

function slice(from: string, to: string): string {
    const start = TSX.indexOf(from);
    expect(start).toBeGreaterThan(-1);
    const end = TSX.indexOf(to, start);
    expect(end).toBeGreaterThan(start);
    return TSX.slice(start, end);
}

describe('T2b — the sentinel', () => {
    it('cannot be a pointer and is not the manager sentinel', () => {
        expect(TEXTUAL_OPTION_VALUE).toBe('@textual');
        expect(TEXTUAL_OPTION_VALUE.startsWith('Pointer')).toBe(false);
        expect(TEXTUAL_OPTION_VALUE).not.toBe(DATA_MANAGER_OPTION_VALUE);
    });

    it('is recognised, and nothing else is', () => {
        expect(isTextualOption(TEXTUAL_OPTION_VALUE)).toBe(true);
        for (const v of ['', DATA_MANAGER_OPTION_VALUE, 'Pointer_ViewPoint_1', '@textual ', 'textual', null, undefined]) {
            expect(isTextualOption(v)).toBe(false);
        }
    });

    it('is not read as the manager sentinel', () => {
        expect(isDataManagerOption(TEXTUAL_OPTION_VALUE)).toBe(false);
    });
});

describe('T2b — the label', () => {
    it('is the language name when there is one', () => {
        expect(textualOptionLabel('Garage', 'GarageText')).toBe('GarageText');
    });

    it('falls back to the metamodel name without a language name', () => {
        expect(textualOptionLabel('Garage')).toBe('Garage');
        expect(textualOptionLabel('Garage', null)).toBe('Garage');
        expect(textualOptionLabel('Garage', '')).toBe('Garage');
        expect(textualOptionLabel('Garage', '   ')).toBe('Garage');
    });

    it('trims the name it shows', () => {
        expect(textualOptionLabel('  Garage ')).toBe('Garage');
        expect(textualOptionLabel('Garage', ' Cars ')).toBe('Cars');
    });

    it('falls back to a fixed word with neither name', () => {
        expect(textualOptionLabel(undefined)).toBe(TEXTUAL_OPTION_FALLBACK_LABEL);
        expect(textualOptionLabel('', ' ')).toBe(TEXTUAL_OPTION_FALLBACK_LABEL);
        expect(TEXTUAL_OPTION_FALLBACK_LABEL).toBe('Text');
    });
});

describe('T2b — the routing in Toolbar.tsx', () => {
    it('returns before activateViewpoint on the sentinel (dies when the branch falls through)', () => {
        const handler = slice('const handleViewpointChange = useCallback(', '}, [modelId]);');
        const guard = handler.indexOf('isTextualOption(vpId)');
        const write = handler.indexOf('activateViewpoint(');
        expect(guard).toBeGreaterThan(-1);
        expect(write).toBeGreaterThan(guard);
        const branch = handler.slice(guard, write);
        expect(branch).toContain("import('../../codegen/textual/ui/openTextualTab')");
        expect(branch).toMatch(/openTextualTab\([\s\S]*\breturn;\s*\}\s*$/);
    });

    it('offers the entry only with the code generation setting on (dies when the guard is dropped)', () => {
        const entries = slice('const syntaxEntries: SyntaxEntry[] = [ABSTRACT_SYNTAX_ENTRY];', 'const currentSyntax');
        const guard = entries.indexOf('if (codegenEnabled) {');
        const entry = entries.indexOf('value: TEXTUAL_OPTION_VALUE');
        expect(guard).toBeGreaterThan(-1);
        expect(entry).toBeGreaterThan(guard);
        expect(entry).toBeLessThan(entries.indexOf('value: DATA_MANAGER_OPTION_VALUE'));
        expect(TSX).toContain('const codegenEnabled = useCodegenEnabled() && CODEGEN_BUILD;');
    });
});
