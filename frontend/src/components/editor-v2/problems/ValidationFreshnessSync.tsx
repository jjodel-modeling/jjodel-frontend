/**
 * Il sorvegliante della freschezza (R-VAL-18). Montato una volta alla radice di
 * `EditorV2`, accanto agli altri due produttori del registro; non rende niente.
 *
 * ── COSA FA, E QUANDO NON FA NIENTE ─────────────────────────────────────────
 *
 * Confronta la firma viva del contenuto con quella che l'ultimo giro di Validate ha
 * guardato. Se differiscono, chiama `markStaleIfFresh`, che ritira i pallini e lo
 * dichiara — una transizione sola, per costruzione (`validationFreshness.ts`).
 *
 * **La scansione gira solo quando c'e' qualcosa da invalidare.** Se il modello non e'
 * `fresh` — mai validato, o gia' dichiarato non fresco — non ci sono pallini da ritirare
 * e la dichiarazione non deve cambiare, quindi il selettore restituisce la stringa vuota
 * e non attraversa `idlookup`. Prima del primo Validate il costo e' zero, ed e' il caso
 * normale: `useConformance` gia' paga una scansione per azione, e raddoppiarla a vuoto
 * per tutta la sessione sarebbe stato il prezzo peggiore di questa fetta.
 *
 * ── PERCHE' NON SERVE UN «PRIMO GIRO» DA IGNORARE ───────────────────────────
 *
 * La firma di riferimento e' presa **dal comando**, sullo stato che il comando ha
 * guardato, e conservata nella dichiarazione. Quindi qui non c'e' nessuna base da
 * stabilire al montaggio, nessun ref, nessun caso speciale al primo render: c'e' un
 * confronto, e basta. Un componente che si costruisse la base da solo al primo effetto
 * lascerebbe scoperta la finestra fra la corsa e quel render.
 *
 * ── SMONTAGGIO ──────────────────────────────────────────────────────────────
 *
 * Chiudere l'editor riporta il modello a «mai validato» e ne ritira le voci. Non e' una
 * cautela: mentre nessuno sorveglia la firma la freschezza non e' garantita, e per
 * R-VAL-18 un pallino di cui non si garantisce la freschezza non c'e'. Conseguenza
 * accettata e dichiarata: riaprendo la tab l'esito va rilanciato.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import type { DState } from '../../../joiner';
import {
    buildValidationSignature, getFreshness, markStaleIfFresh, resetFreshness, subscribe,
    type ValidationFreshness,
} from './validationFreshness';

interface Props {
    /** Il modello aperto. `undefined` su un canvas senza modello: non c'e' niente da
     *  sorvegliare e il componente resta inerte. */
    modelid: string | undefined;
}

/** La dichiarazione di freschezza di un modello, sottoscritta. Esportata qui perche' la
 *  Toolbar la legge per renderla: il modulo di stato resta puro e senza React. */
export function useValidationFreshness(modelId: string | undefined): ValidationFreshness {
    return useSyncExternalStore(
        subscribe,
        () => getFreshness(modelId),
        () => getFreshness(modelId),
    );
}

export function ValidationFreshnessSync({ modelid }: Props) {
    const freshness = useValidationFreshness(modelid);
    const armed = freshness.status === 'fresh';
    const baseline = freshness.status === 'fresh' ? freshness.signature : '';

    const signature = useSelector((state: DState) =>
        armed ? buildValidationSignature(state?.idlookup) : '');

    useEffect(() => {
        if (!modelid || !armed) return;
        if (signature === baseline) return;
        markStaleIfFresh(modelid);
    }, [modelid, armed, signature, baseline]);

    useEffect(() => {
        if (!modelid) return;
        return () => { resetFreshness(modelid); };
    }, [modelid]);

    return null;
}
