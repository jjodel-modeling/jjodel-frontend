/**
 * Equivalenza del registry con i predicati storici.
 *
 * Il registry (shapeRegistry.ts) tabellizza quattro casi speciali che prima
 * vivevano sparsi: il ramo `isDiamond` di IRNodeContent, la mappa DIAMOND_DASH,
 * il gate `defaultResizableForForm` e il `keepAspectRatio` di ObjectNode.
 * Questi test confrontano la tabella con i predicati che sostituisce, scritti
 * qui in forma letterale. Non sono uno specchio del registry: sono la copia del
 * comportamento PRECEDENTE, ed e' quello che devono continuare a descrivere.
 */

import { describe, it, expect } from 'vitest';
import type { ShapeForm } from '../irTypes';
import type { ShapeSizing } from '../shapeRegistry';
import {
    SHAPE_REGISTRY, SVG_BORDER_DASH, getShapeDescriptor,
    contentRect, boxForContent, boxForContentNumeric,
    boxFromIntrinsic, hasSizeSupplement, MEASURE_SLACK,
} from '../shapeRegistry';

const ALL_FORMS: ShapeForm[] = ['rect', 'rounded', 'ellipse', 'circle', 'diamond'];

/** Predicato storico: nodeSizing.ts prima del registry. */
const wasResizable = (f: ShapeForm | undefined) => f === 'ellipse' || f === 'circle' || f === 'diamond';
/** Predicato storico: ObjectNode.tsx prima del registry. */
const wasAspectLocked = (f: ShapeForm | undefined) => f === 'circle';
/** Predicato storico: IRNodeContent.tsx prima del registry. */
const wasSvgPainted = (f: ShapeForm | undefined) => f === 'diamond';

describe('shapeRegistry', () => {
    it('copre ogni ShapeForm, con id coerente con la chiave', () => {
        for (const form of ALL_FORMS) {
            expect(SHAPE_REGISTRY[form]).toBeDefined();
            expect(SHAPE_REGISTRY[form].id).toBe(form);
        }
        expect(Object.keys(SHAPE_REGISTRY).sort()).toEqual([...ALL_FORMS].sort());
    });

    it('riproduce il gate di resize precedente', () => {
        for (const form of ALL_FORMS) {
            expect(getShapeDescriptor(form).defaultResizable).toBe(wasResizable(form));
        }
    });

    it('riproduce il lock di aspect ratio precedente', () => {
        for (const form of ALL_FORMS) {
            expect(getShapeDescriptor(form).keepAspectRatio).toBe(wasAspectLocked(form));
        }
    });

    it('riproduce quali forme sono dipinte in SVG', () => {
        for (const form of ALL_FORMS) {
            expect(getShapeDescriptor(form).painter.kind === 'svg').toBe(wasSvgPainted(form));
        }
    });

    it('conserva il poligono e la classe del diamante', () => {
        const painter = SHAPE_REGISTRY.diamond.painter;
        expect(painter.kind).toBe('svg');
        if (painter.kind !== 'svg') return;
        expect(painter.points).toBe('50,0 100,50 50,100 0,50');
        expect(painter.svgClassName).toBe('ir-diamond-svg');
    });

    it('conserva la mappa dei tratteggi (ex DIAMOND_DASH)', () => {
        expect(SVG_BORDER_DASH.solid).toBeUndefined();
        expect(SVG_BORDER_DASH.dashed).toBe('6 4');
        expect(SVG_BORDER_DASH.dotted).toBe('1 4');
        expect(SVG_BORDER_DASH['stile-inesistente']).toBeUndefined();
    });

    it('rientro nullo per le forme che riempiono il box', () => {
        for (const form of ['rect', 'rounded'] as ShapeForm[]) {
            for (const t of [0, 0.25, 0.5, 0.75, 1]) {
                expect(getShapeDescriptor(form).insetFractionAt(t)).toBe(0);
            }
        }
    });

    it('rombo: rientro lineare dalla mezzeria', () => {
        const f = getShapeDescriptor('diamond').insetFractionAt;
        expect(f(0.5)).toBe(0);          // vertice del rombo, sulla mezzeria del lato
        expect(f(0.25)).toBeCloseTo(0.25, 10);
        expect(f(0.75)).toBeCloseTo(0.25, 10);
        expect(f(0)).toBeCloseTo(0.5, 10);   // spigolo del box: il rombo e' al centro
        expect(f(1)).toBeCloseTo(0.5, 10);
    });

    it('ellisse e cerchio: rientro secondo la radice, non lineare', () => {
        for (const form of ['ellipse', 'circle'] as ShapeForm[]) {
            const f = getShapeDescriptor(form).insetFractionAt;
            expect(f(0.5)).toBe(0);
            // u = -0.5 -> (1 - sqrt(0.75)) / 2
            expect(f(0.25)).toBeCloseTo((1 - Math.sqrt(0.75)) / 2, 10);
            expect(f(0.75)).toBeCloseTo((1 - Math.sqrt(0.75)) / 2, 10);
            expect(f(0)).toBeCloseTo(0.5, 10);
            // sempre piu' dentro del rombo alla stessa quota: l'ellisse e' piu' larga
            expect(f(0.25)).toBeLessThan(getShapeDescriptor('diamond').insetFractionAt(0.25));
        }
    });

    it('rientro simmetrico e limitato a [0, 0.5] su tutte le forme', () => {
        for (const form of ALL_FORMS) {
            const f = getShapeDescriptor(form).insetFractionAt;
            for (let i = 0; i <= 20; i++) {
                const t = i / 20;
                const v = f(t);
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(0.5);
                expect(v).toBeCloseTo(f(1 - t), 10);
            }
        }
    });

    it('input degeneri non producono NaN', () => {
        for (const form of ALL_FORMS) {
            const f = getShapeDescriptor(form).insetFractionAt;
            for (const t of [NaN, Infinity, -Infinity, -3, 7]) {
                expect(Number.isFinite(f(t))).toBe(true);
            }
            expect(f(NaN)).toBe(0);   // ricade sulla mezzeria
        }
    });

    it('forma assente o sconosciuta ricade su rect, come prima', () => {
        expect(getShapeDescriptor(undefined).id).toBe('rect');
        expect(getShapeDescriptor(undefined).defaultResizable).toBe(wasResizable(undefined));
        expect(getShapeDescriptor(undefined).keepAspectRatio).toBe(wasAspectLocked(undefined));
        expect(getShapeDescriptor(undefined).insetFractionAt(0.25)).toBe(0);
        expect(getShapeDescriptor('nope' as ShapeForm).id).toBe('rect');
    });
});

/**
 * Content rectangle and its inverse.
 *
 * These are not equivalence tests: there is no previous behaviour to preserve,
 * the geometry is new. They pin three different things. The golden cases come
 * from the measurement on the running app (eight out of eight with the ink
 * inside the outline) and would catch a change of formula. The agreement
 * between the closed form and the numeric inverse would catch an algebra slip
 * in either. The containment property would catch both at once, on inputs
 * nobody measured.
 */
describe('shapeRegistry: taglia da contenuto', () => {
    /** Half-width profile as a function of the band, `v` in [0,1]. */
    const availableAt = (form: ShapeForm, v: number) =>
        1 - 2 * getShapeDescriptor(form).insetFractionAt(0.5 + v / 2);

    const CONTENT_GRID: Array<[number, number]> = [
        [0, 0], [1, 1], [27, 14], [60, 43], [114, 14], [188, 14], [300, 60], [12, 120], [1000, 11],
    ];

    it('heightFactor e il reciproco dell argmax di v*avail(v), non un numero scelto', () => {
        // Il supplemento verticale e' geometria: il rettangolo inscritto di area
        // massima ha altezza v* volte quella del box, quindi per ospitare un
        // contenuto alto ch serve un box alto ch/v*. Ricerca a griglia, l'argmax
        // e' entro un passo dal migliore punto campionato.
        for (const form of ALL_FORMS) {
            let best = 0;
            let argmax = 1;
            for (let i = 1; i <= 10000; i++) {
                const v = i / 10000;
                const area = v * availableAt(form, v);
                if (area > best) { best = area; argmax = v; }
            }
            expect(1 / argmax).toBeCloseTo(SHAPE_REGISTRY[form].sizing.heightFactor, 2);
        }
    });

    it('riproduce gli otto casi misurati sull applicazione', () => {
        // Politica della misura: H_min 48. Passata esplicitamente perche' il
        // valore in tabella e' una decisione aperta e i numeri qui no.
        const measured = (form: ShapeForm): ShapeSizing =>
            ({ ...SHAPE_REGISTRY[form].sizing, minBoxHeight: 48 });
        const cases: Array<[ShapeForm, number, number, number, number]> = [
            ['ellipse', 27, 14, 39, 48],
            ['ellipse', 114, 14, 120, 48],
            ['ellipse', 188, 14, 197, 48],
            ['ellipse', 60, 43, 85, 61],
            ['diamond', 27, 14, 39, 48],
            ['diamond', 114, 14, 161, 48],
            ['diamond', 188, 14, 266, 48],
            ['diamond', 60, 43, 120, 86],
        ];
        for (const [form, cw, ch, w, h] of cases) {
            expect(boxForContent(getShapeDescriptor(form), cw, ch, measured(form))).toEqual({ w, h });
        }
    });

    it('forma chiusa e inversa numerica danno lo stesso box', () => {
        for (const form of ALL_FORMS) {
            const desc = getShapeDescriptor(form);
            for (const [cw, ch] of CONTENT_GRID) {
                expect(boxForContentNumeric(desc, cw, ch)).toEqual(boxForContent(desc, cw, ch));
            }
        }
    });

    it('il box restituito contiene davvero il contenuto', () => {
        for (const form of ALL_FORMS) {
            const desc = getShapeDescriptor(form);
            for (const [cw, ch] of CONTENT_GRID) {
                const box = boxForContent(desc, cw, ch);
                const usable = contentRect(desc, box.w, box.h, ch);
                expect(box.h).toBeGreaterThanOrEqual(ch);
                // Arrotondamento per eccesso: mai sotto, nemmeno di un decimo di pixel.
                expect(usable.w).toBeGreaterThanOrEqual(cw);
                expect(usable.h).toBe(ch);
            }
        }
    });

    it('nessuna forma in tabella arriva alla guardia di larghezza nulla', () => {
        // La guardia in boxForContent scatta se la banda riempie il box, cioe' se
        // heightFactor e' troppo piccolo per il profilo della forma. Qui non deve
        // mai succedere, altrimenti il box tornerebbe dalla via degenere.
        for (const form of ALL_FORMS) {
            const desc = getShapeDescriptor(form);
            for (const [, ch] of CONTENT_GRID) {
                const box = boxForContent(desc, 100, ch);
                expect(contentRect(desc, 1000, box.h, ch).w).toBeGreaterThan(0);
            }
        }
    });

    it('rect e rounded: identita, salvo i pavimenti gia in CSS', () => {
        for (const form of ['rect', 'rounded'] as ShapeForm[]) {
            const desc = getShapeDescriptor(form);
            for (const [cw, ch] of CONTENT_GRID) {
                expect(boxForContent(desc, cw, ch)).toEqual({
                    w: Math.max(140, Math.ceil(cw)),   // irStyle.ts min-width
                    h: Math.max(40, Math.ceil(ch)),    // irStyle.ts min-height
                });
            }
            // e il contorno non toglie nulla al contenuto, a nessuna banda
            for (const ch of [0, 10, 40, 80]) {
                expect(contentRect(desc, 170, 80, ch).w).toBe(170);
                expect(contentRect(desc, 170, 80, ch).x).toBe(0);
            }
        }
    });

    it('il cerchio resta quadrato', () => {
        const desc = getShapeDescriptor('circle');
        for (const [cw, ch] of CONTENT_GRID) {
            const box = boxForContent(desc, cw, ch);
            expect(box.w).toBe(box.h);
        }
    });

    it('contentRect segue le formule di banda note, e non il rettangolo inscritto', () => {
        // Riga singola alta 14 in un nodo 170x80 (il caso misurato).
        const w = 170, h = 80, hL = 14;
        const ellipse = contentRect(getShapeDescriptor('ellipse'), w, h, hL);
        const diamond = contentRect(getShapeDescriptor('diamond'), w, h, hL);
        expect(ellipse.w).toBeCloseTo(w * Math.sqrt(1 - (hL / h) ** 2), 6);
        expect(diamond.w).toBeCloseTo(w * (1 - hL / h), 6);
        // Il rettangolo inscritto statico darebbe 120,2 e 85: molto meno.
        expect(ellipse.w).toBeGreaterThan(w / Math.SQRT2);
        expect(diamond.w).toBeGreaterThan(w / 2);
    });

    it('contentRect e centrato e si stringe al crescere della banda', () => {
        for (const form of ALL_FORMS) {
            const desc = getShapeDescriptor(form);
            let previous = Infinity;
            for (const ch of [0, 10, 20, 40, 60, 80]) {
                const r = contentRect(desc, 170, 80, ch);
                expect(r.x).toBeCloseTo((170 - r.w) / 2, 10);
                expect(r.y).toBeCloseTo((80 - ch) / 2, 10);
                expect(r.w).toBeLessThanOrEqual(previous + 1e-9);
                previous = r.w;
            }
        }
    });

    it('input degeneri non producono NaN ne misure negative', () => {
        for (const form of ALL_FORMS) {
            const desc = getShapeDescriptor(form);
            for (const bad of [NaN, Infinity, -Infinity, -50]) {
                const box = boxForContent(desc, bad, bad);
                expect(Number.isFinite(box.w) && Number.isFinite(box.h)).toBe(true);
                expect(box.w).toBeGreaterThanOrEqual(0);
                expect(box.h).toBeGreaterThanOrEqual(0);
                const r = contentRect(desc, bad, bad, bad);
                expect(Number.isFinite(r.x) && Number.isFinite(r.y)).toBe(true);
                expect(r.w).toBeGreaterThanOrEqual(0);
                expect(r.h).toBeGreaterThanOrEqual(0);
            }
            // contenuto piu' alto del box: larghezza nulla, non negativa
            expect(contentRect(desc, 170, 80, 500).h).toBe(80);
            expect(contentRect(desc, 170, 80, 500).w).toBeGreaterThanOrEqual(0);
        }
    });
});

/**
 * Da una misura del DOM al box (cablaggio D8/D9, 2026-08-15).
 *
 * `boxFromIntrinsic` e' l'anello fra la misura presa da useContentSize e il
 * contratto. Il caso che ha motivato la funzione: su `rect` la regola degenera
 * nell'identita' e nulla assorbe la differenza fra coordinate del contenuto e
 * border box, quindi il box tornava piu' stretto del contenuto di esattamente i
 * due bordi da 1px (misurato: 170 contro 172 necessari).
 */
describe('shapeRegistry: dalla misura del DOM al box', () => {
    /** Chrome tipico di .ir-node-content: bordo 1px, nessun padding. */
    const CHROME = { chromeX: 2, chromeY: 2 };
    const MEASURES = [
        { w: 40, h: 20, ...CHROME },
        { w: 172, h: 42, ...CHROME },
        { w: 294, h: 72, ...CHROME },
        { w: 60, h: 300, ...CHROME },
        // bordo `double` a 3px per lato, il caso in cui il chrome non e' 2
        { w: 172, h: 42, chromeX: 6, chromeY: 6 },
        // chrome asimmetrico: non si presenta oggi, ma il cerchio ci si appoggia
        { w: 172, h: 42, chromeX: 2, chromeY: 10 },
    ];

    it('quali forme portano un supplemento', () => {
        expect(ALL_FORMS.filter(f => hasSizeSupplement(getShapeDescriptor(f))))
            .toEqual(['ellipse', 'circle', 'diamond']);
    });

    it('il box non e\' mai piu\' piccolo del contenuto misurato', () => {
        for (const form of ALL_FORMS) {
            const desc = getShapeDescriptor(form);
            for (const m of MEASURES) {
                const box = boxFromIntrinsic(desc, m);
                expect(box.w, `${form} ${m.w}x${m.h} chrome ${m.chromeX}`).toBeGreaterThanOrEqual(m.w);
                expect(box.h, `${form} ${m.w}x${m.h} chrome ${m.chromeY}`).toBeGreaterThanOrEqual(m.h);
            }
        }
    });

    it('l\'inchiostro sta dentro il contorno alla banda che occupa', () => {
        for (const form of ALL_FORMS) {
            const desc = getShapeDescriptor(form);
            for (const m of MEASURES) {
                const inkW = m.w - m.chromeX + MEASURE_SLACK;
                const inkH = m.h - m.chromeY + MEASURE_SLACK;
                const bare = boxForContent(desc, inkW, inkH);
                expect(contentRect(desc, bare.w, bare.h, inkH).w, `${form} ${m.w}x${m.h}`)
                    .toBeGreaterThanOrEqual(inkW - 1e-9);
            }
        }
    });

    it('il chrome si somma dopo il supplemento, non prima', () => {
        // Sommarlo prima lo farebbe moltiplicare per heightFactor (2 sul rombo).
        const desc = getShapeDescriptor('diamond');
        const bare = boxForContent(desc, 100 + MEASURE_SLACK, 20 + MEASURE_SLACK);
        expect(boxFromIntrinsic(desc, { w: 102, h: 22, chromeX: 2, chromeY: 2 }))
            .toEqual({ w: bare.w + 2, h: bare.h + 2 });
    });

    it('il cerchio resta quadrato anche con chrome asimmetrico', () => {
        const box = boxFromIntrinsic(getShapeDescriptor('circle'), { w: 172, h: 42, chromeX: 2, chromeY: 10 });
        expect(box.w).toBe(box.h);
    });

    it('le forme che riempiono il box conservano i floor del content-hug', () => {
        for (const form of ['rect', 'rounded'] as ShapeForm[]) {
            const box = boxFromIntrinsic(getShapeDescriptor(form), { w: 10, h: 8, ...CHROME });
            expect(box.w).toBe(140 + 2);
            expect(box.h).toBe(40 + 2);
        }
    });

    it('monotona: piu\' contenuto non produce mai un box piu\' piccolo', () => {
        for (const form of ALL_FORMS) {
            const desc = getShapeDescriptor(form);
            let prev = boxFromIntrinsic(desc, { w: 20, h: 20, ...CHROME });
            for (let w = 30; w <= 400; w += 37) {
                const box = boxFromIntrinsic(desc, { w, h: 20, ...CHROME });
                expect(box.w, `${form} w=${w}`).toBeGreaterThanOrEqual(prev.w);
                prev = box;
            }
        }
    });

    it('input degeneri non producono NaN', () => {
        for (const form of ALL_FORMS) {
            const desc = getShapeDescriptor(form);
            for (const m of [
                { w: NaN, h: 10, chromeX: 2, chromeY: 2 },
                { w: 10, h: 10, chromeX: NaN, chromeY: 2 },
                { w: -50, h: -50, chromeX: 2, chromeY: 2 },
                { w: 0, h: 0, chromeX: 0, chromeY: 0 },
                { w: 5, h: 5, chromeX: 100, chromeY: 100 },
            ]) {
                const box = boxFromIntrinsic(desc, m);
                expect(Number.isFinite(box.w), `${form} ${JSON.stringify(m)}`).toBe(true);
                expect(Number.isFinite(box.h), `${form} ${JSON.stringify(m)}`).toBe(true);
                expect(box.w).toBeGreaterThanOrEqual(0);
                expect(box.h).toBeGreaterThanOrEqual(0);
            }
        }
    });
});
