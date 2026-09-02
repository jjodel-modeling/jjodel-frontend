/**
 * VER1 — `ProjectsApi.save` leggeva la versione da un `__raw` stantio.
 *
 * Il difetto: `save` copia `project.__raw` (`projects.ts:114`), calcola
 * `nextVersion` da quella copia (`:124-126`), e a fine metodo scrive la nuova
 * versione in Redux con un `SetFieldAction` (`:141`). Il reducer copia lungo il
 * path (`deepCopyButOnlyFollowingPath`, `redux/reducer/reducer.ts:540`), quindi
 * `idlookup[id]` diventa un oggetto NUOVO mentre il proxy del chiamante resta
 * agganciato al precedente. Due salvataggi espliciti sullo stesso `LProject`
 * ricalcolavano `nextVersion` dallo stesso numero vecchio: `1.1` due volte.
 *
 * MISURATO nell'app vera prima della correzione (sonda `_tmp_ver1_verify.ts`,
 * progetto `Pointer_RowViewSmokeProject`):
 *
 *     passo               project.version   __raw.version   store
 *     baseline                   1               1            1
 *     save esplicito 1           1               1            1.1
 *     save esplicito 2           1               1            1.1   <- il difetto
 *
 * e dopo: 1.1 / 1.2 / 1.3 concordi su tutti e tre i punti.
 *
 * ESEGUITO, non letto — stesso idioma di `projectsSaveDirty.test.ts`, che questo
 * file affianca: `projects.ts` si importa in `environment: node` doppiando i suoi
 * import e stubbando il `window` che dereferenzia a modulo (`projects.ts:453`).
 *
 * I TRE PUNTI DI LETTURA, qui. Senza Redux vero e senza proxy, la concordanza si
 * misura fra: (A) `dProject.version`, il numero serializzato e restituito;
 * (B) `project.__raw.version`, l'oggetto in mano al chiamante; (C) l'argomento
 * del `SetFieldAction`, cioe' cio' che sarebbe finito in Redux. La concordanza
 * fra proxy, `__raw` e store nell'app vera e' compito della sonda, non di questo
 * file, e li' e' verde.
 *
 * Ogni blocco apre con un controllo POSITIVO che il salvataggio sia davvero
 * passato per il corpo di `save` (`compressedState` chiamata, `Storage.write`
 * scritta): un `save` che non ci fosse mai entrato lascerebbe la versione ferma
 * per la ragione sbagliata, e «non avanza» sarebbe verde senza misurare nulla.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
    (globalThis as any).window = (globalThis as any).window ?? {};

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
        setFieldCalls: [] as any[][],
        storageWrites: [] as any[][],
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
    SetFieldAction: { new: (...args: any[]) => { h.setFieldCalls.push(args); } },
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

/**
 * Un `LProject` ridotto ai membri che `save` legge, con `__raw.version`
 * STRUMENTATA: ogni scrittura viene contata.
 *
 * Il conteggio non e' un lusso. Sul salvataggio silenzioso `nextVersion` vale
 * `currentVersion`, quindi un riallineamento sbagliato — spostato fuori da
 * `if (!silent)` — riscriverebbe lo STESSO numero e sarebbe invisibile a
 * qualunque asserzione sul valore. Il contatore lo vede: un save silenzioso deve
 * scrivere ZERO volte su `__raw.version`, uno esplicito esattamente una.
 */
const project = (version = 1.0) => {
    let v = version;
    const writes: number[] = [];
    const raw: any = { id: 'prj_1', name: 'P' };
    Object.defineProperty(raw, 'version', {
        enumerable: true,
        configurable: true,
        get: () => v,
        set: (x: number) => { v = x; writes.push(x); },
    });
    return {
        __raw: raw,
        rawWrites: writes,
        viewpoints: [],
        metamodels: [],
        models: [],
    } as any;
};

/** I `SetFieldAction.new(..., 'version', ...)` finora, in ordine. */
const versionWrites = () => h.setFieldCalls.filter(c => c[1] === 'version');
/** L'ultimo valore di versione arrivato al `SetFieldAction` — il punto (C). */
const lastReduxVersion = () => versionWrites().at(-1)?.[2];

beforeEach(() => {
    h.U.isProjectModified = false;
    h.U.offline = true;
    h.U.compressedState.mockClear();
    h.setFieldCalls.length = 0;
    h.storageWrites.length = 0;
});

describe('ProjectsApi.save — la progressione della versione (VER1)', () => {
    it('CONTROLLO POSITIVO: il salvataggio entra davvero nel corpo di `save`', async () => {
        const p = project(1.0);
        const dProject = await ProjectsApi.save(p);

        expect(h.U.compressedState).toHaveBeenCalledTimes(1);   // serializza
        expect(h.storageWrites).toHaveLength(1);                // e persiste
        expect(dProject.state).toBe('COMPRESSED');
    });

    it('tre save espliciti sullo STESSO LProject danno 1.1, 1.2, 1.3', async () => {
        const p = project(1.0);

        const first = await ProjectsApi.save(p);
        const second = await ProjectsApi.save(p);
        const third = await ProjectsApi.save(p);

        expect(h.storageWrites).toHaveLength(3);                // controllo positivo
        expect([first.version, second.version, third.version]).toEqual([1.1, 1.2, 1.3]);
    });

    it('i tre punti di lettura concordano dopo ogni save esplicito', async () => {
        const p = project(1.0);

        for (const expected of [1.1, 1.2, 1.3]) {
            const dProject = await ProjectsApi.save(p);
            expect(dProject.version).toBe(expected);            // (A) il serializzato
            expect(p.__raw.version).toBe(expected);             // (B) l'oggetto del chiamante
            expect(lastReduxVersion()).toBe(expected);          // (C) cio' che va in Redux
        }
        expect(versionWrites()).toHaveLength(3);
    });

    it('il save SILENZIOSO non avanza la versione e non scrive su `__raw`', async () => {
        const p = project(1.0);

        const silent = await ProjectsApi.save(p, { silent: true });

        expect(h.U.compressedState).toHaveBeenCalledTimes(1);   // controllo positivo:
        expect(h.storageWrites).toHaveLength(1);                // ha salvato per davvero
        expect(silent.version).toBe(1.0);
        expect(p.__raw.version).toBe(1.0);
        expect(versionWrites()).toHaveLength(0);                // niente delta in Redux
        expect(p.rawWrites).toEqual([]);                        // e nemmeno un riallineamento
    });

    it('PER CONTRASTO: lo stesso oggetto, salvato esplicitamente, scrive una volta sola', async () => {
        const p = project(1.0);

        await ProjectsApi.save(p);

        expect(h.storageWrites).toHaveLength(1);                // controllo positivo
        expect(p.rawWrites).toEqual([1.1]);
    });

    it('un silenzioso in mezzo non consuma un numero: 1.1, silenzioso, 1.2', async () => {
        const p = project(1.0);

        const first = await ProjectsApi.save(p);
        const silent = await ProjectsApi.save(p, { silent: true });
        const second = await ProjectsApi.save(p);

        expect(h.storageWrites).toHaveLength(3);                // controllo positivo
        expect(first.version).toBe(1.1);
        expect(silent.version).toBe(1.1);
        expect(second.version).toBe(1.2);
        expect(p.__raw.version).toBe(1.2);
        expect(p.rawWrites).toEqual([1.1, 1.2]);                // due soli riallineamenti
    });

    it('il riporto di decina passa dal valore riallineato: 1.9 -> 2.0 -> 2.1', async () => {
        const p = project(1.9);

        const a = await ProjectsApi.save(p);
        const b = await ProjectsApi.save(p);

        expect(h.storageWrites).toHaveLength(2);                // controllo positivo
        expect(a.version).toBe(2.0);
        expect(b.version).toBe(2.1);
        expect(p.__raw.version).toBe(2.1);
    });

    it('un progetto senza `__raw` non fa esplodere `save`', async () => {
        const p: any = { viewpoints: [], metamodels: [], models: [] };

        const dProject = await ProjectsApi.save(p);

        expect(h.storageWrites).toHaveLength(1);                // controllo positivo
        expect(dProject.version).toBe(1.0);                     // `getNextVersionNumber(undefined)`
    });
});
