/**
 * structureCapabilities - which level-2 Structure options each Symbol offers, as a
 * data table.
 *
 * Design handoff: `Instance Node Proposal.dc.html`, Turno 7a/7b.
 *
 *   «un campo che il Symbol corrente non supporta non e' disabilitato - e' assente,
 *    e l'assenza e' dichiarata in una riga sola.»
 *
 * A table and not a chain of `if (form === 'stadium')` in the panel, for the reason
 * `markerRegistry.ts` and `shapeRegistry.ts` give: adding a shape must be adding a
 * row here, not editing the engine (D10). It is a SEPARATE table from
 * `shapeRegistry.ts` on purpose - that one is a rendering/geometry descriptor
 * (painter, sizing, anchor insets) and this one is an authoring capability set. The
 * two answer different questions about the same nine shapes and are free to disagree
 * about which distinctions matter.
 *
 * ── Why "absent" rather than "disabled" ────────────────────────────────────────
 *
 * `SegmentedControl` argues the opposite in its own doc, and it is right in general:
 * dropping a segment makes the control show two options here and three there, and
 * the reader has to guess why. What makes dropping safe HERE is the second half of
 * the rule, which the general case does not have: every absence is stated, either by
 * the reason line under the field or by the single `bi-eye-slash` summary at the foot
 * of the tab. The reader never has to guess, because the panel says it.
 *
 * ── The two flags the accent is derived from ───────────────────────────────────
 *
 * `top` needs a flat top edge to sit on and `left` needs a vertical left edge; a
 * shape that has neither gets `ring` instead, which is the design's rule («Ring
 * replaces Top / Left on shapes without straight edges») applied mechanically rather
 * than shape by shape. The two flags are declared per shape rather than computed from
 * the polygon: the hexagon has a flat top segment but a vertex on the left, the
 * cylinder has vertical sides but a curved lid, and no single predicate over
 * `SHAPE_REGISTRY.painter` gets both right.
 *
 * Pure module: no React, no Redux, no runtime import from editor-v2.
 */

import type {
    AccentPlacement,
    CompartmentMode,
    NamePosition,
    ShapeForm,
} from './irTypes';

/**
 * Display name of each Symbol, as the reason lines spell it ("Stadium has no flat top
 * edge"). Mirrors `FORM_OPTIONS` in `VertexAuthoringPanel.tsx`, which is the Shape
 * select's own list and stays where it is; the duplication is two labels for one
 * vocabulary and is recorded here rather than removed, because unifying them would
 * edit a control this slice was not asked to touch.
 */
export const SHAPE_LABEL: Readonly<Record<ShapeForm, string>> = {
    rect: 'Rectangle',
    rounded: 'Rounded',
    ellipse: 'Ellipse',
    circle: 'Circle',
    diamond: 'Diamond',
    stadium: 'Stadium',
    hexagon: 'Hexagon',
    parallelogram: 'Parallelogram',
    cylinder: 'Cylinder',
};

/** The three geometric facts the capabilities are derived from. One row per shape. */
interface ShapeGeometry {
    /** A straight, horizontal top edge wide enough for a header band and a top accent. */
    readonly flatTopEdge: boolean;
    /** A straight, vertical left edge for a left accent. */
    readonly straightLeftEdge: boolean;
    /** Enough interior width at every height for rows of `name · value`. */
    readonly roomForRows: boolean;
}

/**
 * The geometry table. `rounded` and `stadium` differ on exactly one flag, which is the
 * whole of 7b: a stadium's cap curves away at the top, a rounded rect's 10px corner
 * radius does not - the same approximation `shapeRegistry.ts` already records for
 * `rounded`'s anchor insets.
 */
const GEOMETRY: Readonly<Record<ShapeForm, ShapeGeometry>> = {
    rect: { flatTopEdge: true, straightLeftEdge: true, roomForRows: true },
    rounded: { flatTopEdge: true, straightLeftEdge: true, roomForRows: true },
    ellipse: { flatTopEdge: false, straightLeftEdge: false, roomForRows: false },
    circle: { flatTopEdge: false, straightLeftEdge: false, roomForRows: false },
    // Straight edges, but not one of them axis-aligned: nothing for a bar to lie along.
    diamond: { flatTopEdge: false, straightLeftEdge: false, roomForRows: false },
    stadium: { flatTopEdge: false, straightLeftEdge: false, roomForRows: false },
    // Flat top segment between the two upper vertices; the left side is a vertex.
    hexagon: { flatTopEdge: true, straightLeftEdge: false, roomForRows: true },
    // Top edge horizontal, left edge slanted by the shear.
    parallelogram: { flatTopEdge: true, straightLeftEdge: false, roomForRows: true },
    // Vertical sides, curved lid.
    cylinder: { flatTopEdge: false, straightLeftEdge: true, roomForRows: true },
};

/** Every value of each vocabulary, in the order the controls offer them. */
export const ALL_NAME_POSITIONS: readonly NamePosition[] = ['header-band', 'center', 'below', 'external'];
export const ALL_ACCENT_PLACEMENTS: readonly AccentPlacement[] = ['none', 'top', 'left', 'ring'];
export const ALL_COMPARTMENT_MODES: readonly CompartmentMode[] = ['inline', 'popover', 'none'];

/** What the Structure tab may offer for one Symbol, and what it falls back to. */
export interface StructureCapabilities {
    readonly form: ShapeForm;
    readonly namePositions: readonly NamePosition[];
    readonly defaultNamePosition: NamePosition;
    readonly accentPlacements: readonly AccentPlacement[];
    readonly defaultAccentPlacement: AccentPlacement;
    readonly compartmentModes: readonly CompartmentMode[];
    readonly defaultCompartmentMode: CompartmentMode;
    /**
     * The existing `Field compartments` list stays in the tab. False on a Symbol that
     * offers no inline compartment: 7b hides it and declares it in the summary row as
     * «Field compartments (no compartment on this Symbol)».
     */
    readonly showsFieldCompartments: boolean;
}

function capabilitiesFor(form: ShapeForm): StructureCapabilities {
    const g = GEOMETRY[form];

    // `header-band` is the only position with a geometric precondition; the other three
    // put the label in the middle or outside the outline and every shape can do that.
    const namePositions = ALL_NAME_POSITIONS.filter(p => p !== 'header-band' || g.flatTopEdge);

    const accentPlacements: AccentPlacement[] = ['none'];
    if (g.flatTopEdge) accentPlacements.push('top');
    if (g.straightLeftEdge) accentPlacements.push('left');
    // Ring is the substitute, not an addition: a shape that can carry a bar is not
    // offered a ring as well, or the group would show four ways to say one thing.
    if (accentPlacements.length === 1) accentPlacements.push('ring');

    const compartmentModes = ALL_COMPARTMENT_MODES.filter(m => m !== 'inline' || g.roomForRows);

    return {
        form,
        namePositions,
        defaultNamePosition: g.flatTopEdge ? 'header-band' : 'center',
        accentPlacements,
        defaultAccentPlacement: 'none',
        compartmentModes,
        // Inline where there is room, None where there is not: a popover compartment is
        // a deliberate choice, never what a shape falls into by default.
        defaultCompartmentMode: g.roomForRows ? 'inline' : 'none',
        showsFieldCompartments: g.roomForRows,
    };
}

/** Built once per shape: the table is constant, and the panel reads it on every render. */
const TABLE: Readonly<Record<ShapeForm, StructureCapabilities>> = Object.fromEntries(
    (Object.keys(GEOMETRY) as ShapeForm[]).map(f => [f, capabilitiesFor(f)]),
) as Record<ShapeForm, StructureCapabilities>;

/**
 * Capabilities of one Symbol. An absent or unrecognized form falls back to `rect`,
 * which is the IR's own default shape (`irDefaults.ts`) - the same fallback
 * `getShapeDescriptor` applies.
 *
 * A CONDITIONAL `shape.form` has no single answer, and the caller passes `undefined`
 * for it rather than one branch: the panel then offers the rectangle's superset and
 * says nothing about a geometry that changes per instance. Narrowing the tab on one
 * branch of a conditional would hide a field the other branch supports.
 */
export function structureCapabilities(form: ShapeForm | undefined): StructureCapabilities {
    return (form && TABLE[form]) || TABLE.rect;
}

/**
 * Why a Symbol-dependent option is missing, in the design's own words. Returns null
 * when nothing is missing: the reason line exists to explain an absence, and a line
 * that says "everything is available" would be noise on eight shapes out of nine.
 *
 * The affirmative case is the exception the design draws explicitly (7a, on the
 * rectangle): with the header band offered, the line names the Symbol that offers it,
 * so the author learns the field is shape-dependent BEFORE they change the shape and
 * lose it.
 */
export function namePositionReason(caps: StructureCapabilities): string | null {
    const label = SHAPE_LABEL[caps.form];
    return caps.namePositions.includes('header-band')
        ? `Header band available because the Symbol is ${label}`
        : `Header band not offered: ${label} has no flat top edge`;
}

export function accentPlacementReason(caps: StructureCapabilities): string | null {
    return caps.accentPlacements.includes('ring')
        ? 'Ring replaces Top / Left on shapes without straight edges'
        : null;
}

export function compartmentModeReason(caps: StructureCapabilities): string | null {
    return caps.compartmentModes.includes('inline')
        ? null
        : `Inline not offered: a ${SHAPE_LABEL[caps.form]} has no room for rows. The diagram is topology`;
}

/** One entry of the `bi-eye-slash` summary: what is not shown, and why. */
export interface HiddenFieldNote {
    /** Field labels, as their rows spell them. */
    readonly fields: string[];
    /** The parenthesized cause, verbatim. */
    readonly cause: string;
    /** Which of the two families the cause belongs to. */
    readonly family: 'symbol' | 'choice';
}

/**
 * The summary row at the foot of the tab, in the two families 7b separates: what the
 * SYMBOL removed, and what the CURRENT CHOICE made inert. Empty when nothing is
 * hidden, and the panel then draws no row at all.
 *
 * `mode` is the resolved mode - the authored value when it is still offered, the
 * fallback when it is not - because that is what the panel actually renders from, and
 * a summary computed from a value the panel is not honouring would misreport the tab.
 */
export function hiddenFieldNotes(
    caps: StructureCapabilities,
    mode: CompartmentMode,
): HiddenFieldNote[] {
    const out: HiddenFieldNote[] = [];

    // The three fields the compartment group loses when there is no compartment. They
    // are hidden by the CHOICE, so they are listed even on a Symbol that offers inline.
    if (mode === 'none') {
        out.push({
            fields: ['Columns', 'Empty slots', 'Edge marker'],
            cause: 'Mode is None',
            family: 'choice',
        });
    }
    if (!caps.showsFieldCompartments) {
        out.push({
            fields: ['Field compartments'],
            cause: 'no compartment on this Symbol',
            family: 'symbol',
        });
    }
    return out;
}
