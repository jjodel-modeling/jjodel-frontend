/**
 * neighborhoodDraw — la meta' importless dell'adapter del VICINATO (slice 13a).
 *
 * Stessa divisione, stessa ragione, di `outlineDraw.ts`, `multiDraw.ts`,
 * `createDraw.ts` e `shapeDraw.ts` accanto (R-FORM-5): i file `*Adapter.ts`
 * importano il barrel del joiner, il barrel arriva a monaco, monaco dereferenzia
 * `window` al momento dell'import, e un test unitario che toccasse qualcosa di
 * loro morirebbe all'import. Qui tutto e' funzione pura di un `idlookup` piatto.
 *
 * ── Niente e' camminato due volte ─────────────────────────────────────────────
 *
 * Il vicinato non ha un walk proprio: e' la COMPOSIZIONE di quattro puri che
 * esistevano gia' per altre superfici, piu' la ladder per il valore saliente.
 *
 *  - `createDraw.ownerOf` — l'owner a un salto; `null` vuol dire «il modello lo
 *    possiede direttamente», che e' anche «nessun nodo owner da disegnare»;
 *  - `createDraw.filledSlotValues` — i valori di uno slot senza i buchi e SENZA
 *    il filtro di vivezza, che e' cio' che fa comparire il nodo `broken` invece
 *    di farlo sparire (stessa scelta di `outlineDraw`);
 *  - `shapeDraw.referencedBy` — la risalita `pointedBy -> DValue -> father` della
 *    slice 2b, che porta gia' `featureKey` e `composition`: la chiave sull'arco e
 *    il filtro «un owner non e' un referrer» sono suoi, non riscritti qui;
 *  - `irReadCtx.makeDrawReadCtx` — la regola del nome (slot identita', poi
 *    `DObject.name`, poi `initialName`), cosi' il riquadro chiama un'istanza come
 *    la chiamano tabella, outline e breadcrumb;
 *  - `instanceTable.slotShapeFor` + `valueRenderer.detectValueRenderer` — UNA
 *    decisione per il valore saliente, la stessa della cella (R-FORM-15). Una
 *    seconda lettura degli stati del contratto qui sarebbe esattamente la
 *    divergenza che quella ratifica ha chiuso.
 *
 * ── Perche' il vicinato di due istanze della stessa metaclasse e' diverso ─────
 *
 * Perche' e' PER-PUNTATORE, non per tipo: `referencedBy` legge l'indice
 * `pointedBy` dell'istanza, quindi due `Config` sorelle riferite da due `Sensor`
 * diversi hanno vicinati diversi. Un walk «piatto» (tutte le istanze che citano
 * quella metaclasse) darebbe a entrambe lo stesso disegno, ed e' il controllo che
 * il test tiene.
 *
 * ── Un solo nodo per id ───────────────────────────────────────────────────────
 *
 * Un'istanza puo' essere insieme owner, bersaglio di una ref uscente e sorgente
 * di una entrante. Il NODO e' uno solo — con il primo ruolo in ordine
 * owner > uscente > entrante — e gli ARCHI restano tutti: e' il grafo a dire che
 * il legame e' doppio, non due scatole con lo stesso nome.
 */

import { makeDrawReadCtx } from '../viewpoint/ir/irReadCtx';
import { filledSlotValues, ownerOf } from './createDraw';
import { referencedBy } from './shapeDraw';
import { slotShapeFor } from '../../abstract/tabs/instanceTable';
import { detectValueRenderer } from '../nodes/valueRenderer';
import type {
    ClassShape,
    MetamodelShape,
    NeighborEdge,
    NeighborNode,
    NeighborValue,
    Neighborhood,
} from '../../../jjform';

type Idlookup = Record<string, any>;

/** La feature di contenimento in cui l'owner tiene questo oggetto, piu' l'owner.
 *  Non e' un secondo walk: `ownerOf` decide chi e' l'owner, e questa rilegge lo
 *  STESSO slot `father` per il nome della feature — la chiave che finisce
 *  sull'arco. `featureKey` e' null solo se lo slot non risolve la sua
 *  `DReference`, che e' uno stato di modello corrotto e non un caso normale. */
export function ownerLinkOf(
    idlookup: Idlookup,
    objectId: string,
): { ownerId: string; featureKey: string | null } | null {
    const ownerId = ownerOf(idlookup, objectId);
    if (!ownerId) return null;
    const slot = idlookup?.[objectId]?.father;
    const feature = typeof slot === 'string' ? idlookup[idlookup[slot]?.instanceof] : null;
    return { ownerId, featureKey: typeof feature?.name === 'string' ? feature.name : null };
}

/**
 * Il valore saliente di un'istanza: il PRIMO attributo che ne ha uno.
 *
 * Ordine della shape, non alfabetico, per la ragione di sempre: il metamodello
 * dichiara le sue feature in un ordine, e riordinarle qui farebbe litigare il
 * riquadro con la form accanto. Lo slot identita' (`name`) e' saltato — e' gia'
 * il titolo del nodo, e stamparlo due volte non e' informazione.
 *
 * `dash` (slot vuoto) non e' un valore e si salta; `missingRequired` SI', perche'
 * un required rimasto senza valore e' uno stato del contratto e il riquadro lo
 * dipinge col token della tabella. La classificazione arriva dalla ladder: qui
 * non si decide niente.
 */
export function salientValue(
    idlookup: Idlookup,
    instanceId: string,
    cls: ClassShape | null | undefined,
    shape: MetamodelShape,
): NeighborValue | undefined {
    for (const attr of cls?.attrs ?? []) {
        if (attr.key === 'name') continue;
        const { slot } = slotShapeFor(idlookup, instanceId, attr, shape);
        const decision = detectValueRenderer(slot);
        if (decision.kind === 'dash') continue;
        if (decision.kind === 'missingRequired') return { key: attr.key, text: '', missing: true };
        const text = (slot.values ?? []).join(', ');
        if (!text) continue;
        return { key: attr.key, text, missing: false };
    }
    return undefined;
}

/**
 * Il vicinato di un'istanza: owner (un livello su), refs uscenti (un salto) e
 * referenced-by entranti (un salto), come nodi e archi.
 *
 * `shape` e' cio' che dice quali feature sono riferimenti e quali contenimento.
 * Un'istanza la cui metaclasse manca dalla shape rende un nodo senza uscenti
 * invece di sparire: un metamodello mezzo caricato non deve cancellare il
 * soggetto dal suo stesso riquadro.
 *
 * I CONTENUTI non ci sono, ed e' deliberato: i figli sono l'outline (10b), che li
 * mostra tutti e in profondita'. Qui c'e' un salto, e la domanda e' «chi tocca
 * questa istanza».
 */
export function neighborhoodOf(
    idlookup: Idlookup,
    subjectId: string,
    shape: MetamodelShape | null,
): Neighborhood {
    const empty: Neighborhood = { subjectId, nodes: [], edges: [] };
    if (!idlookup || !subjectId) return empty;
    if (idlookup[subjectId]?.className !== 'DObject') return empty;

    const ctx = makeDrawReadCtx(idlookup);
    const classes = shape?.classes ?? {};
    const nodes: NeighborNode[] = [];
    const edges: NeighborEdge[] = [];
    const seen = new Set<string>();

    const classOf = (id: string): ClassShape | null => {
        const name = ctx.getMetaclassName(id);
        return name ? classes[name] ?? null : null;
    };

    /** Aggiunge un nodo una volta sola: il primo ruolo che lo raggiunge vince. */
    const addNode = (id: string, role: NeighborNode['role']): void => {
        if (seen.has(id)) return;
        seen.add(id);
        if (idlookup[id]?.className !== 'DObject') {
            nodes.push({ id, name: '', cls: '', kind: 'broken', role });
            return;
        }
        const cls = classOf(id);
        nodes.push({
            id,
            name: ctx.getName(id) ?? '',
            cls: ctx.getMetaclassName(id) ?? '',
            kind: 'object',
            role,
            value: shape ? salientValue(idlookup, id, cls, shape) : undefined,
        });
    };

    addNode(subjectId, 'subject');

    // Owner: un livello, e null vuol dire radice del modello.
    const owner = ownerLinkOf(idlookup, subjectId);
    if (owner) {
        addNode(owner.ownerId, 'owner');
        edges.push({ source: owner.ownerId, target: subjectId, featureKey: owner.featureKey, kind: 'owner' });
    }

    // Uscenti: le sole reference NON di contenimento della metaclasse del
    // soggetto. Il contenimento e' l'owner dei figli, e i figli sono dell'outline.
    const subjectCls = classOf(subjectId);
    for (const ref of subjectCls?.refs ?? []) {
        for (const value of filledSlotValues(idlookup, subjectId, ref.key)) {
            addNode(value, 'outgoing');
            edges.push({ source: subjectId, target: value, featureKey: ref.key, kind: 'reference' });
        }
    }

    // Entranti: la risalita di 2b, senza il containment — «an owner is not a
    // referrer», e l'owner ha gia' il suo arco. Due puntatori dalla stessa
    // istanza attraverso la stessa feature (slot multivalore) sono UN arco: il
    // disegno non distingue due archi sovrapposti, e la posizione nello slot e'
    // una domanda della form, non del riquadro.
    const incomingSeen = new Set<string>();
    for (const ref of referencedBy(idlookup, subjectId)) {
        if (ref.composition) continue;
        const key = ref.instanceId + '→' + ref.featureKey;
        if (incomingSeen.has(key)) continue;
        incomingSeen.add(key);
        addNode(ref.instanceId, 'incoming');
        edges.push({ source: ref.instanceId, target: subjectId, featureKey: ref.featureKey, kind: 'reference' });
    }

    return { subjectId, nodes, edges };
}

/**
 * Il VERTICE che rende un oggetto sul canvas, o null.
 *
 * Serve a «Open in canvas» e solo a quello. L'id di un nodo React Flow e' l'id
 * del VERTICE (`jjomTransformers.ts`, `id: vertex.id`), non quello del DObject:
 * `SELECT_NODE` va emesso con questo, o il canvas confronta due spazi di id
 * diversi e non seleziona niente.
 *
 * Il vertice si riconosce da `model === objectId`, che e' esattamente cio' che
 * `useJjomSync` scrive creandolo (`DVertex.new(0, objId, graphId, …)`), e il
 * grafo si controlla perche' due grafi possono rendere lo stesso modello.
 *
 * UNA scansione dell'`idlookup`, e gira solo al click: il resto del riquadro e'
 * letture d'indice.
 */
export function vertexOfObject(idlookup: Idlookup, modelId: string, objectId: string): string | null {
    if (!idlookup || !modelId || !objectId) return null;
    for (const id in idlookup) {
        const d = idlookup[id];
        if (!d || d.className !== 'DVertex') continue;
        if (d.model !== objectId) continue;
        const graph = typeof d.graph === 'string' ? idlookup[d.graph] : null;
        if (graph?.model !== modelId) continue;
        return typeof d.id === 'string' ? d.id : id;
    }
    return null;
}
