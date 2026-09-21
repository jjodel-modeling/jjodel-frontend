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
 * ── L'ANCORAGGIO E' DOPPIO (R-VAL-18, fetta 1) ──────────────────────────────
 *
 * Due voci per violazione, sotto due id diversi, perche' le superfici del registro
 * indicizzano su spazi di id diversi:
 *
 *   - l'id del **DObject**, che e' quello che la lista del modale usa per il salto e
 *     che il rail delle proprieta' legge (`IRForm.tsx:371`);
 *   - l'id del **DVertex**, che e' l'id del nodo React Flow (`EditorV2.tsx:795-796`) e
 *     quindi quello con cui `NodeProblemIndicator` e' montato: e' il pallino sul canvas.
 *
 * E' lo stesso gesto di `ConformanceProblemSync.tsx:109-115`, e il risolutore e' lo
 * stesso modulo (`vertexResolver.ts`). Nello scheletro c'era la sola voce del DObject,
 * perche' lo scheletro non metteva indicatori sul canvas: qui e' il contrario, il
 * pallino sull'istanza che viola E' la fetta.
 *
 * Il risolutore arriva dal chiamante e non si costruisce qui: serve il `graphId` del
 * grafo aperto, che e' cosa dell'editor. Senza risolutore — nessun grafo aperto, o un
 * oggetto che in quel grafo non ha vertice — resta la sola voce del DObject, e il canvas
 * non si accende perche' non c'e' niente da accendere. Non e' un errore, e' il caso in
 * cui l'istanza non e' disegnata.
 *
 * LIMITE DICHIARATO: un'istanza resa come edge sintetico (object-as-edge, id `irobj_*`)
 * non ha nessun `ObjectNode` e quindi nessun `NodeProblemIndicator`. Nessun id la
 * farebbe accendere: il segnale su un edge e' un'altra superficie, e un altro giro.
 */

import {
    clearProblem, getProblemIdsOwnedBy, markResolved, registerProblem,
    type NodeProblem,
} from './registry';
import type { VertexResolver } from './vertexResolver';
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
 * @param resolveVertex traduce l'id di un DObject in quello del suo DVertex nel grafo
 *        aperto (`vertexResolver.ts`). Omesso, si registra la sola voce del DObject.
 * @returns quante VOCI sono state registrate — con l'ancoraggio doppio sono fino al
 *          doppio delle violazioni, non il loro numero. Il conto delle violazioni sta
 *          nel referto del valutatore, che e' il posto dove ha significato.
 */
export function publishValidationProblems(
    ownerModelId: string,
    violations: readonly Violation[],
    resolveVertex?: VertexResolver,
): number {
    const desired = new Set<string>();
    const register = (nodeId: string, v: Violation): void => {
        const id = validationProblemId(nodeId, v.ruleId);
        desired.add(id);
        registerProblem({
            id,
            nodeId,
            kind: VALIDATION_KIND,
            severity: 'error',   // nello scheletro ogni violazione e' un error
            title: v.ruleName || 'Validation',
            description: v.message,
            relatedNodeIds: [],
            ownerModelId,
            createdAt: Date.now(),
        });
    };

    for (const v of violations) {
        // Superficie della lista e del rail: l'id dell'elemento.
        register(v.instanceId, v);
        // Superficie del canvas: l'id del vertice risolto, quando l'istanza e' disegnata.
        const vertexId = resolveVertex?.(v.instanceId) ?? null;
        if (vertexId && vertexId !== v.instanceId) register(vertexId, v);
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
