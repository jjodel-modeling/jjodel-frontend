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
    /**
     * Rientro dal lato del bounding box fino al contorno della forma, espresso
     * come FRAZIONE della dimensione perpendicolare a quel lato. `t` e' la
     * posizione lungo il lato: 0 e 1 sono i due spigoli, 0.5 la mezzeria.
     *
     * Frazione e non pixel per una ragione precisa: in CSS una percentuale su
     * `left`/`right` risolve sulla larghezza del contenitore e su `top`/`bottom`
     * sull'altezza, cioe' esattamente la dimensione perpendicolare al lato. Cosi'
     * chi posiziona gli handle non ha bisogno di conoscere le misure del nodo.
     *
     * Il lato non e' un parametro: tutte e cinque le forme attuali sono simmetriche
     * sui due assi, quindi conta solo la distanza dalla mezzeria.
     */
    insetFractionAt(t: number): number;
}

/** `t` normalizzato in [0,1]; un input non finito ricade sulla mezzeria (rientro nullo). */
function normT(t: number): number {
    if (!Number.isFinite(t)) return 0.5;
    return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Forma che riempie il proprio bounding box: nessun rientro. */
const NO_INSET = (): number => 0;

/**
 * Ellisse inscritta. Con u = 2t - 1, il bordo sta a a*sqrt(1 - u^2) dal centro,
 * quindi il rientro vale a*(1 - sqrt(1 - u^2)), cioe' meta' di quello in frazione
 * della dimensione piena.
 */
const ELLIPSE_INSET = (t: number): number => {
    const u = normT(t) * 2 - 1;
    return (1 - Math.sqrt(1 - u * u)) / 2;
};

/**
 * Rombo inscritto. Il lato e' un segmento fra il vertice a meta' lato e lo spigolo
 * del box, quindi il rientro cresce linearmente dalla mezzeria: |t - 0.5|.
 */
const DIAMOND_INSET = (t: number): number => Math.abs(normT(t) - 0.5);

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
    rect: {
        id: 'rect', painter: { kind: 'css' },
        defaultResizable: false, keepAspectRatio: false, insetFractionAt: NO_INSET,
    },
    // rounded: il lato e' dritto salvo gli ultimi `r` px (10, irStyle.ts) vicino agli
    // spigoli. Approssimato a zero: lo scarto massimo e' r e vive solo li'. Registrato
    // come approssimazione accettata, non come svista.
    rounded: {
        id: 'rounded', painter: { kind: 'css' },
        defaultResizable: false, keepAspectRatio: false, insetFractionAt: NO_INSET,
    },
    ellipse: {
        id: 'ellipse', painter: { kind: 'css' },
        defaultResizable: true, keepAspectRatio: false, insetFractionAt: ELLIPSE_INSET,
    },
    circle: {
        id: 'circle', painter: { kind: 'css' },
        defaultResizable: true, keepAspectRatio: true, insetFractionAt: ELLIPSE_INSET,
    },
    diamond: {
        id: 'diamond',
        painter: { kind: 'svg', svgClassName: 'ir-diamond-svg', points: '50,0 100,50 50,100 0,50' },
        defaultResizable: true,
        keepAspectRatio: false,
        insetFractionAt: DIAMOND_INSET,
    },
};

/** Forma di ripiego: `rect` e' il default dell'IR (irDefaults.ts). */
const FALLBACK: ShapeDescriptor = SHAPE_REGISTRY.rect;

/** Descriptor della forma. Forma assente o non riconosciuta => `rect`. */
export function getShapeDescriptor(form: ShapeForm | undefined): ShapeDescriptor {
    return (form && SHAPE_REGISTRY[form]) || FALLBACK;
}
