/**
 * useFormWidgets, derive the form field descriptor of each slot of an object.
 *
 * The rule of the slice (prompt decision 3, spec v1.2 sez. 10): the widget follows the
 * FEATURE'S TYPE in the metamodel, and the view author overrides only where they want
 * something else. So a metamodel with no authored `form` still produces a usable form
 * the "default form" is a real fallback, not an empty state.
 *
 * The type-to-widget mapping and the attribute / enum / reference / composition
 * classification are COPIED from Info.value (the classic properties panel), not
 * extracted from it: Info.tsx is out of scope for this slice and refactoring it to share
 * the code would be exactly the opportunistic change CLAUDE.md rule 8 forbids. The
 * duplication is deliberate and is recorded here so the next person knows there are two
 * copies. If a third appears, extract then.
 *
 * One classification detail is load-bearing and easy to get backwards: a reference whose
 * `composition` is true is a COMPOSITION, not a reference. Info.value spells it that way
 * (setting isReference true, then false again when composition holds) and the form must
 * agree, because the two render differently, a reference picks an existing element, a
 * composition owns its children.
 *
 * Everything here is a pure function of (slot proxies, FormSpec, the host's offer). The
 * hook wrapper only memoizes; there is no subscription, because the caller (IRForm)
 * already re-renders on the object's slot signature through useIRFormView.
 *
 * ── S5: the candidates no longer come off the slot ────────────────────────────
 *
 * `readOptions(slot)` is gone. The candidates of a reference or an enum are asked of the
 * HOST by `(objectId, featureKey)`, through `WriteCtx.validTargets` and its engine
 * wrapper `jjform.targetOptions`, and they reach this module as the `offer` callback —
 * already addressed, so nothing here has to hold an id or a proxy. Two reasons, and
 * neither is tidiness:
 *
 *  - the filter behind the offer is per-INSTANCE (R-FORM-13, the containment loop reads
 *    this object's ancestor chain), so reading it off a slot proxy captured earlier is
 *    the S3 defect applied to the offer instead of to the write: the proxy can be dead
 *    and the answer still looks like an answer;
 *  - the offer and the write must be the same host's, or a form offers a target that the
 *    write then refuses. One interface answers both.
 *
 * The offer is resolved at the moment it is asked. This module asks at RENDER; the two
 * picker controls ask again at OPEN (`ReferenceWidget`, `ListWidget`), because a form
 * stays open for minutes and the hierarchy under it does not stay still. One source, two
 * moments — not two sources.
 */

import { useMemo } from 'react';
import type { FeatureTreatment, FormSpec, WidgetKind } from './irTypes';
import type { TargetOption } from '../../../../jjform';
import { parseRowViewAnnotations, type RowViewAnnotations } from '../../nodes/rowViewAnnotations';
import { meaningfulValues, rawValues } from './slotValues';

/** Option group for a select-like widget; the shape `ui/Select` consumes directly. */
export interface FormFieldOptionGroup {
    label: string;
    options: { value: string; label: string }[];
}

/** Everything a form field needs to know about one slot, resolved once per render. */
export interface FormFieldDescriptor {
    /** DValue (slot) id, the write key. */
    slotId: string;
    /** Feature name. The key of `FormSpec.widgets` / `.features` / `.basic`. */
    name: string;
    /** Resolved widget: derived from the type, then overridden by FormSpec.widgets. */
    widget: WidgetKind;
    /** Widget the TYPE alone would have produced, the mockup's authoring panel flags
     *  an overridden default with a cyan dot, and this is what that comparison needs. */
    derivedWidget: WidgetKind;
    /** Declared type name ('EString', 'EInt', a class name, an enum name). */
    typeName: string;
    lowerBound: number;
    /** -1 means unbounded; kept raw rather than normalised to 999 so the multiplicity
     *  label can print '*' and the upper-bound gate can test it honestly. */
    upperBound: number;
    /** upperBound !== 1, the feature holds a list, whatever its bounds. */
    isMultivalued: boolean;
    /** lowerBound >= 1: the required marker, and the Basic-mode heuristic. */
    isRequired: boolean;
    isEnum: boolean;
    isReference: boolean;
    isComposition: boolean;
    /** Derived or non-changeable: rendered read-only, with the lock glyph. */
    isReadOnly: boolean;
    isDerived: boolean;
    /**
     * How a reference or containment feature renders: `inline` a single control, `list` a
     * row per value. Resolved from `FormSpec.features`, defaulting on the multiplicity.
     * `hidden` never reaches here, those features are dropped before a descriptor is built.
     */
    treatment: FeatureTreatment;
    /** Options for enum and reference widgets; empty otherwise. */
    options: FormFieldOptionGroup[];
    /** Unpadded values (see slotValues.rawValues). */
    values: unknown[];
    /** Values that carry something, the count the multiplicity marker reports. */
    filled: unknown[];
    /** Numeric step for the number widget: 1 for integers, 0.1 / 0.01 for floats. */
    step: number;
    /** Max length for the text widget; 1 for EChar, unlimited otherwise. */
    maxLength?: number;
    /**
     * Opaque handle of the METAFEATURE (DAttribute / DReference), as distinct from
     * `slotId`, which is the instance's DValue. Added for FL4: the width ladder's rung 2 and
     * the duration widget's unit are both `jjodel/…` declarations that hang off the feature,
     * not off the slot.
     */
    featureId: string;
    /**
     * The `jjodel/…` declarations of this feature, already parsed (FL4).
     *
     * Read off the feature proxy's own `annotations` rather than through
     * `readRowViewAnnotations(idlookup, …)`, which would need the store: the proxies are
     * already resolved here, and a second source for the same declaration is how two
     * readers start disagreeing. An entry the proxy gives as a bare id is skipped — this
     * module has no lookup to resolve it with, and an unread declaration is `{}`, which is
     * exactly «the metamodel says nothing».
     */
    annotations: RowViewAnnotations;
}

/**
 * Widget derived from a primitive type name.
 *
 * The list of names, and the step values, are Info.value's switch verbatim
 * (Info.tsx, the `switch (feature?.type.name)` block). 'EDate' maps to text here
 * rather than to a date widget: the mockup has no date field, and inventing one that no
 * artboard specifies would be designing rather than implementing.
 */
export function widgetForPrimitive(typeName: string): { widget: WidgetKind; step: number; maxLength?: number } {
    switch (typeName) {
        case 'EChar': return { widget: 'text', step: 1, maxLength: 1 };
        case 'EInt':
        case 'ELong':
        case 'EShort':
        case 'Byte': return { widget: 'number', step: 1 };
        case 'EFloat': return { widget: 'number', step: 0.1 };
        case 'EDouble': return { widget: 'number', step: 0.01 };
        case 'EBoolean': return { widget: 'checkbox', step: 1 };
        default: return { widget: 'text', step: 1 };
    }
}

/**
 * Widget kinds an override may legally replace a derived one with.
 *
 * An override that cannot possibly work on the underlying type is IGNORED rather than
 * honoured or thrown on: a persisted view carrying `checkbox` on an EString (an author's
 * slip, a hand edit, an AI suggestion) must still render. Silently degrading to the
 * derived widget keeps the form usable, which is the same permissiveness the render side
 * of the IR applies everywhere else, compileView falls back to defaults for values it
 * does not recognise instead of dropping the view.
 *
 * Note the asymmetry with irValidate: the AUTHORING surface may well want to refuse such
 * an override at commit time (the R-B9-bis criterion). That belongs to Slice 2, where the
 * widgets table exists; it is not this module's job.
 *
 * Exported since Slice 2a: the widgets table of `FormAuthoringBody` offers exactly the
 * overrides this predicate accepts, so the two sides cannot drift into offering an override
 * the interpreter would then ignore. One rule, one place.
 */
export function overrideIsCompatible(derived: WidgetKind, override: WidgetKind): boolean {
    if (override === derived) return true;
    switch (derived) {
        // Text and multiline text are interchangeable; a JjEL expression is an EString
        // that the author chose to show as a code area. 'link' renders a string as a
        // clickable target and is equally a string presentation.
        case 'text': return override === 'textarea' || override === 'link';
        case 'textarea': return override === 'text' || override === 'link';
        // A number may be typed rather than stepped.
        case 'number': return override === 'text';
        // An enum is a select by nature; nothing else is meaningful, and 'text' would
        // let a free string be written into a literal slot.
        case 'select': return false;
        // A reference may be rendered as a plain select (the classic panel does exactly
        // that) instead of the picker.
        case 'reference': return override === 'select';
        case 'checkbox': return false;
        default: return false;
    }
}

/**
 * The host's offer for one feature of the object being described, already addressed.
 *
 * A callback and not an array: the caller binds `objectId` once and this module asks per
 * feature, so no id and no proxy travels through the descriptors. `IRForm` builds it out
 * of `jjform.targetOptions(ctx, objectId, key)`.
 */
export type FieldOffer = (featureKey: string) => TargetOption[];

/**
 * Group a flat offer the way the picker renders it.
 *
 * The contract's `TargetOption` is FLAT with an optional `group` (`jjform/writeCtx.ts`):
 * a host with no grouping returns a plain list and loses nothing, while this one files
 * candidates under 'Free Objects' / 'Bound Objects' / 'Literals of <enum>'. The picker
 * shows the heading as secondary text when there is more than one, so the grouping is a
 * RENDERING decision and it is made here, not in the contract.
 *
 * Order is first-appearance, which is the core's own order (free before bound): sorting
 * the headings would reshuffle a list the user has learned the shape of.
 */
export function groupTargets(offered: TargetOption[]): FormFieldOptionGroup[] {
    const out: FormFieldOptionGroup[] = [];
    const byLabel = new Map<string, FormFieldOptionGroup>();
    for (const o of offered ?? []) {
        if (!o || typeof o.id !== 'string' || !o.id) continue;
        const label = typeof o.group === 'string' ? o.group : '';
        let g = byLabel.get(label);
        if (!g) { g = { label, options: [] }; byLabel.set(label, g); out.push(g); }
        g.options.push({ value: o.id, label: String(o.label ?? o.id) });
    }
    return out;
}

/** Ask the offer for one feature, grouped as the picker renders it. An offer that throws
 *  degrades to "no candidates", never to a crashed form: the guarantee `readOptions`
 *  carried since 1a, kept where the call now happens.
 *
 *  Exported because the two picker controls ask AGAIN when they open (S5), through
 *  `IRFormField`, and asking a second way is how two answers start disagreeing. */
export function offerGroups(offer: FieldOffer | undefined, featureKey: string): FormFieldOptionGroup[] {
    if (!offer) return [];
    try {
        return groupTargets(offer(featureKey));
    } catch {
        return [];
    }
}

/**
 * Normalize the values of an enum slot to option ids.
 *
 * The D layer holds whatever the writer put there, and the two writers disagree: the editors
 * write the POINTER of the literal, while the XMI importer writes its NAME (`values: ['normal']`).
 * The L-layer `.values` getter resolves the name; `__raw.values`, which this module reads to
 * avoid the lowerBound padding, does not. The select is keyed by option id, so an imported
 * model showed an empty control over a value that was there all along.
 *
 * A value that already is an option id passes through. A name that matches no option passes
 * through too, unchanged: it may be a literal removed from the enum, and that is a conformance
 * problem for the validator to report, not something to silently rewrite here.
 *
 * Only the READ is normalized. Writes stay by id (`setSlotValue(..., isPtr: true)`), which is
 * what the classic panel does, so the form does not invent a third convention.
 */
function normalizeEnumValues(values: unknown[], options: FormFieldOptionGroup[]): unknown[] {
    if (values.length === 0 || options.length === 0) return values;
    const ids = new Set<string>();
    const byLabel = new Map<string, string>();
    for (const g of options) {
        for (const o of g.options) {
            ids.add(o.value);
            if (!byLabel.has(o.label)) byLabel.set(o.label, o.value);
        }
    }
    let changed = false;
    const out = values.map(v => {
        if (typeof v !== 'string' || ids.has(v)) return v;
        const id = byLabel.get(v);
        if (id === undefined) return v;
        changed = true;
        return id;
    });
    return changed ? out : values;
}

/**
 * Descriptor of one slot. Exported for the unit tests, which drive it on plain object
 * fixtures rather than on live proxies.
 */
export function describeSlot(slot: any, spec?: FormSpec, offer?: FieldOffer): FormFieldDescriptor | null {
    if (!slot) return null;
    const feature = slot.instanceof;
    const name: string = String(slot.name ?? feature?.name ?? '');
    if (!name) return null;

    // Bounds come from __raw, the direct D-layer field: it skips the proxy and it is what
    // Info.value reads. An absent bound is not 0 by accident, a shapeless slot has no
    // metafeature at all, so the fallbacks are explicit.
    const rawFeature = feature?.__raw ?? feature ?? {};
    const lowerBound: number = typeof rawFeature.lowerBound === 'number' ? rawFeature.lowerBound : 0;
    const upperBound: number = typeof rawFeature.upperBound === 'number' ? rawFeature.upperBound : 1;

    const featureType = feature?.type;
    const typeName: string = String(featureType?.name ?? '');
    const featureClass: string = String(feature?.className ?? '');
    const typeClass: string = String(featureType?.className ?? '');

    // Classification, following Info.value: composition WINS over reference.
    const isCompositionRef = featureClass === 'DReference' && feature?.composition === true;
    const isPlainRef = featureClass === 'DReference' && !isCompositionRef;
    const isEnum = featureClass === 'DAttribute' && typeClass === 'DEnumerator';

    let derivedWidget: WidgetKind;
    let step = 1;
    let maxLength: number | undefined;
    if (isEnum) {
        derivedWidget = 'select';
    } else if (isPlainRef || isCompositionRef) {
        derivedWidget = 'reference';
    } else {
        const prim = widgetForPrimitive(typeName);
        derivedWidget = prim.widget;
        step = prim.step;
        maxLength = prim.maxLength;
    }

    const override = spec?.widgets?.[name];
    const widget = override && overrideIsCompatible(derivedWidget, override) ? override : derivedWidget;

    const isDerived = feature?.derived === true;
    const isReadOnly = isDerived || feature?.changeable === false;

    // Treatment. The default follows the multiplicity, which is what an author would have to
    // write out otherwise; an explicit `inline` on a multivalued feature is DEGRADED to
    // `list` rather than honoured or rejected, because a single control cannot show three
    // values and a persisted view must still render (same permissiveness as the widget
    // overrides above). `hidden` is handled by the caller: a hidden feature has no
    // descriptor at all, so nothing downstream has to remember to skip it.
    const declaredTreatment = spec?.features?.[name];
    const defaultTreatment: FeatureTreatment = upperBound === 1 ? 'inline' : 'list';
    let treatment: FeatureTreatment = declaredTreatment ?? defaultTreatment;
    if (treatment === 'inline' && upperBound !== 1) treatment = 'list';
    if (treatment === 'hidden') treatment = defaultTreatment;

    // Annotation sources off the feature proxy. Objects with a `source` string only: see
    // the note on `FormFieldDescriptor.annotations`.
    const annotationSources: (string | undefined)[] = [];
    const rawAnnotations = feature?.annotations;
    if (Array.isArray(rawAnnotations)) {
        for (const a of rawAnnotations) {
            if (a && typeof a === 'object' && typeof (a as any).source === 'string') annotationSources.push((a as any).source);
        }
    }

    const options = isEnum || isPlainRef || isCompositionRef ? offerGroups(offer, name) : [];
    const raw = rawValues(slot);
    const values = isEnum ? normalizeEnumValues(raw, options) : raw;

    return {
        slotId: String(slot.id ?? ''),
        name,
        widget,
        derivedWidget,
        typeName,
        lowerBound,
        upperBound,
        isMultivalued: upperBound !== 1,
        isRequired: lowerBound >= 1,
        isEnum,
        isReference: isPlainRef,
        isComposition: isCompositionRef,
        isReadOnly,
        isDerived,
        treatment,
        options,
        values,
        // Counted on the raw array: normalization only rewrites what a value IS, never how
        // many there are, and `meaningfulValues` has to keep reading the slot itself.
        filled: meaningfulValues(slot),
        step,
        maxLength,
        featureId: String(feature?.id ?? ''),
        annotations: parseRowViewAnnotations(annotationSources),
    };
}

/**
 * Is this field shown in Basic mode?
 *
 * `FormSpec.basic`, when the author declared it, is the whole answer, including when it
 * omits a required feature, which is a legitimate authoring choice and not a mistake to
 * paper over. Absent, the heuristic is `lowerBound >= 1`: the features the metamodel
 * says an instance cannot do without.
 */
export function isBasicField(field: FormFieldDescriptor, spec?: FormSpec): boolean {
    const declared = spec?.basic;
    if (Array.isArray(declared)) return declared.includes(field.name);
    return field.isRequired;
}

/** Multiplicity as the label prints it: `1..1`, `0..5`, `0..*`. */
export function multiplicityLabel(field: FormFieldDescriptor): string {
    const upper = field.upperBound === -1 ? '*' : String(field.upperBound);
    return `${field.lowerBound}..${upper}`;
}

/** True when the list is full and the Add control must be disabled. Unbounded never is. */
export function isAtUpperBound(field: FormFieldDescriptor): boolean {
    if (field.upperBound === -1) return false;
    return field.filled.length >= field.upperBound;
}

/**
 * Descriptors for every slot of an object, in the object's own feature order.
 * `slots` is `LObject.features`; nulls (a slot whose metafeature vanished) are dropped.
 */
export function describeSlots(slots: any[], spec?: FormSpec, offer?: FieldOffer): FormFieldDescriptor[] {
    const out: FormFieldDescriptor[] = [];
    for (const slot of slots ?? []) {
        const d = describeSlot(slot, spec, offer);
        if (!d) continue;
        // `hidden` is applied HERE and in both modes: it is the author saying the feature has
        // no place in this form, which Advanced does not override, Advanced shows everything
        // the form has, not everything the metaclass has. A diagnostic on a hidden feature is
        // still counted, in the residue (formDiagnostics).
        if (spec?.features?.[d.name] === 'hidden') continue;
        out.push(d);
    }
    return out;
}

/** Memoized wrapper. `signature` is the caller's slot snapshot: passing it explicitly
 *  keeps the memo honest, since the proxies themselves are new objects every render. */
export function useFormWidgets(slots: any[], spec: FormSpec | undefined, signature: string, offer?: FieldOffer): FormFieldDescriptor[] {
    return useMemo(() => describeSlots(slots, spec, offer), [signature, spec, offer]);   // eslint-disable-line react-hooks/exhaustive-deps
}
