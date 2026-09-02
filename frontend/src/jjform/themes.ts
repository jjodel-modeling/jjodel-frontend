/**
 * jjform/themes — the FORM THEME, as a named preset over three fields (slice FL2).
 *
 * Design source: `docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md`,
 * section "Themes", ratified 31-08-2026.
 *
 * ── What a theme is allowed to be ─────────────────────────────────────────────
 *
 * Three fields. Not "three fields to start with": three, closed. A theme names a
 * label placement, a density and a section chrome, and everything a preset can say
 * it says through those. The spec puts it as «New theme = new preset over the same
 * three fields; no new fields», and the type below is that sentence made checkable
 * — an object literal carrying a fourth key does not compile.
 *
 * The reason the registry is closed is not economy, it is the second half of the
 * auto-layout argument. FL1 removed per-field width from the vocabulary so that the
 * METAMODEL decides the layout; leaving the theme open would put the same freedom
 * back one door down, as a styling escape hatch that grows a field per request until
 * it is CSS with extra steps. A closed preset can be read at a glance and applied to
 * a metamodel nobody has seen yet, which an open one cannot.
 *
 * ── The invariant of this directory, again ────────────────────────────────────
 *
 * ZERO imports. Like `shape.ts`, `nav.ts`, `outline.ts` and `neighborhood.ts`: a
 * single import from `joiner/` would drag monaco and window-bound modules behind it
 * and end the portability. That is also why the constants below are numbers and
 * strings rather than anything computed from the stylesheet — this module states the
 * scale, the renderer (FL4) spends it.
 *
 * ── Relation to the cascade that already exists ───────────────────────────────
 *
 * `resolveTheme` is deliberately the same mechanism as
 * `editor-v2/nodes/instanceNodeStyle.ts:resolveInstanceNodeStyle`, down to the
 * explicit-`undefined` filter, and for the same stated reason: a bare spread would
 * let a layer that NAMES a field without an opinion erase the layer below. Layers go
 * least- to most-specific — metamodel, viewpoint, per-class — so a class that wants a
 * denser form says `{ density: 'dense' }` and keeps the viewpoint's placement and
 * chrome. One cascade for style fields, not two.
 *
 * The module is pure, so it holds no opinion about WHERE the layers are stored. The
 * D-graph end of the cascade — reading the viewpoint's style field, reading the
 * per-class override — belongs to the adapter, exactly as `instanceNodeStyle` says of
 * itself that «the shape is here so the next slice adds a source, not a mechanism».
 *
 * ── A name that is already taken, on purpose ──────────────────────────────────
 *
 * `viewpoint/ir/irTypes.ts:211` exports a DIFFERENT `FormTheme` — the four panel
 * skins `'plain' | 'card' | 'compact' | 'inspector'`, with a separate
 * `FormSpec.labelPlacement` in the vocabulary `'above' | 'left'`. Those literals are
 * persisted and, since the saved IR has no VersionFixer (R-B9), DEFINITIVE: they are
 * not renamed, not narrowed and not removed here. The two types live in two modules
 * and nothing imports both today; the module that eventually will is `IRForm.tsx`,
 * which is FL4's file, and reconciling them is FL4's decision. The same shape has a
 * precedent: `AccentPlacement` is declared twice, in `instanceNodeStyle.ts` and in
 * `irTypes.ts`, with different unions and no import between them.
 */

/** Where the label sits with respect to its field. `'top'` is the default reading;
 *  `'left'` buys vertical room and spends horizontal room on a fixed label column. */
export type LabelPlacement = 'top' | 'left';

/** How much air a row gets. Three steps, not a number: a continuous knob would be a
 *  per-form style decision, which is the thing this design removes. */
export type Density = 'comfortable' | 'compact' | 'dense';

/** What marks the boundary between two sections. `'none'` is a real option, not the
 *  absence of one: declaration order alone is the boundary, which is enough in a
 *  short form and quieter than any rule drawn on the page. */
export type SectionStyle = 'flat' | 'divided' | 'card' | 'none';

/**
 * The theme. Exactly three fields — see the header for why the count is the point.
 * Every field is required: a theme is a complete answer, and the partial answers are
 * the LAYERS of the cascade (`Partial<FormTheme>`), never a theme itself.
 */
export interface FormTheme {
    labelPlacement: LabelPlacement;
    density: Density;
    sectionStyle: SectionStyle;
}

/** The four presets of the spec, by their spec names. Capitalised as the spec table
 *  writes them, which also keeps the preset `Compact` distinguishable from the
 *  density `'compact'` — they are not the same thing, and two of the presets prove
 *  it: `Sectioned` and `Comfortable` share a density and differ in chrome. */
export type FormThemeName = 'Comfortable' | 'Compact' | 'Sectioned' | 'Dense';

/**
 * The preset table, verbatim from the spec's "Themes" section.
 *
 * Full values rather than `Partial`, unlike `INSTANCE_NODE_PRESETS`: there are three
 * fields and every preset states all three, so a partial here would only hide which
 * of the four columns a preset actually chose.
 */
export const FORM_THEME_PRESETS: Record<FormThemeName, FormTheme> = {
    /** The default. Labels above, room to breathe, sections as a plain eyebrow. */
    Comfortable: { labelPlacement: 'top', density: 'comfortable', sectionStyle: 'flat' },
    /** Two columns and a rule per section: the most rows per screen that still reads. */
    Compact: { labelPlacement: 'left', density: 'compact', sectionStyle: 'divided' },
    /** Comfortable's spacing, with each section closed into its own card. */
    Sectioned: { labelPlacement: 'top', density: 'comfortable', sectionStyle: 'card' },
    /** Everything tightened and no chrome at all — order is the only boundary left. */
    Dense: { labelPlacement: 'left', density: 'dense', sectionStyle: 'none' },
};

/** The name of the default preset, kept separate from the object so the fact "the
 *  default is Comfortable" is stated once and can be read back. */
export const FORM_THEME_DEFAULT_NAME: FormThemeName = 'Comfortable';

/** The factory default the cascade folds over: no layer at any level resolves here. */
export const FORM_THEME_DEFAULT: FormTheme = FORM_THEME_PRESETS[FORM_THEME_DEFAULT_NAME];

/** Every preset name, in the spec's table order. For a chooser that must list them
 *  without hardcoding the four names a second time. */
export const FORM_THEME_NAMES: readonly FormThemeName[] = [
    'Comfortable', 'Compact', 'Sectioned', 'Dense',
];

/**
 * Fold the cascade over the factory default.
 *
 * The three parameters are the three levels, least- to most-specific, and each is a
 * `Partial`: "no opinion" is a field left out (or explicitly `undefined`), which
 * leaves the level below in place. That is what makes a per-class override able to
 * change `density` alone without also inheriting the placement of whatever preset it
 * was written next to.
 */
export function resolveTheme(
    defaults?: Partial<FormTheme> | null,
    viewpointTheme?: Partial<FormTheme> | null,
    classTheme?: Partial<FormTheme> | null,
): FormTheme {
    let out: FormTheme = { ...FORM_THEME_DEFAULT };
    for (const layer of [defaults, viewpointTheme, classTheme]) {
        if (!layer) continue;
        // The explicit `undefined` filter is the whole point, and it is the same one
        // `resolveInstanceNodeStyle` carries: a spread would let a layer that names a
        // field without an opinion erase the layer below.
        const stated = Object.entries(layer).filter(([, v]) => v !== undefined);
        out = { ...out, ...Object.fromEntries(stated) } as FormTheme;
    }
    return out;
}

/** A preset as a cascade layer. A preset states all three fields, so using one as a
 *  layer replaces the level below entirely — which is what choosing a preset means. */
export function themeLayer(name: FormThemeName): FormTheme {
    return { ...FORM_THEME_PRESETS[name] };
}

/** The preset a resolved theme corresponds to, or `null` when the cascade produced a
 *  combination no preset names — which a per-field override can legitimately do
 *  (`Compact` + `{density:'dense'}` is left/dense/divided, and that is none of the
 *  four). A chooser uses this to decide whether to show a preset as selected. */
export function themeName(theme: FormTheme): FormThemeName | null {
    for (const name of FORM_THEME_NAMES) {
        const p = FORM_THEME_PRESETS[name];
        if (p.labelPlacement === theme.labelPlacement
            && p.density === theme.density
            && p.sectionStyle === theme.sectionStyle) return name;
    }
    return null;
}

/* ── Rendering scales ──────────────────────────────────────────────────────────
 *
 * The three fields map to the constants below and to NOTHING else. This is the part
 * that keeps the theme from becoming a styling system: a renderer that needs a number
 * finds it here, keyed by the field that decides it, so "which theme is this" and
 * "how much padding" stay one lookup apart instead of being re-decided per component.
 *
 * Units are CSS pixels, as plain numbers. The module has no imports and emits no
 * strings the renderer has to parse; `${DENSITY_SCALE[d].fieldPaddingY}px` is the
 * renderer's business.
 */

/** The padding, type size and gaps of one density step. */
export interface DensityScale {
    /** Vertical padding inside a field control. */
    fieldPaddingY: number;
    /** Horizontal padding inside a field control. */
    fieldPaddingX: number;
    /** Type size of the field's value. */
    fontSize: number;
    /** Gap between two rows of the 12-column grid. */
    rowGap: number;
    /** Gap between two sections. Constant across the three steps by design: density
     *  tightens the ROWS, and letting it tighten the section boundary too would undo
     *  the only separation `sectionStyle: 'none'` has left. */
    sectionGap: number;
}

/** The three steps, from the spec's rendering notes. Named constants and not numbers
 *  scattered through the renderer: the whole point of the field is that one lookup
 *  answers for the entire form. */
export const DENSITY_SCALE: Record<Density, DensityScale> = {
    comfortable: { fieldPaddingY: 7, fieldPaddingX: 10, fontSize: 12.5, rowGap: 14, sectionGap: 14 },
    compact: { fieldPaddingY: 5, fieldPaddingX: 9, fontSize: 12, rowGap: 8, sectionGap: 14 },
    dense: { fieldPaddingY: 4, fieldPaddingX: 8, fontSize: 11.5, rowGap: 6, sectionGap: 14 },
};

/**
 * Width of the label column when the label sits to the left.
 *
 * The spec gives a range, 72-78px, and a named constant has to pick. 72 is the only
 * multiple of 8 inside it and the project's base grid is 8px (CLAUDE.md §7.1), so the
 * choice is the grid's rather than a taste. Note that the pre-existing IR `compact`
 * theme uses 88px (`irFormStyle.scss`, `grid-template-columns: 88px 1fr`); the new
 * preset is deliberately tighter.
 */
export const LABEL_COLUMN_WIDTH = 72;

/** Type size of a field label, both placements. The spec states it once, for `top`;
 *  one label type-size across the two placements is the reading that keeps a form
 *  recognisable as the same form when the theme changes. */
export const LABEL_FONT_SIZE = 11;

/** Weight of a field label, both placements — same source and same reading. */
export const LABEL_FONT_WEIGHT = 500;

/** What the placement decides, and only that. Type size and weight are NOT here:
 *  they do not vary, and repeating them per placement would suggest they could. */
export interface LabelLayout {
    /** Width of the label column in px, or `null` when the label is above the field
     *  and there is no column. */
    columnWidth: number | null;
    /** Alignment of the label text. Right against the field in the two-column
     *  reading, so label and control meet on a single vertical line. */
    align: 'left' | 'right';
}

export const LABEL_LAYOUT: Record<LabelPlacement, LabelLayout> = {
    top: { columnWidth: null, align: 'left' },
    left: { columnWidth: LABEL_COLUMN_WIDTH, align: 'right' },
};

/**
 * Background of the card header band, as the token rather than the hex.
 *
 * The spec says `#f8fafc`, which is `$slate-50`, which is what
 * `--color-form-panel` is painted in light — and its declaration carries the comment
 * «card-theme panel, sub-form header», i.e. exactly this role. Emitting the token
 * instead of the literal keeps the band alive in dark mode, where the same role is
 * `#0f1012`. Precedent for a `var()` inside a TS module: `instanceNodeStyle.ts`'s
 * `NEUTRAL_ACCENT`.
 *
 * Do NOT alias this to `--color-bg-secondary` or any of the 15 names declared by both
 * `styles/tokens/` and `styles/tokens.css`: the two disagree, `tokens.css` wins the
 * cascade, and this pair has already come out inverted once (see the comment block
 * above the declaration in `_colors-light.scss`).
 */
export const SECTION_HEADER_BAND = 'var(--color-form-panel)';

/** The chrome a section wears. Four booleans-and-a-colour, one per thing a renderer
 *  can draw, so `sectionStyle` never has to be re-read as a series of `if`s. */
export interface SectionChrome {
    /** The small section heading above the fields. */
    eyebrow: boolean;
    /** A rule closing the section off from the next one. */
    divider: boolean;
    /** The section is a bordered card rather than a run of rows. */
    card: boolean;
    /** Fill of the card's header band, or `null` when there is no band. */
    headerBand: string | null;
}

export const SECTION_CHROME: Record<SectionStyle, SectionChrome> = {
    flat: { eyebrow: true, divider: false, card: false, headerBand: null },
    divided: { eyebrow: true, divider: true, card: false, headerBand: null },
    card: { eyebrow: true, divider: false, card: true, headerBand: SECTION_HEADER_BAND },
    /** No chrome at all: no heading, no rule, no box. Order is the boundary. */
    none: { eyebrow: false, divider: false, card: false, headerBand: null },
};
