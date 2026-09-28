/**
 * SaveManager.load — the last synchronous step of opening a project (P-2026-09-25-0030).
 *
 * `stateInitializer` wraps the open in one try/catch (reducer.ts). It can only see what
 * `SaveManager.load` throws before returning: the migration (`VersionFixer.update`) and, since
 * this lane, the LOAD dispatch, which no longer goes through `LoadAction.new` (whose
 * `Action.fire` defers the dispatch to a later macrotask, action.ts).
 *
 * The file imports under a mocked joiner barrel, the pattern of
 * `redux/__tests__/versionfixer_old_states.test.ts`: `RuntimeAccessible` is a passthrough,
 * `LoadAction` and `store` are stand-ins that record what reaches them, `VersionFixer` and
 * `ProjectsApi` are mocked out. `stateInitializer` itself does not import in the bench; its
 * rules are checked at runtime (discovery_2026-09-25_project_open_path.md §8, probes P1-P5).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
    // what went out through the deferred path (LoadAction.new, or a constructor with fire = true)
    const fired: any[] = [];
    class LoadAction {
        static new = vi.fn((state: any) => { fired.push(state); return true; });
        type = 'LOAD';
        className = 'LoadAction';
        value: any;
        constructor(state: any, fire: boolean = true) {
            this.value = state;
            if (fire) fired.push(state);
        }
    }
    return {
        fired,
        LoadAction,
        store: { dispatch: vi.fn() },
        update: vi.fn(),
        transientProperties: { view: {} as Record<string, any> },
    };
});

vi.mock('../../../joiner', () => ({
    RuntimeAccessible: () => (ctor: any) => ctor,
    LoadAction: h.LoadAction,
    store: h.store,
    DViewElement: { RecompileKeys: ['jsxString'] },
    transientProperties: h.transientProperties,
}));
vi.mock('../../../api/persistance', () => ({ ProjectsApi: {} }));
vi.mock('../../../redux/VersionFixer', () => ({ VersionFixer: { update: h.update } }));

import { SaveManager } from '../SaveManager';

const project = { id: 'Pointer_P', _Id: 'guid', name: 'P' } as any;
const saved = () => ({ viewelements: ['Pointer_V'], viewpoints: [], idlookup: { Pointer_V: { name: 'V' } } } as any);

beforeEach(() => {
    h.fired.length = 0;
    h.LoadAction.new.mockClear();
    h.store.dispatch.mockReset();
    h.update.mockReset();
});

describe('SaveManager.load', () => {
    it('T1 a throw in VersionFixer.update leaves load as a throw, and nothing is dispatched', () => {
        h.update.mockImplementation(() => { throw new Error('migration failed'); });
        expect(() => SaveManager.load(saved(), project)).toThrow('migration failed');
        expect(h.store.dispatch).not.toHaveBeenCalled();
        expect(h.fired).toHaveLength(0);
    });

    it('T2 a throw inside the LOAD dispatch leaves load as a throw, in the same call', () => {
        h.update.mockImplementation((s: any) => s);
        h.store.dispatch.mockImplementation(() => { throw new Error('reducer failed'); });
        expect(() => SaveManager.load(saved(), project)).toThrow('reducer failed');
    });

    it('T3 the migrated state is dispatched once, synchronously, as a LOAD, and not also deferred', () => {
        const migrated = { migrated: true };
        h.update.mockImplementation(() => migrated);
        SaveManager.load(saved(), project);
        expect(h.store.dispatch).toHaveBeenCalledTimes(1);
        const action = h.store.dispatch.mock.calls[0][0];
        expect(action.type).toBe('LOAD');
        expect(action.value).toBe(migrated);
        expect(h.fired).toHaveLength(0);
    });
});
