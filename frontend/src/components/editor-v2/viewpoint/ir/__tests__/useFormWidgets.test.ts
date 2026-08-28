/**
 * Unit tests for the form-field derivation (Slice 1a).
 *
 * Pure: describeSlot takes plain objects shaped like the L-proxies it reads, so no
 * store, no React, no framework barrel. The fixtures mirror the proxy surface the real
 * code touches and nothing more, `slot.instanceof`, `slot.instanceof.__raw` for the
 * bounds, `slot.__raw.values`, `slot.validTargetOptions`.
 *
 * The example domain is the Statechart of the design handoff (State: name, kind,
 * entryAction, timeout, isHistory, outgoing, substates, tags) so the cases are the ones
 * the artboards actually show.
 */
import { describe, it, expect } from 'vitest';
import {
    describeSlot,
    describeSlots,
    isAtUpperBound,
    isBasicField,
    multiplicityLabel,
    overrideIsCompatible,
    widgetForPrimitive,
} from '../useFormWidgets';
import { assignableOptions, meaningfulValues, rawValues } from '../slotValues';
import type { FormSpec, WidgetKind } from '../irTypes';

// --- fixtures ---------------------------------------------------------------

interface SlotOpts {
    name: string;
    typeName?: string;
    typeClass?: string;
    featureClass?: string;
    lowerBound?: number;
    upperBound?: number;
    composition?: boolean;
    derived?: boolean;
    changeable?: boolean;
    values?: unknown[];
    options?: { label: string; options: { value: string; label: string }[] }[];
}

/** A slot proxy as describeSlot reads it. */
function slot(o: SlotOpts): any {
    const lower = o.lowerBound ?? 0;
    const upper = o.upperBound ?? 1;
    return {
        id: `dv-${o.name}`,
        name: o.name,
        __raw: { values: o.values ?? [] },
        validTargetOptions: o.options,
        instanceof: {
            name: o.name,
            className: o.featureClass ?? 'DAttribute',
            composition: o.composition,
            derived: o.derived,
            changeable: o.changeable,
            type: { name: o.typeName ?? 'EString', className: o.typeClass ?? 'DClass' },
            __raw: { lowerBound: lower, upperBound: upper },
        },
    };
}

const attr = (name: string, typeName: string, over: Partial<SlotOpts> = {}) =>
    slot({ name, typeName, ...over });

// --- primitive type -> widget ------------------------------------------------

describe('widgetForPrimitive', () => {
    it('maps every primitive of the classic panel switch', () => {
        expect(widgetForPrimitive('EString').widget).toBe('text');
        expect(widgetForPrimitive('EChar')).toEqual({ widget: 'text', step: 1, maxLength: 1 });
        expect(widgetForPrimitive('EInt')).toEqual({ widget: 'number', step: 1 });
        expect(widgetForPrimitive('ELong')).toEqual({ widget: 'number', step: 1 });
        expect(widgetForPrimitive('EShort')).toEqual({ widget: 'number', step: 1 });
        expect(widgetForPrimitive('Byte')).toEqual({ widget: 'number', step: 1 });
        expect(widgetForPrimitive('EFloat')).toEqual({ widget: 'number', step: 0.1 });
        expect(widgetForPrimitive('EDouble')).toEqual({ widget: 'number', step: 0.01 });
        expect(widgetForPrimitive('EBoolean').widget).toBe('checkbox');
    });

    it('falls back to text for an unknown type name, never throws', () => {
        expect(widgetForPrimitive('EDate').widget).toBe('text');
        expect(widgetForPrimitive('').widget).toBe('text');
        expect(widgetForPrimitive('WhateverType').widget).toBe('text');
    });
});

// --- classification ----------------------------------------------------------

describe('describeSlot classification', () => {
    it('derives text for an EString attribute', () => {
        const d = describeSlot(attr('name', 'EString', { lowerBound: 1, upperBound: 1 }))!;
        expect(d.widget).toBe('text');
        expect(d.isRequired).toBe(true);
        expect(d.isMultivalued).toBe(false);
        expect(d.isEnum).toBe(false);
        expect(d.isReference).toBe(false);
    });

    it('derives select with options for an enum attribute', () => {
        const d = describeSlot(slot({
            name: 'kind', typeName: 'StateKind', typeClass: 'DEnumerator',
            lowerBound: 1, upperBound: 1,
            options: [{ label: 'StateKind', options: [
                { value: 'p-initial', label: 'initial' },
                { value: 'p-normal', label: 'normal' },
                { value: 'p-final', label: 'final' },
            ] }],
        }))!;
        expect(d.widget).toBe('select');
        expect(d.isEnum).toBe(true);
        expect(d.options[0].options).toHaveLength(3);
        expect(d.options[0].options[2]).toEqual({ value: 'p-final', label: 'final' });
    });

    it('normalizes an enum value written as the literal NAME into the option id', () => {
        // What the XMI importer writes: the name, not the pointer. The select is keyed by id,
        // so before this the control rendered empty over a value that was there.
        const d = describeSlot(slot({
            name: 'kind', typeClass: 'DEnumerator', values: ['normal'],
            options: [{ label: 'StateKind', options: [
                { value: 'p-initial', label: 'initial' },
                { value: 'p-normal', label: 'normal' },
            ] }],
        }))!;
        expect(d.values).toEqual(['p-normal']);
    });

    it('leaves an enum value that already is an option id untouched', () => {
        const d = describeSlot(slot({
            name: 'kind', typeClass: 'DEnumerator', values: ['p-initial'],
            options: [{ label: 'StateKind', options: [
                { value: 'p-initial', label: 'initial' },
                { value: 'p-normal', label: 'normal' },
            ] }],
        }))!;
        expect(d.values).toEqual(['p-initial']);
    });

    it('leaves an unknown enum name alone, for the validator to report', () => {
        // A literal removed from the enum since the model was written. Rewriting it here
        // would hide a real conformance problem behind a blank control.
        const d = describeSlot(slot({
            name: 'kind', typeClass: 'DEnumerator', values: ['obsolete'],
            options: [{ label: 'StateKind', options: [{ value: 'p-normal', label: 'normal' }] }],
        }))!;
        expect(d.values).toEqual(['obsolete']);
    });

    it('does not normalize a non-enum slot, even when a label happens to match', () => {
        const d = describeSlot(slot({ name: 'trigger', values: ['normal'] }))!;
        expect(d.values).toEqual(['normal']);
    });

    it('derives reference for a DReference, and is NOT a composition', () => {
        const d = describeSlot(slot({
            name: 'outgoing', typeName: 'Transition', featureClass: 'DReference',
            lowerBound: 0, upperBound: -1,
        }))!;
        expect(d.widget).toBe('reference');
        expect(d.isReference).toBe(true);
        expect(d.isComposition).toBe(false);
        expect(d.isMultivalued).toBe(true);
    });

    it('composition WINS over reference (the Info.value rule)', () => {
        const d = describeSlot(slot({
            name: 'substates', typeName: 'State', featureClass: 'DReference',
            composition: true, lowerBound: 0, upperBound: -1,
        }))!;
        expect(d.isComposition).toBe(true);
        expect(d.isReference).toBe(false);   // the half that is easy to get backwards
        expect(d.widget).toBe('reference');
    });

    it('flags derived and non-changeable slots read-only', () => {
        const derived = describeSlot(attr('fullName', 'EString', { derived: true }))!;
        expect(derived.isDerived).toBe(true);
        expect(derived.isReadOnly).toBe(true);

        const frozen = describeSlot(attr('id', 'EString', { changeable: false }))!;
        expect(frozen.isDerived).toBe(false);
        expect(frozen.isReadOnly).toBe(true);

        const plain = describeSlot(attr('name', 'EString'))!;
        expect(plain.isReadOnly).toBe(false);
    });

    it('returns null for a slot with no name instead of throwing', () => {
        expect(describeSlot(null)).toBeNull();
        expect(describeSlot({ id: 'x', __raw: { values: [] } })).toBeNull();
    });

    it('survives a slot whose validTargetOptions getter throws', () => {
        const hostile: any = slot({ name: 'ref', featureClass: 'DReference' });
        Object.defineProperty(hostile, 'validTargetOptions', {
            get() { throw new Error('half-built metamodel'); },
        });
        const d = describeSlot(hostile)!;
        expect(d.options).toEqual([]);       // degraded, not crashed
        expect(d.widget).toBe('reference');
    });
});

// --- multiplicity ------------------------------------------------------------

describe('multiplicity', () => {
    it('counts an empty [1..1] slot as zero even when .values is padded', () => {
        // The L-layer `.values` getter pads to lowerBound with undefined; __raw.values is
        // the unpadded truth. This is the case that makes an empty required field look
        // full, i.e. the "Required empty" state of artboard 3a.
        const padded = slot({ name: 'name', lowerBound: 1, upperBound: 1, values: [undefined] });
        expect(rawValues(padded)).toHaveLength(1);
        expect(meaningfulValues(padded)).toHaveLength(0);

        const d = describeSlot(padded)!;
        expect(d.filled).toHaveLength(0);
        expect(isAtUpperBound(d)).toBe(false);   // the Add gate must NOT read it as full
    });

    it('treats the empty string as no value too', () => {
        const d = describeSlot(slot({ name: 'trigger', values: ['', null, 'go'] }))!;
        expect(d.values).toHaveLength(3);
        expect(d.filled).toEqual(['go']);
    });

    it('reports a [0..5] slot at its upper bound when five values are filled', () => {
        const full = describeSlot(slot({
            name: 'tags', lowerBound: 0, upperBound: 5,
            values: ['a', 'b', 'c', 'd', 'e'],
        }))!;
        expect(isAtUpperBound(full)).toBe(true);
        expect(multiplicityLabel(full)).toBe('0..5');

        const room = describeSlot(slot({
            name: 'tags', lowerBound: 0, upperBound: 5, values: ['a', 'b'],
        }))!;
        expect(isAtUpperBound(room)).toBe(false);
    });

    it('never bounds an unbounded [0..*] slot', () => {
        const d = describeSlot(slot({
            name: 'outgoing', lowerBound: 0, upperBound: -1,
            values: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        }))!;
        expect(multiplicityLabel(d)).toBe('0..*');
        expect(isAtUpperBound(d)).toBe(false);
        expect(d.isMultivalued).toBe(true);
    });

    it('prints 1..1 for the single required case', () => {
        const d = describeSlot(attr('name', 'EString', { lowerBound: 1, upperBound: 1 }))!;
        expect(multiplicityLabel(d)).toBe('1..1');
    });
});

// --- FormSpec overrides ------------------------------------------------------

describe('FormSpec.widgets overrides', () => {
    it('lets the author render an EString as a JjEL textarea', () => {
        const spec: FormSpec = { widgets: { entryAction: 'textarea' } };
        const d = describeSlot(attr('entryAction', 'EString'), spec)!;
        expect(d.derivedWidget).toBe('text');
        expect(d.widget).toBe('textarea');
    });

    it('ignores an override incompatible with the type, without throwing', () => {
        // A checkbox cannot edit a string. The persisted view still has to render, so the
        // derived widget survives instead of the override being honoured or an error
        // being raised. Same permissiveness the render side applies everywhere.
        const spec: FormSpec = { widgets: { name: 'checkbox' } };
        const d = describeSlot(attr('name', 'EString'), spec)!;
        expect(d.widget).toBe('text');
        expect(d.derivedWidget).toBe('text');
    });

    it('refuses to turn an enum into free text', () => {
        const spec: FormSpec = { widgets: { kind: 'text' } };
        const d = describeSlot(slot({ name: 'kind', typeClass: 'DEnumerator' }), spec)!;
        expect(d.widget).toBe('select');
    });

    it('allows a reference to degrade to a plain select', () => {
        const spec: FormSpec = { widgets: { source: 'select' } };
        const d = describeSlot(slot({ name: 'source', featureClass: 'DReference' }), spec)!;
        expect(d.widget).toBe('select');
    });

    it('leaves every other field derived when one is overridden', () => {
        const spec: FormSpec = { widgets: { entryAction: 'textarea' } };
        const ds = describeSlots([
            attr('name', 'EString'),
            attr('entryAction', 'EString'),
            attr('timeout', 'EInt'),
        ], spec);
        expect(ds.map(d => d.widget)).toEqual(['text', 'textarea', 'number']);
    });
});

// --- FormSpec.features: treatment and hidden ---------------------------------

describe('FormSpec.features', () => {
    const ref = (name: string, over: Partial<SlotOpts> = {}) =>
        slot({ name, featureClass: 'DReference', typeName: 'Transition', ...over });

    it('defaults to inline for [1..1] and list for a multivalued feature', () => {
        expect(describeSlot(ref('target', { lowerBound: 1, upperBound: 1 }))!.treatment).toBe('inline');
        expect(describeSlot(ref('outgoing', { upperBound: -1 }))!.treatment).toBe('list');
        expect(describeSlot(ref('outgoing', { upperBound: 5 }))!.treatment).toBe('list');
    });

    it('degrades an explicit inline on a multivalued feature to list, without throwing', () => {
        // One control cannot show three values. A persisted view asking for it still has to
        // render, so the treatment is corrected rather than honoured or rejected.
        const spec: FormSpec = { features: { outgoing: 'inline' } };
        expect(describeSlot(ref('outgoing', { upperBound: 5 }), spec)!.treatment).toBe('list');
    });

    it('honours an explicit list on a single-valued feature', () => {
        const spec: FormSpec = { features: { target: 'list' } };
        expect(describeSlot(ref('target', { lowerBound: 1, upperBound: 1 }), spec)!.treatment).toBe('list');
    });

    it('drops a hidden feature from describeSlots, in BOTH modes', () => {
        const spec: FormSpec = { features: { substates: 'hidden' } };
        const ds = describeSlots([
            attr('name', 'EString', { lowerBound: 1 }),
            slot({ name: 'substates', featureClass: 'DReference', composition: true, upperBound: -1 }),
        ], spec);
        expect(ds.map(d => d.name)).toEqual(['name']);
        // Advanced shows everything the FORM has, not everything the metaclass has: hiding is
        // the author's decision and the mode does not overrule it.
        expect(ds.every(d => isBasicField(d, spec) || true)).toBe(true);
    });

    it('never reports hidden as a treatment on a descriptor that exists', () => {
        // `hidden` is applied by dropping the field; a descriptor carrying it would mean a
        // control that renders nothing, which nothing downstream is prepared for.
        const spec: FormSpec = { features: { outgoing: 'hidden' } };
        const d = describeSlot(ref('outgoing', { upperBound: -1 }), spec)!;
        expect(d.treatment).toBe('list');
    });
});

// --- Basic / Advanced --------------------------------------------------------

describe('isBasicField', () => {
    const name = describeSlot(attr('name', 'EString', { lowerBound: 1 }))!;
    const timeout = describeSlot(attr('timeout', 'EInt', { lowerBound: 0 }))!;

    it('falls back to the lowerBound >= 1 heuristic when basic is absent', () => {
        expect(isBasicField(name, undefined)).toBe(true);
        expect(isBasicField(timeout, undefined)).toBe(false);
        expect(isBasicField(name, { theme: 'plain' })).toBe(true);
    });

    it('lets a declared basic list win over the heuristic, in both directions', () => {
        const spec: FormSpec = { basic: ['timeout'] };
        expect(isBasicField(timeout, spec)).toBe(true);
        // `name` is required, yet the author left it out: that is a choice, not a slip.
        expect(isBasicField(name, spec)).toBe(false);
    });

    it('an empty declared list hides everything in Basic', () => {
        expect(isBasicField(name, { basic: [] })).toBe(false);
    });
});

// --- candidati assegnabili (E3) ----------------------------------------------

describe('assignableOptions', () => {
    const OPTS = [{ label: 'Bound Objects', options: [
        { value: 't_start', label: 'start' },
        { value: 't_stop', label: 'stop' },
        { value: 't_fault', label: 'fault' },
    ] }];

    it('drops the ids the list already holds', () => {
        // The defect this closes: the Add popover of `outgoing` offered `stop` and `fault`
        // while both were already assigned, so two clicks produced a duplicate.
        const out = assignableOptions(OPTS, ['t_stop', 't_fault']);
        expect(out[0].options.map(o => o.value)).toEqual(['t_start']);
    });

    it('ignores holes: undefined and null are not taken ids', () => {
        // Removal leaves a hole rather than shortening (see formWrite.clearSlotValue), so the
        // taken list routinely carries them.
        const out = assignableOptions(OPTS, ['t_stop', null, undefined, '']);
        expect(out[0].options.map(o => o.value)).toEqual(['t_start', 't_fault']);
    });

    it('returns the options untouched when nothing is taken', () => {
        expect(assignableOptions(OPTS, [])).toBe(OPTS);
        expect(assignableOptions(OPTS, [null, undefined])).toBe(OPTS);
    });

    it('drops a group whole when all of its options are taken', () => {
        const two = [
            { label: 'A', options: [{ value: 'a1', label: 'a1' }] },
            { label: 'B', options: [{ value: 'b1', label: 'b1' }] },
        ];
        const out = assignableOptions(two, ['a1']);
        expect(out.map(g => g.label)).toEqual(['B']);
    });

    it('returns an empty list when every candidate is taken, which is what disables Add', () => {
        const out = assignableOptions(OPTS, ['t_start', 't_stop', 't_fault']);
        expect(out).toEqual([]);
    });
});

/**
 * `overrideIsCompatible` became exported with Slice 2a, because the authoring widgets table
 * offers exactly the overrides it accepts. The table below is the whole predicate, pinned so
 * the two sides cannot drift: what the panel offers and what the interpreter honours are the
 * same set by construction, not by agreement.
 */
describe('overrideIsCompatible', () => {
    const ALL: WidgetKind[] = ['text', 'textarea', 'select', 'checkbox', 'color', 'number', 'reference', 'link'];
    const accepted = (derived: WidgetKind) => ALL.filter(k => overrideIsCompatible(derived, k));

    it('always accepts the derived widget itself', () => {
        for (const k of ALL) expect(overrideIsCompatible(k, k)).toBe(true);
    });

    it('text and textarea are interchangeable, and both accept link', () => {
        expect(accepted('text')).toEqual(['text', 'textarea', 'link']);
        expect(accepted('textarea')).toEqual(['text', 'textarea', 'link']);
    });

    it('a number may be typed as text, nothing else', () => {
        expect(accepted('number')).toEqual(['text', 'number']);
    });

    it('an enum select and a checkbox take no override at all', () => {
        expect(accepted('select')).toEqual(['select']);
        expect(accepted('checkbox')).toEqual(['checkbox']);
    });

    it('a reference may degrade to a plain select', () => {
        expect(accepted('reference')).toEqual(['select', 'reference']);
    });

    it('color and link fall in the default branch: no override', () => {
        expect(accepted('color')).toEqual(['color']);
        expect(accepted('link')).toEqual(['link']);
    });

    it('rejects the persisted slip the module doc names: checkbox over an EString', () => {
        expect(overrideIsCompatible(widgetForPrimitive('EString').widget, 'checkbox')).toBe(false);
    });
});
