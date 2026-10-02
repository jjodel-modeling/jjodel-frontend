/**
 * An empty `state` never replaces a stored one, and a record left with one does not open the editor
 * (P-2026-09-30-1540).
 *
 * THE DEFECT, measured on 3061 (discovery `discovery_2026-09-30_empty_state_white_page.md` §3.2): every saved
 * state holds the project's own entry with `state: ''` (`U.compressedState`), so after an open
 * `idlookup[pid].state === ''`. The in-editor favorite (`LeftBar.tsx:190`, `Navbar.tsx:1438`) passes that entry
 * to `Offline.favorite`, which wrote `{...project, isFavorite}` over the stored record: 21850 chars -> 0. The
 * next open took `!project.state` for a new project and mounted the editor on pointer lists no state holds.
 *
 * HERE `projects.ts` is imported with the idiom of `projectsSaveLive.test.ts` (doubled `joiner`, stubbed
 * `window`), with a `Storage` double backed by an array, so every assertion reads what a reload would read.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
    (globalThis as any).window = (globalThis as any).window ?? {};

    const state: any = { idlookup: {}, projects: [], version: { n: 1 } };

    const U: any = {
        isProjectModified: false,
        offline: true,
        isOffline: () => U.offline,
        compressedState: vi.fn(async (_d: any) => 'COMPRESSED'),
        alert: vi.fn(),
        env: () => 'http://persistance.test',
    };
    const Log: any = { ee: vi.fn(), e: vi.fn(), w: vi.fn(), ww: vi.fn(), eDevv: vi.fn() };
    return { U, Log, state, stored: [] as any[], writes: 0, setField: vi.fn() };
});

vi.mock('../../joiner', () => ({
    U: h.U,
    L: { from: () => undefined },
    R: { navigate: () => {} },
    Log: h.Log,
    store: { getState: () => h.state },
    TRANSACTION: (_name: string, fn: Function) => fn(),
    CreateElementAction: { new: () => {} },
    SetFieldAction: { new: (...args: any[]) => { h.setField(...args); return true; } },
    SetRootFieldAction: { new: () => {} },
    RuntimeAccessible: () => (target: any) => target,
    ProjectPointers: {},
    DProject: { new: () => ({ id: 'prj_new' }) },
    DModel: {},
}));
vi.mock('../../data/storage', () => ({
    default: {
        read: (key: string) => (key === 'projects' ? JSON.parse(JSON.stringify(h.stored)) : undefined),
        write: (key: string, v: any) => { if (key === 'projects') { h.stored = JSON.parse(JSON.stringify(v)); h.writes++; } },
    },
}));
vi.mock('../api', () => ({ default: { get: async () => ({ code: 200 }), put: async () => ({ code: 200 }), post: async () => ({ code: 200 }) } }));
vi.mock('../DTO/UpdateProjectRequest', () => ({ UpdateProjectRequest: class { constructor(public p: any) {} } }));
vi.mock('../DTO/GetAllProjects', () => ({ DTOProjectGetAll: class {} }));
vi.mock('../DTO/ProjectResponseDTO', () => ({ ProjectResponseDTO: class {} }));
vi.mock('../../pages/components/Project', () => ({ duplicateProject: async (p: any) => p }));
vi.mock('../../redux/action/action', () => ({
    CollabClearHistoryAction: { new: () => {} },
    CollabRefreshAction: { new: () => {} },
    COMMIT: () => {},
}));
vi.mock('../../services/ActivityLogger', () => ({ default: { log: () => {} } }));
vi.mock('../../types/activity', () => ({
    ActivityType: { PROJECT_CREATED: 'created', PROJECT_DELETED: 'deleted', PROJECT_SAVED: 'saved' },
}));
vi.mock('../../model/megamodelPersistence', () => ({
    extractMegamodelFromProjectJson: () => null,
    registerSerializedMegamodel: () => {},
}));
vi.mock('../../redux/VersionFixer', () => ({ VersionFixer: { fix: (s: any) => s } }));
vi.mock('../../common/libraries/lastSaved', () => ({ markProjectSaved: () => {} }));

import { ProjectsApi } from '../persistance/projects';

const ID = 'prj_1';
const SAVED = 'SAVED_STATE_21850';

/** The stored record of a project that was saved with content. */
const savedRecord = () => ({
    id: ID, name: 'DemoESM copy', version: 1.3, lastModified: 1790631960000, isFavorite: false,
    metamodels: ['mm_1'], models: ['m1_1'], viewpoints: ['Pointer_ViewPointDefault'],
    metamodelsNumber: 1, modelsNumber: 1, viewpointsNumber: 1, state: SAVED,
});
/** The editor's store entry for it, as every loaded state holds it: `state: ''` (U.compressedState). */
const editorEntry = () => ({ ...savedRecord(), state: '', lastModified: 1790585698712 });
/** A record written by `Offline.create` and never saved. */
const newRecord = (id = 'prj_new_1') => ({
    id, name: 'Project 3', version: 1.0, lastModified: 1, isFavorite: false,
    metamodels: [], models: [], viewpoints: [], metamodelsNumber: 0, modelsNumber: 0, viewpointsNumber: 0, state: '',
});
const stored = (id = ID) => h.stored.find((p: any) => p.id === id);
const proxyOn = (d: any) => ({ id: d.id, __raw: d, viewpoints: [], metamodels: [], models: [] } as any);

beforeEach(() => {
    h.U.isProjectModified = true;
    h.U.offline = true;
    h.U.compressedState.mockReset();
    h.U.compressedState.mockImplementation(async () => 'COMPRESSED');
    h.U.alert.mockClear();
    for (const k of Object.keys(h.Log)) h.Log[k].mockClear();
    h.setField.mockClear();
    h.writes = 0;
    h.stored = [savedRecord()];
    h.state.idlookup = { [ID]: editorEntry() };
    ProjectsApi.loadError = undefined;
});

describe('ProjectsApi.save — an empty serialization is refused', () => {
    it('POSITIVE CONTROL: a non-empty serialization is written', async () => {
        await ProjectsApi.save(proxyOn(h.state.idlookup[ID]));

        expect(h.writes).toBe(1);
        expect(stored().state).toBe('COMPRESSED');
    });

    // ---- the load-bearing assertion of the write side ----
    it('an empty serialization over a stored non-empty state is refused, the stored copy unchanged', async () => {
        h.U.compressedState.mockImplementation(async () => '');
        const before = JSON.stringify(h.stored);

        await ProjectsApi.save(proxyOn(h.state.idlookup[ID]));

        expect(h.writes).toBe(0);
        expect(JSON.stringify(h.stored)).toBe(before);
        expect(h.U.alert).toHaveBeenCalledTimes(1);
        expect(h.U.alert.mock.calls[0][0]).toBe('e');
        expect(h.Log.ee).toHaveBeenCalled();
    });

    it('the refused save leaves the project dirty and its version where it was', async () => {
        h.U.compressedState.mockImplementation(async () => '');

        await ProjectsApi.save(proxyOn(h.state.idlookup[ID]));

        expect(h.U.isProjectModified).toBe(true);
        expect(h.setField).not.toHaveBeenCalled();
        expect(h.U.alert.mock.calls.some((c: any[]) => c[1] === 'Project Saved!')).toBe(false);
    });

    it('a first save of a new empty project still works', async () => {
        const fresh = newRecord();
        h.stored = [fresh];
        h.state.idlookup = { [fresh.id]: { ...fresh } };

        await ProjectsApi.save(proxyOn(h.state.idlookup[fresh.id]));

        expect(h.writes).toBe(1);
        expect(stored(fresh.id).state).toBe('COMPRESSED');
        expect(h.U.alert.mock.calls.some((c: any[]) => c[1] === 'Project Saved!')).toBe(true);
    });
});

describe('Offline metadata writes keep the stored state', () => {
    // ---- the measured defect ----
    it('the in-editor favorite toggles the flag and keeps the stored state', async () => {
        await ProjectsApi.favorite(h.state.idlookup[ID]);

        expect(h.writes).toBe(1);                                   // positive control: it wrote
        expect(stored().isFavorite).toBe(true);
        expect(stored().state).toBe(SAVED);
        expect(h.Log.ww).toHaveBeenCalled();
    });

    it('tags written from an entry with an empty state keep the stored state', async () => {
        await ProjectsApi.updateTags(h.state.idlookup[ID], ['demo']);

        expect(h.writes).toBe(1);
        expect(stored().tags).toEqual(['demo']);
        expect(stored().state).toBe(SAVED);
    });

    it('PER CONTRASTO: a favorite from an entry that carries the state writes that state', async () => {
        await ProjectsApi.favorite({ ...savedRecord(), state: 'DASHBOARD_STATE' } as any);

        expect(stored().state).toBe('DASHBOARD_STATE');
        expect(h.Log.ww).not.toHaveBeenCalled();
    });

    it('a never-saved project keeps its empty state on favorite', async () => {
        const fresh = newRecord();
        h.stored = [fresh];

        await ProjectsApi.favorite({ ...fresh } as any);

        expect(stored(fresh.id).isFavorite).toBe(true);
        expect(stored(fresh.id).state).toBe('');
        expect(h.Log.ww).not.toHaveBeenCalled();                    // nothing was kept, nothing is claimed
    });

    it('an entry with no state at all keeps the stored state too', async () => {
        const { state: _drop, ...noState } = editorEntry();

        await ProjectsApi.favorite(noState as any);

        expect(stored().state).toBe(SAVED);
    });
});

describe('ProjectsApi.getOne — a record with an empty state that claims content does not open', () => {
    it('the damaged record throws, so the open lands on the error screen', async () => {
        h.stored = [editorEntry()];                                 // what the favorite left

        await expect(ProjectsApi.getOne(ID)).rejects.toThrow(/empty/i);
    });

    it('pointer lists alone are enough to call it damaged', async () => {
        h.stored = [{ ...editorEntry(), metamodelsNumber: 0, modelsNumber: 0 }];

        await expect(ProjectsApi.getOne(ID)).rejects.toThrow(/empty/i);
    });

    it('counters alone are enough to call it damaged', async () => {
        h.stored = [{ ...newRecord(ID), metamodelsNumber: 1 }];

        await expect(ProjectsApi.getOne(ID)).rejects.toThrow(/empty/i);
    });

    it('a new project, never saved, still opens', async () => {
        const fresh = newRecord();
        h.stored = [fresh];

        const got = await ProjectsApi.getOne(fresh.id);

        expect(got?.id).toBe(fresh.id);
    });

    it('a saved project still opens', async () => {
        const got = await ProjectsApi.getOne(ID);

        expect(got?.state).toBe(SAVED);
    });

    it('an absent project is still null (not-found)', async () => {
        expect(await ProjectsApi.getOne('prj_absent')).toBeNull();
    });
});
