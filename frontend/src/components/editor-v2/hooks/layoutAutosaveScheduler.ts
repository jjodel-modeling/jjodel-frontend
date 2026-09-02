/**
 * layoutAutosaveScheduler — il quando dell'autosave del layout, senza React.
 *
 * SAVE2. La logica dei due timer vive qui e non dentro `useLayoutAutosave` per una
 * ragione operativa: nel repo non ci sono ne' jsdom ne' `@testing-library`
 * (`package.json`, e il commento di `extendedWidgets.test.ts:18` che l'aveva gia'
 * misurato), e aggiungerne uno sarebbe una dipendenza nuova. Un hook non e' quindi
 * eseguibile in test, mentre questo modulo lo e' sotto `vi.useFakeTimers()`: le
 * asserzioni contano le CHIAMATE a `save`, non l'effetto del salvataggio.
 *
 * Nient'altro si e' spostato. La preferenza `autosaveLayout`, la guardia di
 * concorrenza e la chiamata a `ProjectsApi.save` restano nell'hook: qui dentro
 * `save` e' una funzione qualunque e questo modulo non sa cosa faccia.
 */

export interface LayoutAutosaveScheduler {
    /** Un gesto e' avvenuto: rimanda la scadenza di quiete, e arma il tetto se
     *  questo e' il primo gesto della raffica. */
    schedule(): void;
    /** Esegue subito il salvataggio in attesa, se ce n'e' uno, e disarma tutto.
     *  Ritorna se c'era qualcosa in attesa. */
    flush(): boolean;
    /** Disarma tutto SENZA salvare. */
    cancel(): void;
    /** C'e' un salvataggio in attesa? */
    isPending(): boolean;
}

export function createLayoutAutosaveScheduler(opts: {
    save: () => void;
    debounceMs: number;
    maxWaitMs: number;
}): LayoutAutosaveScheduler {
    let idle: ReturnType<typeof setTimeout> | null = null;
    let cap: ReturnType<typeof setTimeout> | null = null;

    const disarm = (): void => {
        if (idle !== null) { clearTimeout(idle); idle = null; }
        if (cap !== null) { clearTimeout(cap); cap = null; }
    };

    const fire = (): void => { disarm(); opts.save(); };

    return {
        schedule(): void {
            if (idle !== null) clearTimeout(idle);
            idle = setTimeout(fire, opts.debounceMs);
            // Il tetto si arma sul PRIMO gesto della raffica e NON si riarma sui
            // successivi: cio' che deve restare limitato e' il tempo trascorso dal
            // primo gesto non salvato, non quello dall'ultimo — quello lo governa
            // gia' la scadenza di quiete qui sopra. Riarmarlo a ogni gesto lo
            // renderebbe un secondo debounce, cioe' inerte.
            if (cap === null) cap = setTimeout(fire, opts.maxWaitMs);
        },
        flush(): boolean {
            const pending = idle !== null;
            disarm();
            if (pending) opts.save();
            return pending;
        },
        cancel(): void { disarm(); },
        isPending(): boolean { return idle !== null; },
    };
}

/**
 * Registra i bordi della finestra di quiete e ritorna il disarmo.
 *
 * SAVE2. Sta qui e non dentro l'hook per la stessa ragione dei due timer: cosi' e'
 * eseguibile in test con un `window`/`document` finti, e la mutazione «tolgo il
 * flush allo smontaggio» diventa rossa invece di restare invisibile a una regex.
 *
 * I bordi sono tre, e sono la contropartita di una finestra che passa da 1 s a 15 s:
 *
 *   - `visibilitychange` con la pagina che va in background;
 *   - `pagehide`, l'ultimo evento affidabile prima che la scheda se ne vada (piu' di
 *     `beforeunload`, che su mobile e col bfcache puo' non arrivare);
 *   - il DISARMO stesso, cioe' lo smontaggio del componente: svuota l'attesa invece
 *     di buttarla via.
 *
 * Limite dichiarato: `save` puo' essere asincrono. Offline la scrittura e'
 * `localStorage`, sincrona, e arriva; online e' una `PUT`, e su `pagehide` il browser
 * puo' chiudere prima che parta. L'ultima rete resta il prompt «Unsaved changes» del
 * browser, che continua a scattare perche' il salvataggio silenzioso non azzera
 * `U.isProjectModified` (DIRTY1).
 */
export function installAutosaveEdgeGuards(
    scheduler: LayoutAutosaveScheduler,
    env?: { win?: any; doc?: any },
): () => void {
    const win = env?.win ?? (typeof window !== 'undefined' ? window : undefined);
    const doc = env?.doc ?? (typeof document !== 'undefined' ? document : undefined);

    const onVisibility = (): void => { if (doc?.visibilityState === 'hidden') scheduler.flush(); };
    const onPageHide = (): void => { scheduler.flush(); };

    doc?.addEventListener?.('visibilitychange', onVisibility);
    win?.addEventListener?.('pagehide', onPageHide);

    return () => {
        doc?.removeEventListener?.('visibilitychange', onVisibility);
        win?.removeEventListener?.('pagehide', onPageHide);
        // Flush-on-unmount. NON e' un dettaglio del cleanup: e' il gesto fatto
        // appena prima di chiudere il tab, che senza questa riga muore in attesa.
        scheduler.flush();
    };
}
