/**
 * SAVE2 — l'autosave non notifica, il save esplicito si'.
 *
 * Il difetto: i due `U.alert('i', 'Project Saved!', '')` stavano in `Offline.save`
 * e `Online.save`, cioe' nel layer di persistenza, che non sa se il salvataggio
 * l'ha chiesto un umano. L'autosave del layout passa dalla stessa `save`, quindi
 * il toast compariva a ogni gesto.
 *
 * ESEGUITO, non letto. Nessuna regex sul sorgente: la doppia di `U.alert` conta le
 * chiamate DOPO una `ProjectsApi.save` vera, su entrambi i rami (offline e online),
 * col ramo di errore incluso.
 *
 * Ogni blocco apre con un CONTROLLO POSITIVO che il salvataggio sia davvero entrato
 * nel corpo (`compressedState` chiamata, e la scrittura sul suo canale). Un `save`
 * che non fosse mai entrato non chiamerebbe nessun alert, e l'asserzione centrale —
 * che e' un'asserzione di assenza — sarebbe verde senza misurare niente
 * (CLAUDE.md §5).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
    (globalThis as any).window = (globalThis as any).window ?? {};
    (globalThis as any).window.dispatchEvent = (globalThis as any).window.dispatchEvent ?? (() => true);
    (globalThis as any).CustomEvent = (globalThis as any).CustomEvent ?? class { constructor(public type: string, public init?: any) {} };

    const U: any = {
        isProjectModified: false,
        offline: true,
        isOffline: () => U.offline,
        compressedState: vi.fn(async () => 'COMPRESSED'),
        alert: vi.fn(),
        env: () => 'http://persistance.test',
    };
    return {
        U,
        putCode: 200,
        storageWrites: [] as any[][],
        puts: [] as any[][],
    };
});

vi.mock('../../joiner', () => ({
    U: h.U,
    L: { from: () => undefined },
    R: { navigate: () => {} },
    Log: { ee: () => {}, e: () => {}, w: () => {} },
    store: { getState: () => ({ projects: [], version: { n: 1 } }) },
    TRANSACTION: (_name: string, fn: Function) => fn(),
    CreateElementAction: { new: () => {} },
    SetFieldAction: { new: () => {} },
    SetRootFieldAction: { new: () => {} },
    RuntimeAccessible: () => (target: any) => target,
    ProjectPointers: {},
    DProject: { new: () => ({ id: 'prj_new' }) },
    DModel: {},
}));
vi.mock('../../data/storage', () => ({
    default: {
        read: () => [],
        write: (...args: any[]) => { h.storageWrites.push(args); },
    },
}));
vi.mock('../api', () => ({ default: {
    get: async () => ({ code: 200 }),
    put: async (...args: any[]) => { h.puts.push(args); return { code: h.putCode }; },
    post: async () => ({ code: 200 }),
} }));
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
import { clearLastSaved, getLastSavedAt } from '../../common/libraries/lastSaved';

const project = (version = 1.0) => ({
    __raw: { id: 'prj_1', name: 'P', version },
    viewpoints: [],
    metamodels: [],
    models: [],
} as any);

/** I soli alert informativi, cioe' i «Project Saved!». Quelli di errore hanno
 *  livello 'e' e restano dove stavano: descrivono un fallimento della rete. */
const savedAlerts = () => h.U.alert.mock.calls.filter((c: any[]) => c[0] === 'i');
const errorAlerts = () => h.U.alert.mock.calls.filter((c: any[]) => c[0] === 'e');

beforeEach(() => {
    // Lo stato di `lastSaved` e' di modulo e sopravvive fra un test e l'altro:
    // senza questo azzeramento un'asserzione su «il timestamp e' stato registrato»
    // sarebbe verde per il valore lasciato dal test precedente, cioe' misurerebbe
    // nulla (CLAUDE.md §5).
    clearLastSaved();
    h.U.isProjectModified = false;
    h.U.offline = true;
    h.putCode = 200;
    h.U.alert.mockClear();
    h.U.compressedState.mockClear();
    h.storageWrites.length = 0;
    h.puts.length = 0;
});

describe('ProjectsApi.save — la notifica, ramo OFFLINE', () => {
    it('CONTROLLO POSITIVO: il salvataggio entra davvero nel corpo e scrive', async () => {
        await ProjectsApi.save(project());
        expect(h.U.compressedState).toHaveBeenCalledTimes(1);
        expect(h.storageWrites.length).toBe(1);
    });

    it('il save ESPLICITO notifica una volta', async () => {
        await ProjectsApi.save(project());
        expect(h.storageWrites.length).toBe(1);            // controllo positivo
        expect(savedAlerts().length).toBe(1);
        expect(savedAlerts()[0][1]).toBe('Project Saved!');
    });

    it('il save SILENZIOSO non notifica', async () => {
        await ProjectsApi.save(project(), { silent: true });
        expect(h.storageWrites.length).toBe(1);            // controllo positivo: ha salvato
        expect(savedAlerts().length).toBe(0);              // ...e non l'ha detto
    });

    it('dieci autosave di fila non producono nessun toast', async () => {
        for (let i = 0; i < 10; i++) await ProjectsApi.save(project(), { silent: true });
        expect(h.storageWrites.length).toBe(10);           // controllo positivo
        expect(savedAlerts().length).toBe(0);
    });

    it('esplicito dopo silenzioso: un toast solo, quello dell\'esplicito', async () => {
        await ProjectsApi.save(project(), { silent: true });
        await ProjectsApi.save(project());
        expect(h.storageWrites.length).toBe(2);            // controllo positivo
        expect(savedAlerts().length).toBe(1);
    });
});

describe('ProjectsApi.save — la notifica, ramo ONLINE', () => {
    beforeEach(() => { h.U.offline = false; });

    it('CONTROLLO POSITIVO: il salvataggio arriva davvero alla PUT', async () => {
        await ProjectsApi.save(project());
        expect(h.puts.length).toBe(1);
    });

    it('il save ESPLICITO notifica una volta', async () => {
        await ProjectsApi.save(project());
        expect(h.puts.length).toBe(1);                     // controllo positivo
        expect(savedAlerts().length).toBe(1);
    });

    it('il save SILENZIOSO non notifica', async () => {
        await ProjectsApi.save(project(), { silent: true });
        expect(h.puts.length).toBe(1);                     // controllo positivo: ha salvato
        expect(savedAlerts().length).toBe(0);
    });

    it('la PUT fallita non notifica un successo, e l\'alert di errore resta', async () => {
        h.putCode = 500;
        await ProjectsApi.save(project());
        expect(h.puts.length).toBe(1);                     // controllo positivo
        expect(savedAlerts().length).toBe(0);
        expect(errorAlerts().length).toBe(1);
        expect(errorAlerts()[0][1]).toBe('Cannot Save');
    });

    it('la PUT fallita non registra un ultimo salvataggio', async () => {
        h.putCode = 500;
        const before = getLastSavedAt();
        await ProjectsApi.save(project());
        expect(h.puts.length).toBe(1);                     // controllo positivo
        expect(getLastSavedAt()).toBe(before);
    });
});

describe('ProjectsApi.save — l\'ultimo salvataggio (punto 3)', () => {
    it('il save esplicito registra il timestamp', async () => {
        const t0 = Date.now();
        const d = await ProjectsApi.save(project());
        expect(h.storageWrites.length).toBe(1);            // controllo positivo
        expect(getLastSavedAt()).toBe(d.lastModified);
        expect(getLastSavedAt()!).toBeGreaterThanOrEqual(t0);
    });

    it('anche il save SILENZIOSO lo registra: e\' il solo segnale che gli resta', async () => {
        const d = await ProjectsApi.save(project(), { silent: true });
        expect(h.storageWrites.length).toBe(1);            // controllo positivo
        expect(getLastSavedAt()).toBe(d.lastModified);
    });
});

describe('SAVE2 — cio\' che non si tocca (non regressione)', () => {
    it('il save silenzioso non azzera il dirty flag (DIRTY1)', async () => {
        h.U.isProjectModified = true;
        await ProjectsApi.save(project(), { silent: true });
        expect(h.storageWrites.length).toBe(1);            // controllo positivo
        expect(h.U.isProjectModified).toBe(true);
    });

    it('il save esplicito lo azzera ancora', async () => {
        h.U.isProjectModified = true;
        await ProjectsApi.save(project());
        expect(h.U.isProjectModified).toBe(false);
    });

    it('il save silenzioso non avanza la versione', async () => {
        const silent = await ProjectsApi.save(project(1.0), { silent: true });
        expect(silent.version).toBe(1.0);
        const explicit = await ProjectsApi.save(project(1.0));
        expect(explicit.version).not.toBe(1.0);
    });
});
