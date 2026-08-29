import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Checkbox, HelpText, Select, SegmentedControl, FormSection, PRESERVED_CHIP } from '../../../ui';
import type { MetaclassInfo } from '../../hooks/useEditorMode';
import { JjodelEvents } from '../../../../events/registry';
import { buildFormSections, type Section } from '../ir/formSections';
import { overrideIsCompatible, widgetForPrimitive } from '../ir/useFormWidgets';
import { viewRendererOverride, type ViewRendererOverride } from '../ir/widgetRenderer';
import { readRowViewAnnotations, type RowViewAnnotations } from '../../nodes/rowViewAnnotations';
import { RENDERER_LABELS, type SlotShape } from '../../nodes/valueRenderer';
import type {
    FeatureTreatment,
    FieldCompartmentSpec,
    FormSpec,
    FormTheme,
    VertexViewIR,
    WidgetKind,
} from '../ir/irTypes';
import './FormAuthoringBody.scss';

/**
 * FormAuthoringBody: the `Form` tab of the vertex authoring panel (Slice 2a, 2b).
 *
 * Authors `FormSpec` (spec addendum 2026-08-28): the panel skin (`theme`), the label
 * placement, the per-feature widget overrides, how references and children render, and
 * (since Slice 2b) which features sit in Basic. Every write starts from a spread of
 * the current `form` instead of building a new object out of the controls: the
 * whole-object commit of the panel would otherwise drop a key it does not know about,
 * with nothing on screen to say so.
 *
 * Purely presentational, no effect and no subscription (discovery 2026-08-28, R4): both
 * mounts of VertexAuthoringPanel keep every tab body mounted, so an effect here would
 * also run inside the symbol editor modal, where this tab is not even reachable.
 *
 * Rows are derived from the TARGET METACLASS, not from an object: there is no instance
 * and no slot in authoring. That is why they are not `FormFieldDescriptor`s and why
 * `buildFormSections` became generic. The derivation cascade below mirrors
 * `useFormWidgets.describeSlot` on metamodel data instead of slot proxies; the
 * duplication is deliberate and recorded here, as that module records its own against
 * `Info.value`.
 */

// --- pure helpers (exported for the unit tests) ------------------------------------

/**
 * One authorable feature of the target metaclass, reduced to what the two tables read.
 * `isReference` and `isComposition` are the two fields `buildFormSections` partitions on,
 * and they follow `Info.value`'s rule: composition WINS over reference.
 */
export interface AuthoringFeatureRow {
    name: string;
    /** Declared type name: a primitive ('EString'), an enum name, or a target class name. */
    typeName: string;
    lowerBound: number;
    /** -1 means unbounded, kept raw like everywhere else in the form code. */
    upperBound: number;
    isEnum: boolean;
    isReference: boolean;
    isComposition: boolean;
}

/** Label of each widget kind in the table. The vocabulary is closed (irTypes.WidgetKind). */
export const WIDGET_LABEL: Record<WidgetKind, string> = {
    text: 'Text',
    textarea: 'Code',
    select: 'Select',
    checkbox: 'Checkbox',
    color: 'Color',
    number: 'Stepper',
    reference: 'Picker',
    link: 'Link',
};

/** Every widget kind, in the order the table offers them. */
const ALL_WIDGETS: WidgetKind[] = ['text', 'textarea', 'select', 'checkbox', 'color', 'number', 'reference', 'link'];

const THEME_OPTIONS: { value: FormTheme; label: string }[] = [
    { value: 'plain', label: 'Plain' },
    { value: 'card', label: 'Card' },
    { value: 'compact', label: 'Compact' },
    { value: 'inspector', label: 'Inspector' },
];

const LABEL_PLACEMENT_OPTIONS: { value: 'above' | 'left'; label: string }[] = [
    { value: 'above', label: 'Above' },
    { value: 'left', label: 'Left' },
];

export const widgetLabel = (kind: WidgetKind): string => WIDGET_LABEL[kind] ?? kind;

/**
 * The widget the TYPE alone produces, the same cascade as `describeSlot` read off the
 * metamodel: enum first, then reference or composition, then the primitive table.
 */
export function deriveAuthoringWidget(row: Pick<AuthoringFeatureRow, 'typeName' | 'isEnum' | 'isReference' | 'isComposition'>): WidgetKind {
    if (row.isEnum) return 'select';
    if (row.isReference || row.isComposition) return 'reference';
    return widgetForPrimitive(row.typeName).widget;
}

/**
 * Alternatives the table offers for a derived widget: what `overrideIsCompatible` accepts,
 * minus the derived one (which is the placeholder, not an override) and minus `link`, which
 * is declared in the vocabulary but has no rendering yet (spec addendum sez. 14). Offering
 * it would persist, irreversibly, an override nothing draws.
 */
export function offeredOverrides(derived: WidgetKind): WidgetKind[] {
    return ALL_WIDGETS.filter(k => k !== derived && k !== 'link' && overrideIsCompatible(derived, k));
}

/** Treatment the multiplicity alone produces (spec addendum sez. 6). */
export const derivedTreatment = (upperBound: number): FeatureTreatment => (upperBound === 1 ? 'inline' : 'list');

/**
 * A FormSpec with nothing left in it is `undefined`, never `{}`.
 *
 * An empty object is harmless at render (every reader uses optional chaining) but it is
 * persisted forever: the saved IR has no VersionFixer (R-B9), so a `form: {}` left behind
 * by an author who tried a theme and went back would stay in the file for good.
 *
 * `basic: []` is NOT pruned, and that asymmetry with `widgets`/`features` is the point:
 * an empty map means "no override", which is the same thing as an absent map, while an
 * empty `basic` is a DECLARED answer ("nothing in Basic"), while absent means the
 * heuristic instead. Only the explicit reset removes the key.
 */
function pruneForm(next: FormSpec): FormSpec | undefined {
    const out: FormSpec = { ...next };
    if (out.widgets && Object.keys(out.widgets).length === 0) delete out.widgets;
    if (out.features && Object.keys(out.features).length === 0) delete out.features;
    return Object.keys(out).length === 0 ? undefined : out;
}

/**
 * Set or clear one scalar key of `FormSpec`.
 *
 * `undefined` REMOVES the key rather than writing it undefined: the round-trip of a view
 * whose theme was set and reset must be byte-identical to one where it was never set. Same
 * idiom as `FieldCompartmentListEditor.withChildFilter`.
 */
export function withFormKey(
    form: FormSpec | undefined,
    key: 'theme' | 'labelPlacement',
    value: FormTheme | 'above' | 'left' | undefined,
): FormSpec | undefined {
    const next: FormSpec = { ...form };
    if (value === undefined) delete next[key];
    else if (key === 'theme') next.theme = value as FormTheme;
    else next.labelPlacement = value as 'above' | 'left';
    return pruneForm(next);
}

/**
 * Set or clear one entry of `widgets` or `features`. The map itself disappears when its
 * last entry does, for the reason `pruneForm` gives.
 */
export function withFormEntry(
    form: FormSpec | undefined,
    map: 'widgets' | 'features',
    name: string,
    value: WidgetKind | FeatureTreatment | undefined,
): FormSpec | undefined {
    const next: FormSpec = { ...form };
    const entries = { ...(next[map] as Record<string, string> | undefined) };
    if (value === undefined) delete entries[name];
    else entries[name] = value;
    if (map === 'widgets') next.widgets = entries as Record<string, WidgetKind>;
    else next.features = entries as Record<string, FeatureTreatment>;
    return pruneForm(next);
}

/**
 * Is a feature in Basic, by the rule the interpreter applies (`useFormWidgets.isBasicField`)
 * read off the metamodel instead of a slot: a declared list is the COMPLETE answer, even
 * when it omits a required feature and even when it is empty; absent means the multiplicity
 * heuristic, which is literally how `describeSlot` computes `isRequired` (`lowerBound >= 1`).
 * Duplicated here for the same reason `deriveAuthoringWidget` duplicates the widget cascade:
 * authoring has no instance and no slot to ask.
 */
export function isBasicRow(row: Pick<AuthoringFeatureRow, 'name' | 'lowerBound'>, form: FormSpec | undefined): boolean {
    const declared = form?.basic;
    if (Array.isArray(declared)) return declared.includes(row.name);
    return row.lowerBound >= 1;
}

/** The heuristic membership as a list, in row order: what the first toggle materializes. */
const derivedBasic = (rows: AuthoringFeatureRow[]): string[] => rows.filter(r => r.lowerBound >= 1).map(r => r.name);

/**
 * Toggle one ROW in or out of Basic.
 *
 * With no `basic` on the ir the list is first MATERIALIZED from the heuristic and then
 * toggled: the first click turns the state from derived into declared, which the state row
 * says out loud. Anything else would be a silent half-state: a list that looks derived
 * while one feature already disagrees with it.
 *
 * The result is rebuilt in ROW order, with names matching no row appended verbatim at the
 * end, in their original order: a `basic` written by hand or by an AI is the author's to
 * keep, exactly like an ignored widget override. Removing one of those is
 * `withoutBasicName`, not this function.
 */
export function withBasic(
    form: FormSpec | undefined,
    rows: AuthoringFeatureRow[],
    name: string,
    checked: boolean,
): FormSpec | undefined {
    const next: FormSpec = { ...form };
    const current = Array.isArray(next.basic) ? next.basic : derivedBasic(rows);
    const member = new Set(current);
    if (checked) member.add(name);
    else member.delete(name);
    const known = new Set(rows.map(r => r.name));
    next.basic = [
        ...rows.filter(r => member.has(r.name)).map(r => r.name),
        ...current.filter(n => !known.has(n) && member.has(n)),
    ];
    return pruneForm(next);
}

/** Reset to the heuristic: removes the KEY, the one operation that undoes a declaration. */
export function withoutBasic(form: FormSpec | undefined): FormSpec | undefined {
    const next: FormSpec = { ...form };
    delete next.basic;
    return pruneForm(next);
}

/**
 * Drop ONE name from a declared `basic`, whatever it names. Used by the Clear of an entry
 * on an unknown feature: it never consults the rows and never materializes the heuristic,
 * so clearing a stale name cannot turn an absent `basic` into a declared one.
 */
export function withoutBasicName(form: FormSpec | undefined, name: string): FormSpec | undefined {
    const declared = form?.basic;
    if (!Array.isArray(declared)) return form;
    return pruneForm({ ...form, basic: declared.filter(n => n !== name) });
}

/**
 * Names in `basic` that match no feature of the metaclass. Shown among the ignored
 * overrides and never rewritten, for the reason `ignoredOverrides` gives.
 */
export function unknownBasicNames(form: FormSpec | undefined, rows: AuthoringFeatureRow[]): string[] {
    const declared = form?.basic;
    if (!Array.isArray(declared)) return [];
    const known = new Set(rows.map(r => r.name));
    return declared.filter(n => !known.has(n));
}

export interface IgnoredOverride {
    name: string;
    value: string;
    /** 'unknown-feature': no feature of the metaclass carries this name.
     *  'incompatible': the feature exists and the override cannot apply to its type. */
    reason: 'unknown-feature' | 'incompatible';
    /** The widget the type produces; absent when the feature itself is unknown. */
    derived?: WidgetKind;
}

/**
 * Widget overrides the interpreter will ignore (spec addendum sez. 5): a key naming no
 * feature of the metaclass, or a value `overrideIsCompatible` rejects. They are SHOWN and
 * offered a Clear, never rewritten: an author's slip, a hand edit or an AI suggestion is
 * theirs to keep or drop, and silently repairing it would hide that the form is not
 * rendering what the IR says.
 */
export function ignoredOverrides(form: FormSpec | undefined, rows: AuthoringFeatureRow[]): IgnoredOverride[] {
    const widgets = form?.widgets;
    if (!widgets) return [];
    const byName = new Map(rows.map(r => [r.name, r]));
    const out: IgnoredOverride[] = [];
    for (const [name, value] of Object.entries(widgets)) {
        const row = byName.get(name);
        if (!row) { out.push({ name, value: String(value), reason: 'unknown-feature' }); continue; }
        const derived = deriveAuthoringWidget(row);
        if (!overrideIsCompatible(derived, value)) out.push({ name, value: String(value), reason: 'incompatible', derived });
    }
    return out;
}

/**
 * The row as a `SlotShape`, so the metamodel's own verdict can be asked with the same
 * function the canvas asks (`metamodelRenderer`) instead of a second derivation of the
 * same cascade.
 *
 * `value` is empty and stays empty: this is the METAMODEL side of the comparison, and
 * every branch of `metamodelRenderer` reads the declared type, the bounds and the
 * annotations — never the value. Authoring has no instance to read one from anyway.
 *
 * `enumLiteralNames` carries one placeholder name rather than the real literals: the
 * verdict tests only whether the list is non-empty, and the authoring row does not hold
 * the literals. Anything that starts reading them here needs the real ones first.
 */
export function slotShapeForRow(row: AuthoringFeatureRow, annotations?: RowViewAnnotations): SlotShape {
    return {
        value: '',
        typeName: row.typeName,
        isReference: row.isReference || row.isComposition,
        isMany: row.upperBound !== 1,
        enumLiteralNames: row.isEnum ? [row.typeName] : undefined,
        featureName: row.name,
        rendererOverride: annotations?.renderer,
        min: annotations?.min,
        max: annotations?.max,
    };
}

/**
 * The provenance of one row: what the view is covering, or null when it covers nothing
 * (Turno 7c). Exported so the test asks exactly what the row shows.
 */
export function provenanceForRow(
    row: AuthoringFeatureRow,
    form: FormSpec | undefined,
    annotations?: RowViewAnnotations,
): ViewRendererOverride | null {
    return viewRendererOverride(slotShapeForRow(row, annotations), form?.widgets?.[row.name]);
}

/**
 * How the provenance line names the metamodel's evidence.
 *
 * The design writes it `@renderer=color`; the wire format in this codebase is
 * `jjodel/renderer=swatch` (`rowViewAnnotations.ts`), and the line quotes the real one —
 * an author who reads `@renderer` here and greps for it finds nothing.
 */
export function provenanceEvidence(p: ViewRendererOverride): string {
    return p.metamodel.fromDeclaration
        ? `jjodel/renderer=${p.metamodel.kind}`
        : p.metamodel.reason;
}

/** The authorable features of a metaclass, attributes first, in declaration order. */
export function rowsForMetaclass(target: MetaclassInfo | null): AuthoringFeatureRow[] {
    if (!target) return [];
    const out: AuthoringFeatureRow[] = [];
    for (const a of (target.allAttributes ?? target.attributes ?? [])) {
        out.push({
            name: a.name,
            typeName: a.type,
            lowerBound: a.lowerBound,
            upperBound: a.upperBound,
            isEnum: !!a.isEnum,
            isReference: false,
            isComposition: false,
        });
    }
    for (const r of (target.references ?? [])) {
        out.push({
            name: r.name,
            typeName: r.targetClassName,
            lowerBound: r.lowerBound,
            upperBound: r.upperBound,
            isEnum: false,
            // composition wins over reference, as in Info.value and describeSlot.
            isReference: !r.containment,
            isComposition: !!r.containment,
        });
    }
    return out;
}

/**
 * The sections the FORM will render, computed here so the panel describes the real layout.
 *
 * Same function the form calls, fed with the compartments of the DRAFT rather than of a
 * compiled view: `title` travels undefined when unauthored, so `buildFormSections` applies
 * its own fallback and the two surfaces cannot show different headings. Empty sections are
 * dropped exactly as `IRForm` drops them.
 */
export function sectionsForAuthoring(
    compartments: FieldCompartmentSpec[],
    rows: AuthoringFeatureRow[],
): Section<AuthoringFeatureRow>[] {
    return buildFormSections(
        rows,
        compartments.map(c => ({ id: c.id, source: c.source.from as 'attributes' | 'references' | 'children', title: c.title })),
    ).filter(s => s.fields.length > 0);
}

// --- component ---------------------------------------------------------------------

export interface FormAuthoringBodyProps {
    draft: VertexViewIR;
    /** Target metaclass of the view, resolved by identity in the panel; null = wildcard. */
    target: MetaclassInfo | null;
    /** Global disclosure mode, read by the panel. Gates the two tables, not the tab. */
    advanced: boolean;
    /** Id of the view being authored. Absent = no cross-tab link (the host cannot be
     *  addressed, and ViewData is mounted more than once). */
    viewId?: string;
    /** `undefined` means: drop the `form` key from the ir entirely. */
    onChange: (form: FormSpec | undefined) => void;
}

export const FormAuthoringBody: React.FC<FormAuthoringBodyProps> = ({ draft, target, advanced, viewId, onChange }) => {
    const form = draft.form;
    const compartments = draft.fieldCompartments;

    /**
     * The metamodel's `jjodel/*` declarations for the target's features, keyed by feature
     * name (Turno 7c). A SELECTOR and not an effect: the note above rules out effects
     * because both mounts keep every tab body alive, and an effect would then run inside
     * the symbol editor modal where this tab is unreachable. A read is inert there — it
     * renders nothing extra and writes nothing — so the invariant that matters is kept.
     *
     * Serialized to a string so the subscription re-renders on a change to THESE
     * annotations and not on every store action (the `liveFeatureNameSig` idiom of
     * `ObjectNode`); the map is parsed back in the memo below.
     */
    const annotationSig = useSelector((state: any) => {
        const lookup = state?.idlookup;
        if (!lookup || !target) return '';
        const parts: string[] = [];
        for (const a of (target.allAttributes ?? target.attributes ?? [])) {
            const ann = readRowViewAnnotations(lookup, a.id);
            if (ann.renderer === undefined && ann.min === undefined && ann.max === undefined) continue;
            parts.push(`${a.name}\u0001${ann.renderer ?? ''}\u0001${ann.min ?? ''}\u0001${ann.max ?? ''}`);
        }
        return parts.join('\u0002');
    });

    const annotationsByName = useMemo(() => {
        const out = new Map<string, RowViewAnnotations>();
        if (!annotationSig) return out;
        for (const entry of annotationSig.split('\u0002')) {
            const [name, renderer, min, max] = entry.split('\u0001');
            out.set(name, {
                renderer: renderer || undefined,
                min: min === '' ? undefined : Number(min),
                max: max === '' ? undefined : Number(max),
            });
        }
        return out;
    }, [annotationSig]);

    const { rows, sections, ignored, unknownBasic } = useMemo(() => {
        const r = rowsForMetaclass(target);
        return {
            rows: r,
            sections: sectionsForAuthoring(compartments ?? [], r),
            ignored: ignoredOverrides(form, r),
            unknownBasic: unknownBasicNames(form, r),
        };
    }, [target, compartments, form]);

    const basicDeclared = Array.isArray(form?.basic);

    const theme = form?.theme;
    const placement = form?.labelPlacement ?? 'above';
    // 'left' is honoured by the compact theme alone (spec addendum sez. 13). An absent theme
    // is a host default, and no host defaults to compact, so absent counts as "not compact".
    const placementInert = placement === 'left' && theme !== 'compact';

    // Where the ignored overrides go: after the last section that holds attributes, which is
    // where the widget table lives. An override naming no feature has no section of its own,
    // and dropping it at the very end would put it under References or Children.
    const lastAttributeSection = sections.reduce(
        (acc, s, i) => (s.fields.some(f => !f.isReference && !f.isComposition) ? i : acc),
        -1,
    );
    const ignoredHost = lastAttributeSection >= 0 ? lastAttributeSection : sections.length - 1;

    const anyOverride = rows.some(r => {
        // A declared membership that disagrees with the heuristic is an override like the
        // others, and wears the same dot: a second marker vocabulary would say nothing new.
        if (basicDeclared && isBasicRow(r, form) !== (r.lowerBound >= 1)) return true;
        if (r.isReference || r.isComposition) return form?.features?.[r.name] !== undefined;
        const o = form?.widgets?.[r.name];
        return o !== undefined && o !== deriveAuthoringWidget(r);
    });

    const anyIgnored = ignored.length > 0 || unknownBasic.length > 0;

    const basicDiffers = (row: AuthoringFeatureRow) => basicDeclared && isBasicRow(row, form) !== (row.lowerBound >= 1);

    /**
     * The Basic cell of a row. `hidden` removes the feature from BOTH halves of the form,
     * so the checkbox is locked there rather than lying: it keeps showing the real
     * membership, and nothing rewrites `basic` when a feature becomes hidden or stops
     * being hidden. The title sits on the cell because the shared Checkbox takes no
     * label of its own here (the column header is the label) and no title prop.
     */
    const basicCell = (row: AuthoringFeatureRow) => {
        const hidden = form?.features?.[row.name] === 'hidden';
        return (
            <span
                className="form-authoring__basic"
                title={hidden
                    ? 'Hidden removes the feature in both Basic and Advanced'
                    : `Show ${row.name} in Basic`}
            >
                <Checkbox
                    checked={isBasicRow(row, form)}
                    disabled={hidden}
                    onChange={(checked) => onChange(withBasic(form, rows, row.name, checked))}
                />
            </span>
        );
    };

    const renderIgnored = () => (
        <div className="form-authoring__ignored">
            {unknownBasic.map(name => (
                <div className="form-authoring__ignored-row" key={`basic:${name}`}>
                    <span style={PRESERVED_CHIP}>{`ignored: basic entry on unknown feature "${name}"`}</span>
                    <button
                        type="button"
                        className="form-authoring__clear"
                        onClick={() => onChange(withoutBasicName(form, name))}
                    >
                        Clear
                    </button>
                </div>
            ))}
            {ignored.map(ig => (
                <div className="form-authoring__ignored-row" key={ig.name}>
                    <span style={PRESERVED_CHIP}>
                        {ig.reason === 'unknown-feature'
                            ? `ignored: ${ig.value} on unknown feature "${ig.name}"`
                            : `ignored: ${ig.value} on ${ig.name} (${widgetLabel(ig.derived as WidgetKind)})`}
                    </span>
                    <button
                        type="button"
                        className="form-authoring__clear"
                        onClick={() => onChange(withFormEntry(form, 'widgets', ig.name, undefined))}
                    >
                        Clear
                    </button>
                </div>
            ))}
        </div>
    );

    const renderWidgetRow = (row: AuthoringFeatureRow) => {
        const derived = deriveAuthoringWidget(row);
        const offered = offeredOverrides(derived);
        const declared = form?.widgets?.[row.name];
        // An incompatible override is listed among the ignored ones; the select stays on
        // its placeholder here rather than showing a value the interpreter drops.
        const active = declared !== undefined && overrideIsCompatible(derived, declared) && declared !== derived
            ? declared
            : '';
        // What this row's widget is covering, when it covers anything (Turno 7c). Null
        // when the view declared nothing, when the metamodel declares nothing to cover,
        // or when the two agree — three different facts, one silence, on purpose.
        const provenance = provenanceForRow(row, form, annotationsByName.get(row.name));

        return (
            <React.Fragment key={row.name}>
                <div className="form-authoring__row">
                    <span className="form-authoring__name">
                        {row.name}
                        {(active !== '' || basicDiffers(row)) && <span className="form-authoring__dot" aria-hidden="true" />}
                    </span>
                    {basicCell(row)}
                    <Select
                        size="sm"
                        options={offered.map(k => ({ value: k, label: widgetLabel(k) }))}
                        placeholder={`Default (${widgetLabel(derived)})`}
                        value={active}
                        disabled={offered.length === 0}
                        title={offered.length === 0 ? `No alternative widget applies to ${row.typeName || 'this type'}` : undefined}
                        onChange={(e) => onChange(withFormEntry(form, 'widgets', row.name, (e.target.value || undefined) as WidgetKind | undefined))}
                    />
                </div>
                {provenance && (
                    <div className="form-authoring__provenance">
                        <i className="bi bi-arrow-return-right" aria-hidden="true" />
                        <span>
                            {'metamodel declares '}
                            <span className="form-authoring__provenance-kind">
                                {RENDERER_LABELS[provenance.metamodel.kind] ?? provenance.metamodel.kind}
                            </span>
                            {' ('}
                            <code>{provenanceEvidence(provenance)}</code>
                            {') — overridden by this view · '}
                            {/* The same key both surfaces write: Reset removes the entry from
                                `widgets`, which is what makes the ladder's rung 0 disappear
                                too. No second store of provenance to keep in step. */}
                            <button
                                type="button"
                                className="form-authoring__link"
                                onClick={() => onChange(withFormEntry(form, 'widgets', row.name, undefined))}
                            >
                                Reset
                            </button>
                        </span>
                    </div>
                )}
            </React.Fragment>
        );
    };

    const renderTreatmentRow = (row: AuthoringFeatureRow) => {
        const multivalued = row.upperBound !== 1;
        const derived = derivedTreatment(row.upperBound);
        const declared = form?.features?.[row.name];
        // A declared `inline` on a multivalued feature degrades to `list` at render and is
        // shown degraded here, with the persisted value spelled out next to it: a single
        // control cannot show three values, and nothing rewrites the key until the author
        // picks a segment themselves.
        const degraded = declared === 'inline' && multivalued;
        const value: FeatureTreatment = degraded ? 'list' : (declared ?? derived);
        const widgetOverride = form?.widgets?.[row.name];
        const widgetPreserved = widgetOverride !== undefined && overrideIsCompatible('reference', widgetOverride);
        return (
            <div
                className={`form-authoring__row form-authoring__row--treatment${declared === 'hidden' ? ' form-authoring__row--muted' : ''}`}
                key={row.name}
            >
                <span className="form-authoring__name">
                    {row.name}
                    {row.isComposition && <span className="form-authoring__badge">child</span>}
                    {((declared !== undefined && declared !== derived) || basicDiffers(row)) && <span className="form-authoring__dot" aria-hidden="true" />}
                    {degraded && <span style={PRESERVED_CHIP}>declared inline, degraded to list</span>}
                    {widgetPreserved && <span style={PRESERVED_CHIP}>{`widget: ${widgetOverride} (preserved)`}</span>}
                </span>
                {basicCell(row)}
                <SegmentedControl<FeatureTreatment>
                    ariaLabel={`How ${row.name} renders in the form`}
                    value={value}
                    options={[
                        {
                            value: 'inline',
                            label: 'Inline',
                            disabled: multivalued,
                            title: multivalued ? 'Multivalued: inline degrades to list' : undefined,
                        },
                        { value: 'list', label: 'List' },
                        { value: 'hidden', label: 'Hidden' },
                    ]}
                    onChange={(next) => onChange(withFormEntry(form, 'features', row.name, next === derived ? undefined : next))}
                />
            </div>
        );
    };

    return (
        <div className="form-authoring">
            <div className="jj-field">
                <label className="jj-field-label">Theme</label>
                {/* Placeholder as the default option, the shared-Select idiom of Padding
                    (nota Select condiviso, 2026-08-08): a closed vocabulary never persists ''. */}
                <Select
                    options={THEME_OPTIONS}
                    placeholder="Host default"
                    value={theme ?? ''}
                    onChange={(e) => onChange(withFormKey(form, 'theme', (e.target.value || undefined) as FormTheme | undefined))}
                />
            </div>

            <div className="jj-field">
                <label className="jj-field-label">Labels</label>
                <SegmentedControl<'above' | 'left'>
                    ariaLabel="Label placement"
                    value={placement}
                    options={LABEL_PLACEMENT_OPTIONS}
                    onChange={(next) => onChange(withFormKey(form, 'labelPlacement', next === 'above' ? undefined : next))}
                />
                {placementInert && (
                    <HelpText icon={false}>Left labels are honoured by the compact theme only. Every other theme places labels above.</HelpText>
                )}
            </div>

            {!advanced && (
                <HelpText icon={false}>
                    Widgets are derived from feature types. Switch to Advanced to override them per feature and to set how references and children render.
                </HelpText>
            )}

            {advanced && target === null && (
                <HelpText icon={false}>Set a metaclass in the Applies to tab to list its features here.</HelpText>
            )}

            {/* One state row for the whole tab, because `basic` is ONE key: it is declared
                or it is not, and no row can be in a different state from its neighbours.
                It renders with no section too (wildcard metaclass, every feature hidden):
                a declared `basic` with no way to reset it would be a trap. */}
            {advanced && (sections.length > 0 || basicDeclared) && (
                <div className="form-authoring__state">
                    {basicDeclared ? (
                        <>
                            <span>Basic: declared</span>
                            <button
                                type="button"
                                className="form-authoring__link"
                                onClick={() => onChange(withoutBasic(form))}
                            >
                                Reset to derived
                            </button>
                        </>
                    ) : (
                        <span>Basic: derived from multiplicity (required features)</span>
                    )}
                </div>
            )}

            {advanced && sections.map((section, index) => {
                const attributeSection = section.fields.some(f => !f.isReference && !f.isComposition);
                const anyHidden = section.fields.some(f => form?.features?.[f.name] === 'hidden');
                return (
                    <FormSection key={section.key} title={section.title} divider={false}>
                        {section.key.startsWith('residual-') && (
                            <div className="form-authoring__residual">
                                not claimed by any compartment: rendered after the authored sections.{' '}
                                {viewId !== undefined ? (
                                    <button
                                        type="button"
                                        className="form-authoring__link"
                                        onClick={() => window.dispatchEvent(new CustomEvent(JjodelEvents.IR_AUTHORING_TAB, {
                                            detail: { viewId, tab: 'ir-structure' },
                                        }))}
                                    >
                                        Edit compartments
                                    </button>
                                ) : 'Edit compartments in the Structure tab'}
                            </div>
                        )}
                        <div className="form-authoring__table">
                            {/* The header is rendered on EVERY section, not on attribute ones
                                alone: the Basic column exists on all of them. A section can be
                                mixed, so the third label follows the section, not the row. */}
                            <div className="form-authoring__head">
                                <span>Feature</span>
                                <span>Basic</span>
                                <span>{attributeSection ? 'Widget' : 'Render'}</span>
                            </div>
                            {section.fields.map(f => (f.isReference || f.isComposition ? renderTreatmentRow(f) : renderWidgetRow(f)))}
                        </div>
                        {anyHidden && (
                            <HelpText icon={false}>Hidden removes the feature from the form in both Basic and Advanced.</HelpText>
                        )}
                        {index === ignoredHost && anyIgnored && renderIgnored()}
                    </FormSection>
                );
            })}

            {/* No section at all (wildcard metaclass, or every feature hidden) and still an
                ignored override on the ir: it has no host section, and losing it would be the
                one thing this block exists to prevent. */}
            {advanced && sections.length === 0 && anyIgnored && renderIgnored()}

            {advanced && anyOverride && (
                <div className="form-authoring__legend">
                    <span className="form-authoring__dot" aria-hidden="true" />
                    overridden default
                </div>
            )}
        </div>
    );
};

export default FormAuthoringBody;
