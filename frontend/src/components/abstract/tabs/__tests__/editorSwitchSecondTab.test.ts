/**
 * L6 of the multi-tab front (P-2026-11-08-0808): EditorSwitch knows its tab id and may start on a
 * chosen viewpoint; omitted, every decision equals today's. The component does not mount here
 * (node environment, no DOM): the decisions it delegates to are executed, the mount write is
 * checked in the app.
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

import { adoptsRootViewpoint, initialTabViewpoint, savedViewpointToRestore } from '../EditorSwitch';

const activeTab = (activeId: string) => ({ dockbox: { children: [{ activeId }] } });
const store = new Map<string, string>();

describe('EditorSwitch on a second tab', () => {
    beforeEach(() => {
        store.clear();
        vi.stubGlobal('localStorage', {
            getItem: (k: string) => store.get(k) ?? null,
            setItem: (k: string, v: string) => { store.set(k, v); },
        });
        h.state = { viewpoints: ['vp1', 'vp2'] };
    });

    describe('savedViewpointToRestore', () => {
        beforeEach(() => { store.set('jjodel.editorPrefs.mA', JSON.stringify({ viewpointId: 'vp1' })); });

        it('a second tab that is active restores', () => {
            h.layout = activeTab('mA~tab2');
            expect(savedViewpointToRestore('mA', 'vp2', 'mA~tab2')).toBe('vp1');
        });

        it('the first tab does not restore while the second is the active one', () => {
            h.layout = activeTab('mA~tab2');
            expect(savedViewpointToRestore('mA', 'vp2')).toBeNull();
        });

        it('no tab id: the model id is the tab id, as today', () => {
            h.layout = activeTab('mA');
            expect(savedViewpointToRestore('mA', 'vp2')).toBe('vp1');
        });
    });

    describe('initialTabViewpoint', () => {
        it('a chosen viewpoint wins over the root and the restored one', () => {
            expect(initialTabViewpoint('root', 'restored', 'chosen')).toBe('chosen');
        });

        it('a chosen null is abstract syntax, whatever the root says', () => {
            expect(initialTabViewpoint('root', 'restored', null)).toBeNull();
        });

        it('none chosen: today', () => {
            expect(initialTabViewpoint('root', 'restored')).toBe('restored');
            expect(initialTabViewpoint('root', null)).toBe('root');
            expect(initialTabViewpoint('root', null, undefined)).toBe('root');
        });
    });

    describe('adoptsRootViewpoint', () => {
        it('a focused tab that is still the active one adopts', () => {
            h.layout = activeTab('mA');
            expect(adoptsRootViewpoint(true, 'mA')).toBe(true);
        });

        it('the tab being left does not, even before its ACTIVE_TAB arrives', () => {
            h.layout = activeTab('mA~tab2');
            expect(adoptsRootViewpoint(true, 'mA')).toBe(false);
        });

        it('a tab behind does not', () => {
            h.layout = activeTab('mA');
            expect(adoptsRootViewpoint(false, 'mA')).toBe(false);
        });
    });
});
