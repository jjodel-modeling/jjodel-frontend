/**
 * lastSaved — quando il progetto e' stato persistito l'ultima volta.
 *
 * SAVE2. Il dato non e' nuovo: `ProjectsApi.save` scrive gia'
 * `dProject.lastModified = Date.now()` a ogni salvataggio, silenzioso incluso
 * (`api/persistance/projects.ts`). Quel valore pero' NON torna in Redux — la sola
 * `SetFieldAction` su `lastModified` sta in `Offline.getAll`, cioe' al caricamento —
 * quindi `project.lastModified` letto dallo store resta fermo al momento in cui il
 * progetto e' stato aperto. Misurato: dopo cinque save silenziosi il valore in
 * `idlookup` e' immutato.
 *
 * Rimetterlo in Redux non e' un'opzione: sarebbe una `SetFieldAction` a ogni
 * autosave, cioe' esattamente il delta di stato che la ratifica del 2026-08-24
 * tiene fuori dal salvataggio silenzioso (un passo di undo invisibile per gesto).
 *
 * Quindi il timestamp vive qui, come `U.isProjectModified` vive su `U`: uno static
 * di runtime, non un campo del modello. La differenza rispetto a `U.isProjectModified`
 * — che il commento di `InstanceManagerTab` segnala come non sottoscrivibile — e' che
 * questo modulo emette un evento a ogni scrittura, quindi l'indicatore si aggiorna
 * quando il salvataggio accade e non solo quando il componente si ridisegna per altro.
 * E' il pattern CustomEvent + `useState` locale di CLAUDE.md §8.7.
 */

import { useEffect, useState } from 'react';
import { JjodelEvents } from '../../events/registry';

/** Epoch ms dell'ultimo salvataggio andato a buon fine in questa sessione, o
 *  `null` se in questa sessione non ne e' ancora andato a buon fine nessuno. */
let lastSavedAt: number | null = null;

export function getLastSavedAt(): number | null { return lastSavedAt; }

/** Chiamata da `ProjectsApi.save` dopo che la persistenza e' riuscita, sia sul
 *  salvataggio esplicito sia su quello silenzioso: l'autosave e' invisibile per
 *  scelta, ed e' proprio per questo che deve restare leggibile da qualche parte. */
export function markProjectSaved(timestamp: number): void {
    lastSavedAt = timestamp;
    // La guardia e' su `dispatchEvent`, non solo su `window`: sotto vitest
    // (`environment: node`) `projects.ts` gira con un `window` stubbato che e' un
    // oggetto vuoto, e un controllo sul solo `typeof window` lo lascerebbe passare.
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent(JjodelEvents.PROJECT_SAVED, { detail: { timestamp } }));
}

/** Azzera il timestamp: il progetto aperto non e' piu' quello salvato. */
export function clearLastSaved(): void {
    lastSavedAt = null;
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent(JjodelEvents.PROJECT_SAVED, { detail: { timestamp: null } }));
}

/** Periodo del tick che rinfresca l'etichetta senza che l'utente faccia nulla.
 *  Un `lastModified` di due minuti fa che continua a dire «just now» e' peggio
 *  che non mostrarlo. 10s e' anche il periodo con cui si ricontrolla il flag di
 *  dirty, che e' uno static non sottoscrivibile: e' il ritardo massimo con cui
 *  l'indicatore passa a «Unsaved changes» per una modifica fatta altrove. */
export const LAST_SAVED_TICK_MS = 10_000;

/**
 * Il timestamp dell'ultimo salvataggio, che si aggiorna da solo: sull'evento di
 * salvataggio e su un tick di `LAST_SAVED_TICK_MS`. Il tick serve al testo
 * relativo («2m ago») piu' che al timestamp, che cambia solo sull'evento.
 *
 * Entrambi si spengono allo smontaggio: nessun timer sopravvive al componente.
 */
export function useLastSaved(): { savedAt: number | null; tick: number } {
    const [savedAt, setSavedAt] = useState<number | null>(lastSavedAt);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const onSaved = () => setSavedAt(lastSavedAt);
        window.addEventListener(JjodelEvents.PROJECT_SAVED, onSaved);
        const id = setInterval(() => { setSavedAt(lastSavedAt); setTick((t) => t + 1); }, LAST_SAVED_TICK_MS);
        return () => {
            window.removeEventListener(JjodelEvents.PROJECT_SAVED, onSaved);
            clearInterval(id);
        };
    }, []);

    return { savedAt, tick };
}
