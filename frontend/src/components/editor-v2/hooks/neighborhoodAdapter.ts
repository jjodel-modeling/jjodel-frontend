/**
 * neighborhoodAdapter — la meta' IMPURA del vicinato: «Open in canvas» (slice 13a).
 *
 * Una funzione sola, e vive fuori da `neighborhoodDraw.ts` per la ragione di
 * sempre: qui si tocca il barrel del joiner e il `DockManager`, la' no, e il walk
 * deve restare caricabile sotto node.
 *
 * ── Perche' non basta emettere l'evento ───────────────────────────────────────
 *
 * `SELECT_NODE` esiste ed e' consumato da `EditorV2` (`jjodel:selectNode`), che
 * confronta il `nodeId` ricevuto con l'id dei nodi React Flow. Quell'id, per
 * un'istanza, e' l'id del VERTICE (`jjomTransformers.ts`, `id: vertex.id`), non
 * quello del DObject: emettere l'id dell'oggetto significa confrontare due spazi
 * di id diversi e non selezionare niente. Misurato il 2026-08-31 e registrato in
 * `docs/discovery/discovery_2026-08-31_vicinato_manager_13a.md` §6 — dove sta
 * anche il reperto collaterale: l'unico altro emettitore, la Tree View, manda
 * proprio l'id del DObject. Non e' toccato qui (Regola 1).
 *
 * ── Perche' c'e' un'attesa, e perche' aspetta DUE cose ───────────────────────
 *
 * Se il canvas di quel modello non e' mai stato aperto, i vertici degli oggetti
 * NON esistono ancora: li crea `useJjomSync` allo Step 2, al mount dell'editor.
 * Quindi il vertice si cerca DOPO aver aperto il tab.
 *
 * Ma il vertice nello store non basta, ed e' il reperto che ha corretto la prima
 * stesura di questa slice. Misurato dal click (`_tmp_13a_race.ts`, 2026-08-31):
 * il DVertex compare a **532 ms**, il nodo React Flow entra nel DOM a **949 ms**,
 * e un evento emesso nel mezzo va PERDUTO — `EditorV2` marca `selected` su una
 * lista di nodi che ancora non contiene quello, e la lista che arriva dopo nasce
 * deselezionata. Un dispaccio tardivo (misurato a 3.2 s) attacca invece sempre.
 *
 * Quindi si aspetta il nodo, non il vertice: `.react-flow__node[data-id=…]`, che
 * e' l'attributo con cui React Flow marca ogni nodo montato. E' una lettura del
 * DOM da codice d'applicazione, ed e' deliberata: l'alternativa senza di essa e'
 * una raffica di dispacci alla cieca, che rifarebbe partire l'animazione del
 * viewport a ogni colpo. Cosi' il dispaccio e' UNO.
 *
 * Alla scadenza del tetto si tenta comunque una volta e poi si rinuncia in
 * silenzio: il tab e' aperto sul modello giusto, che e' meta' del gesto, e un
 * errore su una navigazione riuscita a meta' sarebbe rumore.
 */

import { LModel, store } from '../../../joiner';
import DockManager from '../../abstract/DockManager';
import { JjodelEvents } from '../../../events/registry';
import { vertexOfObject } from './neighborhoodDraw';

/** Quanto si aspetta che il canvas crei i vertici del modello appena aperto. */
export const OPEN_IN_CANVAS_TIMEOUT_MS = 2000;
/** Ogni quanto si riprova nel frattempo. */
export const OPEN_IN_CANVAS_POLL_MS = 100;

/**
 * Apre il canvas del modello e vi seleziona l'istanza.
 *
 * `open2` e' la stessa via che usa il progetto per aprire un modello (attiva il
 * tab se e' gia' aperto, e dispatcha `EDITOR_TYPE_CHANGE`): il riquadro non ne
 * apre uno suo.
 *
 * Ritorna `false` solo quando il modello non risolve — cioe' quando non c'e'
 * niente da aprire. La selezione, che e' asincrona per costruzione, non entra nel
 * valore di ritorno.
 */
export async function openInCanvas(modelId: string, objectId: string): Promise<boolean> {
    if (!modelId || !objectId) return false;

    let model: LModel | null = null;
    try {
        model = LModel.fromPointer(modelId) as LModel;
    } catch {
        model = null;
    }
    if (!model) return false;

    await DockManager.open2(model);

    const deadline = Date.now() + OPEN_IN_CANVAS_TIMEOUT_MS;
    const select = (vertexId: string) => {
        window.dispatchEvent(new CustomEvent(JjodelEvents.SELECT_NODE, {
            detail: { nodeId: vertexId, modelId },
        }));
    };
    const attempt = () => {
        const vertexId = vertexOfObject(store.getState()?.idlookup, modelId, objectId);
        const mounted = vertexId
            ? !!document.querySelector(`.react-flow__node[data-id="${CSS.escape(vertexId)}"]`)
            : false;
        if (vertexId && mounted) { select(vertexId); return; }
        if (Date.now() < deadline) { setTimeout(attempt, OPEN_IN_CANVAS_POLL_MS); return; }
        // Scaduto: un ultimo tentativo alla cieca, che costa un evento e a volte
        // arriva comunque, e poi silenzio.
        if (vertexId) select(vertexId);
    };
    attempt();
    return true;
}
