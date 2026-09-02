/**
 * Scelta dei lati d'ancoraggio — un caso per quadrante.
 *
 * Le prove asserzionano quello che il criterio ratificato il 2026-08-27 promette:
 * lato d'uscita e d'ingresso attesi, tetto di svolte, e **nessun segmento dentro i
 * due corpi**. Quest'ultima è la condizione che il report del 2026-08-27 §4.2 ha
 * misurato violata dalla vecchia regola «tipo diverso sulla stessa coppia».
 *
 * Le geometrie sono quelle della sonda di Fase A (`nodeAvoidance.test.ts` usa le
 * stesse): nodi 140x53, il formato neutro del canvas.
 *
 * Le svolte non si contano leggendo il comparatore ma eseguendo il router
 * (CLAUDE.md §5, sotto-regola «do not validate sorts by reading the comparator»):
 * ogni prova ricostruisce la polilinea con `computeManhattanPath` sui centri di lato
 * scelti e misura su quella.
 */
import { describe, it, expect } from 'vitest';
import { chooseEdgeSides, measureSidePair, rankSidePairs, sideCentre, type RouteRect } from '../edgeRouting';
import { computeManhattanPath, parsePathPoints, type Side } from '../edgeUtils';

const NODE = { width: 140, height: 53 };
const rect = (x: number, y: number): RouteRect => ({ x, y, ...NODE });

/** Il nodo di riferimento: tutti i casi muovono l'altro attorno a questo. */
const A = rect(400, 400);

/** Polilinea effettivamente disegnata fra i due centri di lato scelti. */
function polyline(source: RouteRect, target: RouteRect, sides: { sourceSide: Side; targetSide: Side }) {
    const sp = sideCentre(source, sides.sourceSide);
    const tp = sideCentre(target, sides.targetSide);
    return parsePathPoints(
        computeManhattanPath(sp.x, sp.y, sides.sourceSide, tp.x, tp.y, sides.targetSide),
    );
}

const turnsOf = (points: { x: number; y: number }[]) => Math.max(0, points.length - 2);

/** Quanti segmenti entrano in uno dei due rettangoli, saltando gli 8px di stub. */
function bodyHits(points: { x: number; y: number }[], rects: RouteRect[]): number {
    const STUB = 8;
    let hits = 0;
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
        // Il primo e l'ultimo segmento escono dal proprio nodo: si guarda solo la
        // parte oltre la finestra di stub, e se il segmento è tutto lì dentro si salta.
        const isEnd = i === 1 || i === points.length - 1;
        if (isEnd && len <= STUB) continue;
        for (const r of rects) {
            const x1 = Math.min(a.x, b.x);
            const x2 = Math.max(a.x, b.x);
            const y1 = Math.min(a.y, b.y);
            const y2 = Math.max(a.y, b.y);
            // Margine negativo: il tocco del bordo (l'ancora ci sta sopra) non conta.
            if (x2 > r.x + 1 && x1 < r.x + r.width - 1 && y2 > r.y + 1 && y1 < r.y + r.height - 1) hits++;
        }
    }
    return hits;
}

describe('chooseEdgeSides — un caso per quadrante', () => {
    const cases: Array<{
        name: string;
        b: RouteRect;
        sourceSide: Side;
        targetSide: Side;
        maxTurns: number;
    }> = [
        // Frontali: la verticale e l'orizzontale dirette restano quelle di sempre.
        { name: 'B sotto', b: rect(400, 600), sourceSide: 'bottom', targetSide: 'top', maxTurns: 0 },
        { name: 'B sopra', b: rect(400, 200), sourceSide: 'top', targetSide: 'bottom', maxTurns: 0 },
        { name: 'B a destra', b: rect(700, 400), sourceSide: 'right', targetSide: 'left', maxTurns: 0 },
        { name: 'B a sinistra', b: rect(100, 400), sourceSide: 'left', targetSide: 'right', maxTurns: 0 },
        // Diagonali: una sola svolta, uscita sull'asse dominante (|dx| = 300 > |dy| = 200).
        { name: 'B a nord-est', b: rect(700, 200), sourceSide: 'right', targetSide: 'bottom', maxTurns: 1 },
        { name: 'B a nord-ovest', b: rect(100, 200), sourceSide: 'left', targetSide: 'bottom', maxTurns: 1 },
        { name: 'B a sud-est', b: rect(700, 600), sourceSide: 'right', targetSide: 'top', maxTurns: 1 },
        { name: 'B a sud-ovest', b: rect(100, 600), sourceSide: 'left', targetSide: 'top', maxTurns: 1 },
    ];

    for (const c of cases) {
        it(`${c.name}: ${c.sourceSide} → ${c.targetSide}, al più ${c.maxTurns} svolte, fuori dai corpi`, () => {
            const chosen = chooseEdgeSides(A, c.b);
            expect(chosen.sourceSide).toBe(c.sourceSide);
            expect(chosen.targetSide).toBe(c.targetSide);

            const points = polyline(A, c.b, chosen);
            expect(turnsOf(points)).toBeLessThanOrEqual(c.maxTurns);
            expect(bodyHits(points, [A, c.b])).toBe(0);
        });
    }

    it('mai un wrap-around: nessun quadrante sceglie lo stesso lato su entrambi i capi', () => {
        for (const c of cases) {
            const chosen = chooseEdgeSides(A, c.b);
            expect(chosen.sourceSide).not.toBe(chosen.targetSide);
        }
    });

    it('sulla diagonale la L a una svolta batte la Z più corta (decisione A)', () => {
        // NE: right→bottom fa 1 svolta e 404px, right→left ne fa 2 in 360px.
        // Il criterio mette le svolte prima della lunghezza: vince la L, più lunga.
        const B = rect(700, 200);
        const l = measureSidePair(A, B, 'right', 'bottom');
        const z = measureSidePair(A, B, 'right', 'left');
        expect(l.turns).toBeLessThan(z.turns);
        expect(l.length).toBeGreaterThan(z.length);
        expect(chooseEdgeSides(A, B)).toEqual({ sourceSide: 'right', targetSide: 'bottom' });
    });

    it("lo spareggio va all'asse dominante quando svolte e lunghezza pareggiano (decisione B)", () => {
        // Su NE `top→left` e `right→bottom` pareggiano su entrambi i criteri.
        const B = rect(700, 200);
        const viaSide = measureSidePair(A, B, 'right', 'bottom');
        const viaTop = measureSidePair(A, B, 'top', 'left');
        expect(viaSide.turns).toBe(viaTop.turns);
        expect(Math.abs(viaSide.length - viaTop.length)).toBeLessThanOrEqual(0.5);
        // |dx| = 300 > |dy| = 200 → l'asse dominante è orizzontale, si esce di fianco.
        expect(viaSide.onDominantAxis).toBe(true);
        expect(viaTop.onDominantAxis).toBe(false);
        expect(chooseEdgeSides(A, B).sourceSide).toBe('right');
    });
});

describe('chooseEdgeSides — corpi e stabilità', () => {
    it('scarta gli accoppiamenti il cui tracciato entra in un corpo', () => {
        // Due box affiancati con un varco negativo: è la configurazione in cui la
        // vecchia U collassava in una retta dentro il target (report §4.2, riga 5).
        const B = rect(512, 400); // 28px di sovrapposizione orizzontale con A
        const ranked = rankSidePairs(A, B);
        expect(ranked[0].blocked).toBe(false);
        const points = polyline(A, B, ranked[0]);
        expect(bodyHits(points, [A, B])).toBe(0);
    });

    it('resta sulla coppia corrente quando il guadagno è sotto il margine', () => {
        // B a est: `right → left` è ottimo. Partendo già da lì non ci si muove.
        const B = rect(700, 400);
        expect(chooseEdgeSides(A, B, { current: { sourceSide: 'right', targetSide: 'left' } }))
            .toEqual({ sourceSide: 'right', targetSide: 'left' });
    });

    it('abbandona una coppia con più svolte, quale che sia il margine', () => {
        // La coppia congelata dalla vecchia dead zone: `top → bottom` con B a est.
        // Ha più svolte del frontale, quindi si cambia comunque.
        const B = rect(700, 400);
        expect(chooseEdgeSides(A, B, { current: { sourceSide: 'top', targetSide: 'bottom' } }))
            .toEqual({ sourceSide: 'right', targetSide: 'left' });
    });

    it('senza coppia corrente non ripiega su right → right', () => {
        // Il difetto misurato: `getBaseSide(null)` valeva `right` su entrambi i capi e
        // la dead zone lo congelava, producendo la U attorno al target.
        for (const c of [rect(700, 200), rect(100, 200), rect(700, 600), rect(100, 600)]) {
            const chosen = chooseEdgeSides(A, c);
            expect(`${chosen.sourceSide}→${chosen.targetSide}`).not.toBe('right→right');
        }
    });

    it("il veto di capienza scavalca l'inerzia della coppia corrente", () => {
        const B = rect(700, 400);
        const deny = (p: { sourceSide: Side; targetSide: Side }) =>
            p.sourceSide === 'right' && p.targetSide === 'left';
        const chosen = chooseEdgeSides(A, B, {
            current: { sourceSide: 'right', targetSide: 'left' },
            deny,
        });
        expect(`${chosen.sourceSide}→${chosen.targetSide}`).not.toBe('right→left');
    });

    it("l'occupazione spareggia solo fra pari merito, non scavalca la geometria", () => {
        const B = rect(700, 400);
        // Un'occupazione altissima sul frontale non basta a spostare l'arco: quel
        // candidato vince gia' su svolte e lunghezza, dove l'occupazione non arriva.
        const chosen = chooseEdgeSides(A, B, {
            occupancy: p => (p.sourceSide === 'right' && p.targetSide === 'left' ? 1000 : 0),
        });
        expect(chosen).toEqual({ sourceSide: 'right', targetSide: 'left' });
    });
});
