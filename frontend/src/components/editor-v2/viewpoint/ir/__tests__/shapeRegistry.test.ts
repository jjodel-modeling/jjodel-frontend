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
    baseCornerRadius, clampCornerRadius, honorsCornerRadius, resolveCornerRadius, roundedPolygonPath,
} from '../shapeRegistry';

const ALL_FORMS: ShapeForm[] = [
    'rect', 'rounded', 'ellipse', 'circle', 'diamond',
    'stadium', 'hexagon', 'parallelogram', 'cylinder', 'cloud',
];
/**
 * Le cinque forme che esistevano prima del registry. I tre test di equivalenza
 * qui sotto confrontano la tabella coi predicati storici, che parlano solo di
 * queste: una forma arrivata dopo non ha un comportamento precedente da
 * riprodurre. Gli invarianti geometrici restano su ALL_FORMS.
 */
const LEGACY_FORMS: ShapeForm[] = ['rect', 'rounded', 'ellipse', 'circle', 'diamond'];

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
        for (const form of LEGACY_FORMS) {
            expect(getShapeDescriptor(form).defaultResizable).toBe(wasResizable(form));
        }
    });

    it('riproduce il lock di aspect ratio precedente', () => {
        for (const form of LEGACY_FORMS) {
            expect(getShapeDescriptor(form).keepAspectRatio).toBe(wasAspectLocked(form));
        }
    });

    it('riproduce quali forme sono dipinte in SVG', () => {
        for (const form of LEGACY_FORMS) {
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

    it('le quattro forme del 2026-08-15 dichiarano il painter atteso', () => {
        expect(SHAPE_REGISTRY.stadium.painter.kind).toBe('css');
        expect(SHAPE_REGISTRY.hexagon.painter.kind).toBe('svg');
        expect(SHAPE_REGISTRY.parallelogram.painter.kind).toBe('svg');
        const cyl = SHAPE_REGISTRY.cylinder.painter;
        expect(cyl.kind).toBe('svgPath');
        if (cyl.kind !== 'svgPath') return;
        // La silhouette e' chiusa e il coperchio e' un ornamento a se': se
        // finisse nella silhouette verrebbe riempito e coprirebbe il corpo.
        expect(cyl.silhouette.endsWith('Z')).toBe(true);
        expect(cyl.ornaments).toHaveLength(1);
        expect(cyl.svgClassName).toBe('ir-cylinder-svg');
    });

    it('esagono: profilo diverso per asse, ed e per questo che dichiara handleInsetAt', () => {
        const hex = SHAPE_REGISTRY.hexagon;
        // Mezza larghezza: piena in mezzeria, 0.25 per lato agli estremi.
        expect(hex.insetFractionAt(0.5)).toBeCloseTo(0, 10);
        expect(hex.insetFractionAt(0)).toBeCloseTo(0.25, 10);
        expect(hex.insetFractionAt(1)).toBeCloseTo(0.25, 10);
        // Lati verticali: il profilo di mezza larghezza.
        expect(hex.handleInsetAt!(0, 'left')).toBeCloseTo(0.25, 10);
        expect(hex.handleInsetAt!(0.25, 'right')).toBeCloseTo(hex.insetFractionAt(0.25), 10);
        // Lati orizzontali: piatti nella meta' centrale, punta a 0.5.
        expect(hex.handleInsetAt!(0.5, 'top')).toBeCloseTo(0, 10);
        expect(hex.handleInsetAt!(0.25, 'top')).toBeCloseTo(0, 10);
        expect(hex.handleInsetAt!(0, 'top')).toBeCloseTo(0.5, 10);
        expect(hex.handleInsetAt!(1, 'bottom')).toBeCloseTo(0.5, 10);
    });

    it('parallelogramma: profilo per il sizing, anchor sul bounding box', () => {
        const par = SHAPE_REGISTRY.parallelogram;
        // Banda di altezza nulla: perde il solo taglio, 0.125 per lato.
        expect(par.insetFractionAt(0.5)).toBeCloseTo(0.125, 10);
        // Banda alta quanto il box: 0.25 per lato, cioe' meta' larghezza.
        expect(par.insetFractionAt(1)).toBeCloseTo(0.25, 10);
        for (const side of ['top', 'right', 'bottom', 'left'] as const) {
            for (const t of [0, 0.3, 0.5, 0.8, 1]) {
                expect(par.handleInsetAt!(t, side)).toBe(0);
            }
        }
    });

    it('stadium e cylinder riempiono il box in larghezza: nessun rientro, nessuna deroga', () => {
        for (const form of ['stadium', 'cylinder'] as ShapeForm[]) {
            const desc = getShapeDescriptor(form);
            expect(desc.handleInsetAt).toBeUndefined();
            for (const t of [0, 0.25, 0.5, 0.75, 1]) expect(desc.insetFractionAt(t)).toBe(0);
        }
    });

    it('cloud: painter a path, nessun ornamento, e le ancore di default', () => {
        const desc = SHAPE_REGISTRY.cloud;
        const painter = desc.painter;
        expect(painter.kind).toBe('svgPath');
        if (painter.kind !== 'svgPath') return;
        expect(painter.svgClassName).toBe('ir-cloud-svg');
        expect(painter.silhouette.startsWith('M')).toBe(true);
        // Chiusa, come quella del cilindro: e' riempita, non solo contornata.
        expect(painter.silhouette.endsWith('Z')).toBe(true);
        // Al contrario del cilindro NON ha ornamenti: la sagoma e' tutta la figura.
        expect(painter.ornaments).toBeUndefined();
        // Resize come l'ellisse (D6); il contorno e' simmetrico sui due assi con
        // lo stesso profilo, quindi nessuna deroga sugli anchor.
        expect(desc.defaultResizable).toBe(SHAPE_REGISTRY.ellipse.defaultResizable);
        expect(desc.keepAspectRatio).toBe(false);
        expect(desc.handleInsetAt).toBeUndefined();
    });

    it('cloud: il 18% per lato della spec vale su tutta la banda di contenuto', () => {
        const f = SHAPE_REGISTRY.cloud.insetFractionAt;
        // Rientro costante finche' la banda sta nel 64% centrale: 0.18 per lato.
        for (const t of [0.5, 0.4, 0.6, 0.5 + 0.32, 0.5 - 0.32]) {
            expect(f(t), `t=${t}`).toBeCloseTo(0.18, 9);
        }
        // Oltre quella banda il profilo si chiude fino al bordo del box.
        expect(f(0.9)).toBeGreaterThan(0.18);
        expect(f(1)).toBeCloseTo(0.5, 10);
        expect(f(0)).toBeCloseTo(0.5, 10);
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
            // Ricade sulla mezzeria: il valore atteso e' quello della mezzeria,
            // non zero. Sulle cinque forme storiche i due coincidono, sul
            // parallelogramma no (la banda perde il taglio anche a quota nulla).
            expect(f(NaN)).toBe(f(0.5));
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

    it('cloud: il contenuto sta nel 64% centrale su ENTRAMBI gli assi', () => {
        // Il 18% orizzontale viene dal profilo, il 18% verticale dal supplemento:
        // heightFactor e' il reciproco della frazione, quindi un contenuto alto 64
        // chiede un box alto 100 e ci si siede fra 18 e 82.
        const desc = getShapeDescriptor('cloud');
        const box = boxForContent(desc, 100, 64);
        expect(box.h).toBe(100);
        const r = contentRect(desc, box.w, box.h, 64);
        expect(r.y).toBeCloseTo(18, 9);
        expect(r.w / box.w).toBeCloseTo(0.64, 10);
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
        // Lo stadium riempie il proprio box come rect e rounded, quindi resta
        // fuori; le tre forme geometriche del 2026-08-15 entrano per l'aspect
        // floor, la nuvola per un supplemento verticale vero (heightFactor 1.5625).
        expect(ALL_FORMS.filter(f => hasSizeSupplement(getShapeDescriptor(f))))
            .toEqual(['ellipse', 'circle', 'diamond', 'hexagon', 'parallelogram', 'cylinder', 'cloud']);
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

/**
 * Raggio degli spigoli (slice 3 di Symbol Editor 1b, decisione D5).
 *
 * Il painter del canvas (IRNodeContent) non si importa nel banco, perche' passa dal
 * barrel del joiner: tutte le decisioni vivono quindi in `resolveCornerRadius` e
 * `roundedPolygonPath`, ed e' li' che questi test le eseguono. Il percorso resta
 * prima invarianti, poi un solo letterale.
 */
describe('shapeRegistry: raggio degli spigoli', () => {
    type Pt = { x: number; y: number };
    const HONORING: ShapeForm[] = ['rect', 'rounded', 'diamond', 'hexagon', 'parallelogram'];
    const IGNORING: ShapeForm[] = ['ellipse', 'circle', 'stadium', 'cylinder', 'cloud'];
    const POLYGONS: ShapeForm[] = ['diamond', 'hexagon', 'parallelogram'];
    const EPS = 1e-3;

    /** La grammatica che roundedPolygonPath emette: M, L, Q, Z con coppie x,y. */
    const parse = (d: string): { c: string; pts: Pt[] }[] => {
        const out: { c: string; pts: Pt[] }[] = [];
        for (const m of d.matchAll(/([MLQZ])([^MLQZ]*)/g)) {
            const body = m[2].trim();
            const nums = body ? body.split(/[\s,]+/).map(Number) : [];
            const pts: Pt[] = [];
            for (let i = 0; i < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
            out.push({ c: m[1], pts });
        }
        return out;
    };
    /** I vertici del registry in pixel reali: l'oracolo, scritto qui e non importato. */
    const pixels = (form: ShapeForm, w: number, h: number): Pt[] =>
        (SHAPE_REGISTRY[form].painter as { points: string }).points.split(' ').map((s) => {
            const [x, y] = s.split(',').map(Number);
            return { x: (x * w) / 100, y: (y * h) / 100 };
        });
    const pointsOf = (form: ShapeForm) => (SHAPE_REGISTRY[form].painter as { points: string }).points;
    const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

    /**
     * Per ogni vertice: il punto di controllo e' il vertice, i due tagli stanno sui due
     * lati adiacenti alla distanza attesa, dentro il box, e il taglio di un vertice non
     * scavalca quello del vicino sullo stesso lato (niente spike).
     */
    const assertRounded = (form: ShapeForm, r: number, w: number, h: number) => {
        const v = pixels(form, w, h);
        const n = v.length;
        const cmds = parse(roundedPolygonPath(pointsOf(form), r, w, h));
        const label = `${form} r=${r} ${w}x${h}`;
        expect(cmds.map(c => c.c).join(''), label).toBe(`M${'QL'.repeat(n - 1)}QZ`);
        const a: Pt[] = [], b: Pt[] = [];
        for (let i = 0; i < n; i++) {
            const start = cmds[2 * i], q = cmds[2 * i + 1];
            a.push(start.pts[0]);
            expect(q.pts, label).toHaveLength(2);
            expect(dist(q.pts[0], v[i]), `${label} control ${i}`).toBeLessThan(EPS);
            b.push(q.pts[1]);
        }
        for (let i = 0; i < n; i++) {
            const prev = v[(i + n - 1) % n], next = v[(i + 1) % n];
            const expected = Math.min(r, Math.min(dist(prev, v[i]), dist(next, v[i])) / 2);
            expect(Math.abs(dist(a[i], v[i]) - expected), `${label} a${i}`).toBeLessThan(EPS);
            expect(Math.abs(dist(b[i], v[i]) - expected), `${label} b${i}`).toBeLessThan(EPS);
            // sul lato: somma delle distanze dagli estremi = lunghezza del lato
            expect(Math.abs(dist(prev, a[i]) + dist(a[i], v[i]) - dist(prev, v[i])), `${label} a${i} on edge`).toBeLessThan(EPS);
            expect(Math.abs(dist(v[i], b[i]) + dist(b[i], next) - dist(v[i], next)), `${label} b${i} on edge`).toBeLessThan(EPS);
            // niente incrocio sul lato prev -> v: il taglio uscente di prev viene prima
            expect(dist(prev, b[(i + n - 1) % n]), `${label} spike at ${i}`).toBeLessThanOrEqual(dist(prev, a[i]) + EPS);
            for (const p of [a[i], b[i]]) {
                expect(p.x).toBeGreaterThanOrEqual(-EPS);
                expect(p.y).toBeGreaterThanOrEqual(-EPS);
                expect(p.x).toBeLessThanOrEqual(w + EPS);
                expect(p.y).toBeLessThanOrEqual(h + EPS);
            }
        }
    };

    it('onorano l\'asse esattamente le cinque forme di D5', () => {
        for (const form of ALL_FORMS) {
            expect(honorsCornerRadius(form), form).toBe(HONORING.includes(form));
        }
        expect(honorsCornerRadius(undefined)).toBe(false);
    });

    it('assente o non valido non dipinge nulla: il rect salvato tiene i 4px e il rounded i 10px', () => {
        const box = { w: 160, h: 64 };
        for (const form of ALL_FORMS) {
            for (const authored of [undefined, NaN, -1, Infinity, '6', null]) {
                expect(resolveCornerRadius(form, authored, box), `${form} ${String(authored)}`).toEqual({ kind: 'none' });
            }
        }
        expect(baseCornerRadius('rect')).toBe(4);
        expect(baseCornerRadius('rounded')).toBe(10);
        for (const form of [...POLYGONS, ...IGNORING]) expect(baseCornerRadius(form), form).toBe(0);
    });

    it('ellisse, cerchio, stadio, cilindro e nuvola ignorano qualunque valore scritto', () => {
        for (const form of IGNORING) {
            for (const authored of [0, 6, 12, 400]) {
                expect(resolveCornerRadius(form, authored, { w: 120, h: 120 }), `${form} ${authored}`).toEqual({ kind: 'none' });
                expect(resolveCornerRadius(form, authored, null), `${form} ${authored} no box`).toEqual({ kind: 'none' });
            }
        }
    });

    it('uno 0 scritto sostituisce la base sulle forme CSS: non e\' assente', () => {
        expect(resolveCornerRadius('rect', 0, { w: 160, h: 64 })).toEqual({ kind: 'css', px: 0 });
        expect(resolveCornerRadius('rounded', 0, null)).toEqual({ kind: 'css', px: 0 });
        // sui poligoni lo 0 e' il poligono di oggi
        expect(resolveCornerRadius('diamond', 0, { w: 160, h: 64 })).toEqual({ kind: 'none' });
    });

    it('clamp di render a min(w, h) / 4 su entrambi i painter', () => {
        expect(clampCornerRadius(30, 200, 40)).toBe(10);
        expect(clampCornerRadius(6, 200, 40)).toBe(6);
        expect(resolveCornerRadius('rect', 30, { w: 200, h: 40 })).toEqual({ kind: 'css', px: 10 });
        expect(resolveCornerRadius('rounded', 6, { w: 200, h: 40 })).toEqual({ kind: 'css', px: 6 });
        expect(resolveCornerRadius('diamond', 30, { w: 100, h: 60 })).toEqual({ kind: 'path', r: 15, w: 100, h: 60 });
        expect(resolveCornerRadius('hexagon', 8, { w: 160, h: 64 })).toEqual({ kind: 'path', r: 8, w: 160, h: 64 });
        // senza box la forma CSS tiene il numero scritto: non e' una taglia indovinata
        expect(resolveCornerRadius('rect', 30, null)).toEqual({ kind: 'css', px: 30 });
        for (const [r, w, h] of [[NaN, 10, 10], [6, 0, 10], [6, 10, -1], [-2, 10, 10]]) {
            expect(clampCornerRadius(r, w, h), `${r} ${w} ${h}`).toBe(0);
        }
    });

    it('un poligono senza box misurato resta spigoloso', () => {
        for (const form of POLYGONS) {
            expect(resolveCornerRadius(form, 6, null), form).toEqual({ kind: 'none' });
            expect(resolveCornerRadius(form, 6, { w: 0, h: 0 }), form).toEqual({ kind: 'none' });
        }
    });

    it('rombo 100x60 r=6: chiuso, un M, quattro Q, tre L, controlli sui vertici, tagli a 6', () => {
        assertRounded('diamond', 6, 100, 60);
    });

    it('rombo 100x60 r=6: il d letterale, calcolato a mano', () => {
        // Lato sqrt(50^2 + 30^2) = 58.3095; taglio 6 lungo il lato = (5.145, 3.087).
        expect(roundedPolygonPath(pointsOf('diamond'), 6, 100, 60)).toBe(
            'M44.855,3.087 Q50,0 55.145,3.087 L94.855,26.913 Q100,30 94.855,33.087 '
            + 'L55.145,56.913 Q50,60 44.855,56.913 L5.145,33.087 Q0,30 5.145,26.913 Z',
        );
    });

    it('esagono r=8: path chiuso, senza spike, ogni taglio sul proprio lato e dentro il box', () => {
        assertRounded('hexagon', 8, 160, 64);
        for (const form of POLYGONS) {
            for (const [w, h] of [[160, 64], [64, 160], [40, 40], [300, 70]]) {
                for (const r of [1, 8, 12]) assertRounded(form, r, w, h);
            }
        }
    });

    it('un raggio piu\' lungo del lato si ferma a meta\' del lato piu\' corto: i vicini si toccano, non si incrociano', () => {
        for (const form of POLYGONS) assertRounded(form, 1000, 100, 60);
        const cmds = parse(roundedPolygonPath(pointsOf('diamond'), 1000, 100, 60));
        // il taglio uscente del vertice 0 e quello entrante del vertice 1 sono lo stesso punto medio
        expect(dist(cmds[1].pts[1], cmds[2].pts[0])).toBeLessThan(EPS);
        expect(dist(cmds[2].pts[0], { x: 75, y: 15 })).toBeLessThan(EPS);
    });

    it('r = 0 restituisce il poligono spigoloso, input degeneri un path vuoto', () => {
        expect(roundedPolygonPath(pointsOf('diamond'), 0, 100, 60)).toBe('M50,0 L100,30 L50,60 L0,30 Z');
        expect(roundedPolygonPath(pointsOf('diamond'), 6, 0, 60)).toBe('');
        expect(roundedPolygonPath(pointsOf('diamond'), 6, 100, NaN)).toBe('');
        expect(roundedPolygonPath('0,0 100,100', 6, 100, 100)).toBe('');
        expect(roundedPolygonPath('0,0 x,1 100,100', 6, 100, 100)).toBe('');
    });
});
