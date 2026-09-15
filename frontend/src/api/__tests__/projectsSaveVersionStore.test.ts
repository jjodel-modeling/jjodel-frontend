/**
 * VER2 — il riallineamento di `save` scriveva sull'oggetto vivo dello store.
 *
 * IL DIFETTO. `save` fa `SetFieldAction.new(..., 'version', nextVersion, ...)` e poi
 * riallinea a mano il target del proxy. Il commento di VER1 dava quel target per
 * DETACHED: il reducer copia lungo il path, quindi `idlookup[id]` diventa un oggetto
 * nuovo e il proxy resta sul precedente. MISURATO il 2026-09-02 nell'app vera (sonde
 * `_tmp_ver2_*`), e' falso, sempre:
 *
 *   - l'app sta stabilmente a `transactionStatus.transactionDepthLevel === 1`
 *     (`redux/reducer/reducer.ts:1443` committa ogni `U.UpdatingTimer` = 300ms e
 *     `COMMIT` riapre il blocco con `BEGIN()`, `redux/action/action.ts:137`);
 *   - quindi l'azione NON viene dispatchata li': finisce in `pendingActions`
 *     (misurato: `pending` 0 -> 1 attraversando la chiamata a `save`);
 *   - a quella riga lo store e' intatto e `project.__raw === idlookup[id]` — vero per
 *     ogni call site di produzione, che prende un `LProject.getProject()` fresco;
 *   - la scrittura non protetta mutava quindi l'oggetto VIVO dello store fuori dal
 *     reducer, e avvelenava l'`oldState` che il reducer stesso rilegge: quando
 *     l'azione in coda veniva flushata non trovava piu' nulla da cambiare.
 *
 * IL DANNO, misurato su un save esplicito contro la stessa azione lanciata da sola:
 *   clonedCounter +0 contro +1  ->  il bump NON entra nel delta del reducer
 *   step di undo   +0 contro +1  ->  ne' nella history del D-layer (ne' nel collab)
 *   notifiche      +1 contro +1  ->  i sottoscritti vengono avvisati, ma 300ms DOPO
 *                                    che il valore era gia' cambiato nello store
 *
 * QUI si riproduce quel regime in `environment: node`, con l'idioma del file che
 * questo affianca (`projectsSaveVersion.test.ts`): import doppiati e `window`
 * stubbato, perche' `projects.ts` lo dereferenzia a modulo. Lo `store` doppiato ha
 * un `idlookup` vero e un `flush()` che ricopia lungo il path come
 * `deepCopyButOnlyFollowingPath`, `clonedCounter` compreso, e che — come il reducer —
 * non ricopia nulla se il valore e' gia' quello.
 *
 * L'ASSERZIONE PORTANTE E' SULL'IDENTITA', non sul numero. Un test che guardasse solo
 * la versione resterebbe verde con la scrittura in place: il numero arriva comunque,
 * per la strada sbagliata.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
    (globalThis as any).window = (globalThis as any).window ?? {};

    /** Lo stato doppiato: un `idlookup` vero, con i clonedCounter del reducer. */
    const state: any = { idlookup: { clonedCounter: 0 }, projects: [], version: { n: 1 } };
    const queue: Array<{ id: string; field: string; value: any }> = [];

    const U: any = {
        isProjectModified: false,
        offline: true,
        isOffline: () => U.offline,
        compressedState: vi.fn(async () => 'COMPRESSED'),
        alert: vi.fn(),
        env: () => 'http://persistance.test',
    };
    return { U, state, queue, storageWrites: [] as any[][] };
});

vi.mock('../../joiner', () => ({
    U: h.U,
    L: { from: () => undefined },
    R: { navigate: () => {} },
    Log: { ee: () => {}, e: () => {}, w: () => {} },
    // `getState()` rende SEMPRE l'oggetto corrente: e' quello che fa Redux.
    store: { getState: () => h.state },
    TRANSACTION: (_name: string, fn: Function) => fn(),
    CreateElementAction: { new: () => {} },
    // Il regime misurato: l'azione non tocca lo store, va in coda.
    SetFieldAction: { new: (id: string, field: string, value: any) => { h.queue.push({ id, field, value }); return true; } },
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

/** L'oggetto D vivo dentro `idlookup`, quello che il reducer ha il diritto di sostituire. */
const live = (id = ID) => h.state.idlookup[id];

/**
 * Il flush del `COMMIT` periodico: applica la coda ricopiando lungo il path come
 * `deepCopyButOnlyFollowingPath` (`redux/reducer/reducer.ts:82`). Come il reducer,
 * se il valore in arrivo e' gia' quello presente non ricopia nulla — ed e' proprio
 * quel ramo che la scrittura in place imboccava, rendendo il bump invisibile.
 */
const flush = () => {
    for (const a of h.queue.splice(0)) {
        const target = h.state.idlookup[a.id];
        if (!target || target[a.field] === a.value) continue;   // delta vuoto: niente clone
        h.state.idlookup = { ...h.state.idlookup };
        h.state.idlookup.clonedCounter = 1 + (h.state.idlookup.clonedCounter || 0);
        const copy = { ...target, [a.field]: a.value };
        copy.clonedCounter = 1 + (target.clonedCounter || 0);
        h.state.idlookup[a.id] = copy;
    }
};

/** Un `LProject` fresco agganciato all'oggetto vivo: l'idioma di `LProject.getProject()`. */
const freshProxy = (id = ID) => ({
    __raw: h.state.idlookup[id],
    viewpoints: [], metamodels: [], models: [],
} as any);

beforeEach(() => {
    h.U.isProjectModified = false;
    h.U.offline = true;
    h.U.compressedState.mockClear();
    h.storageWrites.length = 0;
    h.queue.length = 0;
    h.state.idlookup = { clonedCounter: 0 };
    h.state.idlookup[ID] = { id: ID, name: 'P', version: 1.0, clonedCounter: 0 };
});

describe('ProjectsApi.save — il riallineamento e l\'oggetto vivo dello store (VER2)', () => {
    it('CONTROLLO POSITIVO: il save entra nel corpo del metodo e accoda l\'azione', async () => {
        const dProject = await ProjectsApi.save(freshProxy());

        expect(h.U.compressedState).toHaveBeenCalledTimes(1);       // serializza
        expect(h.storageWrites).toHaveLength(1);                    // e persiste
        expect(dProject.state).toBe('COMPRESSED');
        expect(h.queue).toEqual([{ id: ID, field: 'version', value: 1.1 }]);
    });

    it('CONTROLLO POSITIVO: il flush doppiato ricopia lungo il path e alza clonedCounter', () => {
        const before = live();
        h.queue.push({ id: ID, field: 'version', value: 9.9 });
        flush();

        expect(live()).not.toBe(before);                            // oggetto NUOVO
        expect(live().clonedCounter).toBe(before.clonedCounter + 1);
        expect(h.state.idlookup.clonedCounter).toBe(1);
        expect(live().version).toBe(9.9);
    });

    it('CONTROLLO POSITIVO: un valore gia\' presente non fa ricopiare nulla', () => {
        const before = live();
        h.queue.push({ id: ID, field: 'version', value: before.version });
        flush();

        expect(live()).toBe(before);                                // stesso oggetto
        expect(live().clonedCounter).toBe(0);
    });

    // ---- l'asserzione portante ----
    it('un save esplicito NON tocca l\'oggetto vivo: lo cambia solo il flush', async () => {
        const atSaveTime = live();
        expect(freshProxy().__raw).toBe(atSaveTime);                // il proxy E' l'oggetto vivo

        await ProjectsApi.save(freshProxy());

        // IDENTITA' e VALORE, prima del flush: il save non ha scritto nulla nello store
        expect(live()).toBe(atSaveTime);
        expect(live().version).toBe(1.0);
        expect(live().clonedCounter).toBe(0);

        flush();

        // solo ora il reducer sostituisce l'oggetto e il valore avanza
        expect(live()).not.toBe(atSaveTime);
        expect(live().version).toBe(1.1);
        expect(live().clonedCounter).toBe(1);
    });

    it('il save silenzioso non accoda, non clona, non tocca l\'oggetto vivo', async () => {
        const atSaveTime = live();

        const silent = await ProjectsApi.save(freshProxy(), { silent: true });
        flush();

        expect(h.storageWrites).toHaveLength(1);                    // controllo positivo
        expect(silent.version).toBe(1.0);
        expect(h.queue).toHaveLength(0);
        expect(live()).toBe(atSaveTime);
        expect(live().clonedCounter).toBe(0);
    });

    // ---- I TRE SCENARI DEL PUNTO 1, con identita' e clonedCounter ----
    it('S1 due save espliciti consecutivi: due cloni, due versioni, zero scritture in place', async () => {
        const o0 = live();
        await ProjectsApi.save(freshProxy()); flush();
        const o1 = live();
        await ProjectsApi.save(freshProxy()); flush();
        const o2 = live();

        expect(h.storageWrites).toHaveLength(2);                    // controllo positivo
        expect([o0, o1, o2].map(o => o.version)).toEqual([1.0, 1.1, 1.2]);
        expect(o1).not.toBe(o0);
        expect(o2).not.toBe(o1);
        expect([o0, o1, o2].map(o => o.clonedCounter)).toEqual([0, 1, 2]);
    });

    it('S2 con un\'azione su un ALTRO id in mezzo: il path divergente non cambia nulla', async () => {
        h.state.idlookup['prj_other'] = { id: 'prj_other', name: 'O', version: 5.0, clonedCounter: 0 };

        await ProjectsApi.save(freshProxy()); flush();
        const o1 = live();
        h.queue.push({ id: 'prj_other', field: 'name', value: 'O2' }); flush();
        const oMid = live();
        await ProjectsApi.save(freshProxy()); flush();
        const o2 = live();

        expect(oMid).toBe(o1);                                      // l'altro id non tocca il nostro
        expect(o2).not.toBe(o1);
        expect([o1.version, o2.version]).toEqual([1.1, 1.2]);
        expect([o1.clonedCounter, o2.clonedCounter]).toEqual([1, 2]);
    });

    it('S3 con un save SILENZIOSO in mezzo: non consuma un numero e non clona', async () => {
        await ProjectsApi.save(freshProxy()); flush();
        const o1 = live();
        const silent = await ProjectsApi.save(freshProxy(), { silent: true }); flush();
        const oMid = live();
        await ProjectsApi.save(freshProxy()); flush();
        const o2 = live();

        expect(h.storageWrites).toHaveLength(3);                    // controllo positivo
        expect(silent.version).toBe(1.1);
        expect(oMid).toBe(o1);                                      // il silenzioso non ha clonato
        expect(oMid.clonedCounter).toBe(1);
        expect(o2.version).toBe(1.2);
        expect(o2.clonedCounter).toBe(2);
    });

    it('un proxy TENUTO IN MANO fra due save non perde un numero', async () => {
        const held = freshProxy();                                  // si aggancia una volta sola

        await ProjectsApi.save(held); flush();
        const first = live().version;
        await ProjectsApi.save(held); flush();
        const second = live().version;

        // La progressione non passa piu' da `held.__raw`: al primo save quel target E'
        // l'oggetto vivo e il riallineamento NON scatta, al secondo e' ormai staccato e
        // scatta. Il numero corretto arriva perche' `save` legge la versione da Redux.
        expect([first, second]).toEqual([1.1, 1.2]);
        expect(held.__raw.version).toBe(1.2);   // riallineato solo da staccato
    });

    it('un progetto assente da `idlookup` ricade su `__raw` e non fa esplodere `save`', async () => {
        const orphan: any = { __raw: { id: 'prj_absent', version: 2.4 }, viewpoints: [], metamodels: [], models: [] };

        const dProject = await ProjectsApi.save(orphan);

        expect(h.storageWrites).toHaveLength(1);                    // controllo positivo
        expect(dProject.version).toBe(2.5);
        expect(orphan.__raw.version).toBe(2.5);                     // qui il riallineamento serve
    });
});
