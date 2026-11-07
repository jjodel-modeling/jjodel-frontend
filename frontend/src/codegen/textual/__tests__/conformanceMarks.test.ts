/**
 * Step D lane D3b (P-2026-11-07-0157; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §4, decisions D6
 * and D8): the quick fixes the Text tab offers on a parse error marker, from D3a's `fix`, and the conformance violations
 * mapped to the carried spans of their object and feature.
 */

import { describe, it, expect, vi } from 'vitest';
import type * as Monaco from 'monaco-editor';
import type { ConcreteGrammar } from '../concreteGrammar';
import { parseText } from '../parser';
import type { TextParseError } from '../parser';
import { printTextModel } from '../printer';
import { openTextualSession, registerTextualMonaco, TEXTUAL_LANGUAGE_ID } from '../ui/textualMonaco';
import { conformanceMarks, CONFORMANCE_SOURCE } from '../conformanceMarks';
import type { MarkedViolation } from '../conformanceMarks';
import { portGrammar, portObjects, PORT_MM, PORT_TEXT_CLIKE } from './portCorpus';
import { libraryObjects, tolerantCases } from './tolerantCorpus';

// The Monaco adapter's theme imports `joiner` (textualMonaco.ts header): the bench gives it empty rules.
vi.mock('../../../jjscript/editor/jjscriptLanguage', () => ({ jjscriptThemeRules: () => [] }));
vi.mock('../../../jjtl/editor/jjtlTheme', () => ({ jjtlTheme: { rules: [] } }));

/** A model over `text`: offsets and 1-based positions as Monaco's. */
const modelOf = (text: string, version = 1): Monaco.editor.ITextModel => {
    const starts = [0, ...[...text].flatMap((ch, i) => (ch === '\n' ? [i + 1] : []))];
    return {
        uri: { toString: () => `inmemory://${text.length}` },
        getVersionId: () => version,
        getValue: () => text,
        getValueLength: () => text.length,
        getOffsetAt: (p: Monaco.IPosition) => starts[p.lineNumber - 1] + p.column - 1,
        getPositionAt: (o: number) => {
            let l = 0;
            while (l + 1 < starts.length && starts[l + 1] <= o) l++;
            return { lineNumber: l + 1, column: o - starts[l] + 1 };
        },
    } as unknown as Monaco.editor.ITextModel;
};

describe('(1) the code action provider: D3a fixes as quick fixes (D6)', () => {
    const providers = new Map<string, any>();
    const metadata = new Map<string, any>();
    const fakeMonaco = {
        Emitter: class { event = () => ({ dispose: () => {} }); fire(): void {} },
        Range: class { constructor(readonly startLineNumber: number, readonly startColumn: number, readonly endLineNumber: number, readonly endColumn: number) {} },
        languages: new Proxy({ CompletionItemKind: {}, CompletionTriggerKind: { Invoke: 0, TriggerCharacter: 1 }, SymbolKind: {}, FoldingRangeKind: {} } as Record<string, unknown>, {
            get: (t, k: string) => k in t ? t[k] : (id: string, p: unknown, m?: unknown) => {
                if (/^register.*Provider$/.test(k) && id === TEXTUAL_LANGUAGE_ID) { providers.set(k, p); metadata.set(k, m); }
            },
        }),
        editor: { registerCommand: () => {}, defineTheme: () => {}, getEditors: () => [] },
    };
    registerTextualMonaco(fakeMonaco as unknown as typeof Monaco);
    const provider = providers.get('registerCodeActionProvider');

    const LIB = tolerantCases()[0];
    const LIB_TEXT = printTextModel(LIB.g, libraryObjects(2, 2)).text;

    /** The marker the tab sets for `e` (TextualTab.tsx `setMarkers`): its start, its message. */
    const markerOf = (model: Monaco.editor.ITextModel, e: TextParseError): Monaco.editor.IMarkerData => {
        const a = model.getPositionAt(e.start);
        const b = model.getPositionAt(Math.max(e.end, e.start + 1));
        return { severity: 8, message: e.message, startLineNumber: a.lineNumber, startColumn: a.column, endLineNumber: b.lineNumber, endColumn: b.column };
    };
    /** The provider's actions on `text`, given the markers of its plain parse (no fixes asked), as the tab sets them. */
    const actionsOn = (g: ConcreteGrammar | null, text: string, markers?: (m: Monaco.editor.ITextModel) => Monaco.editor.IMarkerData[]) => {
        const model = modelOf(text);
        const session = g === undefined ? null : openTextualSession(model, { base: () => (g ? { grammar: g, mm: PORT_MM } : null), keep: () => undefined });
        const ms = markers ? markers(model) : g ? parseText(text, g).errors.map(e => markerOf(model, e)) : [];
        const out = provider.provideCodeActions(model, ms[0] ? new fakeMonaco.Range(ms[0].startLineNumber, ms[0].startColumn, ms[0].endLineNumber, ms[0].endColumn) : null,
            { markers: ms, trigger: 1 }, { isCancellationRequested: false });
        session?.dispose();
        return { actions: (out?.actions ?? []) as Monaco.languages.CodeAction[], model, markers: ms };
    };
    /** `text` with the action's one edit applied. */
    const applied = (model: Monaco.editor.ITextModel, text: string, a: Monaco.languages.CodeAction): string => {
        const edits = (a.edit?.edits ?? []) as Monaco.languages.IWorkspaceTextEdit[];
        expect(edits.length).toBe(1);
        const { range, text: put } = edits[0].textEdit;
        const from = model.getOffsetAt({ lineNumber: range.startLineNumber, column: range.startColumn });
        const to = model.getOffsetAt({ lineNumber: range.endLineNumber, column: range.endColumn });
        return text.slice(0, from) + put + text.slice(to);
    };

    it('is registered for quick fixes', () => {
        expect(provider).toBeDefined();
        expect(metadata.get('registerCodeActionProvider')?.providedCodeActionKinds).toEqual(['quickfix']);
    });

    it('a missing token: one quick fix, titled by its edit, preferred, whose edit makes the text read in full', () => {
        const broken = LIB_TEXT.replace('Library city {', 'Library city');
        const { actions, model, markers } = actionsOn(LIB.g, broken);
        expect(markers.length).toBe(1);
        expect(actions.map(a => a.title)).toEqual(['insert "{"']);
        expect(actions[0].kind).toBe('quickfix');
        expect(actions[0].isPreferred).toBe(true);
        expect(actions[0].diagnostics).toEqual([markers[0]]);
        const edit = (actions[0].edit!.edits[0] as Monaco.languages.IWorkspaceTextEdit);
        expect(edit.resource).toBe(model.uri);
        expect(applied(model, broken, actions[0])).toBe(LIB_TEXT);
        expect(parseText(applied(model, broken, actions[0]), LIB.g).errors).toEqual([]);
    });

    it('an unknown reference: one quick fix per near name, nearest first, only the first preferred', () => {
        const broken = LIB_TEXT.replace('borrowedBy reader1', 'borrowedBy reder1');
        const { actions, model } = actionsOn(LIB.g, broken);
        expect(actions.map(a => a.title)).toEqual(['replace with "reader1"', 'replace with "reader0"']);
        expect(actions.map(a => !!a.isPreferred)).toEqual([true, false]);
        expect(applied(model, broken, actions[0])).toBe(LIB_TEXT);
        expect(applied(model, broken, actions[1])).toBe(LIB_TEXT.replace('borrowedBy reader1', 'borrowedBy reader0'));
    });

    it('a marker the fixes do not explain, a marker of another source, or no session: no action', () => {
        const broken = LIB_TEXT.replace('Library city {', 'Library city');
        // Same place, another message: a conformance warning, say.
        expect(actionsOn(LIB.g, broken, m => [{ ...markerOf(m, parseText(broken, LIB.g).errors[0]), message: 'Missing required attribute', source: 'conformance' }]).actions).toEqual([]);
        // An error with no fixable shape gets no action.
        const g = portGrammar();
        const garbled = 'Module cpu {\n  input instr : Word(32)\n  ~~~\n}';
        const errs = parseText(garbled, g, { fixes: true }).errors;
        expect(errs.length).toBeGreaterThan(0);
        const withoutFix = errs.filter(e => !e.fix);
        expect(withoutFix.length).toBeGreaterThan(0);
        expect(actionsOn(g, garbled, m => withoutFix.map(e => markerOf(m, e))).actions).toEqual([]);
        // No session (not a Text tab's model), or a session with no base yet.
        expect(actionsOn(undefined as unknown as null, broken, m => parseText(broken, LIB.g).errors.map(e => markerOf(m, e))).actions).toEqual([]);
        expect(actionsOn(null, broken, m => parseText(broken, LIB.g).errors.map(e => markerOf(m, e))).actions).toEqual([]);
    });

    it('several markers in the range: the fixes of each, in marker order, each action naming its own marker', () => {
        const broken = LIB_TEXT.replace('Library city {', 'Library city').replace('borrowedBy reader1', 'borrowedBy reder1');
        const { actions, markers } = actionsOn(LIB.g, broken);
        expect(markers.length).toBeGreaterThan(1);
        const fixed = parseText(broken, LIB.g, { fixes: true }).errors;
        expect(actions.map(a => a.title)).toEqual(fixed.flatMap(e => (e.fix ?? []).map(f => f.title)));
        for (const a of actions) expect(a.diagnostics?.length).toBe(1);
    });
});

describe('(2) conformance violations as marks on the carried spans (D8)', () => {
    const g = portGrammar();
    const printed = printTextModel(g, portObjects());
    const text = printed.text;
    const spans = printed.spans;
    const tree = parseText(text, g).tree;
    const v = (objectId: string, violationType: MarkedViolation['violationType'], metamodelElementName?: string, message = `${violationType} on ${objectId}`): MarkedViolation =>
        ({ objectId, violationType, message, ...(metamodelElementName ? { metamodelElementName } : {}) });
    const shown = (t: string, ms: ReturnType<typeof conformanceMarks>) => ms.map(m => t.slice(m.start, m.end));

    it('the port corpus prints as expected, the spans carrying the model ids', () => {
        expect(text).toBe(PORT_TEXT_CLIKE);
        expect(spans.map(s => s.id)).toContain('p3');
    });

    it('an object violation: on the object\'s first line, a warning of source conformance with the violation\'s message', () => {
        const ms = conformanceMarks([v('m', 'orphan_object', 'Module', 'Object "cpu" is not contained')], spans, text, tree);
        expect(shown(text, ms)).toEqual(['Module cpu {']);
        expect(ms[0]).toMatchObject({ severity: 'warning', source: CONFORMANCE_SOURCE, message: 'Object "cpu" is not contained', objectId: 'm' });
        expect(CONFORMANCE_SOURCE).toBe('conformance');
        // A class name in `metamodelElementName` is no feature, even where a feature has that name.
        expect(shown(text, conformanceMarks([v('p1', 'abstract_instantiation', 'name')], spans, text, tree))).toEqual(['instr : Word(32)']);
    });

    it('a feature violation: on the item of that feature in the object, never on one of a contained object', () => {
        const ms = conformanceMarks([
            v('p3', 'multiplicity_below_min', 'driver'),
            v('p1', 'reference_target_type_mismatch', 'type'),
            v('m', 'invalid_name_format', 'name'),
            v('p3', 'invalid_name_format', 'name'),
        ], spans, text, tree);
        expect(shown(text, ms)).toEqual(['cpu', 'Word(32)', 'result', '= instr & {} & and(ready)']);
        expect(ms.map(m => m.feature)).toEqual(['name', 'type', 'name', 'driver']);
    });

    it('a feature the text does not write (a missing mandatory feature): on the object\'s first line', () => {
        expect(shown(text, conformanceMarks([v('p2', 'missing_required_attr', 'name')], spans, text, tree))).toEqual([': Bool']);
        expect(shown(text, conformanceMarks([v('m', 'missing_required_attr', 'nowhere')], spans, text, tree))).toEqual(['Module cpu {']);
        // Without a tree (a broken text, say), a feature violation falls back the same way.
        expect(shown(text, conformanceMarks([v('p3', 'multiplicity_below_min', 'driver')], spans, text))).toEqual(['output result : Word(8) = instr & {} & and(ready)'.slice('output '.length)]);
    });

    it('a violation whose object has no span (not printed, or the model itself): no mark; nor an empty span', () => {
        expect(conformanceMarks([v('zz', 'orphan_object', 'Port')], spans, text, tree)).toEqual([]);
        expect(conformanceMarks([v('m', 'orphan_object')], [{ id: 'm', start: 4, end: 4 }], text, tree)).toEqual([]);
        expect(shown(text, conformanceMarks([v('zz', 'orphan_object'), v('p1', 'orphan_object')], spans, text, tree))).toEqual(['instr : Word(32)']);
    });

    it('no violations: no marks', () => {
        expect(conformanceMarks([], spans, text, tree)).toEqual([]);
    });

    it('in text order, whatever the order of the violations', () => {
        const ms = conformanceMarks([v('p3', 'orphan_object'), v('m', 'orphan_object'), v('p1', 'orphan_object')], spans, text, tree);
        expect(ms.map(m => m.objectId)).toEqual(['m', 'p1', 'p3']);
    });

    it('across typing: on the carried spans, shifted with the text, the marks keep their words', () => {
        const typed = `// a note\n${text.replace('input : Bool', 'input : Bool\n  input extra : Bool')}`;
        const shift = (o: number): number => o + '// a note\n'.length + (o >= text.indexOf('input : Bool') + 'input : Bool'.length ? '\n  input extra : Bool'.length : 0);
        const carried = spans.map(s => ({ ...s, start: shift(s.start), end: shift(s.end) }));
        const all = [v('m', 'orphan_object'), v('p3', 'multiplicity_below_min', 'driver'), v('p2', 'missing_required_attr', 'name')];
        expect(shown(typed, conformanceMarks(all, carried, typed, parseText(typed, g).tree))).toEqual(shown(text, conformanceMarks(all, spans, text, tree)));
        // A span the edit pushed past the end of the text is cut at it.
        const cut = typed.slice(0, typed.length - 1);
        expect(conformanceMarks([v('m', 'orphan_object')], carried, cut).every(m => m.end <= cut.length)).toBe(true);
    });
});
