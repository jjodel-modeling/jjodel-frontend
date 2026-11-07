/**
 * L1 of the multi-tab front (P-2026-11-07-0105, R-MT-16): a model tab stops rewriting the
 * viewpoint of the other open tabs.
 *
 * - The mount-only restore of a model's saved viewpoint runs only when the mounting tab is the
 *   dock's active tab (`dockbox.children[0].activeId`, the definition Dock.tsx, MyRcDock.tsx and
 *   Navbar.tsx already use).
 * - The preference is written for one model only, by the picker that changed it.
 *
 * The component itself does not mount here (node environment, no DOM): the heavy imports are
 * mocked and the decisions it delegates to are executed. The React wiring is checked in the app.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => ({
    state: { viewpoints: [] as string[] } as any,
    layout: null as any,
}));

vi.mock('../../../editor-v2/EditorV2', () => ({ EditorV2: () => null }));
vi.mock('../../../editor-v2/ActiveEditorContext', () => ({ ActiveEditorProvider: () => null }));
vi.mock('../../../../joiner', () => ({ store: { getState: () => h.state } }));
vi.mock('../../../../utils/lastViewpoint', () => ({ activateViewpoint: vi.fn() }));
vi.mock('../../DockManager', () => ({
    default: { get dock() { return h.layout ? { getLayout: () => h.layout } : null; } },
}));
vi.mock('../EditorSwitch.scss', () => ({}));

import { initialTabViewpoint, isActiveDockTab, savedViewpointToRestore, saveViewpointPreference, writeFocusViewpoint } from '../EditorSwitch';
import { activateViewpoint } from '../../../../utils/lastViewpoint';

const KEY = (m: string) => 'jjodel.editorPrefs.' + m;

function stubLocalStorage(): Map<string, string> {
    const map = new Map<string, string>();
    vi.stubGlobal('localStorage', {
        getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
        setItem: (k: string, v: string) => { map.set(k, String(v)); },
        removeItem: (k: string) => { map.delete(k); },
    });
    return map;
}

function dockWithActive(activeId: string | undefined): any {
    return { dockbox: { children: [{ id: 'models', activeId, tabs: [{ id: 'mA' }, { id: 'mB' }] }] } };
}

describe('EditorSwitch viewpoint preferences (R-MT-16)', () => {
    let ls: Map<string, string>;

    beforeEach(() => {
        ls = stubLocalStorage();
        h.state = { viewpoints: ['vpV', 'vpW'] };
        h.layout = dockWithActive('mA');
    });

    describe('isActiveDockTab', () => {
        it('is true for the active tab of the first dock panel', () => {
            expect(isActiveDockTab('mA')).toBe(true);
        });
        it('is false for a mounted tab that is not the active one', () => {
            expect(isActiveDockTab('mB')).toBe(false);
        });
        it('is false when the dock is not available', () => {
            h.layout = null;
            expect(isActiveDockTab('mA')).toBe(false);
        });
    });

    describe('savedViewpointToRestore', () => {
        it('restores the saved viewpoint of the active tab', () => {
            ls.set(KEY('mA'), JSON.stringify({ viewpointId: 'vpW' }));
            expect(savedViewpointToRestore('mA', 'vpV')).toBe('vpW');
        });
        it('does not restore for a tab that mounts while another tab is active', () => {
            ls.set(KEY('mB'), JSON.stringify({ viewpointId: 'vpW' }));
            expect(savedViewpointToRestore('mB', 'vpV')).toBeNull();
        });
        it('does not restore a deleted or unknown viewpoint', () => {
            ls.set(KEY('mA'), JSON.stringify({ viewpointId: 'vpGone' }));
            expect(savedViewpointToRestore('mA', 'vpV')).toBeNull();
        });
        it('does not restore the viewpoint that is already active', () => {
            ls.set(KEY('mA'), JSON.stringify({ viewpointId: 'vpV' }));
            expect(savedViewpointToRestore('mA', 'vpV')).toBeNull();
        });
        it('does not restore when nothing is saved, or the prefs are corrupt', () => {
            expect(savedViewpointToRestore('mA', 'vpV')).toBeNull();
            ls.set(KEY('mA'), '{not json');
            expect(savedViewpointToRestore('mA', 'vpV')).toBeNull();
        });
        // R-MT-18 (L2): a saved '' is abstract syntax, a preference like any other, and it is
        // restored as such; it is not "nothing saved" (scene 3b of P-2026-11-07-0105).
        it('restores a saved abstract syntax as the empty id, distinct from no saved preference', () => {
            expect(savedViewpointToRestore('mA', 'vpV')).toBeNull();
            ls.set(KEY('mA'), JSON.stringify({ viewpointId: '', editorMode: 'flow' }));
            expect(savedViewpointToRestore('mA', 'vpV')).toBe('');
        });
        it('does not restore a saved abstract syntax that is already in force', () => {
            ls.set(KEY('mA'), JSON.stringify({ viewpointId: '' }));
            expect(savedViewpointToRestore('mA', null)).toBeNull();
            expect(savedViewpointToRestore('mA', '')).toBeNull();
        });
        it('does not restore a saved abstract syntax for a tab mounting behind the active one', () => {
            ls.set(KEY('mB'), JSON.stringify({ viewpointId: '' }));
            expect(savedViewpointToRestore('mB', 'vpV')).toBeNull();
        });
    });

    // L2: the tab's own viewpoint starts from the root, or from what the mount restores.
    describe('initialTabViewpoint', () => {
        it('initialises from the root when nothing is restored', () => {
            expect(initialTabViewpoint('vpV', null)).toBe('vpV');
            expect(initialTabViewpoint(null, null)).toBeNull();
        });
        it('takes the restored viewpoint over the root', () => {
            expect(initialTabViewpoint('vpV', 'vpW')).toBe('vpW');
        });
        it('takes a restored abstract syntax as null, the canonical empty (R-IRN-21)', () => {
            expect(initialTabViewpoint('vpV', '')).toBeNull();
            expect(initialTabViewpoint('', null)).toBeNull();
        });
    });

    describe('saveViewpointPreference', () => {
        it('writes the pick for its own model only', () => {
            ls.set(KEY('mB'), JSON.stringify({ viewpointId: 'vpV', editorMode: 'flow' }));
            saveViewpointPreference('mA', 'vpW');
            expect(JSON.parse(ls.get(KEY('mA'))!)).toEqual({ viewpointId: 'vpW', editorMode: 'flow' });
            expect(JSON.parse(ls.get(KEY('mB'))!)).toEqual({ viewpointId: 'vpV', editorMode: 'flow' });
        });
        it('writes abstract syntax as the empty id', () => {
            saveViewpointPreference('mA', null);
            expect(JSON.parse(ls.get(KEY('mA'))!)).toEqual({ viewpointId: '', editorMode: 'flow' });
        });
    });

    // R-MT-20 (P-2026-11-07-0935): the focus write is not a user edit, so it adds no undo entry.
    describe('writeFocusViewpoint', () => {
        beforeEach(() => { vi.mocked(activateViewpoint).mockClear(); });
        it('writes the tab viewpoint without an undo entry when it differs from the root', () => {
            expect(writeFocusViewpoint('vpV', 'vpW')).toBe(true);
            expect(activateViewpoint).toHaveBeenCalledTimes(1);
            expect(activateViewpoint).toHaveBeenCalledWith('vpW', { undoable: false });
        });
        it('writes abstract syntax as null, without an undo entry', () => {
            expect(writeFocusViewpoint('vpV', null)).toBe(true);
            expect(activateViewpoint).toHaveBeenCalledWith(null, { undoable: false });
        });
        it('writes nothing when the tab viewpoint is the root one, the empty forms included', () => {
            expect(writeFocusViewpoint('vpV', 'vpV')).toBe(false);
            expect(writeFocusViewpoint('', null)).toBe(false);
            expect(writeFocusViewpoint(undefined, null)).toBe(false);
            expect(activateViewpoint).not.toHaveBeenCalled();
        });
    });
});
