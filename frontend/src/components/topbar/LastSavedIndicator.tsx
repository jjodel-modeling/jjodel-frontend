import React from 'react';
import { U } from '../../joiner';
import { formatLastSavedLabel, useLastSaved } from '../../common/libraries/lastSaved';

/**
 * DOC2 — l'indicatore dell'ultimo salvataggio, in topbar.
 *
 * PERCHE' QUI E NON DOVE SAVE2 L'AVEVA MESSO. SAVE2 l'ha messo in testata al Data
 * Manager, accanto a «Save project», che e' dove sta l'azione di salvataggio
 * esplicito. Ma l'autosave lo innesca il CANVAS: si trascinano i nodi in v2-flow, e
 * con la notifica rimossa (`4bc765e85`) e l'idle a 15 s chi lavora sul canvas non
 * ha piu' alcun segnale — ne' toast ne' indicatore — perche' l'unico posto dove lo
 * stato si legge e' un'altra tab. Lo stato di salvataggio e' del PROGETTO, non di
 * una vista: la sua sede e' la barra che vale per tutte le tab.
 *
 * UNA SOLA RESA. Il componente e' montato una volta sola, nella topbar. Non e'
 * duplicato in testata al Data Manager: due copie dello stesso stato in due barre
 * divergono al primo bug, e la seconda copia non aggiungeva niente che questa non
 * dica gia', da un posto che si vede da ogni tab.
 *
 * NIENTE DATO NUOVO. `lastSaved.ts` e' runtime puro ed emette gia'
 * `JjodelEvents.PROJECT_SAVED` a ogni salvataggio riuscito, silenzioso incluso:
 * questo componente e' il consumatore di quell'evento, non una seconda fonte di
 * verita'. Il tempo relativo lo fa `formatRelativeTime` di `types/activity`, il
 * tick e' quello di SAVE2, e listener e tick si spengono allo smontaggio
 * (`subscribeLastSaved`).
 *
 * Il dirty NON e' un flag nuovo: e' `U.isProjectModified`, lo stesso static che
 * governa il prompt «Unsaved changes». Essendo uno static non sottoscrivibile lo
 * si rilegge al render e a ogni tick, quindi il passaggio allo stato sporco ha un
 * ritardo di al piu' `LAST_SAVED_TICK_MS`.
 *
 * Registro visivo: testo di stato, non un controllo. Sentence case, slate 11px,
 * nessuno sfondo, nessuna emoji, nessun colore semantico — un salvataggio riuscito
 * e' lo stato normale, non un «successo». Assente finche' in questa sessione non e'
 * successo niente da raccontare.
 */
export function LastSavedIndicator(): React.ReactElement | null {
    const { savedAt, tick } = useLastSaved();
    void tick;                                    // il tick e' la dipendenza vera del testo relativo
    const label = formatLastSavedLabel(savedAt, !!(U as any).isProjectModified);
    if (!label) return null;
    return <span className="appbar-last-saved" title="When the project was last persisted">{label}</span>;
}

export default LastSavedIndicator;
