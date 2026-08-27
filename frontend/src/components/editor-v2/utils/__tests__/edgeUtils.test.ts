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
    roundManhattanPath,
    buildFinalPath,
    computeManhattanPath,
    computeLabelAnchor,
    computeCardinalityAnchor,
    pointsToPath,
    MARKER_APPROACH_RUN,
    type Side,
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
        // Prima: bend al punto medio, x = 620. Ora: 16px dopo l'ancora, x = 556.
        const d = jogPath(10);
        expect(d).toBe('M 540 426.5 L 556 426.5 L 556 436.5 L 700 436.5');
    });

    it('sopra la soglia il bend torna al punto medio', () => {
        expect(jogPath(40)).toBe('M 540 426.5 L 620 426.5 L 620 466.5 L 700 466.5');
    });

    it('con varco stretto lo scalino non supera il punto medio', () => {
        // Varco di 20px: `min(16, 10)` → il bend resta a metà, come prima.
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
