/**
 * The textual entry in the toolbar viewpoint picker (R-TXT-23, slice T2b, P-2026-11-02-0040).
 *
 * The vocabulary lives in `dataManagerOption.ts`, which imports nothing, and is exercised as a real unit: the sentinel,
 * its predicate, and the label (the language's name, the metamodel's by default). `Toolbar.tsx` does not import under
 * the `node` environment (it reaches `../../joiner`, see dataManagerPicker.test.ts), so the two routing claims below
 * are asserted on its source; the mutation each one dies on is in its name, the bench in the commit body.
 *
 * T4a-2 (P-2026-11-02-1830, R-TXT-25 (12)): the language's name is read from the metamodel's stored syntax annotations
 * (codegen/textual/syntaxRecord.ts), here, with no import, so the picker shows it without loading `src/codegen/`.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    DATA_MANAGER_OPTION_VALUE,
    TEXTUAL_OPTION_FALLBACK_LABEL,
    TEXTUAL_OPTION_VALUE,
    TEXTUAL_SYNTAX_KEY,
    isDataManagerOption,
    isTextualOption,
    textualLanguageNameOf,
    textualLanguageOf,
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

describe('T4a-2 — the language name stored with the syntax annotations', () => {
    const lookup = (stored?: unknown): Record<string, any> => ({
        M: { id: 'M', name: 'city', instanceof: 'MM' },
        MM: { id: 'MM', name: 'Library', _state: stored === undefined ? {} : { [TEXTUAL_SYNTAX_KEY]: stored } },
    });
    const label = (l: Record<string, any>) => textualOptionLabel(l.MM.name, textualLanguageNameOf(l, 'M'));

    it('labels the entry with the language name when the record sets one (dies when the label ignores the language)', () => {
        expect(label(lookup('{"v":1,"language":"Shelf"}'))).toBe('Shelf');
    });

    it('falls back to the metamodel name when the record sets none, or there is no record', () => {
        expect(label(lookup())).toBe('Library');
        expect(label(lookup('{"v":1}'))).toBe('Library');
        expect(label(lookup('{"v":1,"language":"  "}'))).toBe('Library');
    });

    it('reads no language from a record it cannot read, as the codec does (dies when the version is not checked)', () => {
        for (const raw of ['{not json', '{"v":2,"language":"Shelf"}', '{"language":"Shelf"}', '[1]', 7, null]) {
            expect(textualLanguageOf(raw)).toBeNull();
        }
        expect(label(lookup('{"v":2,"language":"Shelf"}'))).toBe('Library');
    });

    it('reads the language from the model\'s metamodel, and nothing for an unknown model', () => {
        const l = lookup('{"v":1,"language":"Shelf"}');
        expect(textualLanguageNameOf(l, 'M')).toBe('Shelf');
        expect(textualLanguageNameOf(l, 'nope')).toBeNull();
        expect(textualLanguageNameOf(l, undefined)).toBeNull();
        expect(textualLanguageNameOf(undefined, 'M')).toBeNull();
    });

    it('is the key the codec writes', () => {
        expect(TEXTUAL_SYNTAX_KEY).toBe('textSyntax');
    });

    it('passes the language name to the label in the entry and in the handler (dies when either drops it)', () => {
        const entries = slice('const syntaxEntries: SyntaxEntry[] = [ABSTRACT_SYNTAX_ENTRY];', 'const currentSyntax');
        expect(entries).toContain('label: textualOptionLabel(metamodelName, languageName),');
        expect(TSX).toContain('const languageName = useSelector((state: any) => textualLanguageNameOf(state.idlookup, modelId))');
        const handler = slice('const handleViewpointChange = useCallback(', '}, [modelId]);');
        expect(handler).toMatch(/textualOptionLabel\(metamodelNameOf\(lookup, modelId\), textualLanguageNameOf\(lookup, modelId\)\)/);
    });
});
