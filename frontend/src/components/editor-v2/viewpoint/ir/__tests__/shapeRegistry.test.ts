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

    it('forma assente o sconosciuta ricade su rect, come prima', () => {
        expect(getShapeDescriptor(undefined).id).toBe('rect');
        expect(getShapeDescriptor(undefined).defaultResizable).toBe(wasResizable(undefined));
        expect(getShapeDescriptor(undefined).keepAspectRatio).toBe(wasAspectLocked(undefined));
        expect(getShapeDescriptor('nope' as ShapeForm).id).toBe('rect');
    });
});
