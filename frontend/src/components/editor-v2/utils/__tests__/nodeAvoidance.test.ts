/**
 * Anti-collisione dei nodi — il passaggio a valle del router (edgeUtils).
 *
 * Le geometrie vengono dalle misure a schermo della Fase A/B del punto 1 canvas
 * (docs/discovery/discovery_2026-08-25_routing_faseA.md): nodi 140x53, gli stessi
 * tre modi di attraversare un corpo, piu' il caso degenere in cui il criterio e'
 * insoddisfacibile e la politica prescrive di tenere il tracciato originale.
 *
 * La prima prova e' quella che regge R0: quando non c'e' violazione la funzione
 * torna **lo stesso riferimento** dell'array in ingresso. E' la byte-identita' dei
 * casi sani dimostrata dove e' deterministica — a schermo non lo e', perche' la
 * scelta dei lati d'ancoraggio dipende dai gesti di trascinamento e non solo dalla
 * geometria finale (misurato: stesse posizioni, lati diversi fra due corse).
 */

import { describe, it, expect } from 'vitest';
import {
    avoidNodeRects,
    AVOID_CLEARANCE,
    computeManhattanPath,
    MIN_APPROACH_RUN,
    parsePathPoints,
    pathBlockingRects,
    snapAxial,
} from '../edgeUtils';

const rect = (x: number, y: number, width = 140, height = 53) => ({ x, y, width, height });

describe('avoidNodeRects', () => {
    it('non tocca un tracciato che non attraversa nulla, e torna lo stesso riferimento', () => {
        const a1 = rect(96, 272);
        const b1 = rect(496, 272);
        const points = [{ x: 240, y: 298.5 }, { x: 492, y: 298.5 }];
        expect(pathBlockingRects(points, [a1, b1])).toHaveLength(0);
        expect(avoidNodeRects(points, [a1, b1])).toBe(points); // identita' di riferimento
    });

    it('aggira un terzo nodo fermo nel corridoio (F1b)', () => {
        const a1 = rect(96, 304);
        const b1 = rect(624, 176);
        const c1 = rect(352, 304);
        // Z prodotto dal router: il tratto orizzontale passa dentro c1.
        const points = [
            { x: 240, y: 330.5 }, { x: 430, y: 330.5 }, { x: 430, y: 202.5 }, { x: 620, y: 202.5 },
        ];
        const rects = [a1, b1, c1];
        expect(pathBlockingRects(points, rects).length).toBeGreaterThan(0);

        const out = avoidNodeRects(points, rects);
        expect(out).not.toBe(points);
        expect(pathBlockingRects(out, rects)).toHaveLength(0);
        expect(out[0]).toEqual(points[0]);
        expect(out[out.length - 1]).toEqual(points[points.length - 1]);
    });

    it('aggira i due corpi quando la U-detour ci passa sopra (F1a / F2)', () => {
        const a1 = rect(288, 288);
        const b1 = rect(384, 352);
        // U-detour di routeOppositeH con il target "dietro": padding fisso da 30px.
        const points = [
            { x: 432, y: 314.5 }, { x: 462, y: 314.5 }, { x: 462, y: 346.5 },
            { x: 350, y: 346.5 }, { x: 350, y: 378.5 }, { x: 380, y: 378.5 },
        ];
        const rects = [a1, b1];
        expect(pathBlockingRects(points, rects).length).toBeGreaterThan(0);

        const out = avoidNodeRects(points, rects);
        expect(out).not.toBe(points);
        expect(pathBlockingRects(out, rects)).toHaveLength(0);
    });

    it('tiene il tracciato originale quando l\'ancoraggio nasce dentro il corpo altrui', () => {
        // Sovrapposizione alla stessa altezza: l'ancoraggio sorgente cade DENTRO il
        // rettangolo del target, quindi nessun tracciato puo' rispettare il criterio.
        const a1 = rect(288, 304);
        const b1 = rect(368, 304);
        const points = [{ x: 432, y: 330.5 }, { x: 364, y: 330.5 }];
        const rects = [a1, b1];
        expect(pathBlockingRects(points, rects).length).toBeGreaterThan(0);
        expect(avoidNodeRects(points, rects)).toBe(points); // degrado dichiarato
    });

    it('non fa nulla senza rettangoli, e si arrende oltre il tetto di ostacoli', () => {
        const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
        expect(avoidNodeRects(points, [])).toBe(points);
        const many = Array.from({ length: 40 }, (_, i) => rect(i * 10, 0, 20, 20));
        expect(avoidNodeRects(points, many)).toBe(points);
    });
});

describe('ortogonalita\' del ri-instradamento', () => {
    /** Ogni segmento della polilinea e' assiale: x1 === x2 oppure y1 === y2. */
    const nonAxial = (pts: { x: number; y: number }[]) => {
        const out: string[] = [];
        for (let i = 1; i < pts.length; i++) {
            const dx = Math.abs(pts[i].x - pts[i - 1].x);
            const dy = Math.abs(pts[i].y - pts[i - 1].y);
            if (dx > 0.01 && dy > 0.01) out.push(`(${pts[i - 1].x},${pts[i - 1].y})->(${pts[i].x},${pts[i].y})`);
        }
        return out;
    };

    it('con ancore a coordinate frazionarie il tracciato resta assiale', () => {
        // Le ancore hanno coordinate frazionarie per costruzione: `computeSidePositions`
        // distribuisce a `(k+1)/(N+1)` dell'altezza del nodo, e su un nodo alto 53 con
        // due ancore la y e' `…,6666`. Prima della correzione la griglia delle corsie
        // arrotondava al mezzo pixel anche gli stub, e il primo segmento usciva
        // inclinato di frazioni di pixel — misurato a schermo, 5 archi su 18.
        const a1 = rect(96, 304);
        const b1 = rect(624, 176);
        const c1 = rect(352, 304);          // nel corridoio: forza il ri-instradamento
        const sy = 304 + 53 / 3;            // 321.6666…
        const ty = 176 + 53 * 2 / 3;        // 211.3333…
        const points = [
            { x: 236, y: sy }, { x: 430, y: sy }, { x: 430, y: ty }, { x: 620, y: ty },
        ];
        const rects = [a1, b1, c1];
        expect(pathBlockingRects(points, rects).length).toBeGreaterThan(0);

        const out = avoidNodeRects(points, rects);
        expect(out).not.toBe(points);
        expect(nonAxial(out)).toEqual([]);
        // I due estremi restano esattamente quelli ricevuti: sono gli ancoraggi.
        expect(out[0]).toEqual(points[0]);
        expect(out[out.length - 1]).toEqual(points[points.length - 1]);
    });

    it('snapAxial non tocca una polilinea gia\' assiale, e torna lo stesso riferimento', () => {
        const clean = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }];
        expect(snapAxial(clean)).toBe(clean);
    });

    it('snapAxial appiattisce lo scarto di quantizzazione senza muovere gli estremi', () => {
        const skewed = [
            { x: 0, y: 10.3333 }, { x: 100, y: 10.5 }, { x: 100, y: 200 }, { x: 240.25, y: 200.4 },
        ];
        const out = snapAxial(skewed);
        expect(out).not.toBe(skewed);
        expect(out[0]).toEqual(skewed[0]);
        expect(out[out.length - 1]).toEqual(skewed[skewed.length - 1]);
        // primo segmento orizzontale sulla y del primo punto, ultimo sulla y dell'ultimo
        expect(out[1].y).toBe(skewed[0].y);
        expect(out[2].y).toBe(skewed[3].y);
    });

    it('snapAxial lascia stare una svolta vera, sopra la tolleranza', () => {
        const real = [{ x: 0, y: 0 }, { x: 100, y: 40 }];
        expect(snapAxial(real)).toBe(real);
    });
});

/**
 * Sporgenza dei terminali nel ri-instradamento.
 *
 * Il ri-instradamento **ricostruisce** i due tratti terminali: il router puo' aver dato
 * 300px di approccio e l'evitamento li riduce alla lunghezza del proprio stub. Misurato
 * il 2026-08-29 sulla scena densa: dodici archi su diciotto passano di qui, e tutti e
 * dodici ne uscivano con il terminale a esattamente 12px, il vecchio valore fisso.
 *
 * Le misure sono sulla polilinea prodotta, non sul valore della costante.
 */
describe('sporgenza dei terminali nel ri-instradamento', () => {
    const runs = (pts: { x: number; y: number }[]) => {
        const len = (a: { x: number; y: number }, b: { x: number; y: number }) =>
            Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
        return { first: len(pts[0], pts[1]), last: len(pts[pts.length - 2], pts[pts.length - 1]) };
    };

    it('i due tratti valgono MIN_APPROACH_RUN, non piu\' lo stub storico da 12', () => {
        const a1 = rect(96, 304);
        const b1 = rect(624, 176);
        const c1 = rect(352, 304);          // nel corridoio: forza il ri-instradamento
        const points = [
            { x: 240, y: 330.5 }, { x: 430, y: 330.5 }, { x: 430, y: 202.5 }, { x: 620, y: 202.5 },
        ];
        const rects = [a1, b1, c1];
        const out = avoidNodeRects(points, rects);
        expect(out).not.toBe(points);
        expect(pathBlockingRects(out, rects)).toHaveLength(0);
        expect(runs(out).first).toBe(MIN_APPROACH_RUN);
        // Il capo d'uscita ne prende **di piu'**: lo stub e' collineare con la corsa
        // che lo precede e `cleanPoints` li fonde. Il contratto e' una soglia, non
        // un'uguaglianza.
        expect(runs(out).last).toBeGreaterThanOrEqual(MIN_APPROACH_RUN);
    });

    it('degrada a meta\' quando la sporgenza piena nascerebbe dentro un corpo', () => {
        // Il bordo destro dell'ostacolo sta a 402: `432 − 24 = 408` cade dentro il
        // margine di rilevazione, `432 − 12 = 420` no. Si prende il gradino sotto
        // invece di rinunciare a deviare.
        const near = rect(262, 300);        // bordo destro a 402
        const mid = rect(200, 304);         // nel corridoio: forza il ri-instradamento
        const points = [{ x: 432, y: 330.5 }, { x: 100, y: 330.5 }];
        const rects = [near, mid];
        expect(pathBlockingRects(points, rects).length).toBeGreaterThan(0);
        const out = avoidNodeRects(points, rects);
        expect(out).not.toBe(points);
        expect(runs(out).first).toBe(MIN_APPROACH_RUN / 2);
    });

    it('con lo spazio libero prende la sporgenza piena', () => {
        // Stessa scena, ostacolo 10px piu' lontano: ora i 24px ci stanno.
        const near = rect(252, 300);        // bordo destro a 392
        const mid = rect(200, 304);
        const points = [{ x: 432, y: 330.5 }, { x: 100, y: 330.5 }];
        const out = avoidNodeRects(points, [near, mid]);
        expect(out).not.toBe(points);
        expect(runs(out).first).toBe(MIN_APPROACH_RUN);
    });

    it('sotto anche il gradino minimo si tiene il tracciato, come prima', () => {
        // Bordo destro a 422: nemmeno 12px liberano l'ancora. E' la degradazione
        // dichiarata di sempre, non introdotta qui.
        const near = rect(282, 300);
        const mid = rect(200, 304);
        const points = [{ x: 432, y: 330.5 }, { x: 100, y: 330.5 }];
        const rects = [near, mid];
        expect(pathBlockingRects(points, rects).length).toBeGreaterThan(0);
        expect(avoidNodeRects(points, rects)).toBe(points);
    });

    it('le corsie interne restano alla clearance di prima', () => {
        // La sporgenza cresce ai due capi; i corridoi intermedi no. Sulla U-detour che
        // passa sopra due corpi il tracciato ne aggira uno, e le due corsie che usa
        // stanno esattamente a `bordo + AVOID_CLEARANCE + 1`, come prima.
        const a1 = rect(288, 288);
        const b1 = rect(384, 352);
        const points = [
            { x: 432, y: 314.5 }, { x: 462, y: 314.5 }, { x: 462, y: 346.5 },
            { x: 350, y: 346.5 }, { x: 350, y: 378.5 }, { x: 380, y: 378.5 },
        ];
        const rects = [a1, b1];
        const out = avoidNodeRects(points, rects);
        expect(pathBlockingRects(out, rects)).toHaveLength(0);
        const lane = AVOID_CLEARANCE + 1;
        expect(out.map((p) => p.x)).toContain(b1.x + b1.width + lane);
        expect(out.map((p) => p.y)).toContain(b1.y + b1.height + lane);
    });

    it('la fetta di pipeline che stampava 12px sulla scena densa', () => {
        // Input veri, letti dal DOM il 2026-08-29: l'arco `…USER_101`, `left → top`.
        // Il router lo manda a 316px prima di svoltare; l'evitamento lo ricostruisce
        // perche' quel corridoio attraversa due corpi.
        const rects = [
            { x: 50, y: 50, width: 239.5, height: 281 },
            { x: 470, y: 50, width: 209.03, height: 107 },
            { x: 890, y: 50, width: 236.38, height: 194 },
            { x: 50, y: 350, width: 200, height: 78 },
            { x: 470, y: 350, width: 200, height: 78 },
        ];
        const routed = parsePathPoints(computeManhattanPath(886, 147, 'left', 570, 346, 'top'));
        expect(runs(routed).first).toBe(316);
        const out = avoidNodeRects(routed, rects);
        expect(out).not.toBe(routed);
        expect(pathBlockingRects(out, rects)).toHaveLength(0);
        expect(runs(out).first).toBe(MIN_APPROACH_RUN);
        expect(runs(out).last).toBe(MIN_APPROACH_RUN);
    });
});
