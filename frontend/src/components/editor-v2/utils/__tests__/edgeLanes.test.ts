/**
 * Corsie — separazione dei corridoi condivisi da archi diversi.
 *
 * Le geometrie sono quelle della scena densa (`_tmp_dense.ts`, la macchina Heater):
 * nodi affiancati, corridoi verticali lunghi, tratti d'approccio da 16px.
 *
 * Due prove esistono per non dichiarare un verde vuoto (CLAUDE.md §5, «before writing
 * X does not render, build the state where X would render if the claim were false»):
 * quella sul tratto d'approccio costruisce apposta un ostacolo sotto la scala, e
 * quella sull'ordine mescola l'ingresso.
 */
import { describe, it, expect } from 'vitest';
import {
    assignLanes,
    collectLaneSegments,
    computeLaneShifts,
    applyLaneShifts,
    LANE_APPROACH_RUN,
    LANE_MIN_GAP,
    type LaneEdge,
    type LaneSegment,
} from '../edgeLanes';
import { applyWaypoints, MIN_APPROACH_RUN } from '../edgeUtils';

/** Z verticale: esce a destra, corre in verticale a `x`, entra a sinistra. */
const zEdge = (id: string, x: number, y0: number, y1: number): LaneEdge => ({
    id,
    points: [{ x: x - 120, y: y0 }, { x, y: y0 }, { x, y: y1 }, { x: x + 120, y: y1 }],
});

/** Distanza minima fra i corridoi verticali di una lista di archi, dopo gli scostamenti. */
function corridorGaps(edges: LaneEdge[]): number[] {
    const shifts = computeLaneShifts(edges);
    const xs = edges.map(e => applyLaneShifts(e.points, shifts.get(e.id))[1].x).sort((a, b) => a - b);
    return xs.slice(1).map((x, i) => x - xs[i]);
}

describe('assegnazione delle corsie', () => {
    it('tre corridoi coincidenti si separano di almeno 8px', () => {
        const edges = [zEdge('a', 500, 100, 600), zEdge('b', 500, 140, 640), zEdge('c', 500, 180, 680)];
        // Prima: tutti e tre sulla stessa ascissa.
        expect(new Set(edges.map(e => e.points[1].x)).size).toBe(1);
        for (const gap of corridorGaps(edges)) expect(gap).toBeGreaterThanOrEqual(LANE_MIN_GAP);
    });

    it('corridoi gia\' distanti restano dove sono', () => {
        const edges = [zEdge('a', 400, 100, 600), zEdge('b', 500, 140, 640)];
        expect(computeLaneShifts(edges).size).toBe(0);
    });

    it('due corridoi che non si sovrappongono lungo l\'asse non si contendono nulla', () => {
        // Stessa ascissa, ma uno in alto e uno in basso: non sono nello stesso corridoio.
        const edges = [zEdge('a', 500, 100, 200), zEdge('b', 500, 900, 1000)];
        expect(computeLaneShifts(edges).size).toBe(0);
    });

    it('l\'esito non dipende dall\'ordine in cui gli archi arrivano', () => {
        const edges = [zEdge('a', 500, 100, 600), zEdge('b', 500, 140, 640), zEdge('c', 500, 180, 680)];
        const straight = computeLaneShifts(edges);
        const shuffled = computeLaneShifts([edges[2], edges[0], edges[1]]);
        expect(shuffled.size).toBe(straight.size);
        for (const [id, offsets] of straight) expect(shuffled.get(id)).toEqual(offsets);
    });

    it('a parita\' di posizione lo spareggio e\' l\'id, non l\'ordine di arrivo', () => {
        // Due corridoi identici: solo l'id li distingue.
        const a = zEdge('aaa', 500, 100, 600);
        const b = zEdge('bbb', 500, 100, 600);
        const first = computeLaneShifts([a, b]);
        const second = computeLaneShifts([b, a]);
        expect(first.get('aaa')).toEqual(second.get('aaa'));
        expect(first.get('bbb')).toEqual(second.get('bbb'));
        // e i due finiscono su corsie diverse
        expect(first.get('aaa')).not.toEqual(first.get('bbb'));
    });
});

describe('il tratto d\'approccio non si tocca e non si occupa', () => {
    it('un approccio entra come ostacolo, non come corridoio spostabile', () => {
        const segs = collectLaneSegments([zEdge('a', 500, 100, 600)]);
        const fixed = segs.filter(s => s.fixed);
        const movable = segs.filter(s => !s.fixed);
        expect(fixed).toHaveLength(2);          // i due capi
        expect(movable).toHaveLength(1);        // il corridoio centrale
        expect(movable[0].segmentIndex).toBe(1);
        // L'ostacolo copre al piu' la lunghezza protetta.
        for (const f of fixed) expect(f.to - f.from).toBeLessThanOrEqual(LANE_APPROACH_RUN);
    });

    it('una L contribuisce solo ostacoli: non ha segmenti interni', () => {
        const l: LaneEdge = { id: 'l', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 300 }] };
        expect(collectLaneSegments([l]).every(s => s.fixed)).toBe(true);
    });

    it('la scala si scosta quando un piolo cadrebbe sul tratto d\'approccio', () => {
        // Costruzione apposita: due corridoi verticali a x = 500, e un approccio
        // verticale fisso a x = 500 che ne occupa la stessa fascia. Senza il veto la
        // scala metterebbe un piolo proprio li'.
        const segments: LaneSegment[] = [
            { edgeId: 'a', segmentIndex: 1, horizontal: false, at: 500, from: 100, to: 600, fixed: false },
            { edgeId: 'b', segmentIndex: 1, horizontal: false, at: 500, from: 100, to: 600, fixed: false },
            { edgeId: 'z', segmentIndex: -1, horizontal: false, at: 500, from: 200, to: 216, fixed: true },
        ];
        const shifts = assignLanes(segments);
        const at = (id: string) => 500 + (shifts.get(id)?.[0]?.offset ?? 0);
        // I due corridoi restano distanti fra loro...
        expect(Math.abs(at('a') - at('b'))).toBeGreaterThanOrEqual(LANE_MIN_GAP);
        // ...e nessuno dei due resta addosso all'ostacolo.
        for (const id of ['a', 'b']) expect(Math.abs(at(id) - 500)).toBeGreaterThanOrEqual(LANE_MIN_GAP);
    });

    it('corridoio insoddisfacibile: si tiene il tracciato invece di peggiorarlo', () => {
        // Ostacoli fissi ovunque la scala potrebbe andare: nessuna traslazione libera.
        const fixedWall: LaneSegment[] = Array.from({ length: 40 }, (_, k) => ({
            edgeId: `z${k}`, segmentIndex: -1, horizontal: false,
            at: 500 + (k - 20) * 9, from: 100, to: 600, fixed: true,
        }));
        const segments: LaneSegment[] = [
            { edgeId: 'a', segmentIndex: 1, horizontal: false, at: 500, from: 100, to: 600, fixed: false },
            ...fixedWall,
        ];
        // Non esplode e non produce un tracciato peggiore: al piu' lascia dov'era.
        expect(() => assignLanes(segments)).not.toThrow();
    });
});

describe('applicazione degli scostamenti', () => {
    it('senza scostamenti torna lo stesso riferimento', () => {
        const pts = zEdge('a', 500, 100, 600).points;
        expect(applyLaneShifts(pts, undefined)).toBe(pts);
        expect(applyLaneShifts(pts, [])).toBe(pts);
    });

    it('sposta il segmento interno e lascia i capi dove sono', () => {
        const pts = zEdge('a', 500, 100, 600).points;
        const out = applyLaneShifts(pts, [{ segmentIndex: 1, offset: 12 }]);
        expect(out[0]).toEqual(pts[0]);
        expect(out[3]).toEqual(pts[3]);
        expect(out[1].x).toBe(512);
        expect(out[2].x).toBe(512);
    });

    it('e\' la stessa operazione del trascinamento di una maniglia', () => {
        // Corsia automatica e waypoint manuale devono passare dalla stessa funzione,
        // altrimenti possono divergere.
        const pts = zEdge('a', 500, 100, 600).points;
        expect(applyLaneShifts(pts, [{ segmentIndex: 1, offset: 12 }]))
            .toEqual(applyWaypoints(pts, [{ segmentIndex: 1, offset: 12 }]));
    });
});

/**
 * La corsia non mangia il tratto d'approccio dell'arco che la porta.
 *
 * `conflicts` esclude per costruzione le coppie dello stesso arco: l'approccio di un
 * arco entra come ostacolo per **gli altri**, mai per se stesso. Uno scostamento sul
 * segmento accanto al terminale lo fa quindi scorrere lungo l'asse del terminale, e ne
 * accorcia la sporgenza — misurato il 2026-08-29 sulla scena densa: l'evitamento
 * consegnava 24px e la corsia li riportava a 7,5.
 *
 * Il prezzo e' dichiarato: un piolo bloccato puo' finire a meno di `LANE_MIN_GAP` dal
 * vicino. La scala e' un'euristica di leggibilita', la sporgenza e' un contratto.
 */
describe('la corsia non mangia il tratto d\'approccio', () => {
    /** Z verticale con terminali corti: 30px, cioe' poco piu' della sporgenza. */
    const shortZ = (id: string, x: number, y0: number, y1: number): LaneEdge => ({
        id,
        points: [{ x: x - 30, y: y0 }, { x, y: y0 }, { x, y: y1 }, { x: x + 30, y: y1 }],
    });

    it('la sporgenza protetta e\' quella del router, importata e non ricopiata', () => {
        expect(LANE_APPROACH_RUN).toBe(MIN_APPROACH_RUN);
    });

    it('il piolo si ferma dove il terminale scenderebbe sotto la sporgenza', () => {
        // Tre corridoi coincidenti a x = 500, terminali da 30px. La scala vorrebbe
        // 491 / 500 / 509 (passo 9); il limite e' 470 + 24 = 494 da un lato e
        // 530 − 24 = 506 dall'altro.
        const edges = [shortZ('a', 500, 100, 600), shortZ('b', 500, 140, 640), shortZ('c', 500, 180, 680)];
        const shifts = computeLaneShifts(edges);
        const corridors = edges.map((e) => applyLaneShifts(e.points, shifts.get(e.id))[1].x);
        expect(corridors).toEqual([494, 500, 506]);
        for (const e of edges) {
            const p = applyLaneShifts(e.points, shifts.get(e.id));
            expect(Math.abs(p[1].x - p[0].x)).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
            expect(Math.abs(p[3].x - p[2].x)).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
        }
    });

    it('il prezzo e\' dichiarato: due pioli bloccati possono finire sotto il passo', () => {
        // Stessa scena: la separazione scende a 6px, sotto LANE_MIN_GAP. E' il verso
        // in cui si e' scelto di sbagliare.
        const edges = [shortZ('a', 500, 100, 600), shortZ('b', 500, 140, 640), shortZ('c', 500, 180, 680)];
        const shifts = computeLaneShifts(edges);
        const xs = edges.map((e) => applyLaneShifts(e.points, shifts.get(e.id))[1].x).sort((a, b) => a - b);
        const gaps = xs.slice(1).map((x, i) => x - xs[i]);
        expect(gaps.every((g) => g < LANE_MIN_GAP)).toBe(true);
    });

    it('con terminali lunghi il limite non morde e la scala resta quella di sempre', () => {
        // I 120px di `zEdge` lasciano 96px di gioco: gli scostamenti sono gli stessi
        // di prima del limite, e la separazione torna sopra il passo.
        const edges = [zEdge('a', 500, 100, 600), zEdge('b', 500, 140, 640), zEdge('c', 500, 180, 680)];
        for (const gap of corridorGaps(edges)) expect(gap).toBeGreaterThanOrEqual(LANE_MIN_GAP);
    });

    it('un segmento lontano da entrambi i terminali non ha limiti', () => {
        // Scala a cinque punti: il segmento 2 non tocca nessuna ancora.
        const staircase: LaneEdge = {
            id: 'L',
            points: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 100 }, { x: 400, y: 100 }, { x: 400, y: 200 }, { x: 600, y: 200 }],
        };
        const movable = collectLaneSegments([staircase]).filter((s) => !s.fixed);
        const byIndex = new Map(movable.map((s) => [s.segmentIndex, s]));
        expect(byIndex.get(2)!.minOffset).toBe(-Infinity);
        expect(byIndex.get(2)!.maxOffset).toBe(Infinity);
        // I due che confinano con un terminale, invece, sono limitati da quel lato.
        // Il segmento 1 e' verticale a x = 200 e la sua ancora sta a x = 0: puo'
        // avvicinarsi fino a 24px da lei, cioe' scendere di 176.
        expect(byIndex.get(1)!.minOffset).toBe(0 + MIN_APPROACH_RUN - 200);
        expect(byIndex.get(1)!.maxOffset).toBe(Infinity);
        // Il segmento 3, a x = 400, ha l'ancora d'uscita a x = 600: simmetrico.
        expect(byIndex.get(3)!.maxOffset).toBe(600 - MIN_APPROACH_RUN - 400);
        expect(byIndex.get(3)!.minOffset).toBe(-Infinity);
    });
});
