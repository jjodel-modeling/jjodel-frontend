import { useCallback, useEffect, useRef } from 'react';
import { DUser, LProject } from '../../../joiner';
import { ProjectsApi } from '../../../api/persistance';
import { createLayoutAutosaveScheduler, installAutosaveEdgeGuards } from './layoutAutosaveScheduler';

/**
 * Autosave of the v2-flow node layout.
 *
 * The v2-flow drag handler commits node positions to the D-layer (DVertex.x/y)
 * but the project is only serialized to disk on an explicit save (Ctrl+S /
 * toolbar). Without persistence, a Close Project → reload discards the moved
 * coordinates and the auto-populate regenerates nodes on the default grid.
 *
 * This hook bridges that gap: `scheduleLayoutSave()` debounces and coalesces
 * rapid drags into a single full project save, gated by the current user's
 * `autosaveLayout` preference. It reuses the existing `ProjectsApi.save` path
 * (full state serialization) — no new persistence infrastructure — in its SILENT
 * form: same serialization, but the project version does not advance and nothing
 * is written back into the store.
 *
 * The silence is load-bearing, not cosmetic. The version bump of an ordinary save
 * is a `SetFieldAction` into Redux, and this save fires only once the idle delay
 * declared by `AUTOSAVE_DEBOUNCE_MS` below has elapsed (or, at the latest, the
 * `AUTOSAVE_MAX_WAIT_MS` cap), well past the 450ms coalescing window of the D-layer
 * history: it would land as an undo step of its own, so the first Cmd+Z after a drag
 * would undo an invisible version bump instead of the drag. The project version
 * advances only on an explicit save (Cmd+S, toolbar) — ratified 2026-08-24.
 *
 * Il ritardo non e' ripetuto qui apposta. Fino a SAVE2 (`4bc765e85`, 2026-09-02) era
 * 1000 ms ed era scritto in questo blocco, che e' rimasto indietro quando il valore e'
 * cambiato: la sede del numero sono le costanti qui sotto, e questo paragrafo le cita
 * invece di copiarle. Il ragionamento vale a fortiori con un'attesa piu' lunga, perche'
 * si allontana ulteriormente dalla finestra di coalescing.
 *
 * A pending save in the debounce window is flushed on unmount, so a node moved
 * just before closing the metamodel tab is not lost.
 */
/**
 * SAVE2 — il diradamento, e il numero su cui e' scelto.
 *
 * MISURA (2026-09-02, sonda `_tmp_save2_verify.ts` contro il dev server, progetto
 * offline). Modello: metamodello di 30 classi x 3 attributi + 30 reference, M1 di
 * 300 istanze, 499 voci in `idlookup` — 36k caratteri UTF-16 di stato compresso,
 * ~72 KB. Mediana su 5 giri:
 *
 *     ProjectsApi.save(..., {silent:true})   235 ms
 *     di cui U.compressedState da sola       241 ms
 *     di cui la scrittura                    sotto la soglia di rumore
 *
 * Il costo e' interamente la serializzazione, ed e' sul thread principale: sono
 * centinaia di millisecondi, non decine, quindi il costo E' la ragione del
 * diradamento e non solo la finestra di perdita. E cresce col modello: 499 voci di
 * `idlookup` sono un progetto medio.
 *
 * Sulla stessa sonda, 10 nodi trascinati a 2 s l'uno dall'altro (≈20 s di lavoro)
 * hanno prodotto 6 salvataggi completi: ≈1,4 s di thread principale bloccato, in
 * sei gruzzoli che cadono negli intervalli fra un gesto e il successivo — cioe'
 * esattamente quando l'utente sta per fare il gesto dopo.
 *
 * SCELTA DEL TRIGGER. Un timer puro e' scartato: salverebbe anche a nulla di
 * cambiato, e potrebbe cadere in mezzo a un trascinamento. Restavano due strade.
 *
 *   (b) intervallo di N minuti in AND col flag di dirty. Scartata: il flag risolve
 *       il primo difetto del timer puro ma non il secondo — l'intervallo scatta
 *       sull'orologio, quindi puo' comunque cadere fra due gesti di una sequenza
 *       attiva, che e' il blocco da 235 ms che vogliamo togliere. In piu' introduce
 *       un timer di lungo periodo con un proprietario da dichiarare.
 *
 *   (a) idle, cioe' il debounce esistente allungato. SCELTA. Ogni gesto rimanda la
 *       scadenza, quindi il salvataggio non puo' strutturalmente cadere mentre
 *       l'utente sta lavorando: cade quando ha smesso. Nessuno stato nuovo, nessun
 *       proprietario nuovo, il coalescing e' gia' quello che il debounce fa. Sulla
 *       sessione misurata sopra i 6 salvataggi diventano 1.
 *
 * N = 15 s. E' la pausa oltre la quale un gesto di editing e' finito davvero, e a
 * 235 ms per salvataggio il costo scende sotto il 2% della finestra.
 */
const AUTOSAVE_DEBOUNCE_MS = 15_000;

/**
 * Il tetto sull'attesa: dal PRIMO gesto non ancora salvato non possono passare piu'
 * di tanto, per quanto l'utente continui a lavorare senza mai fermarsi.
 *
 * Senza questo, (a) da sola avrebbe una regressione vera rispetto al debounce da
 * 1000 ms: chi lavora ininterrottamente non raggiunge mai la finestra di quiete, e
 * la finestra di perdita passa da un secondo a illimitata. Il tetto la riporta a un
 * numero: due minuti di lavoro continuo, che e' anche il «ogni tot minuti» da cui la
 * richiesta era partita — realizzato in modo che non interrompa un gesto, salvo
 * dopo due minuti che di gesti non se ne smette di fare.
 */
const AUTOSAVE_MAX_WAIT_MS = 120_000;

export function useLayoutAutosave(): { scheduleLayoutSave: () => void } {
    const isSavingRef = useRef(false);
    // Set when a save is requested while another is already in flight, so the
    // in-flight save's completion triggers exactly one more save (no overlap,
    // no lost final state).
    const pendingRef = useRef(false);

    const runSave = useCallback(async (): Promise<void> => {
        const project = LProject.getProject();
        // Gate: respect the user-level autosaveLayout preference. Default-on;
        // off only when the current user explicitly disables it (undefined/true
        // → autosave active). The project is still required as the save target.
        const user = DUser.getUser();
        if (!project || user?.autosaveLayout === false) {
            pendingRef.current = false;
            return;
        }
        // Concurrency guard: never overlap saves. Remember the request and
        // replay it once the in-flight save resolves.
        if (isSavingRef.current) {
            pendingRef.current = true;
            return;
        }
        isSavingRef.current = true;
        pendingRef.current = false;
        try {
            await ProjectsApi.save(project, { silent: true });
        } catch (e) {
            console.warn('[useLayoutAutosave] Layout autosave failed:', e);
        } finally {
            isSavingRef.current = false;
            if (pendingRef.current) {
                pendingRef.current = false;
                void runSave();
            }
        }
    }, []);

    // SAVE2. I due timer (quiete e tetto) stanno in `layoutAutosaveScheduler`, che
    // e' testabile senza React — nel repo non ci sono jsdom ne' `@testing-library`,
    // e aggiungerli sarebbe una dipendenza nuova. Uno scheduler per montaggio,
    // creato una volta sola: `runSave` non ha dipendenze, quindi non cambia identita'.
    const schedulerRef = useRef<ReturnType<typeof createLayoutAutosaveScheduler> | null>(null);
    if (schedulerRef.current === null) {
        schedulerRef.current = createLayoutAutosaveScheduler({
            save: () => { void runSave(); },
            debounceMs: AUTOSAVE_DEBOUNCE_MS,
            maxWaitMs: AUTOSAVE_MAX_WAIT_MS,
        });
    }

    const scheduleLayoutSave = useCallback(() => { schedulerRef.current!.schedule(); }, []);

    // SAVE2 — i bordi della finestra allargata, e il flush-on-unmount, in un solo
    // effetto. Il disarmo che `installAutosaveEdgeGuards` ritorna toglie i listener
    // E svuota l'attesa: e' la stessa rete che il cleanup di prima faceva da solo,
    // piu' `visibilitychange` e `pagehide`. Il perche' di ciascuno sta sul modulo.
    useEffect(() => installAutosaveEdgeGuards(schedulerRef.current!), []);

    return { scheduleLayoutSave };
}
