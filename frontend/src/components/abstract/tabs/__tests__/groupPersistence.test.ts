/**
 * Multi-tab lane 3 (P-2026-11-19-2328, G7): the editor groups record, executed on plain saved layouts.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    buildGroupsRecord, createGroupsPersister, editorGroupsKey, noteTabViewpoint, pruneGroupsRecord, readGroupsRecord,
    resetTabViewpoints, setGroupsChangeListener, tabViewpointOf, validateGroupsRecord, writeGroupsRecord,
    type EditorGroupsRecord,
} from '../groupPersistence';

const panel = (id: string, ids: string[], activeId = ids[0], size = 500) =>
    ({ id, size, group: 'models', activeId, tabs: ids.map(t => ({ id: t })) });
const saved = (...children: any[]) => ({
    dockbox: { id: '+1', size: 200, mode: 'horizontal', children },
    floatbox: { mode: 'float', children: [] }, windowbox: { mode: 'window', children: [] }, maxbox: { mode: 'maximize', children: [] },
});
const models = new Set(['A', 'B', 'M']);
const isArtifactTab = (id: string) => models.has(id.split('~tab')[0]);

class MemoryStorage {
    data = new Map<string, string>();
    getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
    setItem(k: string, v: string) { this.data.set(k, v); }
    removeItem(k: string) { this.data.delete(k); }
}
const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('QuotaExceededError'); } } as any;

const twoGroups = () => {
    const vps: Record<string, string | null> = { A: null, 'A~tab2': 'vpX', M: null, B: 'vpY' };
    return buildGroupsRecord(
        saved(panel('+2', ['project_summary', 'A', 'M', 'doc_A'], 'M', 700), panel('+3', ['A~tab2', 'B', 'jjs_s1'], 'B', 300)),
        '+3',
        { isArtifactTab, viewpointOf: id => vps[id] },
    );
};
const keepAll = { canOpenModel: (m: string) => models.has(m), viewpointKnown: (v: string) => v === 'vpX' || v === 'vpY' };

describe('groupPersistence', () => {
    afterEach(() => { resetTabViewpoints(); setGroupsChangeListener(null); vi.useRealTimers(); });

    it('the key is per user and per project, no user is anon', () => {
        expect(editorGroupsKey('u1', 'p1')).toBe('jjodel.editorGroups.u1.p1');
        expect(editorGroupsKey('u2', 'p1')).not.toBe(editorGroupsKey('u1', 'p1'));
        expect(editorGroupsKey('u1', 'p2')).not.toBe(editorGroupsKey('u1', 'p1'));
        expect(editorGroupsKey(undefined, 'p1')).toBe('jjodel.editorGroups.anon.p1');
    });

    it('round trip: two groups, a second tab, different viewpoints, widths, active tabs and the active group', () => {
        const storage = new MemoryStorage() as any;
        const key = editorGroupsKey('u1', 'p1');
        expect(writeGroupsRecord(key, twoGroups(), storage)).toBe(true);
        const back = readGroupsRecord(key, storage)!;
        expect(back).not.toBeNull();
        const plan = pruneGroupsRecord(back, keepAll);
        const [g1, g2] = plan.layout.dockbox.children as any[];
        expect(g1.tabs.map((t: any) => t.id)).toEqual(['A', 'M']);
        expect(g2.tabs.map((t: any) => t.id)).toEqual(['A~tab2', 'B']);
        expect(g1.tabs[0]).toEqual({ id: 'A', modelId: 'A', viewpointId: null });
        expect(g2.tabs[0]).toEqual({ id: 'A~tab2', modelId: 'A', viewpointId: 'vpX' });
        expect(g2.tabs[1].viewpointId).toBe('vpY');
        expect([g1.activeId, g2.activeId]).toEqual(['M', 'B']);
        expect([g1.size, g2.size]).toEqual([700, 300]);
        expect(plan.activeGroup).toBe(1);
        expect(plan.activeTab).toBe('B');
        expect(plan.tabs.map(t => [t.id, t.viewpointId])).toEqual([['A', null], ['M', null], ['A~tab2', 'vpX'], ['B', 'vpY']]);
    });

    it('non-artifact tabs are not saved, and a group left without tabs is not saved', () => {
        const r = buildGroupsRecord(saved(panel('+2', ['project_summary', 'A']), panel('+3', ['doc_A', 'jjtl_t'])), '+3', { isArtifactTab, viewpointOf: () => undefined });
        expect(r.layout.dockbox.children).toHaveLength(1);
        expect(r.activeGroup).toBe(0);
        expect((r.layout.dockbox.children[0] as any).tabs.map((t: any) => t.id)).toEqual(['A']);
        expect((r.layout.dockbox.children[0] as any).tabs[0].viewpointId).toBeNull();
    });

    it('a tab of a missing model is dropped; its group stays when it holds other tabs', () => {
        const plan = pruneGroupsRecord(twoGroups(), { ...keepAll, canOpenModel: m => m !== 'B' });
        const [g1, g2] = plan.layout.dockbox.children as any[];
        expect(g1.tabs.map((t: any) => t.id)).toEqual(['A', 'M']);
        expect(g2.tabs.map((t: any) => t.id)).toEqual(['A~tab2']);
        expect(g2.activeId).toBe('A~tab2');
        expect(plan.activeGroup).toBe(1);
        expect(plan.activeTab).toBe('A~tab2');
    });

    it('a group left empty is dropped and the active group is clamped to the groups left', () => {
        const plan = pruneGroupsRecord(twoGroups(), { ...keepAll, canOpenModel: m => m === 'M' });
        expect(plan.layout.dockbox.children).toHaveLength(1);
        expect(plan.activeGroup).toBe(0);
        expect((plan.layout.dockbox.children[0] as any).tabs.map((t: any) => t.id)).toEqual(['M']);
        expect(plan.activeTab).toBe('M');
    });

    it('an unknown viewpoint becomes abstract syntax', () => {
        const plan = pruneGroupsRecord(twoGroups(), { ...keepAll, viewpointKnown: v => v === 'vpY' });
        const g2 = plan.layout.dockbox.children[1] as any;
        expect(g2.tabs[0].viewpointId).toBeNull();
        expect(g2.tabs[1].viewpointId).toBe('vpY');
    });

    // P-2026-11-20-1632: the project dashboard is no tab of a group; group 1 is kept even when empty (rc-dock's panelLock).
    it('the summary is not saved', () => {
        const r = twoGroups();
        const ids = (r.layout.dockbox.children as any[]).flatMap(g => g.tabs.map((t: any) => t.id));
        expect(ids).not.toContain('project_summary');
        const only = buildGroupsRecord(saved(panel('+2', ['project_summary']), panel('+3', ['A'])), '+2', { isArtifactTab, viewpointOf: () => null });
        expect(only.layout.dockbox.children).toHaveLength(1);
        expect(only.activeGroup).toBe(0);
    });

    it('a saved record that still holds the summary restores without it', () => {
        const old = twoGroups();
        (old.layout.dockbox.children[0] as any).tabs.unshift({ id: 'project_summary' });
        const plan = pruneGroupsRecord(validateGroupsRecord(old)!, keepAll);
        const [g1, g2] = plan.layout.dockbox.children as any[];
        expect(g1.tabs.map((t: any) => t.id)).toEqual(['A', 'M']);
        expect(g2.tabs.map((t: any) => t.id)).toEqual(['A~tab2', 'B']);
        expect(plan.tabs.map(t => t.id)).not.toContain('project_summary');
    });

    it('group 1 is locked, so it stays when its tabs close; the others are not', () => {
        const plan = pruneGroupsRecord(twoGroups(), keepAll);
        const [g1, g2] = plan.layout.dockbox.children as any[];
        expect(g1.panelLock).toEqual({});
        expect(g2.panelLock).toBeUndefined();
    });

    it('a record left with no tab restores one empty locked group, noting no tab', () => {
        const none = pruneGroupsRecord(twoGroups(), { ...keepAll, canOpenModel: () => false });
        expect(none.layout.dockbox.children).toHaveLength(1);
        expect(none.layout.dockbox.children[0]).toEqual({ tabs: [], group: 'models', panelLock: {} });
        expect(none.activeGroup).toBe(0);
        expect(none.activeTab).toBeNull();
        expect(none.tabs).toEqual([]);
    });

    it('an old record whose active group held only the summary notes no tab (R-MT-32)', () => {
        const old = { v: 1, activeGroup: 0, layout: { dockbox: { mode: 'horizontal', children: [
            { id: '+2', group: 'models', activeId: 'project_summary', tabs: [{ id: 'project_summary' }] },
            { id: '+3', group: 'models', activeId: 'A', tabs: [{ id: 'A', modelId: 'A', viewpointId: null }] },
        ] } } };
        const plan = pruneGroupsRecord(validateGroupsRecord(old)!, keepAll);
        expect(plan.layout.dockbox.children).toHaveLength(1);
        expect(plan.activeGroup).toBe(0);
        expect(plan.activeTab).toBe('A');
        const r2 = { ...old, layout: { dockbox: { mode: 'horizontal', children: [
            { id: '+2', group: 'models', activeId: 'project_summary', tabs: [{ id: 'project_summary' }, { id: 'A', modelId: 'A', viewpointId: null }] },
        ] } } };
        expect(pruneGroupsRecord(validateGroupsRecord(r2)!, keepAll).activeTab).toBe('A');
    });

    it('an invalid record is ignored as a whole', () => {
        const good = twoGroups();
        const bad: any[] = [
            null, 'x', { ...good, v: 2 }, { ...good, activeGroup: -1 }, { ...good, activeGroup: 1.5 }, { v: 1, activeGroup: 0 },
            { ...good, layout: { dockbox: { mode: 'diagonal', children: [] } } },
            { ...good, layout: { dockbox: { mode: 'horizontal', children: [] } } },
        ];
        const mutate = (f: (r: any) => void) => { const r = JSON.parse(JSON.stringify(good)); f(r); return r; };
        bad.push(mutate(r => { r.layout.dockbox.children[1].tabs[0].modelId = 'B'; }));
        bad.push(mutate(r => { r.layout.dockbox.children[1].tabs.push({ id: 'A', modelId: 'A' }); }));
        bad.push(mutate(r => { r.layout.dockbox.children[1].tabs[0].viewpointId = 3; }));
        bad.push(mutate(r => { r.layout.dockbox.children[0].size = 'wide'; }));
        bad.push(mutate(r => { r.layout.dockbox.children[1].tabs = []; }));
        for (const b of bad) expect(validateGroupsRecord(b)).toBeNull();
        expect(validateGroupsRecord(JSON.parse(JSON.stringify(good)))).not.toBeNull();
        const storage = new MemoryStorage() as any;
        storage.setItem('k', '{not json');
        expect(readGroupsRecord('k', storage)).toBeNull();
        storage.setItem('k', JSON.stringify(bad[3]));
        expect(readGroupsRecord('k', storage)).toBeNull();
        expect(readGroupsRecord('missing', storage)).toBeNull();
    });

    it('a write or a read under a throwing localStorage does not throw', () => {
        expect(() => writeGroupsRecord('k', twoGroups(), throwing)).not.toThrow();
        expect(writeGroupsRecord('k', twoGroups(), throwing)).toBe(false);
        expect(writeGroupsRecord('k', twoGroups(), null)).toBe(false);
        expect(() => readGroupsRecord('k', throwing)).not.toThrow();
        vi.useFakeTimers();
        const p = createGroupsPersister(100, () => throwing);
        p.schedule('k', twoGroups());
        expect(() => vi.advanceTimersByTime(200)).not.toThrow();
        p.schedule('k', twoGroups());
        expect(() => p.flush()).not.toThrow();
    });

    it('the persister writes the last record once the changes stop, and flush writes at once', () => {
        vi.useFakeTimers();
        const storage = new MemoryStorage();
        const set = vi.spyOn(storage, 'setItem');
        const p = createGroupsPersister(100, () => storage as any);
        const r1 = twoGroups();
        const r2 = { ...twoGroups(), activeGroup: 0 } as EditorGroupsRecord;
        p.schedule('k', r1);
        vi.advanceTimersByTime(60);
        p.schedule('k', r2);
        vi.advanceTimersByTime(60);
        expect(set).not.toHaveBeenCalled();
        vi.advanceTimersByTime(60);
        expect(set).toHaveBeenCalledTimes(1);
        expect(JSON.parse(storage.getItem('k')!).activeGroup).toBe(0);
        p.schedule('k2', r1);
        p.flush();
        expect(storage.getItem('k2')).not.toBeNull();
        p.schedule('k3', r1);
        p.cancel();
        vi.advanceTimersByTime(200);
        expect(storage.getItem('k3')).toBeNull();
    });

    it('the tab viewpoint map: null is abstract syntax, unknown is undefined, a change calls the listener once', () => {
        const listener = vi.fn();
        setGroupsChangeListener(listener);
        expect(tabViewpointOf('A')).toBeUndefined();
        noteTabViewpoint('A', 'vpX');
        noteTabViewpoint('A', 'vpX');
        noteTabViewpoint('A~tab2', '');
        expect(tabViewpointOf('A')).toBe('vpX');
        expect(tabViewpointOf('A~tab2')).toBeNull();
        expect(listener).toHaveBeenCalledTimes(2);
    });
});
