/**
 * formAutoLayout — where FL1, FL2 and FL3 meet the form renderer (FL4).
 *
 * Specification: `docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md`,
 * ratified 31-08-2026, amendments A1 and A2. The board `Form Auto Layout.dc.html` lives in
 * the design project and not in this repository: it is read as an ILLUSTRATION of the
 * rules below and never as their source — the spec says so in its own first paragraph, and
 * FL1 measured three places where the board's hand-tuned rows and the rules disagree.
 *
 * Three modules land here and none of them knew about the others:
 *
 *  - `jjform/layout.ts` (FL1) decides the WIDTH of a field and the packing of the rows,
 *    from a `MetamodelShape`;
 *  - `jjform/themes.ts` (FL2) decides the three theme fields and the scales they spend;
 *  - `widgets/index.ts` (FL3) holds the write-side twins, keyed by the NAME FL1 emits.
 *
 * This module is the ADAPTER between them and the two surfaces that render a form: the
 * edit form (`IRForm` → `IRFormField`) and the create draft (`InstanceManagerTab`'s
 * `DraftDialog`). Both go through `autoLayoutRows`, which is the whole of the prompt's
 * «nessuna form parallela»: two callers, one geometry.
 *
 * ── Why the input is not `FormFieldDescriptor` ────────────────────────────────
 *
 * The two surfaces describe a field with two different types — `FormFieldDescriptor`
 * (a live slot of an existing instance) and `jjform.DraftField` (a field of a draft that
 * has no slots yet) — and neither is convertible into the other. What they DO share is the
 * handful of facts FL1 reads: a key, a type name, bounds, whether it is an enum and how
 * many literals it has, whether it is a reference. `AutoLayoutInput` is exactly that
 * intersection, and the two `inputFrom…` functions below are the only places that know
 * either concrete type.
 *
 * ── Why a synthetic `MetamodelShape` ──────────────────────────────────────────
 *
 * FL1 takes shapes, and this side has descriptors. Rather than widen FL1's signature — the
 * module has zero imports and that is load-bearing — the descriptors are projected ONTO its
 * types. The projection is total for everything the width ladder reads and empty for
 * everything it does not: the synthetic shape carries the enums (because the literal count
 * chooses between a segmented control and a select) and no classes at all (because
 * `widthOf` never looks one up). A projection that filled in more would be inventing
 * metamodel that the form does not have.
 *
 * ── Node-loadable, like its neighbours ────────────────────────────────────────
 *
 * Every import here is either a TYPE (erased) or a module with no runtime dependencies of
 * its own: the `jjform` barrel, whose files import nothing, and `shapeDraw`'s
 * `classifyAttrType`, whose module has two `import type` lines and nothing else. Nothing
 * reaches the joiner barrel, which pulls Monaco, which dereferences `window` at import
 * time — the constraint `formSections.ts` and `formDiagnostics.ts` were split off for.
 */

import {
    DENSITY_SCALE,
    FORM_THEME_PRESETS,
    LABEL_FONT_SIZE,
    LABEL_FONT_WEIGHT,
    LABEL_LAYOUT,
    SECTION_CHROME,
    layoutField,
    packRows,
    resolveTheme,
} from '../../../../jjform';
import type {
    AttrShape,
    DraftField,
    FormTheme as PresetTheme,
    FormThemeName,
    FormWidget,
    LayoutAnnotations,
    LayoutField,
    LayoutRow,
    MetamodelShape,
    RefShape,
    SectionChrome,
} from '../../../../jjform';
import { classifyAttrType } from '../../hooks/shapeDraw';
import type { FormTheme as LegacySkin } from './irTypes';
import type { FormFieldDescriptor } from './useFormWidgets';
import { extendedWidget } from './widgets';

// ─── The intersection the width ladder reads ─────────────────────────────────

/**
 * What FL1 needs to know about one field, whatever surface described it.
 *
 * No span and no widget: those are the ANSWER, and a caller that could state either would
 * be the per-field width the whole design exists to remove.
 */
export interface AutoLayoutInput {
    key: string;
    /** Opaque handle, carried through onto `LayoutField.id`. A draft field has no slot
     *  yet, so its key doubles as its handle; nothing downstream dereferences it. */
    id: string;
    /** The metamodel's spelling — `EString`, `StateKind`, `Transition`. Rung 3 parses it. */
    typeName: string;
    lower: number;
    /** -1 is unbounded, as everywhere else in the engine. */
    upper: number;
    isEnum: boolean;
    /** How many literals the enumeration has, when this is one. Absent means «unresolved»,
     *  which FL1 answers with the select rather than with a segmented control it cannot
     *  draw a button count for. */
    enumLiteralCount?: number;
    isReference: boolean;
    isComposition: boolean;
    readOnly: boolean;
    derived: boolean;
}

/** Enum name under which a field's literals are filed in the synthetic shape. The type name
 *  IS the enum name in this codebase (`describeSlot` reads both off the same feature), so
 *  the key needs no invention. */
const enumKey = (i: AutoLayoutInput): string => i.typeName || i.key;

/**
 * The synthetic metamodel: the enums of these fields, and nothing else.
 *
 * Literal IDENTITIES are not reconstructed, only the count, because the count is the only
 * thing `widthOf` reads (`ENUM_SEGMENTED_MAX`). Fabricating ids that no D element answers to
 * would put a lie in a structure whose whole point is that its ids are opaque handles.
 */
export function syntheticShape(inputs: readonly AutoLayoutInput[]): MetamodelShape {
    const enums: MetamodelShape['enums'] = {};
    for (const i of inputs) {
        if (!i.isEnum || i.enumLiteralCount === undefined) continue;
        const name = enumKey(i);
        enums[name] = {
            id: `synthetic_enum_${name}`,
            name,
            literals: Array.from({ length: i.enumLiteralCount }, (_, n) => ({
                id: `synthetic_literal_${name}_${n}`,
                name: String(n),
            })),
        };
    }
    return { enums, classes: {} };
}

/** One input as the feature FL1 classifies. A composition is a reference here, exactly as
 *  `RefShape.composition` says: the split into `refs` / `children` is the CLASS's, and a
 *  feature passed on its own keeps the flag instead. */
export function featureOf(i: AutoLayoutInput): AttrShape | RefShape {
    const base = {
        key: i.key,
        id: i.id,
        lower: i.lower,
        upper: i.upper,
        many: i.upper !== 1,
        required: i.lower >= 1,
        derived: i.derived,
        readOnly: i.readOnly,
    };
    if (i.isReference || i.isComposition) {
        return { ...base, of: i.typeName, ofId: `synthetic_class_${i.typeName}`, composition: i.isComposition };
    }
    return {
        ...base,
        type: classifyAttrType(i.typeName, i.isEnum),
        enum: i.isEnum ? enumKey(i) : undefined,
        typeName: i.typeName,
    };
}

/**
 * The rows of one SECTION, packed.
 *
 * Per section and not per form, because rule 3 restarts the packing at every section
 * boundary and the two callers already have their fields partitioned — `buildFormSections`
 * on the edit side, a single list on the draft side. Handing the whole form in would mean
 * re-deciding the sections here, in a second place.
 */
export function autoLayoutRows(
    inputs: readonly AutoLayoutInput[],
    annotations?: LayoutAnnotations,
): LayoutRow[] {
    const shape = syntheticShape(inputs);
    return packRows(inputs.map(i => layoutField(featureOf(i), shape, annotations)));
}

// ─── The two surfaces ────────────────────────────────────────────────────────

/** Literals offered for an enum or reference, counted across the picker's groups. */
const optionCount = (groups: readonly { options: readonly unknown[] }[]): number =>
    groups.reduce((n, g) => n + g.options.length, 0);

/** The edit form's descriptor as the width ladder sees it. */
export function inputFromDescriptor(f: FormFieldDescriptor): AutoLayoutInput {
    return {
        key: f.name,
        id: f.slotId || f.name,
        typeName: f.typeName,
        lower: f.lowerBound,
        upper: f.upperBound,
        isEnum: f.isEnum,
        // Only for an enum: the same array holds REFERENCE candidates, whose count says
        // nothing about a width and would be read as a literal count if passed on.
        enumLiteralCount: f.isEnum ? optionCount(f.options) : undefined,
        isReference: f.isReference,
        isComposition: f.isComposition,
        readOnly: f.isReadOnly,
        derived: f.isDerived,
    };
}

/** `0..*`, `1..1` — the only form a `DraftField` states its bounds in. A shape it does not
 *  have is read as `0..1`, which is what an unbounded-unknown renders as anyway. */
export function boundsOfMultiplicity(m: string): { lower: number; upper: number } {
    const parts = String(m ?? '').split('..');
    if (parts.length !== 2) return { lower: 0, upper: 1 };
    const lower = Number(parts[0]);
    const upper = parts[1].trim() === '*' ? -1 : Number(parts[1]);
    return {
        lower: Number.isFinite(lower) ? lower : 0,
        upper: Number.isFinite(upper) ? upper : 1,
    };
}

/**
 * The create draft's field as the width ladder sees it.
 *
 * A draft never carries a read-only field — `draftableAttrs` filters them out before the
 * model is built — so the two flags are `false` by construction rather than by default.
 */
export function inputFromDraftField(f: DraftField): AutoLayoutInput {
    const { lower, upper } = boundsOfMultiplicity(f.multiplicity);
    return {
        key: f.key,
        id: f.key,
        typeName: f.typeName,
        lower,
        upper,
        isEnum: f.kind === 'enum',
        enumLiteralCount: f.kind === 'enum' ? f.options.length : undefined,
        isReference: f.kind === 'ref',
        isComposition: false,
        readOnly: false,
        derived: false,
    };
}

// ─── A2: the two `FormTheme`s, reconciled in one place ───────────────────────

/**
 * The persisted panel skin → the preset it names.
 *
 * Amendment A2 of the spec. `irTypes.FormTheme` is four PANEL SKINS, persisted in the saved
 * IR, which has no VersionFixer (R-B9) and whose literals are therefore definitive;
 * `jjform.FormTheme` is the three-field preset. Neither is renamed: this table is the
 * mapping, and it is the only one.
 *
 * `card` and `inspector` both land on `Sectioned`, and that is not a defect of the table:
 * a preset states a label placement, a density and a section chrome, and those two skins
 * agree on all three — they differ in whether the section header is a BAND with a collapse
 * control, which is chrome the stylesheet draws and not one of the theme's three fields.
 * The map is deliberately not injective; making it so would mean inventing a fifth preset
 * for a difference the theme vocabulary does not carry.
 */
export const LEGACY_SKIN_PRESET: Readonly<Record<LegacySkin, FormThemeName>> = {
    plain: 'Comfortable',
    card: 'Sectioned',
    compact: 'Compact',
    inspector: 'Sectioned',
};

/**
 * The resolved theme of a form, from what the saved IR actually holds.
 *
 * Two legacy fields become two LAYERS of FL2's cascade, least- to most-specific:
 *
 *  1. the skin, as a whole preset — choosing a preset is replacing the level below;
 *  2. `FormSpec.labelPlacement`, when the author stated one, as a one-field layer over it.
 *     `'above'` is FL2's `'top'`; the two vocabularies name the same placement and the
 *     rename happens here rather than in either type.
 *
 * `classTheme` is the per-class rung of the spec's cascade, threaded through for the caller
 * that will have one. Nothing in the D graph stores it yet, and this signature is what
 * makes adding the source a change of one call site rather than of the mechanism.
 */
export function resolveFormTheme(
    skin: LegacySkin,
    labelPlacement?: 'above' | 'left',
    classTheme?: Partial<PresetTheme> | null,
): PresetTheme {
    const preset = FORM_THEME_PRESETS[LEGACY_SKIN_PRESET[skin]];
    const stated = labelPlacement
        ? { labelPlacement: labelPlacement === 'above' ? ('top' as const) : ('left' as const) }
        : null;
    return resolveTheme(preset, stated, classTheme);
}

/** The chrome a section wears under this theme. A re-export in function form, so a renderer
 *  never has to read `sectionStyle` back as a series of `if`s. */
export function chromeOf(theme: PresetTheme): SectionChrome {
    return SECTION_CHROME[theme.sectionStyle];
}

/**
 * The theme as CSS custom properties.
 *
 * FL2 states the scale in plain numbers and says the renderer spends it; this is where it
 * is spent. Custom properties and not a class per preset, for the reason FL2 gives for the
 * numbers being numbers: a fifth preset must be a new row in a table, never a new
 * stylesheet block.
 *
 * `--ir-form-label-col` is emitted ONLY for the left placement. An `auto` fallback would
 * silently give the two-column grid a width, so its absence is what the stylesheet tests.
 */
export function themeVars(theme: PresetTheme): Record<string, string> {
    const d = DENSITY_SCALE[theme.density];
    const label = LABEL_LAYOUT[theme.labelPlacement];
    const vars: Record<string, string> = {
        '--ir-form-row-gap': `${d.rowGap}px`,
        '--ir-form-section-gap': `${d.sectionGap}px`,
        '--ir-form-pad-y': `${d.fieldPaddingY}px`,
        '--ir-form-pad-x': `${d.fieldPaddingX}px`,
        '--ir-form-font-size': `${d.fontSize}px`,
        '--ir-form-label-size': `${LABEL_FONT_SIZE}px`,
        '--ir-form-label-weight': String(LABEL_FONT_WEIGHT),
        '--ir-form-label-align': label.align,
    };
    if (label.columnWidth !== null) vars['--ir-form-label-col'] = `${label.columnWidth}px`;
    return vars;
}

// ─── FL3: which widget a cell renders ────────────────────────────────────────

/**
 * The extended widget a cell should render, or `null` for «the dispatch that was already
 * there».
 *
 * Three rules, and the second one is the trap FL3's own header warns about:
 *
 *  1. An AUTHOR OVERRIDE wins and is left to the legacy dispatch. `FormSpec.widgets` is
 *     persisted and definitive (R-B9), the existing dispatch honours it, and re-routing an
 *     overridden field through the width map would silently change what a saved view asked
 *     for.
 *  2. `textarea` is spelled twice, and the two mean opposite things. `WidgetKind.textarea`
 *     — reachable only as an override, since no type derives it — is the JjEL EXPRESSION
 *     editor `TextWidget` renders at a fixed height, and rule 1 already keeps it on the
 *     legacy side. The registry's `textarea` is the width map's growing PROSE box, reached
 *     only when the metamodel type says `text`. Rule 1 is what keeps them apart, which is
 *     why it is stated first.
 *  3. `@url` has no read-side twin (FL3 §F5, asserted in its tests). It is nonetheless a
 *     registry entry with a write-side widget, so it resolves here like the rest: the
 *     missing half is a gap in the Row view library, not in this dispatch.
 *
 * A name the registry does not cover — `toggle`, `segmented`, `select`, `number`, `text`,
 * `code`, `picker` — returns `null` on purpose: those widgets exist already and are not
 * missing.
 */
export function extendedWidgetFor(
    autoWidget: FormWidget,
    descriptor: Pick<FormFieldDescriptor, 'widget' | 'derivedWidget' | 'isReadOnly' | 'isComposition'>,
): FormWidget | null {
    // Rule 1: the author asked for something else. Also covers the JjEL textarea.
    if (descriptor.widget !== descriptor.derivedWidget) return null;
    // A read-only cell offers no editor at all (deviation 3 of the shape contract); the
    // legacy dispatch renders it as a value and this must not hand it a control.
    if (descriptor.isReadOnly) return null;
    // A containment list is a sub-form, not a field: the spec's own reason for leaving
    // `children` out of the grid. `ListWidget` keeps it.
    if (descriptor.isComposition) return null;
    return extendedWidget(autoWidget) ? autoWidget : null;
}

// ─── The overflow promotion, as a decision ───────────────────────────────────

/**
 * How far below the half-row a chip run must fall before a promoted field goes back.
 *
 * The prompt's «isteresi minima: promuovi su overflow, non retrocedere a ogni keystroke».
 * Without a band the field flips on every character that crosses the boundary, because
 * promoting to 12 changes nothing about the measured content width but demoting to 6 makes
 * it overflow again — the classic two-state oscillation. 0.85 is one chip's width of margin
 * at the sizes the design uses, and it is a constant rather than a parameter for the reason
 * the grid is: a knob here is a per-form layout setting.
 */
export const OVERFLOW_DEMOTE_RATIO = 0.85;

/**
 * Promoted, or not, given the last verdict and a fresh measurement.
 *
 * Pure, and separate from the hook that measures, for the sub-rule of CLAUDE.md §5: a sort
 * or a threshold validated by reading the code is not validated. Both widths are in the
 * same units; `halfWidth` is the width the field WOULD have at 6 columns, which the caller
 * computes from the grid and not from the element, since a promoted element is already 12
 * wide and measuring it would answer a different question.
 */
export function overflowVerdict(previous: boolean, contentWidth: number, halfWidth: number): boolean {
    if (halfWidth <= 0) return previous;
    if (!previous) return contentWidth > halfWidth;
    return contentWidth > halfWidth * OVERFLOW_DEMOTE_RATIO;
}

/** The span a field occupies once the runtime measurement is folded in. Only a field FL1
 *  flagged `growsOnOverflow` can change, and only upwards: the packer's own stretch already
 *  produced the span for everything else. */
export function spanWithOverflow(field: LayoutField, promoted: boolean): number {
    return field.growsOnOverflow && promoted ? 12 : field.span;
}

/** Re-exported so a renderer imports the geometry it draws from the module that produced
 *  it, rather than reaching past this adapter into `jjform` for half of it. */
export type { LayoutField, LayoutRow, PresetTheme };
