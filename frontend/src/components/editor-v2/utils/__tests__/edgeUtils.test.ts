/**
 * Rifiniture del tracciato dei reference edge — tratto d'approccio, jog, label,
 * molteplicità. Le quattro cose che il prompt del 2026-08-27 chiedeva dopo la scelta
 * dei lati.
 *
 * Le prove misurano il `d` emesso, non la forma del sorgente: un raggio «corretto a
 * leggerlo» può comunque produrre un arco che finisce sull'ultimo punto. La misura è
 * sulla sequenza dei comandi.
 *
 * Vincolo che ogni prova presidia: **senza `RoundingPolicy` il comportamento è quello
 * storico, byte per byte**. È così che il connettore d'ereditarietà (`useTreeLayout`,
 * unico altro consumatore delle due funzioni) resta fuori da questo lavoro.
 */
import { describe, it, expect } from 'vitest';
import {
    applyWaypoints,
    applyWaypointsWithMap,
    getPathSegments,
    roundManhattanPath,
    buildFinalPath,
    computeManhattanPath,
    computeLabelAnchor,
    computeCardinalityAnchor,
    pointsToPath,
    parsePathPoints,
    computeTreeConnectorPath,
    MARKER_APPROACH_RUN,
    MIN_APPROACH_RUN,
    type Side,
    type TreeBranch,
} from '../edgeUtils';

const REFERENCE_ROUNDING = { approachRun: MARKER_APPROACH_RUN, interiorStraight: 0.5 };

/** Comandi del `d` come coppie (lettera, punto d'arrivo). */
function commands(d: string): Array<{ op: string; x: number; y: number }> {
    const out: Array<{ op: string; x: number; y: number }> = [];
    for (const m of d.match(/[MLA][^MLA]*/g) ?? []) {
        const nums = (m.match(/-?[\d.]+/g) ?? []).map(Number);
        if (nums.length < 2) continue;
        out.push({ op: m[0], x: nums[nums.length - 2], y: nums[nums.length - 1] });
    }
    return out;
}

/** Lunghezza dell'ultimo tratto retto prima della fine (0 se l'ultimo comando è un arco). */
function finalStraightRun(d: string): number {
    const cmds = commands(d);
    if (cmds.length < 2) return 0;
    const last = cmds[cmds.length - 1];
    if (last.op !== 'L') return 0;
    const prev = cmds[cmds.length - 2];
    return Math.abs(last.x - prev.x) + Math.abs(last.y - prev.y);
}

/** Lunghezza del primo tratto retto dopo la partenza. */
function initialStraightRun(d: string): number {
    const cmds = commands(d);
    if (cmds.length < 2 || cmds[1].op !== 'L') return 0;
    return Math.abs(cmds[1].x - cmds[0].x) + Math.abs(cmds[1].y - cmds[0].y);
}

describe('tratto d’approccio dritto accanto ai marker', () => {
    // L a tre punti con l'ultimo tratto cortissimo: è la configurazione che produce
    // l'uncino, misurata il 2026-08-27 (`… A 3 3 0 0 0 103 40 L 103 40`, la `L`
    // finale di lunghezza zero).
    const shortTail = pointsToPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 40 }, { x: 103, y: 40 }]);

    it('senza politica il raccordo finale può ancora consumare tutto il segmento (comportamento storico)', () => {
        expect(finalStraightRun(roundManhattanPath(shortTail, 4))).toBe(0);
    });

    it('con la politica non resta nessun arco a ridosso della punta', () => {
        const d = roundManhattanPath(shortTail, 4, REFERENCE_ROUNDING);
        // Ultimo tratto 3px: sotto la retta richiesta, quindi spigolo vivo e
        // nessun arco che mangi l'approccio.
        expect(finalStraightRun(d)).toBeCloseTo(3, 5);
        expect(commands(d).at(-1)!.op).toBe('L');
    });

    it('con margine sufficiente la retta d’approccio arriva alla misura richiesta', () => {
        const roomy = pointsToPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 40 }, { x: 118, y: 40 }]);
        const d = roundManhattanPath(roomy, 4, REFERENCE_ROUNDING);
        expect(finalStraightRun(d)).toBeGreaterThanOrEqual(MARKER_APPROACH_RUN);
    });

    it('vale anche in partenza, dopo l’ancora del source', () => {
        const shortHead = pointsToPath([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 40 }, { x: 100, y: 40 }]);
        // Storico: `M 0 0 L 1 0 A 4 4 …`, un solo pixel di retta.
        expect(initialStraightRun(roundManhattanPath(shortHead, 4))).toBeCloseTo(1, 5);
        // Con la politica il raccordo sparisce e i 5px restano tutti dritti.
        expect(initialStraightRun(roundManhattanPath(shortHead, 4, REFERENCE_ROUNDING))).toBeCloseTo(5, 5);
    });

    it('un segmento terminale ampio resta byte-identico con e senza politica', () => {
        // 24px = 2 × la retta richiesta: il raggio pieno ci sta già, quindi il tetto
        // nuovo non morde e il `d` non cambia di un carattere.
        const roomy = pointsToPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 60 }, { x: 140, y: 60 }]);
        expect(roundManhattanPath(roomy, 4, REFERENCE_ROUNDING)).toBe(roundManhattanPath(roomy, 4));
    });

    it('buildFinalPath applica la stessa politica (ramo degli archi incrociati)', () => {
        const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 40 }, { x: 103, y: 40 }];
        expect(finalStraightRun(buildFinalPath(pts, [], 4, 6))).toBe(0);
        expect(finalStraightRun(buildFinalPath(pts, [], 4, 6, REFERENCE_ROUNDING))).toBeCloseTo(3, 5);
    });
});

describe('collasso del jog ravvicinato', () => {
    const jogPath = (offset: number) =>
        computeManhattanPath(540, 426.5, 'right' as Side, 700, 426.5 + offset, 'left' as Side);

    it('sotto lo snap resta la retta di sempre', () => {
        expect(jogPath(7)).toBe('M 540 430 L 700 430');
    });

    it('fra snap e soglia lo scalino si sposta a ridosso del source', () => {
        // Prima: bend al punto medio, x = 620. Ora: MIN_APPROACH_RUN dopo l'ancora,
        // x = 564. Il varco (160) regge due sporgenze piene, quindi il capo target
        // ne conserva 136: il contratto vale su entrambi i lati.
        const d = jogPath(10);
        expect(d).toBe('M 540 426.5 L 564 426.5 L 564 436.5 L 700 436.5');
    });

    it('sopra la soglia il bend torna al punto medio', () => {
        expect(jogPath(40)).toBe('M 540 426.5 L 620 426.5 L 620 466.5 L 700 466.5');
    });

    it('con varco stretto lo scalino non supera il punto medio', () => {
        // Varco di 20px, sotto `2 × MIN_APPROACH_RUN`: il bend resta a metà, come
        // prima — `min(MIN_APPROACH_RUN, varco/2)` vale 10 per capo.
        const d = computeManhattanPath(540, 426.5, 'right' as Side, 560, 436.5, 'left' as Side);
        expect(d).toBe('M 540 426.5 L 550 426.5 L 550 436.5 L 560 436.5');
    });

    it('i due raccordi di un jog corto non si toccano più', () => {
        const d = roundManhattanPath(jogPath(10), 4, REFERENCE_ROUNDING);
        const cmds = commands(d);
        const arcs = cmds.filter(c => c.op === 'A');
        expect(arcs).toHaveLength(2);
        // Fra la fine del primo arco e l'inizio del secondo deve restare metà del
        // jog, cioè 5px sui 10 di offset.
        const firstArcEnd = arcs[0];
        const secondArcStart = cmds[cmds.indexOf(arcs[1]) - 1];
        const gap = Math.abs(secondArcStart.x - firstArcEnd.x) + Math.abs(secondArcStart.y - firstArcEnd.y);
        expect(gap).toBeGreaterThanOrEqual(5);
    });

    it('senza politica i due raccordi si toccano ancora (comportamento storico)', () => {
        const d = roundManhattanPath(jogPath(10), 4);
        const cmds = commands(d);
        const arcs = cmds.filter(c => c.op === 'A');
        const firstArcEnd = arcs[0];
        const secondArcStart = cmds[cmds.indexOf(arcs[1]) - 1];
        const gap = Math.abs(secondArcStart.x - firstArcEnd.x) + Math.abs(secondArcStart.y - firstArcEnd.y);
        expect(gap).toBeLessThan(5);
    });
});

describe('ancora della label sul segmento più lungo', () => {
    it('su una U-detour prende il tratto lungo, non il centrale corto', () => {
        // Cinque segmenti: 30, 120, 200, 120, 30. Il punto a metà lunghezza d'arco
        // cadrebbe sul terzo; anche il criterio nuovo lo sceglie, ed è il più lungo.
        const u = pointsToPath([
            { x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 120 },
            { x: 230, y: 120 }, { x: 230, y: 0 }, { x: 260, y: 0 },
        ]);
        const a = computeLabelAnchor(u);
        expect(a.isHorizontal).toBe(true);
        expect(a.x).toBeCloseTo(130, 5);
        expect(a.y).toBeCloseTo(120, 5);
    });

    it('su una L sceglie il ramo lungo, non quello corto', () => {
        const l = pointsToPath([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 300 }]);
        const a = computeLabelAnchor(l);
        expect(a.isHorizontal).toBe(false);
        expect(a.x).toBeCloseTo(20, 5);
        expect(a.y).toBeCloseTo(150, 5);
    });

    it('lo scostamento per gli archi in fascio resta dentro il segmento ospite', () => {
        const l = pointsToPath([{ x: 0, y: 0 }, { x: 0, y: 100 }]);
        // Uno scostamento enorme non porta la label oltre il segmento: il margine
        // la tiene a 12px dagli estremi, cioè dentro il bounding box del tracciato.
        expect(computeLabelAnchor(l, 1000).y).toBeCloseTo(88, 5);
        expect(computeLabelAnchor(l, -1000).y).toBeCloseTo(12, 5);
    });

    it('a pari lunghezza vince il primo segmento: ordine deterministico', () => {
        const symmetric = pointsToPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]);
        const a = computeLabelAnchor(symmetric);
        expect(a.isHorizontal).toBe(true);
        expect(a.x).toBeCloseTo(50, 5);
    });
});

describe('molteplicità dal lato che il tracciato non occupa', () => {
    it('senza tracciato tiene lo scostamento storico, per lato', () => {
        expect(computeCardinalityAnchor(100, 200, 'top', 8))
            .toBe('translate(0%, -100%) translate(104px, 192px)');
        expect(computeCardinalityAnchor(100, 200, 'bottom', 8))
            .toBe('translate(-100%, 0%) translate(96px, 208px)');
        expect(computeCardinalityAnchor(100, 200, 'left', 8))
            .toBe('translate(-100%, 0%) translate(92px, 204px)');
        expect(computeCardinalityAnchor(100, 200, 'right', 8))
            .toBe('translate(0%, -100%) translate(108px, 196px)');
    });

    it('ingresso verticale: se il tracciato arriva da destra, la scatola va a sinistra', () => {
        // Entra dalla cima di un nodo; il tracciato piega da destra.
        const fromRight = [{ x: 300, y: 150 }, { x: 100, y: 150 }, { x: 100, y: 200 }];
        expect(computeCardinalityAnchor(100, 200, 'top', 8, 0, fromRight))
            .toBe('translate(-100%, -100%) translate(96px, 192px)');
    });

    it('ingresso verticale: se arriva da sinistra, la scatola va a destra', () => {
        const fromLeft = [{ x: -100, y: 150 }, { x: 100, y: 150 }, { x: 100, y: 200 }];
        expect(computeCardinalityAnchor(100, 200, 'top', 8, 0, fromLeft))
            .toBe('translate(0%, -100%) translate(104px, 192px)');
    });

    it('ingresso orizzontale: se il tracciato arriva dal basso, la scatola va in alto', () => {
        const fromBelow = [{ x: 50, y: 400 }, { x: 50, y: 200 }, { x: 100, y: 200 }];
        // Entra dal lato sinistro del nodo, il tracciato viene da sotto → scatola sopra.
        expect(computeCardinalityAnchor(100, 200, 'left', 8, 0, fromBelow))
            .toBe('translate(-100%, -100%) translate(92px, 196px)');
    });

    it('tracciato perfettamente perpendicolare: si torna al default del lato', () => {
        const straight = [{ x: 100, y: 100 }, { x: 100, y: 200 }];
        expect(computeCardinalityAnchor(100, 200, 'top', 8, 0, straight))
            .toBe(computeCardinalityAnchor(100, 200, 'top', 8));
    });
});

describe('waypoint sui segmenti terminali', () => {
    // Una L: esce orizzontale da A, entra verticale in B.
    const L = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 300 }];

    it('senza waypoint torna lo stesso riferimento e la mappa identita\'', () => {
        const r = applyWaypointsWithMap(L, []);
        expect(r.points).toBe(L);
        expect(r.segmentMap).toEqual([0, 1]);
    });

    it('un segmento interno si sposta in blocco, come da sempre', () => {
        // Questa e' la semantica preesistente, e resta byte-identica: due punti
        // spostati, nessun punto inserito.
        const Z = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 200 }, { x: 150, y: 200 }];
        const r = applyWaypointsWithMap(Z, [{ segmentIndex: 1, offset: 25 }]);
        expect(pointsToPath(r.points)).toBe('M 0 0 L 75 0 L 75 200 L 150 200');
        expect(r.points).toHaveLength(Z.length);
        expect(r.segmentMap).toEqual([0, 1, 2]);
        // e la vecchia firma concorda con la nuova
        expect(applyWaypoints(Z, [{ segmentIndex: 1, offset: 25 }])).toEqual(r.points);
    });

    it('il primo segmento si sposta con una gomitata, l\'ancora non si muove', () => {
        const r = applyWaypointsWithMap(L, [{ segmentIndex: 0, offset: 20 }]);
        expect(pointsToPath(r.points)).toBe('M 0 0 L 24 0 L 24 20 L 100 20 L 100 300');
        // L'ancora sorgente e' esattamente quella ricevuta...
        expect(r.points[0]).toEqual(L[0]);
        // ...e il tratto che ne esce e' ancora perpendicolare al suo lato.
        expect(r.points[1].y).toBe(L[0].y);
        // La L e' diventata una Z: il segmento interno ora esiste.
        expect(r.points.length).toBeGreaterThan(L.length);
    });

    it('l\'ultimo segmento fa lo stesso dalla parte dell\'arrowhead', () => {
        const r = applyWaypointsWithMap(L, [{ segmentIndex: 1, offset: 30 }]);
        expect(pointsToPath(r.points)).toBe('M 0 0 L 130 0 L 130 276 L 100 276 L 100 300');
        expect(r.points[r.points.length - 1]).toEqual(L[2]);
        // L'ingresso resta verticale, come il lato del target chiede.
        expect(r.points[r.points.length - 2].x).toBe(L[2].x);
    });

    it('la mappa punta al segmento che il waypoint governa davvero', () => {
        const r = applyWaypointsWithMap(L, [{ segmentIndex: 0, offset: 20 }]);
        const segs = getPathSegments(pointsToPath(r.points));
        const governed = segs[r.segmentMap[0]];
        // Il segmento 0 in ingresso e' l'orizzontale spostato a y = 20.
        expect(governed.isHorizontal).toBe(true);
        expect(governed.midY).toBe(20);
    });

    it('con varco stretto la gomitata non supera meta\' del tratto', () => {
        const shortL = [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 300 }];
        const r = applyWaypointsWithMap(shortL, [{ segmentIndex: 0, offset: 12 }]);
        expect(r.points[1].x).toBe(10); // min(MIN_APPROACH_RUN, 20/2)
    });
});

/**
 * Sporgenza minima ai due capi — il contratto di `MIN_APPROACH_RUN`.
 *
 * La misura non si legge dal router ma dal `d` emesso, come tutto il resto del file:
 * la L può diventare una Z, e la Z può guadagnare uno stub da
 * `ensureOrthogonalEndpoints`, quindi il primo e l'ultimo segmento del tracciato
 * finale non sono quelli che il ramo di routing ha scritto.
 */
describe('sporgenza minima ai due capi', () => {
    /** Lunghezze del primo e dell'ultimo segmento del `d`, in pixel Manhattan. */
    const ends = (d: string) => {
        const p = parsePathPoints(d);
        const len = (a: { x: number; y: number }, b: { x: number; y: number }) =>
            Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
        return { first: len(p[0], p[1]), last: len(p[p.length - 2], p[p.length - 1]) };
    };

    it('la L con la curva a ridosso del source ripiega sulla Z', () => {
        // right → top con le due ancore a 10px sull'asse X: la L secca metteva la
        // svolta a 10px dall'ancora sorgente, dentro il raccordo.
        const d = computeManhattanPath(540, 426.5, 'right' as Side, 550, 600, 'top' as Side);
        expect(d).toBe('M 540 426.5 L 570 426.5 L 570 576 L 550 576 L 550 600');
        const { first, last } = ends(d);
        expect(first).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
        expect(last).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
    });

    it('la L con la curva a ridosso del target ripiega sulla Z', () => {
        // Stessa coppia di lati, ancore a 10px sull'asse Y: qui era l'ultimo tratto,
        // quello sotto la punta della freccia, a valere 10px.
        const d = computeManhattanPath(540, 426.5, 'right' as Side, 740, 436.5, 'top' as Side);
        expect(d).toBe('M 540 426.5 L 640 426.5 L 640 412.5 L 740 412.5 L 740 436.5');
        const { first, last } = ends(d);
        expect(first).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
        expect(last).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
    });

    it('la simmetrica col source verticale si comporta allo stesso modo', () => {
        const d = computeManhattanPath(470, 453, 'bottom' as Side, 700, 463, 'left' as Side);
        expect(d).toBe('M 470 453 L 470 483 L 676 483 L 676 463 L 700 463');
        const { first, last } = ends(d);
        expect(first).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
        expect(last).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
    });

    it('la L con entrambi i tratti larghi resta una L a due segmenti', () => {
        // Nessuna regressione sul caso sano: tre punti, come da sempre.
        const d = computeManhattanPath(540, 426.5, 'right' as Side, 740, 600, 'top' as Side);
        expect(d).toBe('M 540 426.5 L 740 426.5 L 740 600');
        expect(parsePathPoints(d)).toHaveLength(3);
    });

    it('la Z con varco ampio tiene la sporgenza su entrambi i capi', () => {
        for (const d of [
            computeManhattanPath(540, 426.5, 'right' as Side, 700, 436.5, 'left' as Side),
            computeManhattanPath(470, 453, 'bottom' as Side, 480, 613, 'top' as Side),
            computeManhattanPath(540, 426.5, 'right' as Side, 700, 466.5, 'left' as Side),
        ]) {
            const { first, last } = ends(d);
            expect(first).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
            expect(last).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
        }
    });

    it('sotto i due run pieni la Z degrada a metà varco, su entrambi gli assi', () => {
        // Varco di 40px < `2 × MIN_APPROACH_RUN`: 20px per capo. È la degradazione
        // dichiarata, e il tracciato è quello di sempre.
        const h = computeManhattanPath(540, 426.5, 'right' as Side, 580, 446.5, 'left' as Side);
        expect(h).toBe('M 540 426.5 L 560 426.5 L 560 446.5 L 580 446.5');
        expect(ends(h)).toEqual({ first: 20, last: 20 });

        const v = computeManhattanPath(470, 453, 'bottom' as Side, 490, 493, 'top' as Side);
        expect(v).toBe('M 470 453 L 470 473 L 490 473 L 490 493');
        expect(ends(v)).toEqual({ first: 20, last: 20 });

        // …e in entrambi i casi metà varco è esattamente il tetto disponibile.
        expect(20).toBe(Math.min(MIN_APPROACH_RUN, 40 / 2));
    });

    it("resta una banda degenere dove lo stub cade sull'ancora del target", () => {
        // Difetto preesistente, non introdotto qui: quando la distanza fra le due
        // ancore vale **esattamente** lo stub, `buildOrthogonalPath` mette i due stub
        // sulla stessa verticale, salta la svolta di raccordo e `cleanPoints` collassa
        // la U a larghezza zero. Prima della modifica la banda stava a 20px (lo stub
        // di allora), ora sta a 24: si è spostata di 4px, non si è allargata.
        const degenere = computeManhattanPath(540, 426.5, 'right' as Side, 564, 426.5, 'top' as Side);
        expect(ends(degenere).last).toBe(0);
        // A 20px, che era la banda vecchia, ora il gancio si disegna.
        const sana = computeManhattanPath(540, 426.5, 'right' as Side, 560, 426.5, 'top' as Side);
        expect(sana).toBe('M 540 426.5 L 564 426.5 L 564 402.5 L 560 402.5 L 560 426.5');
        expect(ends(sana)).toEqual({ first: 24, last: 24 });
    });
});

/**
 * Il connettore d'ereditarietà è fuori da questo lavoro, e questa prova lo tiene
 * fuori: `computeTreeConnectorPath` non passa da `computeManhattanPath` né dagli stub
 * ortogonali, quindi né `MIN_APPROACH_RUN` né `STUB_LENGTH` possono raggiungerlo.
 * I sei `d` sotto sono quelli emessi prima della modifica, copiati byte per byte.
 */
describe("connettore d'ereditarietà: output invariato", () => {
    const branches: TreeBranch[] = [
        { childX: 120, childY: 300, edgeId: 'e1' },
        { childX: 400, childY: 300, edgeId: 'e2' },
        { childX: 660, childY: 340, edgeId: 'e3' },
    ];

    it('tronco, barra e rami sono byte-identici', () => {
        const g = computeTreeConnectorPath(380, 100, branches);
        expect(g.trunkPath).toBe('M 380 200 L 380 100');
        expect(g.barAndBranchesPath).toBe(
            'M 120 300 L 120 200 L 380 200 M 400 300 L 400 200 M 660 340 L 660 200 L 380 200',
        );
        expect(g.junction).toEqual({ x: 380, y: 200 });
        expect(g.branchPaths.get('e1')).toBe('M 380 100 L 380 200 L 120 200 L 120 300');
        expect(g.branchPaths.get('e2')).toBe('M 380 100 L 380 200 L 400 200 L 400 300');
        expect(g.branchPaths.get('e3')).toBe('M 380 100 L 380 200 L 660 200 L 660 340');
    });

    it('anche gli arrotondamenti senza policy restano quelli di prima', () => {
        const g = computeTreeConnectorPath(380, 100, branches);
        expect(roundManhattanPath(g.barAndBranchesPath, 6)).toBe(
            'M 120 300 L 120 206 A 6 6 0 0 1 126 200 L 374 200 A 6 6 0 0 1 386 206 '
            + 'L 394 294 A 6 6 0 0 0 400 294 L 400 206 A 6 6 0 0 1 406 206 L 654 334 '
            + 'A 6 6 0 0 0 660 334 L 660 206 A 6 6 0 0 0 654 200 L 380 200',
        );
        expect(buildFinalPath(parsePathPoints(g.trunkPath), [], 6, 6)).toBe('M 380 200 L 380 100');
    });
});
