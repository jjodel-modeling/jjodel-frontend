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

/** Axis-aligned rectangle in box coordinates: origin at the box's top-left, pixels. */
export interface Rect {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
}

/** Box dimensions in pixels. */
export interface Size {
    readonly w: number;
    readonly h: number;
}

/**
 * Sizing policy for the "content plus supplement" rule (D8, 2026-08-14).
 *
 * A geometric shape has neither a fixed default size nor pure content-hug: the
 * box is derived from the content plus whatever supplement the outline demands.
 * Measured, pure content-hug is off by a factor of two (a real ellipse renders
 * 116x16.3px around 114px of text while its outline, at the band the line
 * occupies, allows 55.6px).
 *
 * The four numbers are per shape because the supplement is per shape. On `rect`
 * and `rounded` they reproduce the existing content-hug floors (irStyle.ts:
 * min-width 140, min-height 40) and the rule degenerates to the identity.
 */
export interface ShapeSizing {
    /**
     * Vertical supplement: a box of height `heightFactor * ch` holds content of
     * height `ch`. It is the reciprocal of the height fraction of the
     * maximum-area inscribed rectangle, so it is geometry and not taste:
     * argmax over v of `v * availableWidthFraction(v)`. Sqrt(2) for the ellipse,
     * 2 for the diamond, 1 where the outline fills its box.
     */
    readonly heightFactor: number;
    /** Width floor of the box, px. Reproduces the CSS content-hug floor. */
    readonly minBoxWidth: number;
    /** Height floor of the box, px. */
    readonly minBoxHeight: number;
    /**
     * Aspect floor, `boxW >= minAspect * boxH`. Without it a short label on a
     * geometric shape produces a vertical lens (28x48px for 27px of text).
     */
    readonly minAspect: number;
}

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
     * The side is not a parameter, and that is a DECLARED PRECONDITION rather
     * than an observation (D9, 2026-08-14): a shape that exposes this function
     * states that it is symmetric about both axes, so only the distance from the
     * midline matters. All five shapes shipped today satisfy it. Sampling the
     * thirteen shapes of the planned catalogue shows nine that satisfy it and
     * four that do not (cylinder, folder, note, chevron); on the cylinder and
     * the folder a centred rectangle collapses to zero where the true answer is
     * the full width, because the geometric centre falls inside the lid or the
     * tab. Those shapes will not declare this function and will go through the
     * numeric path of `boxForContentNumeric` instead, at which point the field
     * becomes optional and `DynamicHandles` (its single consumer today) needs a
     * fallback. Not before: no such shape exists yet.
     */
    insetFractionAt(t: number): number;
    /** Content-plus-supplement sizing parameters. See `boxForContent`. */
    readonly sizing: ShapeSizing;
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
 * Height floor for the shapes that carry a supplement. Ratified at 64 on
 * 2026-08-15, out of a visual comparison: at 48 a diamond holding a single line
 * comes out 225x48 and reads as a ribbon, 64 gives 204x64, 80 gives 193x80 and
 * wastes height.
 *
 * The eight-case verification on the running app was measured with 48, so the
 * golden cases in the test pass that policy explicitly rather than reading this
 * constant. They record a measurement; this records a decision, and the two are
 * free to differ.
 */
const GEOMETRIC_MIN_BOX_HEIGHT = 64;

/**
 * Shapes whose outline fills the box: no supplement, so the sizing rule is the
 * identity up to the existing CSS floors (irStyle.ts: 140x40 in content-hug).
 */
const BOX_SIZING: ShapeSizing = { heightFactor: 1, minBoxWidth: 140, minBoxHeight: 40, minAspect: 0 };

/** Ellipse and circle: max-area inscribed rectangle is w/sqrt(2) x h/sqrt(2). */
const ELLIPSE_SIZING: ShapeSizing = {
    heightFactor: Math.SQRT2, minBoxWidth: 0, minBoxHeight: GEOMETRIC_MIN_BOX_HEIGHT, minAspect: 0.8,
};

/** Diamond: max-area inscribed rectangle is w/2 x h/2. */
const DIAMOND_SIZING: ShapeSizing = {
    heightFactor: 2, minBoxWidth: 0, minBoxHeight: GEOMETRIC_MIN_BOX_HEIGHT, minAspect: 0.8,
};

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
        sizing: BOX_SIZING,
    },
    // rounded: il lato e' dritto salvo gli ultimi `r` px (10, irStyle.ts) vicino agli
    // spigoli. Approssimato a zero: lo scarto massimo e' r e vive solo li'. Registrato
    // come approssimazione accettata, non come svista.
    rounded: {
        id: 'rounded', painter: { kind: 'css' },
        defaultResizable: false, keepAspectRatio: false, insetFractionAt: NO_INSET,
        sizing: BOX_SIZING,
    },
    ellipse: {
        id: 'ellipse', painter: { kind: 'css' },
        defaultResizable: true, keepAspectRatio: false, insetFractionAt: ELLIPSE_INSET,
        sizing: ELLIPSE_SIZING,
    },
    circle: {
        id: 'circle', painter: { kind: 'css' },
        defaultResizable: true, keepAspectRatio: true, insetFractionAt: ELLIPSE_INSET,
        sizing: ELLIPSE_SIZING,
    },
    diamond: {
        id: 'diamond',
        painter: { kind: 'svg', svgClassName: 'ir-diamond-svg', points: '50,0 100,50 50,100 0,50' },
        defaultResizable: true,
        keepAspectRatio: false,
        insetFractionAt: DIAMOND_INSET,
        sizing: DIAMOND_SIZING,
    },
};

/** Forma di ripiego: `rect` e' il default dell'IR (irDefaults.ts). */
const FALLBACK: ShapeDescriptor = SHAPE_REGISTRY.rect;

/** Descriptor della forma. Forma assente o non riconosciuta => `rect`. */
export function getShapeDescriptor(form: ShapeForm | undefined): ShapeDescriptor {
    return (form && SHAPE_REGISTRY[form]) || FALLBACK;
}

/* ------------------------------------------------------------------------- */
/* Content rectangle and its inverse (D9, 2026-08-14)                         */
/*                                                                            */
/* Two questions, one geometry. `contentRect` answers "given this box, where  */
/* can content of this height sit"; `boxForContent` is its inverse, "given    */
/* this content, how big must the box be". Nothing here is wired to a         */
/* consumer yet.                                                              */
/*                                                                            */
/* Both are BANDED: they take the height of the content, not just the box.    */
/* That is the correction the measurement forced. The static maximum-area      */
/* inscribed rectangle, which the roadmap called `labelBox`, is the wrong      */
/* primitive: on a 170x80 node it cuts the usable width from 168px to 83       */
/* (diamond) and 118 (ellipse), truncating labels that are readable today and  */
/* that already sit inside the outline. It is sized for the worst band, while  */
/* a single line of text occupies the best one, the central band.              */
/* ------------------------------------------------------------------------- */

function finiteOr(n: number, fallback: number): number {
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Fraction of the box width available to a band of height `contentH` centred in
 * a box of height `boxH`, in [0, 1].
 *
 * This reads `insetFractionAt` for what it structurally is: the half-width
 * profile of the outline. Positioning the handles was its first consumer, not
 * its reason to exist. The band is evaluated at its worst edge, which for a
 * profile that is even about the midline and monotone away from it is the far
 * edge, `t = 0.5 + contentH / (2 * boxH)`.
 */
function availableWidthFraction(desc: ShapeDescriptor, boxH: number, contentH: number): number {
    if (boxH <= 0) return 0;
    const frac = 1 - 2 * desc.insetFractionAt(0.5 + contentH / (2 * boxH));
    return frac < 0 ? 0 : frac > 1 ? 1 : frac;
}

/**
 * The widest rectangle of height `contentH` that fits inside the outline of a
 * `boxW x boxH` box, and where it sits. Box coordinates, origin top-left.
 *
 * The rectangle carries its position because the scalar profile cannot express
 * every shape: on the cylinder and the folder the centred rectangle collapses
 * to zero where the true answer is the full width. For a shape that declares
 * `insetFractionAt` (symmetric about both axes) the widest rectangle is the
 * centred one, so `x` and `y` are always the centred values here. Vertical
 * alignment of the actual content is a CSS question, not this contract's: on a
 * shape with a null inset every position is equally wide and `y` carries no
 * information.
 *
 * `contentH` is clamped to the box height. A content as tall as the bounding
 * box of an ellipse or a diamond legitimately gets zero width.
 */
export function contentRect(desc: ShapeDescriptor, boxW: number, boxH: number, contentH: number): Rect {
    const w = Math.max(0, finiteOr(boxW, 0));
    const h = Math.max(0, finiteOr(boxH, 0));
    const ch = Math.min(Math.max(0, finiteOr(contentH, 0)), h);
    const rw = w * availableWidthFraction(desc, h, ch);
    return { x: (w - rw) / 2, y: (h - ch) / 2, w: rw, h: ch };
}

/** Height floor and the geometric supplement, shared by both inverse paths. */
function boxHeightFor(contentH: number, sizing: ShapeSizing): number {
    return Math.max(sizing.minBoxHeight, Math.ceil(sizing.heightFactor * contentH));
}

/**
 * Floors applied after the outline has had its say, shared by both inverse
 * paths so they cannot drift apart.
 *
 * Rounding is upwards throughout: with `round` the short-label case lost 0.2px
 * and the content ended up outside the outline.
 */
function applyBoxFloors(desc: ShapeDescriptor, widthFromOutline: number, boxH: number, sizing: ShapeSizing): Size {
    const w = Math.max(widthFromOutline, sizing.minBoxWidth, Math.ceil(sizing.minAspect * boxH));
    if (!desc.keepAspectRatio) return { w, h: boxH };
    // A square at least as large as the free box. Growing either side only
    // relaxes the band, so containment is preserved; a marginally tighter square
    // may exist, and finding it is not worth a search in a per-render path.
    const s = Math.max(w, boxH);
    return { w: s, h: s };
}

/**
 * Smallest box that holds content of `contentW x contentH`, closed form.
 *
 *     boxH = max(minBoxHeight, ceil(heightFactor * contentH))
 *     boxW = max( ceil(contentW / availableWidthFraction), minBoxWidth,
 *                 ceil(minAspect * boxH) )
 *
 * The height is settled first, by the geometric supplement and the floor, which
 * is what pins down the one degree of freedom the inverse otherwise has (many
 * boxes hold the same content, trading width for height). The width then falls
 * out of the outline at the band that content occupies inside that height.
 *
 * `contentW` and `contentH` are the dimensions of the content's INK (a Range
 * over the text nodes), not of its span. On an ellipse the span is as wide as
 * the box by construction, so measuring the span reports every ellipse as
 * overflowing, even at six characters.
 *
 * `sizing` is a parameter, defaulting to the shape's own, so a caller can pass
 * the policy a measurement was taken with. The verification on the running app
 * (eight cases out of eight with the ink inside the outline) used
 * `minBoxHeight` 48; see `GEOMETRIC_MIN_BOX_HEIGHT`.
 */
export function boxForContent(
    desc: ShapeDescriptor, contentW: number, contentH: number, sizing: ShapeSizing = desc.sizing,
): Size {
    const cw = Math.max(0, finiteOr(contentW, 0));
    const ch = Math.max(0, finiteOr(contentH, 0));
    const boxH = boxHeightFor(ch, sizing);
    const frac = availableWidthFraction(desc, boxH, ch);
    // frac is zero only if the band fills the box, which needs a heightFactor
    // too small for the shape's own profile. Unreachable with the table above
    // (asserted in the tests); the guard keeps a mis-declared descriptor from
    // producing an infinite width.
    const fromOutline = frac > 0 ? Math.ceil(cw / frac) : Math.ceil(cw);
    return applyBoxFloors(desc, fromOutline, boxH, sizing);
}

/** Upper bound on the doubling search, so a pathological descriptor terminates. */
const NUMERIC_WIDTH_LIMIT = 1e6;

/**
 * Same answer as `boxForContent`, obtained by inverting `contentRect`
 * numerically instead of algebraically.
 *
 * This is the default the contract promises to shapes that cannot expose a
 * symmetric profile: it only assumes that the available width grows with the
 * box width, never a closed form. Today no such shape exists, so its job is to
 * be the oracle the closed form is tested against; the tests require exact
 * agreement on all five shipped shapes.
 *
 * When the first non-symmetric shape lands, this path also has to search the
 * vertical offset of the rectangle, which `contentRect` centres today.
 */
export function boxForContentNumeric(
    desc: ShapeDescriptor, contentW: number, contentH: number, sizing: ShapeSizing = desc.sizing,
): Size {
    const cw = Math.max(0, finiteOr(contentW, 0));
    const ch = Math.max(0, finiteOr(contentH, 0));
    const boxH = boxHeightFor(ch, sizing);
    // Comparison with a slack of one part in a billion: without it a width whose
    // exact answer is an integer can be rejected by floating-point rounding, and
    // the search would return one pixel more than the closed form.
    const fits = (boxW: number): boolean => contentRect(desc, boxW, boxH, ch).w >= cw - 1e-9;

    let hi = Math.max(1, Math.ceil(cw));
    while (!fits(hi) && hi < NUMERIC_WIDTH_LIMIT) hi *= 2;
    let lo = 0;
    if (!fits(hi)) return applyBoxFloors(desc, Math.ceil(cw), boxH, sizing);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (fits(mid)) hi = mid; else lo = mid + 1;
    }
    return applyBoxFloors(desc, lo, boxH, sizing);
}
