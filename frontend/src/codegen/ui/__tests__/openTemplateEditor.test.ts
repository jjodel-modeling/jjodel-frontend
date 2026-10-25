/**
 * openTemplateEditor and canvasSelection's dock helpers — the generator tab docked beside the canvas, and moved
 * beside it when a fragment click brings the canvas forward in its panel (P-2026-10-24-1515). rc-dock's `dock` is a
 * fake with the same `find`/`dockMove`/`getLayout` contract. Mutations each test kills are in its name; the bench is
 * in the commit body.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';

const fake = vi.hoisted(() => ({ dock: null as any }));
const rail = vi.hoisted(() => ({ collapse: vi.fn() }));
const lookup = vi.hoisted(() => ({ idlookup: {} as Record<string, any> }));

vi.mock('../../../components/abstract/DockManager', () => ({ default: fake }));
vi.mock('../../../components/environment/consumerMode', () => ({ isConsumerMode: () => false }));
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
        createGenerator: () => null,
    };
});

import { openTemplateEditor } from '../openTemplateEditor';
import { BESIDE_SHARE, generatorTabsOf, keepBeside, panelOf } from '../canvasSelection';
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
            for (const p of dockbox.children as Panel[]) p.tabs = p.tabs.filter(t => t.id !== tab.id);
            if (direction === 'middle') {
                target.tabs.push(tab);
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

beforeEach(() => {
    fake.dock = null;
    rail.collapse.mockClear();
    lookup.idlookup = {};
});

describe('openTemplateEditor', () => {
    it('every opening, new or brought forward, arms the rail collapse (kills: no collapse on opening) (P-2026-10-25-0925)', () => {
        fake.dock = fakeDock(['project_summary', 'M1']);
        expect(openTemplateEditor('MM', 'Turnstile', null, 'default', 'M1')).toBe(true);
        expect(openTemplateEditor('MM', 'Turnstile', null, 'default', 'M1')).toBe(true);
        expect(rail.collapse).toHaveBeenCalledTimes(2);
    });

    it('docks a new tab right of the canvas panel, at 45 % (kills: middle kept)', () => {
        const dock = fakeDock(['project_summary', 'M1']);
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

    it('with no canvas docked, goes right of the project page, not over it (kills: stacked in the first panel) (P-2026-10-25-1045)', () => {
        const dock = fakeDock(['project_summary']);
        fake.dock = dock;
        expect(openTemplateEditor('MM', 'Turnstile', null, 'default', 'M1')).toBe(true);
        expect(dock.moves).toEqual([['codegen_tpl_MM', 'p0', 'right']]);
        expect(panelOf(dock as any, 'project_summary')).not.toBe(panelOf(dock as any, 'codegen_tpl_MM'));
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

    it('only activates an open tab, wherever it is (kills: an open tab moved)', () => {
        const dock = fakeDock(['M1', 'codegen_tpl_MM']);
        fake.dock = dock;
        openTemplateEditor('MM', 'Turnstile', null, 'default', 'M1');
        expect(dock.moves).toEqual([]);
        expect(dock.updateTab).toHaveBeenCalledWith('codegen_tpl_MM', null, true);
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
