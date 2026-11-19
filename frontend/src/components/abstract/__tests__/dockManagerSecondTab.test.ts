/**
 * L6 of the multi-tab front (P-2026-11-08-0808, R-MT-9, R-MT-24): DockManager with several tabs on
 * one model. The real DockManager runs against a fake dock; one tab per model equals today.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => ({ state: { idlookup: {} } as any, consumer: false }));

vi.mock('../../../joiner', () => ({
    store: { getState: () => h.state },
    RuntimeAccessible: () => (c: any) => c,
    LModel: {}, LProject: {}, SetRootFieldAction: {}, U: {},
}));
vi.mock('../tabs/TabDataMaker', () => ({
    default: {
        model: (m: any, o?: any) => ({ id: o?.tabId ?? m.id, viewpointId: o?.viewpointId, kind: 'model' }),
        metamodel: (m: any) => ({ id: m.id, kind: 'metamodel' }),
    },
}));
vi.mock('../tabs/DocumentationTab', () => ({ DocumentationTab: () => null }));
vi.mock('../../../jjtl/components', () => ({ JjtlDevelopmentEnv: () => null }));
vi.mock('../../../jjtl/types', () => ({}));
vi.mock('../../../jjtl/views/MetamodelTreeView', () => ({}));
vi.mock('../../environment/consumerMode', () => ({ isConsumerMode: () => h.consumer }));

import DockManager from '../DockManager';
import { managerTabId } from '../tabs/instanceManagerModel';
import { noteActiveTab, resetDockGroups, splitRightInProgress } from '../tabs/dockGroups';

const M = 'M';
const panel = (id: string, tabIds: string[], activeId = tabIds[0]) => ({ id, activeId, tabs: tabIds.map(t => ({ id: t, content: {} })) });

function install(layout: any) {
    const all: any[] = [];
    const walk = (b: any) => { for (const c of b?.children ?? []) { if (c.tabs) all.push(...c.tabs); else walk(c); } };
    walk(layout.dockbox); walk(layout.floatbox); walk(layout.windowbox); walk(layout.maxbox);
    const dock = {
        getLayout: () => layout,
        find: (id: string) => all.find(t => t.id === id),
        updateTab: vi.fn(),
        dockMove: vi.fn(),
        changeLayout: vi.fn(),
    };
    (DockManager as any).dock = dock;
    return dock;
}
const horizontal = (...children: any[]) => ({ dockbox: { mode: 'horizontal', children } });
const removedIds = (dock: any) => dock.dockMove.mock.calls.filter((c: any[]) => c[2] === 'remove').map((c: any[]) => c[0].id);

describe('DockManager, several tabs on one model', () => {
    beforeEach(() => {
        resetDockGroups();
        h.consumer = false;
        h.state = { idlookup: { M: { id: M, className: 'DModel', isMetamodel: false }, MM: { id: 'MM', className: 'DModel', isMetamodel: true } } };
    });

    describe('closeTabsForEntity', () => {
        it('closes every tab of the model, wherever it is, and no other model\'s', () => {
            const dock = install({
                dockbox: { mode: 'horizontal', children: [panel('p1', [M, `${M}~tab2`, 'N', 'N~tab2']), panel('p2', [`${M}~tab3`])] },
                floatbox: { children: [panel('f', [`${M}~tab4`])] },
            });
            DockManager.closeTabsForEntity(M, 'model');
            expect(removedIds(dock).sort()).toEqual([M, `${M}~tab2`, `${M}~tab3`, `${M}~tab4`].sort());
        });

        it('one tab per model: the bare id, the doc and the manager, as today', () => {
            const dock = install(horizontal(panel('p1', [M, `doc_${M}`, managerTabId(M), 'N'])));
            DockManager.closeTabsForEntity(M, 'model');
            expect(removedIds(dock).sort()).toEqual([M, `doc_${M}`, managerTabId(M)].sort());
        });

        it('a transformation with that id leaves the model tabs alone', () => {
            const dock = install(horizontal(panel('p1', [M, `${M}~tab2`, `jjtl_${M}`])));
            DockManager.closeTabsForEntity(M, 'transformation');
            expect(removedIds(dock)).toEqual([`jjtl_${M}`]);
        });
    });

    describe('openBeside', () => {
        it('no group to the right: false, and it never splits (R-MT-30, Q12: Split Right only)', () => {
            const dock = install(horizontal(panel('p1', [M])));
            expect(DockManager.openBeside(M, `${M}~tab2`, 0.5, 'V')).toBe(false);
            expect(DockManager.openBeside(M, 'MM', 0.5)).toBe(false);
            expect(dock.dockMove).not.toHaveBeenCalled();
            expect(dock.changeLayout).not.toHaveBeenCalled();
        });

        it('a second tab\'s id with a group to the right: opens that tab there, on that viewpoint', () => {
            const dock = install(horizontal(panel('p1', [M]), panel('p2', ['N'])));
            expect(DockManager.openBeside(M, `${M}~tab2`, 0.5, 'V')).toBe(true);
            const [tab, target, where] = dock.dockMove.mock.calls[0];
            expect(tab).toMatchObject({ id: `${M}~tab2`, viewpointId: 'V', kind: 'model' });
            expect(target.id).toBe('p2');
            expect(where).toBe('middle');
        });

        it('a second tab already on the right is raised by its own id', () => {
            const dock = install(horizontal(panel('p1', [M]), panel('p2', [`${M}~tab2`])));
            expect(DockManager.openBeside(M, `${M}~tab2`, 0.5, 'V')).toBe(true);
            expect(dock.updateTab).toHaveBeenCalledWith(`${M}~tab2`, null, true);
            expect(dock.dockMove).not.toHaveBeenCalled();
        });

        it('a bare model id, as ScriptTab passes it, into the group to the right', () => {
            const dock = install(horizontal(panel('p1', ['jjs_s']), panel('p2', ['N'])));
            expect(DockManager.openBeside('jjs_s', M, 0.4)).toBe(true);
            expect(dock.dockMove.mock.calls[0][0]).toMatchObject({ id: M, kind: 'model' });
            expect(dock.dockMove.mock.calls[0][0].viewpointId).toBeUndefined();
        });

        it('a bare metamodel id still opens the metamodel tab', () => {
            const dock = install(horizontal(panel('p1', ['jjs_s']), panel('p2', ['N'])));
            expect(DockManager.openBeside('jjs_s', 'MM', 0.4)).toBe(true);
            expect(dock.dockMove.mock.calls[0][0]).toMatchObject({ id: 'MM', kind: 'metamodel' });
        });

        it('no second tab on a metamodel in this lane', () => {
            const dock = install(horizontal(panel('p1', ['MM'])));
            expect(DockManager.openBeside('MM', 'MM~tab2', 0.5, 'V')).toBe(false);
            expect(dock.dockMove).not.toHaveBeenCalled();
        });

        it('false when something is maximized', () => {
            install({ ...horizontal(panel('p1', [M])), maxbox: { children: [panel('m', ['x'])] } });
            expect(DockManager.openBeside(M, `${M}~tab2`, 0.5, 'V')).toBe(false);
        });
    });

    describe('openModelTab', () => {
        it('a model already open gets a further tab on the chosen viewpoint', async () => {
            const dock = install(horizontal(panel('p1', [M])));
            await DockManager.openModelTab(M, 'V');
            const [tab, , where] = dock.dockMove.mock.calls[0];
            expect(tab).toMatchObject({ id: `${M}~tab2`, viewpointId: 'V' });
            expect(where).toBe('middle');
        });

        it('a model not open gets its first tab, the bare id', async () => {
            const dock = install(horizontal(panel('p1', ['project_summary'])));
            await DockManager.openModelTab(M, null);
            expect(dock.dockMove.mock.calls[0][0]).toMatchObject({ id: M, viewpointId: null });
        });
    });

    describe('openModelTabBeside', () => {
        it('opens right of the active tab of the editor panel', () => {
            const dock = install(horizontal(panel('p1', ['x', M], M)));
            DockManager.openModelTabBeside(M, 'V');
            const [tab, target, where] = dock.dockMove.mock.calls[0];
            expect(tab).toMatchObject({ id: `${M}~tab2`, viewpointId: 'V' });
            expect(target.id).toBe('p1');
            expect(where).toBe('right');
        });

        it('openBeside false: falls back to a new tab with the same viewpoint', () => {
            const dock = install({ ...horizontal(panel('p1', [M])), maxbox: { children: [panel('m', ['x'])] } });
            DockManager.openModelTabBeside(M, 'V');
            const [tab, target, where] = dock.dockMove.mock.calls[0];
            expect(tab).toMatchObject({ id: `${M}~tab2`, viewpointId: 'V' });
            expect(target.id).toBe('p1');
            expect(where).toBe('middle');
        });
    });

    describe('editor groups (R-MT-30)', () => {
        it('splitRight: a copy of the tab on its viewpoint, right of the tab\'s group, inside the veto\'s permission', () => {
            const dock = install(horizontal(panel('p1', ['project_summary', M], M), panel('p2', ['N'])));
            let allowed = false;
            dock.dockMove.mockImplementation(() => { allowed = splitRightInProgress(); });
            DockManager.splitRight(M, 'V');
            const [tab, target, where] = dock.dockMove.mock.calls[0];
            expect(tab).toMatchObject({ id: `${M}~tab2`, viewpointId: 'V', kind: 'model' });
            expect(target.id).toBe('p1');
            expect(where).toBe('right');
            expect(allowed).toBe(true);
            expect(splitRightInProgress()).toBe(false);
        });

        it('splitRight on a metamodel, or with something maximized: nothing moves', () => {
            const dock = install(horizontal(panel('p1', ['MM'])));
            expect(DockManager.splitRight('MM', null)).toBe(false);
            install({ ...horizontal(panel('p1', [M])), maxbox: { children: [panel('m', ['x'])] } });
            expect(DockManager.splitRight(M, null)).toBe(false);
            expect(dock.dockMove).not.toHaveBeenCalled();
        });

        it('open: a new tab lands in the active group, not the first', async () => {
            const dock = install(horizontal(panel('p1', ['project_summary']), panel('p2', ['N'])));
            noteActiveTab('N');
            await DockManager.open('models', { id: M } as any);
            expect(dock.dockMove.mock.calls[0][1].id).toBe('p2');
            expect(dock.dockMove.mock.calls[0][2]).toBe('middle');
        });

        it('open: a model open only in another group gets a copy in the active group', async () => {
            const dock = install(horizontal(panel('p1', ['project_summary', M]), panel('p2', ['N'])));
            noteActiveTab('N');
            await DockManager.open('models', { id: M } as any);
            const [tab, target, where] = dock.dockMove.mock.calls[0];
            expect(tab.id).toBe(`${M}~tab2`);
            expect([target.id, where]).toEqual(['p2', 'middle']);
        });

        it('open: the active group already has a tab of the model, it is focused', async () => {
            const dock = install(horizontal(panel('p1', ['project_summary', M]), panel('p2', [`${M}~tab2`])));
            noteActiveTab(`${M}~tab2`);
            await DockManager.open('models', { id: M } as any);
            expect(dock.updateTab).toHaveBeenCalledWith(`${M}~tab2`, null, true);
            expect(dock.dockMove).not.toHaveBeenCalled();
        });

        it('open: a tab that is no model\'s is focused where it is open (Q3)', async () => {
            const dock = install(horizontal(panel('p1', ['project_summary', 'doc_x']), panel('p2', ['N'])));
            noteActiveTab('N');
            await DockManager.open('models', { id: 'doc_x' } as any);
            expect(dock.updateTab).toHaveBeenCalledWith('doc_x', null, true);
            expect(dock.dockMove).not.toHaveBeenCalled();
        });
    });
});
