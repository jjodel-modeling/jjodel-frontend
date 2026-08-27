/**
 * Edge lanes — separazione dei corridoi condivisi da archi diversi.
 *
 * `applyBundleSpread` distanzia i corridoi degli archi che collegano la **stessa
 * coppia di nodi**, con una funzione continua della posizione dell'ancora. Fra coppie
 * diverse non c'era nulla: misurato il 2026-08-27 sul canvas, 44 coppie di segmenti
 * paralleli sotto gli 8px su 95 segmenti, con minimi a 0,00px
 * (`discovery_2026-08-27_2_dense_diagram_routing.md` §4).
 *
 * Questo modulo assegna a ciascun arco un **unico scostamento** del suo corridoio
 * centrale, calcolato guardando tutti gli archi insieme. Due vincoli lo governano:
 *
 * - **Il tratto d'approccio non si tocca.** I primi e gli ultimi `LANE_APPROACH_RUN`
 *   px di ogni arco escono perpendicolari dall'ancora: spostarli staccherebbe la
 *   linea dal punto d'aggancio. Entrano quindi come **ostacoli fissi**, e sono i
 *   corridoi a scansarli.
 * - **L'ordine è deterministico.** Prima la posizione fisica sull'asse trasversale —
 *   la stessa grandezza su cui `computeSidePositions` ordina le ancore, cosi' i
 *   corridoi si annidano invece di incrociarsi — e a parità l'id dell'arco. Nessuno
 *   dei due dipende dall'ordine di rendering, quindi il tracciato non salta fra un
 *   render e l'altro.
 *
 * Puro: niente React, niente ReactFlow, niente DOM.
 */

import { applyWaypoints, avoidNodeRects, computeManhattanPath, getNodeRect, getSideFromHandle, parsePathPoints } from './edgeUtils';
import { computeHandlePositionForNode } from './handlePosition';
import { applyBundleSpread } from '../edges/bundleSpread';
import type { NodePosition } from './portDistribution';

export interface Point {
    x: number;
    y: number;
}

/** Distanza minima fra due segmenti paralleli di archi diversi: e' il criterio. */
export const LANE_MIN_GAP = 8;

/**
 * Passo con cui i pioli della scala si posano: un pixel sopra il criterio.
 *
 * Il criterio chiede `>= 8`, non `> 8`, e la geometria su cui la scala si calcola e'
 * ricostruita, non letta dal DOM: un residuo sub-pixel basta a far scendere una
 * coppia sotto soglia (misurato: 7,86px). Stesso rimedio, e stessa ragione, di
 * `AVOID_LANE` in `avoidNodeRects`.
 */
const LANE_STEP = LANE_MIN_GAP + 1;

/**
 * Lunghezza del tratto d'approccio protetto a ciascun capo. Coincide con la
 * sporgenza minima del router (`MIN_APPROACH_RUN`): è il tratto che deve restare
 * perpendicolare all'ancora e che nessun altro segmento può occupare.
 */
export const LANE_APPROACH_RUN = 16;

/**
 * Sovrapposizione minima, lungo l'asse del segmento, perché due segmenti paralleli
 * contino come «nello stesso corridoio». Sotto questa misura si sfiorano soltanto.
 */
const LANE_MIN_OVERLAP = 8;

/**
 * Quanto l'ancora resa sta **fuori** dal bordo del nodo.
 *
 * `computeHandlePositionForNode` restituisce il punto sul bordo; React Flow consegna
 * all'arco il centro dell'handle, che il pool disegna appena fuori. Misurato il
 * 2026-08-27 su tutti e diciotto gli archi della scena densa: `bottom +4`, `top -4`,
 * `left -4`, `right +4`, senza eccezioni. Senza questo scarto la polilinea
 * ricostruita puo' avere una forma diversa da quella resa, e gli indici di segmento
 * finirebbero su un altro segmento.
 */
const ANCHOR_OUTSET = 4;

/** Sposta il punto d'ancoraggio fuori dal bordo, come lo rende il pool di handle. */
function outset(p: Point, side: 'top' | 'right' | 'bottom' | 'left'): Point {
    switch (side) {
        case 'top': return { x: p.x, y: p.y - ANCHOR_OUTSET };
        case 'bottom': return { x: p.x, y: p.y + ANCHOR_OUTSET };
        case 'left': return { x: p.x - ANCHOR_OUTSET, y: p.y };
        case 'right': return { x: p.x + ANCHOR_OUTSET, y: p.y };
    }
}

/** Un segmento in gioco per l'assegnazione delle corsie. */
export interface LaneSegment {
    edgeId: string;
    /** Indice del segmento nella polilinea dell'arco. -1 per gli ostacoli troncati. */
    segmentIndex: number;
    /** true = il segmento corre orizzontale. */
    horizontal: boolean;
    /** Coordinata sull'asse perpendicolare: `y` se orizzontale, `x` se verticale. */
    at: number;
    /** Estremi lungo il proprio asse, ordinati. */
    from: number;
    to: number;
    /** Un ostacolo non si sposta: è un tratto d'approccio, incollato alla sua ancora. */
    fixed: boolean;
}

/** Polilinea di un arco, come la catena automatica la produce. */
export interface LaneEdge {
    id: string;
    points: Point[];
}

/** Lo scostamento di un segmento, nella forma che `applyWaypoints` sa applicare. */
export interface LaneOffset {
    segmentIndex: number;
    offset: number;
}

const axis = (a: Point, b: Point) => ({
    horizontal: Math.abs(b.y - a.y) < Math.abs(b.x - a.x),
    length: Math.abs(b.x - a.x) + Math.abs(b.y - a.y),
});

/**
 * I segmenti che partecipano.
 *
 * **Mobili**: tutti i segmenti *interni*, quelli che non toccano un'ancora. Spostarli
 * perpendicolarmente allunga o accorcia i vicini e lascia i due capi dove sono — è la
 * stessa operazione che il trascinamento di una maniglia compie.
 *
 * **Fissi**: i due tratti d'approccio di ogni arco, troncati a `LANE_APPROACH_RUN`.
 * Escono perpendicolari dall'ancora e non si toccano: sono gli altri a scansarli. Un
 * arco a due soli segmenti (una L) contribuisce quindi solo ostacoli.
 */
export function collectLaneSegments(edges: LaneEdge[]): LaneSegment[] {
    const out: LaneSegment[] = [];
    for (const e of edges) {
        const pts = e.points;
        if (pts.length < 2) continue;
        const nSeg = pts.length - 1;

        for (const end of ['start', 'end'] as const) {
            const a = end === 'start' ? pts[0] : pts[pts.length - 1];
            const b = end === 'start' ? pts[1] : pts[pts.length - 2];
            const { horizontal, length } = axis(a, b);
            if (length < 1) continue;
            const run = Math.min(LANE_APPROACH_RUN, length);
            const along = horizontal
                ? [a.x, a.x + Math.sign(b.x - a.x) * run]
                : [a.y, a.y + Math.sign(b.y - a.y) * run];
            out.push({
                edgeId: e.id,
                segmentIndex: -1,
                horizontal,
                at: horizontal ? a.y : a.x,
                from: Math.min(along[0], along[1]),
                to: Math.max(along[0], along[1]),
                fixed: true,
            });
        }

        for (let i = 1; i < nSeg - 1; i++) {
            const a = pts[i], b = pts[i + 1];
            const { horizontal, length } = axis(a, b);
            if (length < 1) continue;
            out.push({
                edgeId: e.id,
                segmentIndex: i,
                horizontal,
                at: horizontal ? a.y : a.x,
                from: horizontal ? Math.min(a.x, b.x) : Math.min(a.y, b.y),
                to: horizontal ? Math.max(a.x, b.x) : Math.max(a.y, b.y),
                fixed: false,
            });
        }
    }
    return out;
}

/** Due segmenti si contendono lo stesso corridoio? */
function conflicts(a: LaneSegment, b: LaneSegment): boolean {
    if (a.horizontal !== b.horizontal) return false;
    if (a.edgeId === b.edgeId) return false;
    if (Math.abs(a.at - b.at) >= LANE_MIN_GAP) return false;
    return Math.min(a.to, b.to) - Math.max(a.from, b.from) >= LANE_MIN_OVERLAP;
}

/** Componenti connesse della relazione «si contendono il corridoio». */
function corridors(segments: LaneSegment[]): LaneSegment[][] {
    const parent = segments.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (let i = 0; i < segments.length; i++) {
        for (let j = i + 1; j < segments.length; j++) {
            if (conflicts(segments[i], segments[j])) parent[find(i)] = find(j);
        }
    }
    const groups = new Map<number, LaneSegment[]>();
    for (let i = 0; i < segments.length; i++) {
        const root = find(i);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root)!.push(segments[i]);
    }
    return Array.from(groups.values()).filter((g) => g.length > 1);
}

/**
 * Lo scostamento del corridoio centrale, per arco.
 *
 * Ogni corridoio conteso diventa una scala di pioli distanti `LANE_MIN_GAP`, centrata
 * sulla media delle posizioni dei suoi membri spostabili e ordinata per posizione
 * fisica poi per id. Se un piolo cade addosso a un ostacolo, **tutta la scala** trasla
 * dal lato più vicino che li libera tutti: traslare in blocco conserva la spaziatura
 * interna e l'annidamento.
 *
 * Limite dichiarato: quando nessuna traslazione libera gli ostacoli — corridoio
 * saturo fra due approcci — la scala resta dov'è. Si degrada al tracciato di prima
 * invece di produrne uno peggiore, che è la stessa politica di `avoidNodeRects`.
 */
export function assignLanes(segments: LaneSegment[]): Map<string, LaneOffset[]> {
    const shifts = new Map<string, LaneOffset[]>();
    const push = (edgeId: string, o: LaneOffset) => {
        const list = shifts.get(edgeId);
        if (list) list.push(o); else shifts.set(edgeId, [o]);
    };

    for (const group of corridors(segments)) {
        const movable = group.filter((s) => !s.fixed);
        if (movable.length === 0) continue;
        const fixed = group.filter((s) => s.fixed);

        // Ordine deterministico: posizione fisica, poi id, poi indice di segmento.
        // Nessuno dei tre dipende dall'ordine di rendering.
        movable.sort((a, b) => (a.at !== b.at ? a.at - b.at
            : a.edgeId !== b.edgeId ? (a.edgeId < b.edgeId ? -1 : 1)
            : a.segmentIndex - b.segmentIndex));

        const centre = movable.reduce((acc, s) => acc + s.at, 0) / movable.length;
        const span = (movable.length - 1) * LANE_STEP;
        const ladder = movable.map((_, k) => centre - span / 2 + k * LANE_STEP);

        const overlaps = (a: LaneSegment, b: LaneSegment) =>
            Math.min(a.to, b.to) - Math.max(a.from, b.from) >= LANE_MIN_OVERLAP;
        const blocked = (delta: number) => ladder.some((rung, k) =>
            fixed.some((f) => Math.abs(rung + delta - f.at) < LANE_MIN_GAP && overlaps(movable[k], f)));

        let delta = 0;
        if (blocked(0)) {
            // Si prova a scostare tutta la scala, un passo alla volta e alternando i
            // due versi: vince il primo che libera, cioe' il piu' vicino.
            const tries: number[] = [];
            for (let k = 1; k <= fixed.length + movable.length + 1; k++) {
                tries.push(k * LANE_STEP, -k * LANE_STEP);
            }
            const found = tries.find((d) => !blocked(d));
            if (found !== undefined) delta = found;
        }

        movable.forEach((s, k) => {
            const offset = ladder[k] + delta - s.at;
            if (Math.abs(offset) > 0.01) push(s.edgeId, { segmentIndex: s.segmentIndex, offset });
        });
    }

    return shifts;
}

/** Scorciatoia: dalle polilinee agli scostamenti, in un passo solo. */
export function computeLaneShifts(edges: LaneEdge[]): Map<string, LaneOffset[]> {
    return assignLanes(collectLaneSegments(edges));
}

/**
 * Applica gli scostamenti di corsia a una polilinea.
 *
 * Delega ad `applyWaypoints`: spostare un segmento interno perpendicolarmente e' la
 * stessa identica operazione, e riusarla garantisce che corsia automatica e
 * trascinamento manuale non possano divergere. Senza scostamenti torna i punti
 * ricevuti **per riferimento**, cosi' una scena senza corsie contese resta
 * byte-identica.
 */
export function applyLaneShifts(points: Point[], offsets: LaneOffset[] | undefined): Point[] {
    if (!offsets || offsets.length === 0) return points;
    return applyWaypoints(points, offsets);
}

// ── Ricostruzione della geometria ─────────────────────────────────────────────

/** Arco come lo vede la distribuzione: id, capi, handle gia' assegnati. */
export interface LaneInputEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string | null;
}

/**
 * Le polilinee su cui assegnare le corsie, ricostruite dalla stessa catena che
 * `UnifiedEdge` percorre: ancore da `computeHandlePositionForNode`, tracciato da
 * `computeManhattanPath`, ventaglio da `applyBundleSpread`, evitamento dei corpi da
 * `avoidNodeRects`.
 *
 * L'evitamento **deve** starci: e' li' che nascono i tracciati lunghi, ed e' fra i
 * loro segmenti interni che si misurano quasi tutti i corridoi contesi. Fermarsi
 * prima darebbe indici di segmento riferiti a una polilinea che non e' quella
 * disegnata.
 *
 * Si ferma invece **prima dei waypoint**, che sono l'ultima parola dell'utente
 * (R-B10) e che `UnifiedEdge` applica dopo le corsie: gli indici restano quindi
 * quelli della polilinea automatica, la stessa che le maniglie usano.
 */
export function laneEdgesFromLayout(
    edges: LaneInputEdge[],
    positions: Map<string, NodePosition>,
    rects: Array<{ x: number; y: number; width: number; height: number }>,
): LaneEdge[] {
    const out: LaneEdge[] = [];
    for (const e of edges) {
        const s = positions.get(e.source);
        const t = positions.get(e.target);
        if (!s || !t || !e.sourceHandle || !e.targetHandle) continue;
        if (e.source === e.target) continue;         // self-loop: geometria propria
        const sw = s.width ?? 0, sh = s.height ?? 0;
        const tw = t.width ?? 0, th = t.height ?? 0;
        if (!(sw > 0 && sh > 0 && tw > 0 && th > 0)) continue;

        const common = { edges, nodePositions: positions };
        const sp = computeHandlePositionForNode({
            ...common, nodeId: e.source, nodeX: s.centerX - sw / 2, nodeY: s.centerY - sh / 2,
            nodeWidth: sw, nodeHeight: sh, handleId: e.sourceHandle, role: 'source',
        });
        const tp = computeHandlePositionForNode({
            ...common, nodeId: e.target, nodeX: t.centerX - tw / 2, nodeY: t.centerY - th / 2,
            nodeWidth: tw, nodeHeight: th, handleId: e.targetHandle, role: 'target',
        });
        const ss = getSideFromHandle(e.sourceHandle);
        const ts = getSideFromHandle(e.targetHandle);
        const spOut = outset(sp, ss);
        const tpOut = outset(tp, ts);
        const raw = parsePathPoints(computeManhattanPath(spOut.x, spOut.y, ss, tpOut.x, tpOut.y, ts));
        const spread = e.type === 'inheritance'
            ? raw
            : applyBundleSpread(raw, { x: (s.centerX + t.centerX) / 2, y: (s.centerY + t.centerY) / 2 });
        const routed = e.type === 'inheritance' ? spread : avoidNodeRects(spread, rects as any);
        out.push({ id: e.id, points: routed });
    }
    return out;
}

// ── Registro degli scostamenti ────────────────────────────────────────────────
//
// Gli scostamenti NON viaggiano su `edge.data`. Misurato il 2026-08-27: la sincro
// ricostruisce l'arco da JjOM e preserva **solo** gli handle
// (`useJjomSync.ts:1411-1415`, «Preserve handles from applyDistribution»), quindi
// qualunque campo scritto in `data` da `applyDistribution` viene sostituito al primo
// giro di sincro. Sul canvas M1 la prova e' diretta: le chiavi dell'arco reso sono
// `["referenceName","referenceId"]` e nient'altro.
//
// Il registro a livello di modulo e' lo stesso schema che il codebase usa gia' per i
// tracciati e gli incroci (`registerEdgePath` / `getEdgeCrossings` in `edgeUtils`):
// scritto da chi vede tutti gli archi, letto in render dentro una memo che dipende
// dall'array degli archi. Resta fuori dalla critical zone (CLAUDE.md §3.1).

const laneRegistry = new Map<string, LaneOffset[]>();
/** Cambia a ogni riscrittura: e' la chiave con cui una memo si accorge del giro nuovo. */
let laneRevision = 0;

/** Sostituisce l'intero registro. Ritorna la nuova revisione. */
export function setLaneShifts(shifts: Map<string, LaneOffset[]>): number {
    laneRegistry.clear();
    for (const [id, offsets] of shifts) laneRegistry.set(id, offsets);
    return ++laneRevision;
}

/** Gli scostamenti di un arco, o `undefined` se non ne ha. */
export function getLaneShifts(edgeId: string): LaneOffset[] | undefined {
    return laneRegistry.get(edgeId);
}

/** La revisione corrente del registro. */
export function laneShiftsRevision(): number {
    return laneRevision;
}

/** Svuota il registro. Usato dai test per isolare una prova dall'altra. */
export function clearLaneShifts(): void {
    laneRegistry.clear();
}
