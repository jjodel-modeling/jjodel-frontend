/**
 * Edge routing — scelta dei lati d'ancoraggio per i reference edge.
 *
 * Il criterio, ratificato il 2026-08-27 (report
 * `docs/discovery/discovery_2026-08-27_reference_edge_routing.md`, punti A..E):
 * si valutano tutti e sedici gli accoppiamenti (lato d'uscita, lato d'ingresso) con
 * l'ancoraggio al **centro del lato**, si scartano quelli il cui tracciato entra nei
 * corpi dei due nodi, e vince quello con **meno svolte**; a parità di svolte, il più
 * corto.
 *
 * Due scelte esplicite, che il criterio da solo non fissa:
 *
 * - **Svolte prima della lunghezza, sempre.** Sulla diagonale questo preferisce una L
 *   a una svolta lunga 404px alla Z a due svolte lunga 360px. È una decisione di
 *   resa, non un ottimo: misurata e accettata.
 * - **Spareggio all'asse dominante**, poi stabilità sulla coppia corrente. Su una
 *   diagonale pura `top→left` e `right→bottom` pareggiano su svolte *e* lunghezza;
 *   vince quella che esce dal lato sull'asse dominante (|dx| ≥ |dy| ⇒ esce di fianco).
 *
 * La lunghezza e il conteggio delle svolte si misurano sulla polilinea che il router
 * produrrebbe davvero — `computeManhattanPath`, la stessa funzione che disegna — e non
 * su una stima. È l'unico modo perché il punteggio e il tracciato non divergano
 * (CLAUDE.md §5, sotto-regola «verify consumers before assuming an output is
 * load-bearing»).
 *
 * Puro: niente React, niente ReactFlow, niente DOM.
 */
import { computeManhattanPath, parsePathPoints, pathBlockingRects, MIN_APPROACH_RUN, type Side } from './edgeUtils';

/**
 * Sporgenza perpendicolare desiderata prima della prima svolta (e dopo l'ultima).
 * Ri-esportata dal router, che è chi deve rispettarla: un solo valore, una sola sede.
 */
export const MIN_APPROACH = MIN_APPROACH_RUN;

/**
 * Quanto deve migliorare un accoppiamento per soppiantare quello corrente.
 *
 * Sostituisce la dead zone angolare di `useAutoAnchor` (30°-60°), che congelava i
 * lati precedenti e, in assenza di lati precedenti, ripiegava su `right → right` —
 * la U che gira attorno al target misurata nel report del 2026-08-27 §4.2. Qui la
 * geometria vince sempre quando il guadagno è reale; sotto il margine si tiene la
 * coppia corrente, che è ciò che impedisce lo sfarfallio durante il trascinamento.
 */
export const IMPROVEMENT_MARGIN = 0.2;

/** Ordine deterministico di ultima istanza, così due corse danno lo stesso lato. */
const SIDE_ORDER: readonly Side[] = ['top', 'right', 'bottom', 'left'];

export interface RouteRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SidePair {
    sourceSide: Side;
    targetSide: Side;
}

export interface RouteMetrics extends SidePair {
    /** Numero di svolte a 90° della polilinea. */
    turns: number;
    /** Lunghezza Manhattan totale. */
    length: number;
    /** Px mancanti a `MIN_APPROACH` sul più corto dei due tratti terminali. */
    stubDeficit: number;
    /** Il tracciato entra nel corpo di uno dei due nodi (fuori dalle finestre di stub). */
    blocked: boolean;
    /** Il lato d'uscita sta sull'asse dominante fra i due centri. */
    onDominantAxis: boolean;
}

/** Punto centrale di un lato: è l'ancoraggio con cui si valutano i candidati. */
export function sideCentre(r: RouteRect, side: Side): { x: number; y: number } {
    switch (side) {
        case 'top': return { x: r.x + r.width / 2, y: r.y };
        case 'bottom': return { x: r.x + r.width / 2, y: r.y + r.height };
        case 'left': return { x: r.x, y: r.y + r.height / 2 };
        case 'right': return { x: r.x + r.width, y: r.y + r.height / 2 };
    }
}

function isHorizontal(side: Side): boolean {
    return side === 'left' || side === 'right';
}

/** Lunghezza del tratto terminale, sull'asse perpendicolare al lato. */
function endRun(points: { x: number; y: number }[], side: Side, from: 'start' | 'end'): number {
    if (points.length < 2) return 0;
    const a = from === 'start' ? points[0] : points[points.length - 1];
    const b = from === 'start' ? points[1] : points[points.length - 2];
    return isHorizontal(side) ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y);
}

/**
 * Misura un accoppiamento: la polilinea che il router produrrebbe fra i due centri
 * di lato, con svolte, lunghezza, deficit di sporgenza e violazione dei corpi.
 */
export function measureSidePair(
    sourceRect: RouteRect,
    targetRect: RouteRect,
    sourceSide: Side,
    targetSide: Side,
): RouteMetrics {
    const sp = sideCentre(sourceRect, sourceSide);
    const tp = sideCentre(targetRect, targetSide);
    const points = parsePathPoints(computeManhattanPath(sp.x, sp.y, sourceSide, tp.x, tp.y, targetSide));

    let length = 0;
    for (let i = 1; i < points.length; i++) {
        length += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
    }

    const dx = (targetRect.x + targetRect.width / 2) - (sourceRect.x + sourceRect.width / 2);
    const dy = (targetRect.y + targetRect.height / 2) - (sourceRect.y + sourceRect.height / 2);
    const horizontalDominant = Math.abs(dx) >= Math.abs(dy);

    const runIn = endRun(points, sourceSide, 'start');
    const runOut = endRun(points, targetSide, 'end');
    // Su una retta (due soli punti) non c'è prima svolta: nessun deficit da imputare.
    const stubDeficit = points.length <= 2
        ? 0
        : Math.max(0, MIN_APPROACH - Math.min(runIn, runOut));

    return {
        sourceSide,
        targetSide,
        turns: Math.max(0, points.length - 2),
        length,
        stubDeficit,
        blocked: pathBlockingRects(points, [sourceRect, targetRect]).length > 0,
        onDominantAxis: isHorizontal(sourceSide) === horizontalDominant,
    };
}

/** Occupazione di un accoppiamento: usata solo come spareggio fra pari merito. */
export type OccupancyFn = (pair: SidePair) => number;

/**
 * Accoppiamento da mettere in coda a prescindere dalla geometria.
 *
 * Serve alla capienza fisica dei lati: quando il lato frontale è oltre capienza
 * l'arco non ci sta, e va cercato altrove anche se geometricamente sarebbe il
 * migliore. È la sola cosa che sopravanza il criterio svolte/lunghezza, insieme alla
 * violazione dei corpi.
 */
export type DenyFn = (pair: SidePair) => boolean;

/**
 * Ordine totale fra candidati. Prima le svolte, poi la lunghezza, poi la sporgenza,
 * poi l'occupazione dei lati, poi l'asse dominante, infine un ordine fisso.
 */
function compareCandidates(a: RouteMetrics, b: RouteMetrics, occupancy?: OccupancyFn): number {
    if (a.turns !== b.turns) return a.turns - b.turns;
    if (Math.abs(a.length - b.length) > 0.5) return a.length - b.length;
    if (a.stubDeficit !== b.stubDeficit) return a.stubDeficit - b.stubDeficit;
    if (occupancy) {
        const oa = occupancy(a);
        const ob = occupancy(b);
        if (oa !== ob) return oa - ob;
    }
    if (a.onDominantAxis !== b.onDominantAxis) return a.onDominantAxis ? -1 : 1;
    const sa = SIDE_ORDER.indexOf(a.sourceSide) - SIDE_ORDER.indexOf(b.sourceSide);
    if (sa !== 0) return sa;
    return SIDE_ORDER.indexOf(a.targetSide) - SIDE_ORDER.indexOf(b.targetSide);
}

/**
 * Tutti e sedici gli accoppiamenti, dal migliore al peggiore. Quelli che attraversano
 * un corpo restano in coda: se nessun candidato è pulito (nodi molto sovrapposti) si
 * degrada al migliore fra i violanti invece di non tornare nulla.
 */
export function rankSidePairs(
    sourceRect: RouteRect,
    targetRect: RouteRect,
    occupancy?: OccupancyFn,
    deny?: DenyFn,
): RouteMetrics[] {
    const all: RouteMetrics[] = [];
    for (const s of SIDE_ORDER) {
        for (const t of SIDE_ORDER) {
            all.push(measureSidePair(sourceRect, targetRect, s, t));
        }
    }
    const isDenied = (m: RouteMetrics) => !!deny?.({ sourceSide: m.sourceSide, targetSide: m.targetSide });
    return all.sort((a, b) => {
        const da = isDenied(a);
        const db = isDenied(b);
        if (da !== db) return da ? 1 : -1;
        if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
        return compareCandidates(a, b, occupancy);
    });
}

/**
 * Vale la pena spostare i lati da `current` a `best`?
 *
 * Un tracciato che attraversa un corpo si abbandona sempre; per il resto si cambia
 * solo se le svolte calano, o se a parità di svolte il percorso si accorcia oltre il
 * margine. Sotto il margine si resta dove si è: è quello che tiene fermi i lati
 * durante un trascinamento.
 */
export function shouldSwitch(current: RouteMetrics, best: RouteMetrics): boolean {
    if (current.blocked && !best.blocked) return true;
    if (best.blocked && !current.blocked) return false;
    if (best.turns !== current.turns) return best.turns < current.turns;
    return best.length < current.length * (1 - IMPROVEMENT_MARGIN);
}

/**
 * L'accoppiamento da usare. Con `current` valorizzato applica il margine di
 * miglioramento; senza, vince sempre la geometria.
 */
export function chooseEdgeSides(
    sourceRect: RouteRect,
    targetRect: RouteRect,
    opts?: { current?: SidePair; occupancy?: OccupancyFn; deny?: DenyFn },
): SidePair {
    const ranked = rankSidePairs(sourceRect, targetRect, opts?.occupancy, opts?.deny);
    const best = ranked[0];
    const current = opts?.current;
    if (!current) return { sourceSide: best.sourceSide, targetSide: best.targetSide };

    const currentMetrics = ranked.find(
        m => m.sourceSide === current.sourceSide && m.targetSide === current.targetSide,
    );
    if (!currentMetrics) return { sourceSide: best.sourceSide, targetSide: best.targetSide };
    // Un accoppiamento negato non si tiene per inerzia: la capienza vince sul margine.
    if (opts?.deny?.(current)) return { sourceSide: best.sourceSide, targetSide: best.targetSide };

    return shouldSwitch(currentMetrics, best)
        ? { sourceSide: best.sourceSide, targetSide: best.targetSide }
        : { sourceSide: current.sourceSide, targetSide: current.targetSide };
}
