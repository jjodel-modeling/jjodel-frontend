/**
 * F2 — Cmd+S saved a stale copy of the project, not the live one (P-2026-09-29-2120).
 *
 * THE DEFECT. The Cmd+S handler holds the `LProject` of Navbar's last render
 * (`Navbar.tsx:564`, effect deps `:1300`), and Navbar re-renders only on
 * `user`/`m2models`/`advanced`/`debug`. `save` copied `project.__raw`, the target that
 * proxy was bound to; the reducer copies along the path, so once any field of the
 * project changes `idlookup[id]` is a NEW object and `__raw` is the old one.
 * `U.compressedState` then writes that copy over the live project entry
 * (`common/U.tsx:437`). MEASURED in the app (discovery
 * `discovery_2026-09-29_ir_authoring_freeze.md` §0 side finding 1, probe
 * `_tmp_irfreeze_side.ts`): `+ New` viewpoint then Cmd+S saves `project.viewpoints`
 * with 5 entries against 6 live; after a reload the viewpoint is in the root
 * `viewpoints` but not in `project.viewpoints`. Data loss.
 *
 * HERE the regime is rebuilt in `environment: node` with the idiom of
 * `projectsSaveVersionStore.test.ts`: `projects.ts` imported with doubled imports and a
 * stubbed `window`; the doubled `store` holds a real `idlookup`, and `addViewpoint`
 * replaces the project entry the way the reducer's path copy does.
 *
 * THE LOAD-BEARING ASSERTION is on what reaches `compressedState` and storage, not on
 * the returned value alone: the serialized state is what a reload reads back.
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
    return { U, state, storageWrites: [] as any[][] };
});

vi.mock('../../joiner', () => ({
    U: h.U,
    L: { from: () => undefined },
    R: { navigate: () => {} },
    Log: { ee: () => {}, e: () => {}, w: () => {}, ww: () => {} },
    store: { getState: () => h.state },
    TRANSACTION: (_name: string, fn: Function) => fn(),
    CreateElementAction: { new: () => {} },
    // The measured regime: the action does not touch the store, it is queued.
    SetFieldAction: { new: () => true },
    SetRootFieldAction: { new: () => {} },
    RuntimeAccessible: () => (target: any) => target,
    ProjectPointers: {},
    DProject: { new: () => ({ id: 'prj_new' }) },
    DModel: {},
}));
vi.mock('../../data/storage', () => ({
    default: { read: () => [], write: (...args: any[]) => { h.storageWrites.push(args); } },
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

import { ProjectsApi } from '../persistance/projects';

const ID = 'prj_1';
const VPS = ['vp_0', 'vp_1', 'vp_2', 'vp_3', 'vp_4'];

/** The live D object inside `idlookup`. */
const live = (id = ID) => h.state.idlookup[id];

/** An `LProject` bound to the object `idlookup` holds NOW: the idiom of `LProject.getProject()`. */
const proxyOnLive = (id = ID) => ({
    id,
    __raw: h.state.idlookup[id],
    viewpoints: [], metamodels: [], models: [],
} as any);

/** `+ New` viewpoint as the reducer applies it: a copy along the path, a NEW project object. */
const addViewpoint = (vp: string, id = ID) => {
    const target = h.state.idlookup[id];
    h.state.idlookup = { ...h.state.idlookup };
    h.state.idlookup[id] = { ...target, viewpoints: [...target.viewpoints, vp] };
};

/** What `compressedState` received on its last call, i.e. what the saved state holds. */
const serialized = () => h.U.compressedState.mock.calls.at(-1)?.[0];
/** The project record the offline branch wrote on its last `Storage.write('projects', ...)`. */
const record = (id = ID) => (h.storageWrites.at(-1)?.[1] as any[] | undefined)?.find((p: any) => p.id === id);

beforeEach(() => {
    h.U.isProjectModified = false;
    h.U.offline = true;
    h.U.compressedState.mockClear();
    h.storageWrites.length = 0;
    h.state.idlookup = {};
    h.state.idlookup[ID] = { id: ID, name: 'P', version: 1.0, viewpoints: [...VPS], lastModified: 1 };
});

describe('ProjectsApi.save — Cmd+S saves the live project (F2)', () => {
    it('POSITIVE CONTROL: a proxy held across `+ New` is bound to a detached object', () => {
        const held = proxyOnLive();
        addViewpoint('vp_new');

        expect(held.__raw).not.toBe(live());
        expect(held.__raw.viewpoints).toHaveLength(5);
        expect(live().viewpoints).toHaveLength(6);
    });

    it('POSITIVE CONTROL: a proxy taken after `+ New` saves all six', async () => {
        addViewpoint('vp_new');

        await ProjectsApi.save(proxyOnLive());

        expect(h.U.compressedState).toHaveBeenCalledTimes(1);
        expect(serialized().viewpoints).toEqual([...VPS, 'vp_new']);
    });

    // ---- the load-bearing assertion ----
    it('a proxy held across `+ New` saves the six live viewpoints, not the five it was bound to', async () => {
        const held = proxyOnLive();
        addViewpoint('vp_new');

        const dProject = await ProjectsApi.save(held);

        expect(h.U.compressedState).toHaveBeenCalledTimes(1);       // positive control: it serialized
        expect(serialized().viewpoints).toEqual([...VPS, 'vp_new']);
        expect(record().viewpoints).toEqual([...VPS, 'vp_new']);
        expect(dProject.viewpoints).toEqual([...VPS, 'vp_new']);
    });

    it('the save copies the live object: identity and fields of the store entry stay untouched', async () => {
        const held = proxyOnLive();
        addViewpoint('vp_new');
        const atSaveTime = live();

        const dProject = await ProjectsApi.save(held);

        expect(h.storageWrites).toHaveLength(1);                    // positive control: it persisted
        expect(dProject).not.toBe(atSaveTime);
        expect(live()).toBe(atSaveTime);
        expect(live().lastModified).toBe(1);
        expect(live().version).toBe(1.0);
        expect('state' in live()).toBe(false);
    });

    it('a project absent from `idlookup` falls back on `__raw`', async () => {
        const orphan: any = { id: 'prj_absent', __raw: { id: 'prj_absent', version: 2.4, viewpoints: ['vp_x'] }, viewpoints: [], metamodels: [], models: [] };

        const dProject = await ProjectsApi.save(orphan);

        expect(h.storageWrites).toHaveLength(1);                    // positive control: it persisted
        expect(dProject.id).toBe('prj_absent');
        expect(serialized().viewpoints).toEqual(['vp_x']);
        expect(record('prj_absent').viewpoints).toEqual(['vp_x']);
    });
});
