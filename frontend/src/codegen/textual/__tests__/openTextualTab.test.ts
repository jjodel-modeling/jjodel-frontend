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

import { openTextualTab, textualPlacement, textualTabId, writeTextualSyntax } from '../ui/openTextualTab';
import { encodeSyntax, TEXTUAL_SYNTAX_KEY, withStyleBase } from '../syntaxRecord';
import type { SyntaxAnnotations } from '../annotations';

/**
 * A fake rc-dock with the panels `panels`, each a list of tab ids and the shown one (the first when none): `find` gives
 * a tab with its panel as `parent`, as rc-dock does; `dockMove` records the move.
 */
function fakeDock(panels: { tabs: string[]; active?: string }[]) {
    const moves: { tab: any; target: any; direction: string }[] = [];
    const built = panels.map(p => {
        const panel: any = { activeId: p.active, tabs: [] };
        panel.tabs = p.tabs.map(id => ({ id, content: null, parent: panel }));
        return panel;
    });
    return {
        moves,
        find: (id: string) => built.flatMap(p => p.tabs).find((t: any) => t.id === id),
        dockMove: (tab: any, target: any, direction: string) => { moves.push({ tab, target, direction }); },
        updateTab: () => true,
        getLayout: () => ({ dockbox: { children: built } }),
    } as any;
}

const RECORD: SyntaxAnnotations = { v: 1, language: 'Shelf', features: { A_Book_genre: { keyword: '' } } };

beforeEach(() => {
    writes.length = 0;
    fake.open.mockClear();
    fake.dock = fakeDock([{ tabs: ['project_summary'] }]);
    state.idlookup = {
        mm: { id: 'mm', name: 'Library', _state: { other: 'kept', [TEXTUAL_SYNTAX_KEY]: encodeSyntax(RECORD) } },
        m: { id: 'm', className: 'DModel', name: 'city', instanceof: 'mm' },
        n: { id: 'n', className: 'DModel', name: 'town', instanceof: 'mm' },
    };
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

describe('E9 (R-TXT-54): the Text tab opens beside its model\'s canvas', () => {
    const TXT = textualTabId('m');

    it('not open, the model\'s canvas shown: beside it (mutant: the canvas test dropped, the tab opens as today)', () => {
        expect(textualPlacement(fakeDock([{ tabs: ['project_summary', 'm'], active: 'm' }]), 'm')).toBe('open-beside');
    });

    it('not open, the canvas docked but the project page shown: as today (mutant: a docked canvas counts as shown)', () => {
        expect(textualPlacement(fakeDock([{ tabs: ['project_summary', 'm'], active: 'project_summary' }]), 'm')).toBe('open');
    });

    it('not open, another model\'s canvas shown in the panel: as today (mutant: shownCanvas read with the store\'s lookup)', () => {
        expect(textualPlacement(fakeDock([{ tabs: ['project_summary', 'm', 'n'], active: 'n' }]), 'm')).toBe('open');
    });

    it('not open, no canvas of the model docked: as today', () => {
        expect(textualPlacement(fakeDock([{ tabs: ['project_summary'] }]), 'm')).toBe('open');
    });

    it('open behind the shown canvas, in its panel: moved beside it (mutant: an open tab is only brought forward)', () => {
        expect(textualPlacement(fakeDock([{ tabs: ['project_summary', 'm', TXT], active: 'm' }]), 'm')).toBe('move-beside');
    });

    it('open in a panel of its own beside the canvas: brought forward where it is (mutant: moved whenever the canvas is shown)', () => {
        expect(textualPlacement(fakeDock([{ tabs: ['project_summary', 'm'], active: 'm' }, { tabs: [TXT] }]), 'm')).toBe('activate');
    });

    it('open and shown in the canvas\'s panel, the canvas behind it: brought forward where it is', () => {
        expect(textualPlacement(fakeDock([{ tabs: ['project_summary', 'm', TXT], active: TXT }]), 'm')).toBe('activate');
    });

    it('openTextualTab docks the new tab right of the canvas\'s panel, not through DockManager.open (mutant: the placement not applied)', () => {
        const dock = fakeDock([{ tabs: ['project_summary', 'm'], active: 'm' }]);
        fake.dock = dock;
        expect(openTextualTab('m', 'Library')).toBe(true);
        expect(dock.moves.map((m: any) => [m.tab.id, m.target.tabs.map((t: any) => t.id), m.direction])).toEqual([[TXT, ['project_summary', 'm'], 'right']]);
        expect(fake.open).not.toHaveBeenCalled();
    });

    it('openTextualTab with no canvas shown opens through DockManager.open, as today (mutant: always docked beside)', () => {
        expect(openTextualTab('m', 'Library')).toBe(true);
        expect(fake.open).toHaveBeenCalledTimes(1);
        expect((fake.dock as any).moves).toEqual([]);
    });

    it('the title carries the dock\'s not-pinned marker, so PinnableDock shows the panel beside the canvas (mutant: the class dropped)', () => {
        openTextualTab('m', 'Library');
        const tab = (fake.open.mock.calls[0] as unknown[])[1] as any;
        expect(String(tab.title.props.className).split(/\s+/)).toContain('not-pinned');
    });
});
