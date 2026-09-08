/**
 * Il terzo produttore del registro dei problemi: le violazioni delle regole definite
 * dall'utente (R-VAL, Step 3).
 *
 * ── NON E' UN «…ProblemSync» ────────────────────────────────────────────────
 *
 * Gli altri due produttori sono componenti montati che osservano un hook e riscrivono a
 * ogni cambio (`UniquenessProblemSync` su una firma `useSelector`,
 * `ConformanceProblemSync` sul risultato di `useConformance`, con 500 ms di debounce).
 * Questo no: e' una **funzione**, e scrive solo quando l'utente lancia il comando.
 * Nessun debounce, nessuna rivalutazione automatica, nessun `AFTER_TRANSACTION` — il
 * costo della rivalutazione totale va misurato prima di renderla automatica (spec §9), e
 * finche' resta a comando quella misura non e' bloccante.
 *
 * Non c'e' quindi niente da montare accanto agli altri due in `EditorV2.tsx`, e infatti
 * quel file non e' toccato.
 *
 * ── SOLO LE VIOLAZIONI ENTRANO NEL REGISTRO (R-VAL-14) ──────────────────────
 *
 * Le non valutabili **non** diventano voci: sono un contatore che la superficie dichiara,
 * non problemi del modello. Un modello incompleto ne produce a decine, e riversarle nel
 * registro trasformerebbe la diagnostica in rumore proprio quando serve leggerla. Lo
 * stesso vale per i difetti delle regole, che stanno sul canale di authoring (R-VAL-7):
 * il registro non e' mai il posto dove si scopre che una regola e' scritta male.
 *
 * ── L'ANCORAGGIO E' L'ID DELL'ELEMENTO ──────────────────────────────────────
 *
 * `nodeId` e' l'id del **DObject**, non quello del DVertex. `ConformanceProblemSync`
 * registra due voci per oggetto — una per l'id dell'oggetto, che accende il triangolo
 * dell'albero, e una per l'id del vertice risolto, che accende il pallino sul canvas —
 * perche' quelle due superfici indicizzano il registro su spazi di id diversi. Qui la
 * seconda non serve: lo scheletro **non mette indicatori sul canvas**, e alla lista
 * basta l'id dell'elemento per il salto. Registrare anche l'id del vertice
 * significherebbe accendere un indicatore che nessuno ha progettato.
 */

import {
    clearProblem, getProblemIdsOwnedBy, markResolved, registerProblem,
    type NodeProblem,
} from './registry';
import type { Violation } from '../../../model/validation/validationEvaluator';

const VALIDATION_KIND: NodeProblem['kind'] = 'validation';

/**
 * L'id di una voce. Forma lunga `${kind}:${nodeId}:${ruleId}` e non `${kind}:${nodeId}`:
 * un'istanza puo' violare piu' regole insieme (R-VAL-12, le regole si accumulano e non
 * si sovrascrivono), e la forma corta ne mostrerebbe una sola. E' il caso che il
 * commento di `registry.ts` prevedeva gia' per nome.
 */
export function validationProblemId(nodeId: string, ruleId: string): string {
    return `${VALIDATION_KIND}:${nodeId}:${ruleId}`;
}

/**
 * Riversa nel registro le violazioni di un giro, e ritira quelle del giro precedente
 * **dello stesso modello**.
 *
 * Il ritiro passa da `getProblemIdsOwnedBy(kind, ownerModelId)`, che filtra su `kind` E
 * su `ownerModelId`: le voci degli altri due produttori e quelle di un altro modello
 * aperto sono fuori portata per costruzione. E' l'innesto che la discovery aveva
 * misurato come pulito.
 *
 * Le voci non piu' volute si `markResolved`, non si cancellano: il registro le mostra
 * risolte e le toglie dopo il suo TTL, che su un comando esplicito e' esattamente il
 * riscontro che serve — «questa l'hai sistemata». La cancellazione secca resta per il
 * ritiro totale.
 *
 * @returns quante voci sono state registrate.
 */
export function publishValidationProblems(
    ownerModelId: string,
    violations: readonly Violation[],
): number {
    const desired = new Set<string>();
    for (const v of violations) {
        const id = validationProblemId(v.instanceId, v.ruleId);
        desired.add(id);
        registerProblem({
            id,
            nodeId: v.instanceId,
            kind: VALIDATION_KIND,
            severity: 'error',   // nello scheletro ogni violazione e' un error
            title: v.ruleName || 'Validation',
            description: v.message,
            relatedNodeIds: [],
            ownerModelId,
            createdAt: Date.now(),
        });
    }
    for (const id of getProblemIdsOwnedBy(VALIDATION_KIND, ownerModelId)) {
        if (!desired.has(id)) markResolved(id);
    }
    return desired.size;
}

/** Ritira tutte le voci di validazione di un modello, senza transitorio: serve quando
 *  l'esito precedente non e' piu' vero e non c'e' un giro nuovo che lo dica. */
export function clearValidationProblems(ownerModelId: string): void {
    for (const id of getProblemIdsOwnedBy(VALIDATION_KIND, ownerModelId)) clearProblem(id);
}
