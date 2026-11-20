/**
 * Multi-tab lane 2a (P-2026-11-19-1600, R-MT-30): the editor groups of the dock, executed on plain layouts.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    activeGroup, activeTabId, dockMoveAllowed, groupOfTab, modelGroups, noteActiveTab, recentTabIds,
    resetDockGroups, setArtifactTabPredicate, splitRightInProgress, withSplitRight, SUMMARY_TAB_ID,
    dashboardShown, isDashboardOpen, setDashboardOpen, subscribeDashboard,
} from '../dockGroups';

const tab = (id: string) => ({ id, group: 'models' });
const panel = (id: string, ids: string[], activeId = ids[0], group: string | undefined = 'models') =>
    ({ id, group, activeId, tabs: ids.map(tab) });
const layout = (...children: any[]) => ({ dockbox: { mode: 'horizontal', children }, floatbox: { children: [panel('f', ['F'])] } });

describe('dockGroups', () => {
    beforeEach(() => resetDockGroups());

    describe('modelGroups', () => {
        it('the models panels of the dock box, left to right, nested boxes included, floats excluded', () => {
            const l = layout(panel('g1', [SUMMARY_TAB_ID]), { mode: 'vertical', children: [panel('g2', ['A'])] }, panel('e', ['x'], 'x', 'editors'));
            (l.dockbox.children[2] as any).tabs[0].group = 'editors';
            expect(modelGroups(l).map(p => p.id)).toEqual(['g1', 'g2']);
        });

        it('a saved layout, tabs reduced to ids, is read by the panel group', () => {
            const l = { dockbox: { children: [{ id: 'g1', group: 'models', tabs: [{ id: 'A' }] }, { id: 'e', group: 'editors', tabs: [{ id: 'x' }] }] } };
            expect(modelGroups(l).map(p => p.id)).toEqual(['g1']);
        });

        it('a panel with no group recorded is a group, unless one of its tabs is of another group', () => {
            const l = { dockbox: { children: [{ tabs: [{ id: SUMMARY_TAB_ID }] }, { tabs: [{ id: 'A', group: 'models' }] }, { tabs: [{ id: 'x', group: 'editors' }] }] } };
            expect(modelGroups(l)).toHaveLength(2);
        });
    });

    describe('groupOfTab', () => {
        it('the group holding the tab, null for none or a floating tab', () => {
            const l = layout(panel('g1', [SUMMARY_TAB_ID, 'A']), panel('g2', ['B']));
            expect(groupOfTab(l, 'B')?.id).toBe('g2');
            expect(groupOfTab(l, 'F')).toBeNull();
            expect(groupOfTab(l, null)).toBeNull();
        });
    });

    describe('activeGroup and activeTabId', () => {
        it('no tab recorded: the first group, its active tab', () => {
            const l = layout(panel('g1', [SUMMARY_TAB_ID, 'A'], 'A'), panel('g2', ['B']));
            expect(activeGroup(l)?.id).toBe('g1');
            expect(activeTabId(l)).toBe('A');
        });

        it('a tab activated in the second group makes it the active group', () => {
            const l = layout(panel('g1', [SUMMARY_TAB_ID, 'A'], 'A'), panel('g2', ['B', 'C'], 'C'));
            noteActiveTab('A');
            noteActiveTab('B');
            expect(activeGroup(l)?.id).toBe('g2');
            expect(activeTabId(l)).toBe('C');
        });

        it('the active group follows a tab dragged to another group', () => {
            noteActiveTab('B');
            const l = layout(panel('g1', [SUMMARY_TAB_ID, 'A', 'B'], 'B'));
            expect(activeGroup(l)?.id).toBe('g1');
        });

        it('the last tab of the active group closed: the group used before takes over', () => {
            noteActiveTab('A');
            noteActiveTab('X');
            noteActiveTab('B');
            const l = layout(panel('g1', [SUMMARY_TAB_ID]), panel('g2', ['A']));
            expect(activeGroup(l)?.id).toBe('g2');
        });

        it('no group: null', () => {
            expect(activeGroup({ dockbox: { children: [] } })).toBeNull();
            expect(activeTabId(undefined)).toBeNull();
        });
    });

    describe('noteActiveTab', () => {
        it('most recent first, no duplicates, capped', () => {
            ['a', 'b', 'a'].forEach(noteActiveTab);
            expect(recentTabIds()).toEqual(['a', 'b']);
            for (let i = 0; i < 50; i++) noteActiveTab(`t${i}`);
            expect(recentTabIds()).toHaveLength(32);
            expect(recentTabIds()[0]).toBe('t49');
        });
    });

    describe('only artifact tabs count for the active group (P-2026-11-19-2236)', () => {
        const artifacts = new Set(['A', 'A~tab2', 'MM']);
        beforeEach(() => setArtifactTabPredicate(id => artifacts.has(id.split('~tab')[0])));
        afterEach(() => setArtifactTabPredicate(undefined));

        it('the project tab noted after an artifact tab does not move the active group', () => {
            const l = layout(panel('g1', [SUMMARY_TAB_ID, 'A'], SUMMARY_TAB_ID), panel('g2', ['A~tab2']));
            noteActiveTab('A~tab2');
            noteActiveTab(SUMMARY_TAB_ID);
            expect(activeGroup(l)?.id).toBe('g2');
            expect(activeTabId(l)).toBe('A~tab2');
        });

        it('any other non-artifact tab noted after an artifact tab does not move it either', () => {
            const l = layout(panel('g1', [SUMMARY_TAB_ID, 'doc_x'], 'doc_x'), panel('g2', ['MM']));
            noteActiveTab('MM');
            noteActiveTab('doc_x');
            expect(activeGroup(l)?.id).toBe('g2');
        });

        it('an artifact tab still moves it, a further tab included', () => {
            const l = layout(panel('g1', [SUMMARY_TAB_ID, 'A']), panel('g2', ['A~tab2']));
            noteActiveTab('A~tab2');
            noteActiveTab('A');
            expect(activeGroup(l)?.id).toBe('g1');
            noteActiveTab(SUMMARY_TAB_ID);
            noteActiveTab('A~tab2');
            expect(activeGroup(l)?.id).toBe('g2');
        });

        it('only non-artifact tabs noted: the first group', () => {
            const l = layout(panel('g1', [SUMMARY_TAB_ID]), panel('g2', ['doc_x']));
            noteActiveTab('doc_x');
            noteActiveTab(SUMMARY_TAB_ID);
            expect(activeGroup(l)?.id).toBe('g1');
            expect(recentTabIds()).toEqual([]);
        });

        it('noteActiveTab says whether it recorded the tab', () => {
            expect(noteActiveTab(SUMMARY_TAB_ID)).toBe(false);
            expect(noteActiveTab('A')).toBe(true);
            expect(noteActiveTab('A')).toBe(false);
        });

        it('with no predicate set, the project tab alone is not an artifact', () => {
            setArtifactTabPredicate(undefined);
            expect(noteActiveTab(SUMMARY_TAB_ID)).toBe(false);
            expect(noteActiveTab('X')).toBe(true);
        });
    });

    describe('withSplitRight', () => {
        it('open only inside the call, also after a throw', () => {
            expect(splitRightInProgress()).toBe(false);
            expect(withSplitRight(() => splitRightInProgress())).toBe(true);
            expect(() => withSplitRight(() => { throw new Error('x'); })).toThrow();
            expect(splitRightInProgress()).toBe(false);
        });
    });

    describe('dockMoveAllowed', () => {
        const move = (direction: string, extra: object = {}) =>
            dockMoveAllowed({ kind: 'tab', id: 'A', group: 'models', direction, targetGroup: 'models', ...extra });

        it('a tab moves into an existing group: middle, before or after a tab', () => {
            expect(move('middle')).toBe(true);
            expect(move('before-tab')).toBe(true);
            expect(move('after-tab')).toBe(true);
        });

        it('right only for Split Right', () => {
            expect(move('right')).toBe(false);
            expect(move('right', { splitting: true })).toBe(true);
        });

        it('no other edge, no float, no new window, no maximize', () => {
            for (const d of ['left', 'top', 'bottom', 'float', 'new-window', 'maximize']) {
                expect(move(d)).toBe(false);
                expect(move(d, { splitting: true })).toBe(false);
            }
        });

        it('not into a panel of another group', () => {
            expect(move('middle', { targetGroup: 'editors' })).toBe(false);
            expect(move('right', { splitting: true, targetGroup: null })).toBe(false);
        });

        it('a whole panel never moves, but may be removed', () => {
            expect(move('middle', { kind: 'panel' })).toBe(false);
            expect(move('right', { kind: 'panel', splitting: true })).toBe(false);
            expect(move('remove', { kind: 'panel' })).toBe(true);
        });

        it('the project summary tab never moves and never closes', () => {
            const summary = (direction: string) => dockMoveAllowed({ kind: 'tab', id: SUMMARY_TAB_ID, direction, targetGroup: 'models' });
            expect(summary('middle')).toBe(false);
            expect(summary('after-tab')).toBe(false);
            expect(summary('remove')).toBe(false);
            expect(summary('update')).toBe(true);
        });

        it('closing a tab and the non-moves pass', () => {
            for (const d of ['remove', 'active', 'update', 'front']) expect(move(d)).toBe(true);
        });

        it('any other group moves as ever', () => {
            expect(dockMoveAllowed({ kind: 'panel', id: 'p', group: 'pinned', direction: 'float' })).toBe(true);
        });
    });

    // P-2026-11-20-1632: the project dashboard is a full-screen view over the groups, no tab of a group.
    describe('the project dashboard', () => {
        it('toggles: open, closed, and each change tells the listeners once', () => {
            let calls = 0;
            const off = subscribeDashboard(() => calls++);
            expect(isDashboardOpen()).toBe(false);
            expect(setDashboardOpen(true)).toBe(true);
            expect(isDashboardOpen()).toBe(true);
            expect(setDashboardOpen(true)).toBe(false);
            expect(setDashboardOpen(false)).toBe(true);
            expect(isDashboardOpen()).toBe(false);
            expect(calls).toBe(2);
            off();
            setDashboardOpen(true);
            expect(calls).toBe(2);
        });

        it('a new project starts with it closed', () => {
            setDashboardOpen(true);
            resetDockGroups();
            expect(isDashboardOpen()).toBe(false);
        });

        it('shows when open, or when no group holds a tab (a project just opened, every tab closed)', () => {
            const open = layout(panel('g1', ['A']), panel('g2', ['B']));
            expect(dashboardShown(open, false)).toBe(false);
            expect(dashboardShown(open, true)).toBe(true);
            const empty = layout({ id: 'g1', group: 'models', tabs: [] });
            expect(dashboardShown(empty, false)).toBe(true);
            expect(dashboardShown(layout(), false)).toBe(true);
            // An empty group 1 beside a group with a tab: the tab shows.
            expect(dashboardShown(layout({ id: 'g1', group: 'models', tabs: [] }, panel('g2', ['B'])), false)).toBe(false);
        });
    });
});
