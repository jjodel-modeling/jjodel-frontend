/**
 * La freschezza di un esito di validazione, e il ritiro che le va insieme (R-VAL-18).
 *
 * ── LA REGOLA ───────────────────────────────────────────────────────────────
 *
 * Un pallino di validazione sul canvas non e' mai vecchio: se non se ne puo' garantire
 * la freschezza, non c'e'. La validazione gira **a comando**, quindi il pallino racconta
 * l'ultima esecuzione e invecchia appena il modello cambia — un rosso su un'istanza
 * appena sistemata afferma sul modello di adesso un verdetto calcolato su quello di
 * prima, e lo fa a colori in mezzo al diagramma.
 *
 * ── IL RITIRO E LA DICHIARAZIONE SONO UNA TRANSIZIONE SOLA ──────────────────
 *
 * E' il motivo per cui vivono nello stesso modulo, e `markStaleIfFresh` fa **entrambe**
 * le cose. Il ritiro da solo sarebbe un difetto: l'assenza di pallini e' indistinguibile
 * da un modello validato e pulito, cioe' la malattia di R-VAL-14 e R-VAL-17 un piano
 * piu' in la'. Separarli in due moduli, o in due chiamate che un chiamante deve
 * ricordarsi di fare in coppia, e' precisamente il modo in cui quella malattia
 * ritornerebbe.
 *
 * Si RITIRA (`clearProblem`), non si marca risolto: `markResolved` accende il verde con
 * il suo transitorio, cioe' direbbe «l'hai sistemata» quando la verita' e' «non l'ho
 * piu' controllata». E non si marca vecchio per voce: paga in `formDiagnostics.ts:85`,
 * che conta ogni voce non risolta e non c'entra con la validazione, e introduce un
 * secondo vocabolario di pallino per uno stato transitorio che sparira' quando arrivera'
 * la rivalutazione automatica (spec §9).
 *
 * ── TRE STATI, IN UN POSTO SOLO E MAI PER NODO ──────────────────────────────
 *
 *   never  — mai validato in questa sessione. Non e' «pulito».
 *   fresh  — validato, N violazioni, e il modello non e' cambiato da allora.
 *   stale  — non validato dall'ultima modifica. I pallini sono stati ritirati.
 *
 * La dichiarazione e' UNA, e sta accanto al comando che la produce. Mai sul nodo: un
 * pallino grigio per nodo sarebbe il vocabolario doppio che si e' appena scartato.
 *
 * ── LA FIRMA COPRE MODELLO E REGOLE ─────────────────────────────────────────
 *
 * Cambiare il corpo di una regola invalida quanto cambiare il modello. Una firma sul
 * solo modello lascerebbe in piedi pallini che rispondono a una regola che non esiste
 * piu': R-VAL-17 un piano piu' in la'.
 *
 * La firma si prende **al momento della corsa** e si conserva qui (`noteValidationRun`).
 * Ricostruirla al primo render successivo lascerebbe aperta una finestra fra la corsa e
 * quel render, e una modifica caduta li' dentro non sarebbe mai vista.
 */

import { clearValidationProblems } from './validationToProblems';

export type ValidationFreshness =
    | { status: 'never' }
    | { status: 'fresh'; violationCount: number; signature: string }
    | { status: 'stale' };

const NEVER: ValidationFreshness = Object.freeze({ status: 'never' });
const STALE: ValidationFreshness = Object.freeze({ status: 'stale' });

/** Per modello: due tab aperte non si rubano la dichiarazione a vicenda, come il
 *  registro dei problemi non si ruba le voci (`ownerModelId`). */
const byModel = new Map<string, ValidationFreshness>();

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
    for (const l of listeners) l();
}

function set(modelId: string, next: ValidationFreshness): void {
    const prev = byModel.get(modelId) ?? NEVER;
    if (prev === next) return;
    byModel.set(modelId, next);
    notify();
}

// --- La firma -----------------------------------------------------------------

/**
 * La firma del contenuto da cui un esito dipende: le istanze e i loro slot, il
 * metamodello che ne decide la catena di classi, e le regole.
 *
 * La forma ricalca quella di `useConformance` (`model/conformance/useConformance.ts:45`)
 * perche' i due sottosistemi dipendono quasi dalle stesse cose, e non la importa perche'
 * quella e' inline dentro un hook con un debounce e un risultato propri: estrarla
 * sarebbe una modifica a un file fuori dal perimetro. La divergenza voluta e' in due
 * punti, ed e' additiva:
 *
 *   - `name` sugli elementi M1 e M2, che la conformance non guarda e una regola si':
 *     un corpo legge `self.name`, e `State.instances` risolve la classe per nome.
 *   - le entita' della validazione, che la conformance non conosce affatto.
 *
 * Si scandisce per `className` e non per l'id fisso del viewpoint di default: R-VAL-2
 * vuole piu' viewpoint di validazione, e una firma che ne conoscesse uno solo li
 * mancherebbe in silenzio appena arrivano.
 *
 * PURA sull'`idlookup`: nessun import del barrel, quindi provabile in ambiente `node`.
 */
export function buildValidationSignature(idlookup: Record<string, unknown> | undefined): string {
    if (!idlookup) return '';
    const ptrs = (v: unknown): string => (Array.isArray(v) ? v.join(',') : '');
    let sig = '';
    for (const id in idlookup) {
        const raw = idlookup[id] as Record<string, unknown> | undefined;
        if (!raw) continue;
        switch (raw.className) {
            case 'DObject':
                sig += `o${id}=${raw.instanceof ?? ''},${raw.name ?? ''};`;
                break;
            case 'DValue':
                // JSON.stringify e non join: un valore che contiene una virgola non deve
                // poter impersonare due valori distinti.
                sig += `v${id}=${Array.isArray(raw.values) ? JSON.stringify(raw.values) : (raw.values ?? '')};`;
                break;
            case 'DClass':
                sig += `c${id}=${raw.name ?? ''},${raw.abstract ?? ''},${ptrs(raw.attributes)}|${ptrs(raw.references)}|${ptrs(raw.extends)};`;
                break;
            case 'DAttribute':
                sig += `a${id}=${raw.name ?? ''},${raw.type ?? ''},${raw.lowerBound ?? ''},${raw.upperBound ?? ''};`;
                break;
            case 'DReference':
                sig += `r${id}=${raw.name ?? ''},${raw.type ?? ''},${raw.lowerBound ?? ''},${raw.upperBound ?? ''};`;
                break;
            case 'DEnumerator':
                sig += `e${id}=${raw.name ?? ''},${ptrs(raw.literals)};`;
                break;
            case 'DEnumLiteral':
                sig += `l${id}=${raw.name ?? ''};`;
                break;
            case 'DValidationViewpoint':
                sig += `V${id}=${ptrs(raw.rules)};`;
                break;
            case 'DValidationRule':
                // Ogni campo che il valutatore legge (`collectValidationRules`): cambiarne
                // uno cambia l'esito, e quindi invalida i pallini.
                sig += `R${id}=${raw.name ?? ''},${raw.context ?? ''},${raw.enabled !== false ? '1' : '0'},${JSON.stringify(raw.body ?? '')},${JSON.stringify(raw.message ?? '')};`;
                break;
            default:
                break;
        }
    }
    return sig;
}

// --- Le transizioni -----------------------------------------------------------

/** Un giro di Validate e' andato a buon fine. `signature` e' quella dello stato che il
 *  giro ha guardato, non quella di un momento successivo. */
export function noteValidationRun(modelId: string, violationCount: number, signature: string): void {
    set(modelId, { status: 'fresh', violationCount, signature });
}

/**
 * La transizione che la regola descrive: i pallini si ritirano E la superficie lo dice.
 * Non fa nulla se non c'era niente di fresco da invalidare — un modello mai validato
 * resta «mai validato», che e' la verita', e uno gia' stale non ha piu' voci da togliere.
 *
 * @returns `true` se ha invalidato qualcosa. Serve alla sonda, non alla UI.
 */
export function markStaleIfFresh(modelId: string): boolean {
    const cur = byModel.get(modelId);
    if (!cur || cur.status !== 'fresh') return false;
    clearValidationProblems(modelId);
    set(modelId, STALE);
    return true;
}

/**
 * Riporta il modello a «mai validato», ritirandone le voci.
 *
 * Due chiamanti: l'editor che si smonta — mentre non e' montato nessuno sorveglia la
 * firma, quindi la freschezza non e' garantita e per R-VAL-18 il pallino non c'e' — e il
 * comando che non ha potuto guardare (nessun progetto, contesto non costruibile), che
 * non e' un modello valido e non deve sembrarlo.
 */
export function resetFreshness(modelId: string): void {
    clearValidationProblems(modelId);
    set(modelId, NEVER);
}

// --- Lettura ------------------------------------------------------------------

export function getFreshness(modelId: string | undefined): ValidationFreshness {
    if (!modelId) return NEVER;
    return byModel.get(modelId) ?? NEVER;
}

export function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

/** Solo per i test: lo stato e' module-level e un test che ereditasse quello del
 *  precedente misurerebbe l'ordine del file. */
export function __resetAllFreshnessForTests(): void {
    byModel.clear();
}
