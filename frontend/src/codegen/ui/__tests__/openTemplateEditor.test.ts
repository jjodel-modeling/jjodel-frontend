/**
 * openTemplateEditor and canvasSelection's dock helpers — the generator tab docked beside the canvas, and moved
 * beside it when a fragment click brings the canvas forward in its panel (P-2026-10-24-1515); one placement rule from
 * a shown canvas, back to the first panel with none (P-2026-10-25-1310). rc-dock's `dock` is a fake with the same
 * `find`/`dockMove`/`getLayout` contract, a middle drop activating the tab as rc-dock's does. Mutations each test kills are in its name; the bench is
 * in the commit body.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';

const fake = vi.hoisted(() => ({ dock: null as any }));
const rail = vi.hoisted(() => ({ collapse: vi.fn(), close: vi.fn() }));
const lookup = vi.hoisted(() => ({ idlookup: {} as Record<string, any> }));

vi.mock('../../../components/abstract/DockManager', () => ({ default: fake }));
vi.mock('../../../components/environment/consumerMode', () => ({ isConsumerMode: () => false }));
vi.mock('../../../events/registry', () => ({ JjodelEvents: { SELECT_NODE: 'select-node' } }));
vi.mock('../../../joiner', () => ({ LPointerTargetable: { fromPointer: (x: unknown) => x }, store: { getState: () => lookup } }));
vi.mock('../TemplateEditorTab', async () => {
    const { generatorTabId } = await vi.importActual<typeof import('../generatorTabs')>('../generatorTabs');
    return {
        default: () => null,
        TemplateTabTitle: () => null,
        chooseModelInTemplateTab: () => true,
        selectInTemplateTab: () => true,
        templateTabId: generatorTabId,
        collapseRailOnOpen: rail.collapse,
        requestCloseTemplateTab: rail.close,
        createGenerator: () => null,
    };
});

import { openTemplateEditor } from '../openTemplateEditor';
import { BESIDE_SHARE, generatorTabsOf, keepBeside, panelOf, selectOnModelCanvas } from '../canvasSelection';
import { GENERATOR_GROUP } from '../generatorTabs';

type Panel = { id: string; tabs: any[]; size: number; parent?: any; activeId?: string };

/** A dock with one horizontal box, panels holding the tabs named. */
function fakeDock(...panels: string[][]) {
    const dockbox: any = { mode: 'horizontal', children: [] };
    panels.forEach((ids, i) => {
        const panel: Panel = { id: `p${i}`, tabs: [], size: 1000, parent: dockbox };
        panel.tabs = ids.map(id => ({ id, parent: panel, content: null }));
        dockbox.children.push(panel);
    });
    const layout = { dockbox };
    const tabs = () => dockbox.children.flatMap((p: Panel) => p.tabs);
    const dock = {
        moves: [] as [string, string, string][],
        getLayout: () => layout,
        find: (id: string) => tabs().find((t: any) => t.id === id),
        updateTab: vi.fn(),
        dockMove(tab: any, target: Panel, direction: string) {
            dock.moves.push([tab.id, target.id, direction]);
            for (const p of dockbox.children as Panel[]) {
                p.tabs = p.tabs.filter(t => t.id !== tab.id);
                if (p.activeId === tab.id) p.activeId = undefined;
            }
            if (direction === 'middle') {
                target.tabs.push(tab);
                target.activeId = tab.id;
                tab.parent = target;
            } else {
                const panel: Panel = { id: `p${dockbox.children.length}`, tabs: [tab], size: target.size, parent: dockbox };
                tab.parent = panel;
                const at = dockbox.children.indexOf(target) + (direction === 'right' ? 1 : 0);
                dockbox.children.splice(at, 0, panel);
            }
        },
    };
    return dock;
}

/** The tab `id` shown in its panel, as a click on it leaves it. */
function show(dock: ReturnType<typeof fakeDock>, id: string): void {
    panelOf(dock as any, id)!.activeId = id;
}

const shownIn = (dock: ReturnType<typeof fakeDock>, id: string) => { const p = panelOf(dock as any, id)!; return p.activeId ?? p.tabs[0]?.id; };

beforeEach(() => {
    fake.dock = null;
    rail.collapse.mockClear();
    rail.close.mockClear();
    lookup.idlookup = {};
});

describe('openTemplateEditor', () => {
    it('every opening, new or brought forward, arms the rail collapse (kills: no collapse on opening) (P-2026-10-25-0925)', () => {
        fake.dock = fakeDock(['project_summary', 'M1']);
        show(fake.dock, 'M1');
        expect(openTemplateEditor('MM', 'Turnstile', null, 'default', 'M1')).toBe(true);
        expect(openTemplateEditor('MM', 'Turnstile', null, 'default', 'M1')).toBe(true);
        expect(rail.collapse).toHaveBeenCalledTimes(2);
    });

    it('docks a new tab right of the canvas panel, at 45 % (kills: middle kept)', () => {
        const dock = fakeDock(['project_summary', 'M1']);
        show(dock, 'M1');
        fake.dock = dock;
        expect(openTemplateEditor('MM', 'Turnstile', null, 'default', 'M1')).toBe(true);
        expect(dock.moves).toEqual([['codegen_tpl_MM', 'p0', 'right']]);
        const canvas = panelOf(dock as any, 'M1')!;
        const tab = panelOf(dock as any, 'codegen_tpl_MM')!;
        expect(canvas).not.toBe(tab);
        expect(tab.size! / (canvas.size! + tab.size!)).toBeCloseTo(BESIDE_SHARE);
    });

    it('docks beside the metamodel tab when no model is given (kills: model required)', () => {
        const dock = fakeDock(['project_summary'], ['MM']);
        fake.dock = dock;
        openTemplateEditor('MM', 'Turnstile');
        expect(dock.moves).toEqual([['codegen_tpl_MM', 'p1', 'right']]);
    });

    it('puts a second generator of the metamodel in the first one\'s panel (kills: a new split each time)', () => {
        const dock = fakeDock(['M1'], ['codegen_tpl_MM']);
        fake.dock = dock;
        openTemplateEditor('MM', 'Turnstile', null, 'g2', 'M1');
        expect(dock.moves).toEqual([['codegen_tpl_MM_g2', 'p1', 'middle']]);
    });

    it('with no canvas docked, joins the first panel, which the app bar lists, not a split beside the project page (kills: right of the project page kept) (P-2026-10-25-1200)', () => {
        const dock = fakeDock(['project_summary']);
        fake.dock = dock;
        expect(openTemplateEditor('MM', 'Turnstile', null, 'default', 'M1')).toBe(true);
        expect(dock.moves).toEqual([['codegen_tpl_MM', 'p0', 'middle']]);
        expect(panelOf(dock as any, 'codegen_tpl_MM')).toBe(dock.getLayout().dockbox.children[0]);
    });

    it('with a canvas of another metamodel shown first, still opens beside it (kills: always the first panel with no canvas of the metamodel) (P-2026-10-25-1200)', () => {
        const dock = fakeDock(['X']);
        fake.dock = dock;
        lookup.idlookup = { X: { className: 'DModel', instanceof: 'OTHER' } };
        openTemplateEditor('MM', 'Turnstile');
        expect(dock.moves).toEqual([['codegen_tpl_MM', 'p0', 'right']]);
    });

    it('the tab carries the app bar\'s title and close: <generator> · <metamodel>, null when gone, the close through the tab (kills: close only hides the entry; ghost title) (P-2026-10-25-1200)', () => {
        const dock = fakeDock(['project_summary']);
        fake.dock = dock;
        lookup.idlookup = { MM: { className: 'DModel', name: 'Turnstile', _state: {} } };
        openTemplateEditor('MM', 'Turnstile');
        const tab = dock.find('codegen_tpl_MM');
        expect(tab.appBarTitle()).toBe('Default · Turnstile');
        tab.requestClose();
        expect(rail.close).toHaveBeenCalledWith('codegen_tpl_MM');
        lookup.idlookup = {};
        expect(tab.appBarTitle()).toBeNull();
    });

    it('a new tab is in the generator group, not models, whose tab bar the app bar hides (kills: header hidden) (P-2026-10-25-1045)', () => {
        const dock = fakeDock(['project_summary']);
        fake.dock = dock;
        openTemplateEditor('MM', 'Turnstile');
        const tab = dock.find('codegen_tpl_MM');
        expect(GENERATOR_GROUP).not.toBe('models');
        expect(tab.group).toBe(GENERATOR_GROUP);
    });

    it('with a conforming model\'s canvas docked, goes beside it, not beside the project page (kills: always the first panel) (P-2026-10-25-1045)', () => {
        const dock = fakeDock(['project_summary'], ['M2']);
        fake.dock = dock;
        lookup.idlookup = { M2: { className: 'DModel', instanceof: 'MM' } };
        openTemplateEditor('MM', 'Turnstile');
        expect(dock.moves).toEqual([['codegen_tpl_MM', 'p1', 'right']]);
    });

    it('a pill opening moves a tab of the main panel beside the shown canvas, which stays active (kills: only activated) (P-2026-10-25-1310)', () => {
        const dock = fakeDock(['project_summary', 'M1', 'codegen_tpl_MM']);
        show(dock, 'M1');
        fake.dock = dock;
        openTemplateEditor('MM', 'Turnstile', null, 'default', 'M1');
        expect(dock.moves).toEqual([['codegen_tpl_MM', 'p0', 'right']]);
        expect(panelOf(dock as any, 'codegen_tpl_MM')).not.toBe(panelOf(dock as any, 'M1'));
        expect(shownIn(dock, 'M1')).toBe('M1');
        expect(dock.updateTab).toHaveBeenCalledWith('codegen_tpl_MM', null, true);
    });

    it('a tab already beside the canvas is only activated (kills: moved every time) (P-2026-10-25-1310)', () => {
        const dock = fakeDock(['project_summary', 'M1'], ['codegen_tpl_MM']);
        show(dock, 'M1');
        fake.dock = dock;
        openTemplateEditor('MM', 'Turnstile', null, 'default', 'M1');
        expect(dock.moves).toEqual([]);
        expect(dock.updateTab).toHaveBeenCalledWith('codegen_tpl_MM', null, true);
    });

    it('from GENERATORS with the project page shown, a tab beside a hidden canvas goes back to the first panel (kills: left beside the project page) (P-2026-10-25-1310)', () => {
        const dock = fakeDock(['project_summary', 'M1'], ['codegen_tpl_MM']);
        show(dock, 'project_summary');
        fake.dock = dock;
        lookup.idlookup = { M1: { className: 'DModel', instanceof: 'MM' } };
        openTemplateEditor('MM', 'Turnstile');
        expect(dock.moves).toEqual([['codegen_tpl_MM', 'p0', 'middle']]);
        expect(dock.updateTab).toHaveBeenCalledWith('codegen_tpl_MM', null, true);
    });

    it('a second generator asked for from the shown canvas does not join the first one in the canvas\'s panel (kills: siblings\' panel over the canvas) (P-2026-10-25-1310)', () => {
        const dock = fakeDock(['project_summary', 'M1', 'codegen_tpl_MM']);
        show(dock, 'M1');
        fake.dock = dock;
        openTemplateEditor('MM', 'Turnstile', null, 'g2', 'M1');
        expect(dock.moves).toEqual([['codegen_tpl_MM_g2', 'p0', 'right']]);
        expect(shownIn(dock, 'M1')).toBe('M1');
    });
});

describe('keepBeside', () => {
    it('moves the generator tab right of a canvas in its own panel (kills: the same-panel move dropped)', () => {
        const dock = fakeDock(['M1', 'codegen_tpl_MM']);
        expect(keepBeside(dock as any, 'codegen_tpl_MM', 'M1')).toBe(true);
        expect(dock.moves).toEqual([['codegen_tpl_MM', 'p0', 'right']]);
        expect(panelOf(dock as any, 'M1')).not.toBe(panelOf(dock as any, 'codegen_tpl_MM'));
    });

    it('joins the panel of the metamodel\'s other generator tabs when one exists (kills: always a new split)', () => {
        const dock = fakeDock(['M1', 'codegen_tpl_MM'], ['codegen_tpl_MM_g2'], ['codegen_tpl_OTHER']);
        expect(keepBeside(dock as any, 'codegen_tpl_MM', 'M1', generatorTabsOf('MM'))).toBe(true);
        expect(dock.moves).toEqual([['codegen_tpl_MM', 'p1', 'middle']]);
    });

    it('leaves the tab where it is when the canvas is in another panel (kills: an unconditional move)', () => {
        const dock = fakeDock(['M1'], ['codegen_tpl_MM']);
        expect(keepBeside(dock as any, 'codegen_tpl_MM', 'M1')).toBe(false);
        expect(dock.moves).toEqual([]);
    });
});

describe('selectOnModelCanvas', () => {
    it('a fragment click from the app-bar placement ends with canvas and tab side by side, the canvas docked after open2 resolves (kills: canvas tab activated over the code; move tried only once) (P-2026-10-25-1310)', async () => {
        const dock = fakeDock(['project_summary', 'codegen_tpl_MM']);
        show(dock, 'codegen_tpl_MM');
        fake.dock = dock;
        (fake as any).open2 = async () => {
            setTimeout(() => {
                const first = dock.getLayout().dockbox.children[0];
                const tab = { id: 'M1', parent: first, content: null };
                first.tabs.push(tab);
                first.activeId = 'M1';
            }, 20);
        };
        vi.stubGlobal('document', { querySelector: () => null });
        vi.stubGlobal('CSS', { escape: (x: string) => x });
        try {
            await selectOnModelCanvas({}, 'M1', 'E1', 300, { tabId: 'codegen_tpl_MM', metamodelId: 'MM' });
        } finally {
            vi.unstubAllGlobals();
            delete (fake as any).open2;
        }
        expect(panelOf(dock as any, 'codegen_tpl_MM')).not.toBe(panelOf(dock as any, 'M1'));
        expect(shownIn(dock, 'M1')).toBe('M1');
        expect(shownIn(dock, 'codegen_tpl_MM')).toBe('codegen_tpl_MM');
    });
});
