/**
 * shapeRegistry — un descriptor per ogni `ShapeForm`.
 *
 * Prima di questo modulo una forma viveva in sei punti distinti: le regole
 * `.ir-shape--<form>` in irStyle.ts, il neutralizzatore `:has()` sul `.mm-node`,
 * il ramo `isDiamond` in IRNodeContent, la mappa `DIAMOND_DASH`, il caso in
 * `defaultResizableForForm` e il `keepAspectRatio` in ObjectNode. Quattro di
 * questi (ramo, mappa, gate di resize, aspect ratio) diventano dati di questa
 * tabella; i due CSS restano in irStyle.ts, perche' il painter 'css' e' per
 * definizione una regola CSS.
 *
 * Nessuna forma nuova viene introdotta qui: il contenuto e' l'equivalente esatto
 * del comportamento precedente, tabellizzato. Il test di equivalenza in
 * __tests__/shapeRegistry.test.ts confronta la tabella con i predicati storici.
 *
 * Modulo puro: nessun React, nessun Redux, nessun import a runtime da editor-v2.
 */

import type { ShapeForm } from './irTypes';

/**
 * Chi dipinge la forma.
 *
 * - `css`: la box `.ir-node-content`, tramite le regole `.ir-shape--<form>` di
 *   irStyle.ts. `fill` e `border` authored sono applicati inline sulla box da
 *   IRNodeContent.
 * - `svg`: un layer SVG interno alla box. irStyle.ts sopprime il box CSS
 *   (background/border/box-shadow trasparenti) e IRNodeContent NON emette
 *   fill/border inline, altrimenti il rettangolo riapparirebbe dietro la forma.
 */
export type ShapePainter =
    | { readonly kind: 'css' }
    | {
        /** classe del `<svg>`, gia' stilata in irStyle.ts */
        readonly kind: 'svg';
        readonly svgClassName: string;
        /** punti del `<polygon>` nel viewBox `0 0 100 100`, preserveAspectRatio="none" */
        readonly points: string;
    };

export interface ShapeDescriptor {
    readonly id: ShapeForm;
    readonly painter: ShapePainter;
    /** resize a mano attivo di default, in assenza del flag esplicito `resizable` */
    readonly defaultResizable: boolean;
    /** il resize mantiene il rapporto d'aspetto */
    readonly keepAspectRatio: boolean;
}

/**
 * `strokeDasharray` per stile di bordo, per le forme dipinte in SVG.
 * Indicizzata per stringa come la `DIAMOND_DASH` che sostituisce: uno stile di
 * bordo non previsto ricade su `undefined`, cioe' tratto pieno.
 */
export const SVG_BORDER_DASH: Readonly<Record<string, string | undefined>> = {
    solid: undefined,
    dashed: '6 4',
    dotted: '1 4',
};

export const SHAPE_REGISTRY: Readonly<Record<ShapeForm, ShapeDescriptor>> = {
    rect: { id: 'rect', painter: { kind: 'css' }, defaultResizable: false, keepAspectRatio: false },
    rounded: { id: 'rounded', painter: { kind: 'css' }, defaultResizable: false, keepAspectRatio: false },
    ellipse: { id: 'ellipse', painter: { kind: 'css' }, defaultResizable: true, keepAspectRatio: false },
    circle: { id: 'circle', painter: { kind: 'css' }, defaultResizable: true, keepAspectRatio: true },
    diamond: {
        id: 'diamond',
        painter: { kind: 'svg', svgClassName: 'ir-diamond-svg', points: '50,0 100,50 50,100 0,50' },
        defaultResizable: true,
        keepAspectRatio: false,
    },
};

/** Forma di ripiego: `rect` e' il default dell'IR (irDefaults.ts). */
const FALLBACK: ShapeDescriptor = SHAPE_REGISTRY.rect;

/** Descriptor della forma. Forma assente o non riconosciuta => `rect`. */
export function getShapeDescriptor(form: ShapeForm | undefined): ShapeDescriptor {
    return (form && SHAPE_REGISTRY[form]) || FALLBACK;
}
