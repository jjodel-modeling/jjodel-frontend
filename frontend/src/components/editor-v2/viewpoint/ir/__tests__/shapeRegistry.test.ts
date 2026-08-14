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
import { SHAPE_REGISTRY, SVG_BORDER_DASH, getShapeDescriptor } from '../shapeRegistry';

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
