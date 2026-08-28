import React, { useMemo } from 'react';
import { HelpText, Select, SegmentedControl, FormSection } from '../../../ui';
import type { MetaclassInfo } from '../../hooks/useEditorMode';
import { buildFormSections, type Section } from '../ir/formSections';
import { overrideIsCompatible, widgetForPrimitive } from '../ir/useFormWidgets';
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
 * FormAuthoringBody — the `Form` tab of the vertex authoring panel (Slice 2a).
 *
 * Authors `FormSpec` (spec addendum 2026-08-28): the panel skin (`theme`), the label
 * placement, the per-feature widget overrides and how references and children render.
 * `basic` is deliberately NOT authored here (Slice 2b) and round-trips verbatim, which
 * is why every write starts from a spread of the current `form` instead of building a
 * new object out of the four controls: the whole-object commit of the panel would
 * otherwise drop the key with nothing on screen to say so.
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

/** Read-only chip for a value this surface preserves but does not edit. Same visual
 *  convention as FieldCompartmentListEditor's CHIP, inline style, no new CSS class. */
const CHIP: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-tertiary)',
    fontStyle: 'italic',
    padding: '2px 6px',
    border: '1px dashed var(--color-border-primary)',
    borderRadius: 'var(--radius-sm)',
};

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
    /** `undefined` means: drop the `form` key from the ir entirely. */
    onChange: (form: FormSpec | undefined) => void;
}

export const FormAuthoringBody: React.FC<FormAuthoringBodyProps> = ({ draft, target, advanced, onChange }) => {
    const form = draft.form;
    const compartments = draft.fieldCompartments;

    const { rows, sections, ignored } = useMemo(() => {
        const r = rowsForMetaclass(target);
        return {
            rows: r,
            sections: sectionsForAuthoring(compartments ?? [], r),
            ignored: ignoredOverrides(form, r),
        };
    }, [target, compartments, form]);

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
        if (r.isReference || r.isComposition) return form?.features?.[r.name] !== undefined;
        const o = form?.widgets?.[r.name];
        return o !== undefined && o !== deriveAuthoringWidget(r);
    });

    const renderIgnored = () => (
        <div className="form-authoring__ignored">
            {ignored.map(ig => (
                <div className="form-authoring__ignored-row" key={ig.name}>
                    <span style={CHIP}>
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
        return (
            <div className="form-authoring__row" key={row.name}>
                <span className="form-authoring__name">
                    {row.name}
                    {active !== '' && <span className="form-authoring__dot" aria-hidden="true" />}
                </span>
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
                    {declared !== undefined && declared !== derived && <span className="form-authoring__dot" aria-hidden="true" />}
                    {degraded && <span style={CHIP}>declared inline, degraded to list</span>}
                    {widgetPreserved && <span style={CHIP}>{`widget: ${widgetOverride} (preserved)`}</span>}
                </span>
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

            {advanced && sections.map((section, index) => {
                const attributeSection = section.fields.some(f => !f.isReference && !f.isComposition);
                const anyHidden = section.fields.some(f => form?.features?.[f.name] === 'hidden');
                return (
                    <FormSection key={section.key} title={section.title} divider={false}>
                        {section.key.startsWith('residual-') && (
                            <div className="form-authoring__residual">
                                not claimed by any compartment: rendered after the authored sections. Edit compartments in the Structure tab
                            </div>
                        )}
                        <div className="form-authoring__table">
                            {attributeSection && (
                                <div className="form-authoring__head">
                                    <span>Feature</span>
                                    <span>Widget</span>
                                </div>
                            )}
                            {section.fields.map(f => (f.isReference || f.isComposition ? renderTreatmentRow(f) : renderWidgetRow(f)))}
                        </div>
                        {anyHidden && (
                            <HelpText icon={false}>Hidden removes the feature from the form in both Basic and Advanced.</HelpText>
                        )}
                        {index === ignoredHost && ignored.length > 0 && renderIgnored()}
                    </FormSection>
                );
            })}

            {/* No section at all (wildcard metaclass, or every feature hidden) and still an
                ignored override on the ir: it has no host section, and losing it would be the
                one thing this block exists to prevent. */}
            {advanced && sections.length === 0 && ignored.length > 0 && renderIgnored()}

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
