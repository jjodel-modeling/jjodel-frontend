/**
 * jjform/layout — the width registry and the packer of the form auto-layout (FL1).
 *
 * Specification: `docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md`,
 * ratified 31-08-2026. Boundary contract: `form-engine-contract.md`.
 *
 * The principle the whole module exists to enforce: THE METAMODEL DECIDES THE
 * LAYOUT. A field never states its own width, and a user never arranges fields.
 * There is consequently no per-field width anywhere in these types — not even an
 * optional one — because an optional override is an override, and the first
 * caller that sets it ends the principle. A correction promotes to the metamodel
 * as an annotation, on the same ladder the value renderers already climb.
 *
 * ── The invariant of this directory, restated ─────────────────────────────────
 *
 * ZERO imports beyond the sibling TYPES of `shape.ts`, exactly as `shape.ts` and
 * `create.ts` have. That is what keeps the module loadable under vitest without
 * the joiner barrel, and it is also what decides the shape of the registry below:
 * `classifyAttrType` lives in `editor-v2/hooks/shapeDraw.ts`, on the host side of
 * the adapter, and cannot be imported here.
 *
 * ── Why that is not a duplication ─────────────────────────────────────────────
 *
 * It would be one if this file re-decided what `EInt` is. It does not: it CONSUMES
 * `AttrShape.type`, which is `classifyAttrType`'s verbatim output, so the primitive
 * list is read once and lives in one place. What this file adds is the vocabulary
 * `classifyAttrType` has no opinion about — `datetime`, `duration`, `color`,
 * `code`, `email`, `url`, `text`, `richtext` — every one of which classifies as
 * `unknown` or `string` upstream. The extension therefore only ever fires on the
 * bottom of the classification, never over one of its verdicts, which is why the
 * two lists cannot drift into disagreeing: they do not overlap.
 *
 * ── The ladder ────────────────────────────────────────────────────────────────
 *
 * Same three rungs as the renderers, in the same order, and the field NAME is
 * never one of them:
 *
 *   1. the metamodel type — `AttrShape.type`, plus cardinality and reference-ness,
 *      which settle `collection` and `reference` outright;
 *   2. a metamodel annotation — `jjodel/renderer=…`, mapped through
 *      `RENDERER_WIDTH_KIND`. A value outside the map falls THROUGH rather than
 *      blanking the field, the way `valueRenderer` treats `rendererOverride`;
 *   3. the type NAME, parsed syntactically — a set membership test, not a
 *      heuristic, and only over names rung 1 left at `unknown` or `string`.
 *
 * Every decision carries the rung that produced it in `reason`, for the same
 * reason the renderers do: a layout nobody can interrogate is a layout nobody can
 * correct at the metamodel.
 */

import type { AttrShape, ClassShape, MetamodelShape, RefShape } from './shape';

// ─── The grid ────────────────────────────────────────────────────────────────

/** The spec's grid. Not a parameter: rule 4 of the packing is that the algorithm
 *  never changes, and a variable column count is the first way it would. */
export const GRID_COLUMNS = 12;

/** The three width classes. `3` is a quarter row, `6` a half, `12` the whole. */
export type Span = 3 | 6 | 12;

/**
 * How many literals an enumeration may have and still render as a segmented
 * control. Beyond it the spec asks for a select, which needs a half row.
 */
export const ENUM_SEGMENTED_MAX = 3;

// ─── The registry ────────────────────────────────────────────────────────────

/**
 * The vocabulary of the width map — one member per ROW of the spec's table.
 *
 * `enumShort` / `enumLong` are one row of the spec split in two, because the
 * literal count is what chooses between them and a `Record` cannot hold a
 * predicate. `unknown` is the honest bottom, and it is deliberately a half-row of
 * text rather than a failure: a metamodel that declares an attribute over a type
 * this vocabulary does not name is asking for a text field, exactly as
 * `classifyAttrType`'s own `unknown` is.
 */
export type WidthKind =
    | 'boolean'
    | 'enumShort'
    | 'enumLong'
    | 'number'
    | 'date'
    | 'datetime'
    | 'duration'
    | 'color'
    | 'string'
    | 'code'
    | 'email'
    | 'url'
    | 'reference'
    | 'collection'
    | 'text'
    | 'richtext'
    | 'unknown';

/**
 * The write-side twin of a Row view, by name. FL3 builds these; FL1 only decides
 * WHICH one a field gets, which is why the type is a union of names and not of
 * components — a name crosses the module boundary, a component would not.
 */
export type FormWidget =
    | 'toggle'
    | 'segmented'
    | 'select'
    | 'number'
    | 'date'
    | 'datetime'
    | 'duration'
    | 'color'
    | 'text'
    | 'code'
    | 'email'
    | 'url'
    | 'picker'
    | 'chips'
    | 'textarea'
    | 'richtext';

export interface WidthClass {
    span: Span;
    widget: FormWidget;
}

/**
 * THE registry. One definition, transcribed from the spec's table, and the only
 * place a width is ever written down.
 *
 * It is OPEN in the spec's sense: a new type is one new row here, and the packer
 * below never learns about it. It is closed to per-field widths, which is a
 * different sentence and the one that matters.
 */
export const WIDTH_MAP: Readonly<Record<WidthKind, WidthClass>> = {
    boolean: { span: 3, widget: 'toggle' },
    enumShort: { span: 3, widget: 'segmented' },
    enumLong: { span: 6, widget: 'select' },
    number: { span: 3, widget: 'number' },
    date: { span: 3, widget: 'date' },
    datetime: { span: 3, widget: 'datetime' },
    duration: { span: 3, widget: 'duration' },
    color: { span: 3, widget: 'color' },
    string: { span: 6, widget: 'text' },
    code: { span: 6, widget: 'code' },
    email: { span: 6, widget: 'email' },
    url: { span: 6, widget: 'url' },
    reference: { span: 6, widget: 'picker' },
    collection: { span: 6, widget: 'chips' },
    text: { span: 12, widget: 'textarea' },
    richtext: { span: 12, widget: 'richtext' },
    unknown: { span: 6, widget: 'text' },
};

// ─── Rung 2: the annotation ──────────────────────────────────────────────────

/**
 * `jjodel/renderer=…` values that also settle a WIDTH, mapped to the kind they
 * settle. Keys are `valueRenderer.DECLARABLE_RENDERERS` verbatim; the map is
 * partial on purpose, since `enumChip` and `progress` declare a notation over a
 * type whose width rung 1 has already decided, and re-deciding it here would let
 * a display choice change the geometry.
 *
 * The five width kinds no renderer can name — `datetime`, `duration`, `email`,
 * `url`, `richtext` — are reachable through rung 3 instead. That asymmetry is the
 * spec's, not an omission: the Row view library has nine members and the width
 * table has sixteen rows.
 */
export const RENDERER_WIDTH_KIND: Readonly<Record<string, WidthKind>> = {
    code: 'code',
    swatch: 'color',
    date: 'date',
    boolean: 'boolean',
    numberUnit: 'number',
    truncatedText: 'string',
};

// ─── Rung 3: the syntactic type names ────────────────────────────────────────
//
// Set membership over the NORMALISED type name, in the shape `valueRenderer`
// already uses for its own families: lowercase, trimmed, whole name only, never a
// substring. Every name below classifies as `unknown` or `string` upstream — see
// the header — so none of these sets can contradict `classifyAttrType`.

const normType = (t: string | undefined | null): string => (t ?? '').trim().toLowerCase();

const DATETIME_TYPE_NAMES: ReadonlySet<string> = new Set([
    'edatetime', 'datetime', 'timestamp', 'etimestamp', 'instant', 'einstant',
]);

const DURATION_TYPE_NAMES: ReadonlySet<string> = new Set([
    'eduration', 'duration', 'timespan', 'period', 'eperiod',
]);

/** Same words `valueRenderer.COLOR_TYPE_NAMES` holds, for the same question.
 *  Not imported because nothing here may import from `components/`; not a drift
 *  risk because a change to either list is a change to the SAME declaration and
 *  the pair is named in both headers. */
const COLOR_TYPE_NAMES: ReadonlySet<string> = new Set([
    'color', 'colour', 'ecolor', 'ecolour', 'rgb', 'rgba', 'rgbcolor', 'hexcolor',
]);

const CODE_TYPE_NAMES: ReadonlySet<string> = new Set([
    'code', 'ecode', 'expression', 'eexpression', 'script', 'escript', 'jjel', 'ocl', 'query',
]);

const EMAIL_TYPE_NAMES: ReadonlySet<string> = new Set(['email', 'eemail', 'emailaddress', 'mail']);

const URL_TYPE_NAMES: ReadonlySet<string> = new Set(['url', 'eurl', 'uri', 'euri', 'link', 'hyperlink']);

const TEXT_TYPE_NAMES: ReadonlySet<string> = new Set([
    'text', 'etext', 'longtext', 'multiline', 'memo', 'clob',
]);

const RICHTEXT_TYPE_NAMES: ReadonlySet<string> = new Set([
    'richtext', 'erichtext', 'html', 'ehtml', 'markdown', 'emarkdown',
]);

function syntacticKind(typeName: string | undefined): WidthKind | null {
    const t = normType(typeName);
    if (t === '') return null;
    if (DATETIME_TYPE_NAMES.has(t)) return 'datetime';
    if (DURATION_TYPE_NAMES.has(t)) return 'duration';
    if (COLOR_TYPE_NAMES.has(t)) return 'color';
    if (CODE_TYPE_NAMES.has(t)) return 'code';
    if (EMAIL_TYPE_NAMES.has(t)) return 'email';
    if (URL_TYPE_NAMES.has(t)) return 'url';
    if (TEXT_TYPE_NAMES.has(t)) return 'text';
    if (RICHTEXT_TYPE_NAMES.has(t)) return 'richtext';
    return null;
}

// ─── The resolution ──────────────────────────────────────────────────────────

/**
 * The annotations the layout reads, keyed by feature name.
 *
 * `renderer` is `jjodel/renderer=…` as `rowViewAnnotations` parses it, threaded in
 * by the host: `AttrShape` does not carry annotations and is not being widened to,
 * since the shape is the METAMODEL's structure and an annotation is a decoration
 * over it. Absent map, absent entry and unrecognised value are all the same
 * answer — rung 2 did not fire.
 */
export interface LayoutAnnotations {
    [featureKey: string]: { renderer?: string } | undefined;
}

/** Which rung decided, in the spec's own numbering. */
export type WidthRung = 'type' | 'annotation' | 'syntax' | 'bottom';

export interface WidthVerdict {
    kind: WidthKind;
    span: Span;
    widget: FormWidget;
    rung: WidthRung;
    reason: string;
}

/** A feature as the layout needs to see it: either half of `tableFeatures`. */
type Feature = AttrShape | RefShape;

const isRef = (f: Feature): f is RefShape => (f as RefShape).of !== undefined;

/**
 * Rung 1 → 2 → 3 → bottom, for ONE feature. The field name is not consulted at
 * any rung, which is the acceptance criterion of the whole ladder.
 */
export function widthOf(
    feature: Feature,
    shape: MetamodelShape,
    annotations?: LayoutAnnotations,
): WidthVerdict {
    const verdict = (kind: WidthKind, rung: WidthRung, reason: string): WidthVerdict => ({
        kind, ...WIDTH_MAP[kind], rung, reason,
    });

    // Rung 1a — cardinality. A multivalued feature is a chip input whatever it
    // holds, attribute or reference alike: the spec's `any 0..*` row.
    if (feature.many) {
        return verdict('collection', 'type', `multivalued (${feature.upper === -1 ? '0..*' : `0..${feature.upper}`})`);
    }
    // Rung 1b — reference-ness. A single-valued reference is a picker.
    if (isRef(feature)) return verdict('reference', 'type', `reference to ${feature.of}`);

    const attr = feature as AttrShape;

    // Rung 1c — the classified metamodel type, where it is decisive.
    switch (attr.type) {
        case 'boolean':
            return verdict('boolean', 'type', 'declared boolean');
        case 'number':
            return verdict('number', 'type', `declared numeric (${attr.typeName})`);
        case 'enum': {
            // An enumeration whose literals are unreachable resolves to the SELECT,
            // not to the segmented control: a segmented control has to draw one
            // button per literal, and it cannot draw an unknown number of them.
            const literals = attr.enum ? shape.enums[attr.enum]?.literals : undefined;
            if (!literals) return verdict('enumLong', 'type', `enum ${attr.enum ?? '?'} with unresolved literals`);
            const short = literals.length <= ENUM_SEGMENTED_MAX;
            return verdict(
                short ? 'enumShort' : 'enumLong',
                'type',
                `enum ${attr.enum} with ${literals.length} literal${literals.length === 1 ? '' : 's'}`,
            );
        }
        case 'date':
            // `EDate` classifies as `date`; a name that says `datetime` is still
            // reachable below, since rung 1 only fixes the FAMILY here.
            break;
        default:
            break;
    }

    // Rung 2 — the annotation.
    const declared = annotations?.[feature.key]?.renderer;
    if (declared) {
        const kind = RENDERER_WIDTH_KIND[declared];
        if (kind) return verdict(kind, 'annotation', `declared jjodel/renderer=${declared}`);
    }

    // Rung 3 — the type name, parsed.
    const syntactic = syntacticKind(attr.typeName);
    if (syntactic) return verdict(syntactic, 'syntax', `type name ${attr.typeName}`);

    // Bottom. `date` survived rung 1 as a family; everything else is the string /
    // unknown floor, and the two are kept apart because `unknown` is a statement
    // about the metamodel while `string` is a verdict about it.
    if (attr.type === 'date') return verdict('date', 'type', `declared date (${attr.typeName})`);
    if (attr.type === 'string') return verdict('string', 'type', `declared string (${attr.typeName})`);
    return verdict('unknown', 'bottom', `unrecognised type ${attr.typeName || '(none)'}`);
}

// ─── The packing ─────────────────────────────────────────────────────────────

export interface LayoutField {
    key: string;
    /** Opaque handle of the DAttribute / DReference, carried through untouched. */
    id: string;
    kind: WidthKind;
    widget: FormWidget;
    /** The span the field OCCUPIES, after any stretch. */
    span: Span;
    /** The span the registry gave it, before any stretch. Kept so a renderer can
     *  tell a half-row field that grew from one that was declared whole. */
    baseSpan: Span;
    /** True when the packer stretched it to close a short row. */
    stretched: boolean;
    /**
     * The runtime promotion of rule 2, and the ONLY width decision this module
     * defers. A chip input starts at 6 and goes to 12 when its chips overflow the
     * container — which is a measurement in pixels, and this module measures
     * nothing. FL4 reads the flag, measures, and promotes.
     */
    growsOnOverflow: boolean;
    /** `upper !== 1`. */
    many: boolean;
    required: boolean;
    readOnly: boolean;
    /** Which rung decided the width, and what it saw. */
    rung: WidthRung;
    reason: string;
}

export interface LayoutRow {
    fields: LayoutField[];
    /** Columns left empty on this row. Non-zero only where a multi refused to
     *  stretch, or where the row holds nothing but multis. */
    free: number;
}

export type SectionKey = 'attributes' | 'references';

export interface LayoutSection {
    key: SectionKey;
    title: string;
    rows: LayoutRow[];
}

export interface FormLayout {
    cls: string;
    sections: LayoutSection[];
}

/**
 * Greedy fill, then the stretch.
 *
 * Declaration order is preserved absolutely: no sort, no bin-packing, no
 * "intelligent" reflow to close a hole. A hole is information — it says the
 * metamodel declared a multi where a scalar would have closed the row — and a
 * packer that removed it would remove the reason to go fix the metamodel.
 *
 * The stretch is rule 2 in its entirety: the last SCALAR of a short row extends
 * to fill it; a multi never stretches by position, only by its own overflow, so a
 * row ending in a multi keeps its hole and the multi keeps `growsOnOverflow`.
 */
export function packRows(fields: readonly LayoutField[]): LayoutRow[] {
    const rows: LayoutRow[] = [];
    let current: LayoutField[] = [];
    let used = 0;

    const close = (): void => {
        if (current.length === 0) return;
        const free = GRID_COLUMNS - used;
        const last = current[current.length - 1];
        if (free > 0 && !last.growsOnOverflow) {
            current[current.length - 1] = { ...last, span: (last.span + free) as Span, stretched: true };
            rows.push({ fields: current, free: 0 });
        } else {
            rows.push({ fields: current, free });
        }
        current = [];
        used = 0;
    };

    for (const f of fields) {
        if (used + f.span > GRID_COLUMNS) close();
        current.push(f);
        used += f.span;
        if (used === GRID_COLUMNS) close();
    }
    close();
    return rows;
}

/** One feature to one unpacked field. Exported because FL4 needs the width of a
 *  single field (a live-edited one) without re-laying-out the form. */
export function layoutField(
    feature: Feature,
    shape: MetamodelShape,
    annotations?: LayoutAnnotations,
): LayoutField {
    const w = widthOf(feature, shape, annotations);
    return {
        key: feature.key,
        id: feature.id,
        kind: w.kind,
        widget: w.widget,
        span: w.span,
        baseSpan: w.span,
        stretched: false,
        growsOnOverflow: w.kind === 'collection',
        many: feature.many,
        required: feature.required,
        readOnly: feature.readOnly,
        rung: w.rung,
        reason: w.reason,
    };
}

/**
 * The whole form of one metaclass.
 *
 * Two sections and not one, because rule 3 says the packing restarts at each, and
 * they come from the metamodel in `tableFeatures`' order: attributes, then
 * references — what an instance IS before what it points at. `cls.children` is
 * absent for the reason it is absent from `tableFeatures`: a containment list is
 * not a field, it is a sub-form, and giving it a span would put a table inside a
 * grid cell.
 *
 * An empty section is dropped rather than rendered empty: a heading over nothing
 * is a promise the form does not keep.
 */
export function formLayout(
    cls: ClassShape,
    shape: MetamodelShape,
    annotations?: LayoutAnnotations,
): FormLayout {
    const section = (key: SectionKey, title: string, features: readonly Feature[]): LayoutSection | null => {
        if (features.length === 0) return null;
        return { key, title, rows: packRows(features.map(f => layoutField(f, shape, annotations))) };
    };

    const sections = [
        section('attributes', 'Attributes', cls.attrs),
        section('references', 'References', cls.refs),
    ].filter((s): s is LayoutSection => s !== null);

    return { cls: cls.key, sections };
}
