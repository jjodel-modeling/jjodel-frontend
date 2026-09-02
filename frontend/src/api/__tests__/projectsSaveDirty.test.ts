/**
 * DIRTY1 — `isProjectModified` non va azzerato dall'autosave silenzioso.
 *
 * Il difetto (referto SAVE1, campo Notes): in `ProjectsApi.save` la riga
 * `U.isProjectModified = false` sta FUORI da `if (!silent)`. Il salvataggio
 * silenzioso di `useLayoutAutosave.ts:59` — che scatta 1000 ms dopo un drag di
 * nodo — dichiara quindi il progetto pulito, e l'avviso «Unsaved changes» alla
 * chiusura (`Navbar.tsx`, via `isProjectModified()`) non scatta piu'.
 *
 * ESEGUITO, non letto. `projects.ts` si importa in `environment: node` una volta
 * doppiati i suoi import e stubbato il `window` che dereferenzia a modulo
 * (`projects.ts:453`, `let windoww = window as any`): il flag e' letto DOPO una
 * chiamata vera a `ProjectsApi.save`, non cercato con una regex nel sorgente.
 *
 * Ogni blocco apre con un controllo POSITIVO — che il salvataggio sia davvero
 * passato di li' (`compressedState` chiamata, `Storage.write` scritta). Un
 * `save` che non fosse mai entrato nel corpo lascerebbe il flag a `true` per la
 * ragione sbagliata, e l'asserzione centrale sarebbe verde senza misurare nulla
 * (CLAUDE.md §5, «un'asserzione di assenza richiede la prova che la ricerca sia
 * girata»).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
    // `projects.ts` dereferenzia `window` a livello di modulo; vitest gira in
    // `environment: node`. Lo stub deve esistere PRIMA dell'import, quindi qui.
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

/** Un `LProject` ridotto ai soli membri che `save` legge. */
const project = (version = 1.0) => ({
    __raw: { id: 'prj_1', name: 'P', version },
    viewpoints: [],
    metamodels: [],
    models: [],
} as any);

/** I `SetFieldAction.new(..., 'version', ...)` finora, in ordine. */
const versionWrites = () => h.setFieldCalls.filter(c => c[1] === 'version');

beforeEach(() => {
    h.U.isProjectModified = false;
    h.U.offline = true;
    h.U.compressedState.mockClear();
    h.setFieldCalls.length = 0;
    h.storageWrites.length = 0;
});

describe('ProjectsApi.save — il dirty flag', () => {
    it('CONTROLLO POSITIVO: il salvataggio entra davvero nel corpo di `save`', async () => {
        h.U.isProjectModified = true;
        const dProject = await ProjectsApi.save(project());

        expect(h.U.compressedState).toHaveBeenCalledTimes(1);   // serializza
        expect(h.storageWrites).toHaveLength(1);                 // e persiste
        expect(dProject.state).toBe('COMPRESSED');
    });

    it('il salvataggio ESPLICITO azzera il flag', async () => {
        h.U.isProjectModified = true;
        await ProjectsApi.save(project());

        expect(h.storageWrites).toHaveLength(1);                 // controllo positivo
        expect(h.U.isProjectModified).toBe(false);
    });

    it('il salvataggio esplicito con `{silent:false}` azzera il flag', async () => {
        h.U.isProjectModified = true;
        await ProjectsApi.save(project(), { silent: false });

        expect(h.storageWrites).toHaveLength(1);                 // controllo positivo
        expect(h.U.isProjectModified).toBe(false);
    });

    it('il salvataggio SILENZIOSO persiste ma NON azzera il flag — il difetto DIRTY1', async () => {
        h.U.isProjectModified = true;
        await ProjectsApi.save(project(), { silent: true });

        expect(h.U.compressedState).toHaveBeenCalledTimes(1);    // controllo positivo:
        expect(h.storageWrites).toHaveLength(1);                 // ha salvato per davvero
        expect(h.U.isProjectModified).toBe(true);                // e il progetto resta sporco
    });

    it('il salvataggio silenzioso non sporca un progetto pulito', async () => {
        h.U.isProjectModified = false;
        await ProjectsApi.save(project(), { silent: true });

        expect(h.storageWrites).toHaveLength(1);                 // controllo positivo
        expect(h.U.isProjectModified).toBe(false);
    });

    it('vale anche sul ramo ONLINE: silenzioso non azzera, esplicito si\'', async () => {
        h.U.offline = false;

        h.U.isProjectModified = true;
        await ProjectsApi.save(project(), { silent: true });
        expect(h.U.compressedState).toHaveBeenCalledTimes(1);    // controllo positivo
        expect(h.U.isProjectModified).toBe(true);

        await ProjectsApi.save(project());
        expect(h.U.isProjectModified).toBe(false);
    });

    it('la sequenza del referto: modifica -> autosave silenzioso -> save esplicito', async () => {
        // 1. l'utente edita un campo
        h.U.isProjectModified = true;

        // 2. `useLayoutAutosave` salva in silenzio 1000 ms dopo il drag
        await ProjectsApi.save(project(), { silent: true });
        expect(h.storageWrites).toHaveLength(1);                 // il salvataggio c'e' stato
        expect(h.U.isProjectModified).toBe(true);                // ma il progetto e' ancora sporco

        // 3. l'utente salva davvero (Cmd+S, menu File, bottone in testata)
        await ProjectsApi.save(project());
        expect(h.storageWrites).toHaveLength(2);
        expect(h.U.isProjectModified).toBe(false);
    });
});

describe('ProjectsApi.save — cio\' che DIRTY1 non tocca (non regressione)', () => {
    it('la versione avanza sul salvataggio esplicito e non su quello silenzioso', async () => {
        const silent = await ProjectsApi.save(project(1.0), { silent: true });
        expect(silent.version).toBe(1.0);
        expect(versionWrites()).toHaveLength(0);

        const explicit = await ProjectsApi.save(project(1.0));
        expect(explicit.version).toBe(1.1);
        expect(versionWrites()).toHaveLength(1);
        expect(versionWrites()[0][2]).toBe(1.1);
    });

    /**
     * Difetto pre-esistente REGISTRATO e NON toccato da DIRTY1 (referto SAVE1:
     * «`version` non avanza fra due save vicini»). `save` legge la versione da
     * `project.__raw`, che il `SetFieldAction` di fine metodo aggiornava in Redux
     * ma non nell'oggetto in mano al chiamante: due salvataggi espliciti sullo
     * stesso `LProject` in memoria producevano due volte la stessa versione.
     *
     * CORRETTO da VER1 (2026-09-02): `save` riallinea `project.__raw.version`
     * dopo il bump, quindi la seconda chiamata legge il valore avanzato. Questa
     * asserzione era scritta COM'ERA, con la nota «1.2 il giorno in cui verra'
     * corretto»; quel giorno e' arrivato e la nota e' stata aggiornata invece che
     * cancellata, perche' la ragione per cui il test esiste non e' cambiata.
     * La copertura piena della progressione sta in `projectsSaveVersion.test.ts`.
     */
    it('VER1: due save sullo stesso __raw danno versioni successive', async () => {
        const p = project(1.0);
        const first = await ProjectsApi.save(p);
        const second = await ProjectsApi.save(p);

        expect(first.version).toBe(1.1);
        expect(second.version).toBe(1.2);   // era 1.1 prima di VER1
    });
});
