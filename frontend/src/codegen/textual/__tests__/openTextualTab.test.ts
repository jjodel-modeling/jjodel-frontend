/**
 * Step C3a (P-2026-11-04-0412): the Text tab's style picker is the first caller of `writeTextualSyntax`. The writer
 * makes one `state` assignment holding the record's key alone (one `set_state`, one undo step), none when the record
 * is the stored one; the tab of a model carries it. The app's modules are fakes; the record's functions are real.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';

const fake = vi.hoisted(() => ({ dock: {} as any, open: vi.fn(async () => true), closeTab: vi.fn() }));
const state = vi.hoisted(() => ({ idlookup: {} as Record<string, any> }));
const writes = vi.hoisted(() => [] as { id: string; value: unknown }[]);

vi.mock('../../../components/abstract/DockManager', () => ({ default: fake }));
vi.mock('../../../joiner', () => ({
    DUser: {}, L: {}, U: {},
    LPointerTargetable: { fromPointer: (id: string) => ({ set state(value: unknown) { writes.push({ id, value }); } }) },
    store: { getState: () => state },
}));
vi.mock('../../../redux/action/action', () => ({ COMMIT: () => undefined }));
vi.mock('../../../redux/reducer/reducer', () => ({ beginUndoGroup: () => undefined, endUndoGroup: () => undefined }));
vi.mock('../../../jjscript/executor/planWorld', () => ({ buildPlanWorld: () => ({}) }));
vi.mock('../../../components/editor-v2/preview/PreviewBar', () => ({ applyAsOneStep: async () => ({ applied: 0, failed: 0 }) }));
vi.mock('../../../pages/components/Navbar', () => ({ createM1: () => null }));
vi.mock('../../../components/Toast/toastDispatch', () => ({ toast: {} }));
vi.mock('../ui/TextualTab', () => ({ default: () => null, NewTextualTab: () => null }));

import { openTextualTab, writeTextualSyntax } from '../ui/openTextualTab';
import { encodeSyntax, TEXTUAL_SYNTAX_KEY, withStyleBase } from '../syntaxRecord';
import type { SyntaxAnnotations } from '../annotations';

const RECORD: SyntaxAnnotations = { v: 1, language: 'Shelf', features: { A_Book_genre: { keyword: '' } } };

beforeEach(() => {
    writes.length = 0;
    fake.open.mockClear();
    state.idlookup = { mm: { id: 'mm', name: 'Library', _state: { other: 'kept', [TEXTUAL_SYNTAX_KEY]: encodeSyntax(RECORD) } }, m: { id: 'm', name: 'city', instanceof: 'mm' } };
});

describe('writeTextualSyntax, called by the style picker', () => {
    it('a switch to Pascal is one state assignment holding the key alone (mutants: the writer writes nothing; it writes the whole state)', () => {
        expect(writeTextualSyntax('mm', withStyleBase(RECORD, 'pascal'))).toBe(true);
        expect(writes).toEqual([{ id: 'mm', value: { [TEXTUAL_SYNTAX_KEY]: encodeSyntax({ ...RECORD, style: { base: 'pascal' } }) } }]);
    });

    it('the record as stored writes nothing; a switch back writes the string before the switch (mutant: the no-op check dropped)', () => {
        expect(writeTextualSyntax('mm', withStyleBase(RECORD, 'clike'))).toBe(true);
        expect(writes).toEqual([]);
        state.idlookup.mm._state[TEXTUAL_SYNTAX_KEY] = encodeSyntax(withStyleBase(RECORD, 'pascal'));
        writeTextualSyntax('mm', withStyleBase(withStyleBase(RECORD, 'pascal'), 'clike'));
        expect(writes.map(w => (w.value as Record<string, string>)[TEXTUAL_SYNTAX_KEY])).toEqual([encodeSyntax(RECORD)]);
    });

    it('a metamodel not in the store is false, and nothing is written', () => {
        expect(writeTextualSyntax('gone', withStyleBase(RECORD, 'pascal'))).toBe(false);
        expect(writes).toEqual([]);
    });
});

describe('the Text tab of a model', () => {
    it('carries the writer, so the picker shows (mutant: the prop not passed)', () => {
        expect(openTextualTab('m', 'Library')).toBe(true);
        const tab = (fake.open.mock.calls[0] as unknown[])[1] as any;
        expect(tab.content.props.writeSyntax).toBe(writeTextualSyntax);
    });
});
