/**
 * Unit tests for the Form authoring surface (Slice 2a).
 *
 * Pure: every helper is exported from FormAuthoringBody ahead of the component, the way
 * FieldCompartmentListEditor exports its preserve-verbatim helpers, so the render path and
 * the tested path are the same code. Fixtures are the Statechart `State` of the design
 * handoff (name, kind, entryAction, timeout, isHistory, outgoing, substates), so the cases
 * are the ones artboard 6b actually shows.
 *
 * Two things are asserted here that no other test can catch:
 *  - a key set to its default is REMOVED, not written undefined, and `basic` survives every
 *    write, because the panel commit is a whole-object replace of the draft (discovery
 *    2026-08-28, D3 and R2);
 *  - the authoring table offers exactly the overrides `overrideIsCompatible` accepts, which
 *    is what stops the panel from persisting an override the interpreter then ignores.
 */
import { describe, it, expect } from 'vitest';
import {
    deriveAuthoringWidget,
    derivedTreatment,
    ignoredOverrides,
    offeredOverrides,
    rowsForMetaclass,
    sectionsForAuthoring,
    widgetLabel,
    withFormEntry,
    withFormKey,
    WIDGET_LABEL,
    type AuthoringFeatureRow,
} from '../FormAuthoringBody';
import { overrideIsCompatible } from '../../ir/useFormWidgets';
import { validateIR } from '../../ir/irValidate';
import { defaultObjectViewIR } from '../../ir/irDefaults';
import type { FieldCompartmentSpec, FormSpec, VertexViewIR, WidgetKind } from '../../ir/irTypes';
import type { MetaclassInfo } from '../../../hooks/useEditorMode';

// --- fixtures ----------------------------------------------------------------------

const attr = (
    name: string,
    type: string,
    extra: Partial<{ isEnum: boolean; lowerBound: number; upperBound: number }> = {},
) => ({ id: `a_${name}`, name, type, lowerBound: 0, upperBound: 1, ...extra });

const ref = (
    name: string,
    targetClassName: string,
    extra: Partial<{ containment: boolean; upperBound: number; lowerBound: number }> = {},
) => ({
    id: `r_${name}`, name, targetClassId: `c_${targetClassName}`, targetClassName,
    containment: false, aggregation: false, lowerBound: 0, upperBound: 1, ...extra,
});

/** The handoff's State metaclass, reduced to what the authoring rows read. */
const STATE = {
    id: 'c_State',
    name: 'State',
    isAbstract: false,
    attributes: [],
    allAttributes: [
        attr('name', 'EString', { lowerBound: 1 }),
        attr('kind', 'StateKind', { isEnum: true }),
        attr('entryAction', 'EString'),
        attr('timeout', 'EInt'),
        attr('isHistory', 'EBoolean'),
    ],
    references: [
        ref('outgoing', 'Transition', { upperBound: -1 }),
        ref('substates', 'State', { containment: true }),
    ],
    concreteSubclasses: [],
} as unknown as MetaclassInfo;

const ROWS = rowsForMetaclass(STATE);
const row = (name: string): AuthoringFeatureRow => {
    const r = ROWS.find(x => x.name === name);
    if (!r) throw new Error(`no row ${name}`);
    return r;
};

const compartment = (id: string, from: 'attributes' | 'references' | 'children', title?: string) =>
    ({ id, source: { from }, rowFormat: { segments: [] }, title } as FieldCompartmentSpec);

// --- 1. rows off the metaclass -----------------------------------------------------

describe('rowsForMetaclass', () => {
    it('reads attributes first, then references, in declaration order', () => {
        expect(ROWS.map(r => r.name)).toEqual([
            'name', 'kind', 'entryAction', 'timeout', 'isHistory', 'outgoing', 'substates',
        ]);
    });

    it('classifies composition as a child and not as a reference, like Info.value', () => {
        expect(row('substates').isComposition).toBe(true);
        expect(row('substates').isReference).toBe(false);
        expect(row('outgoing').isReference).toBe(true);
        expect(row('outgoing').isComposition).toBe(false);
    });

    it('carries the enum flag from MetaclassAttribute.isEnum', () => {
        expect(row('kind').isEnum).toBe(true);
        expect(row('name').isEnum).toBe(false);
    });

    it('a wildcard view has no target and therefore no rows', () => {
        expect(rowsForMetaclass(null)).toEqual([]);
    });
});

// --- 2. derived widget -------------------------------------------------------------

describe('deriveAuthoringWidget', () => {
    it('follows the type, matching artboard 6b', () => {
        expect(deriveAuthoringWidget(row('name'))).toBe('text');
        expect(deriveAuthoringWidget(row('kind'))).toBe('select');
        expect(deriveAuthoringWidget(row('timeout'))).toBe('number');
        expect(deriveAuthoringWidget(row('isHistory'))).toBe('checkbox');
    });

    it('a reference and a composition both derive the picker', () => {
        expect(deriveAuthoringWidget(row('outgoing'))).toBe('reference');
        expect(deriveAuthoringWidget(row('substates'))).toBe('reference');
    });

    it('an unknown type name falls back to text, like widgetForPrimitive', () => {
        expect(deriveAuthoringWidget({ typeName: 'EDate', isEnum: false, isReference: false, isComposition: false })).toBe('text');
    });
});

// --- 3. the offered overrides are exactly the accepted ones -------------------------

describe('offeredOverrides', () => {
    const KINDS: WidgetKind[] = ['text', 'textarea', 'select', 'checkbox', 'color', 'number', 'reference', 'link'];

    it('offers every override the interpreter accepts, minus the derived one and minus link', () => {
        for (const derived of KINDS) {
            const expected = KINDS.filter(k => k !== derived && k !== 'link' && overrideIsCompatible(derived, k));
            expect(offeredOverrides(derived)).toEqual(expected);
        }
    });

    it('never offers an override the interpreter would ignore', () => {
        for (const derived of KINDS) {
            for (const k of offeredOverrides(derived)) expect(overrideIsCompatible(derived, k)).toBe(true);
        }
    });

    it('link is declared in the vocabulary but never offered: no rendering exists yet', () => {
        for (const derived of KINDS) expect(offeredOverrides(derived)).not.toContain('link');
    });

    it('an enum and a checkbox offer nothing, which is what disables their select', () => {
        expect(offeredOverrides('select')).toEqual([]);
        expect(offeredOverrides('checkbox')).toEqual([]);
    });

    it('every kind has a label', () => {
        for (const k of KINDS) expect(widgetLabel(k)).toBe(WIDGET_LABEL[k]);
        expect(WIDGET_LABEL.textarea).toBe('Code');
        expect(WIDGET_LABEL.number).toBe('Stepper');
        expect(WIDGET_LABEL.reference).toBe('Picker');
    });
});

// --- 4. writes remove the key on the default ---------------------------------------

const has = (o: unknown, k: string) => Object.prototype.hasOwnProperty.call(o ?? {}, k);

describe('withFormKey', () => {
    it('sets a theme', () => {
        expect(withFormKey(undefined, 'theme', 'card')).toEqual({ theme: 'card' });
    });

    it('undefined REMOVES the key, it does not write it undefined', () => {
        const out = withFormKey({ theme: 'card', labelPlacement: 'left' }, 'theme', undefined);
        expect(has(out, 'theme')).toBe(false);
        expect(JSON.stringify(out)).toBe('{"labelPlacement":"left"}');
    });

    it('returns undefined when the last key goes, never an empty object', () => {
        expect(withFormKey({ theme: 'card' }, 'theme', undefined)).toBeUndefined();
    });

    it('does not mutate its input', () => {
        const before: FormSpec = { theme: 'card' };
        withFormKey(before, 'labelPlacement', 'left');
        expect(before).toEqual({ theme: 'card' });
    });
});

describe('withFormEntry', () => {
    it('sets one widget override', () => {
        expect(withFormEntry(undefined, 'widgets', 'entryAction', 'textarea'))
            .toEqual({ widgets: { entryAction: 'textarea' } });
    });

    it('removes the entry, and the whole map with its last entry', () => {
        const one = withFormEntry({ widgets: { entryAction: 'textarea' } }, 'widgets', 'entryAction', undefined);
        expect(one).toBeUndefined();
        const two = withFormEntry(
            { widgets: { entryAction: 'textarea', name: 'textarea' } },
            'widgets', 'entryAction', undefined,
        );
        expect(two).toEqual({ widgets: { name: 'textarea' } });
        expect(has(two?.widgets, 'entryAction')).toBe(false);
    });

    it('features and widgets are independent maps', () => {
        const out = withFormEntry({ widgets: { name: 'textarea' } }, 'features', 'outgoing', 'hidden');
        expect(out).toEqual({ widgets: { name: 'textarea' }, features: { outgoing: 'hidden' } });
    });

    it('does not mutate its input, map included', () => {
        const before: FormSpec = { widgets: { name: 'textarea' } };
        withFormEntry(before, 'widgets', 'kind', 'select');
        expect(before).toEqual({ widgets: { name: 'textarea' } });
    });
});

// --- 5. basic survives every write -------------------------------------------------

describe('basic (Slice 2b) round-trips verbatim', () => {
    const withBasic: FormSpec = { basic: ['name', 'kind'], theme: 'plain' };

    it('survives a theme change', () => {
        expect(withFormKey(withBasic, 'theme', 'inspector')?.basic).toEqual(['name', 'kind']);
    });

    it('survives a theme reset, which keeps the FormSpec alive', () => {
        const out = withFormKey(withBasic, 'theme', undefined);
        expect(out).toEqual({ basic: ['name', 'kind'] });
    });

    it('survives a widget override and its removal', () => {
        const set = withFormEntry(withBasic, 'widgets', 'entryAction', 'textarea');
        expect(set?.basic).toEqual(['name', 'kind']);
        const cleared = withFormEntry(set, 'widgets', 'entryAction', undefined);
        expect(cleared).toEqual({ basic: ['name', 'kind'], theme: 'plain' });
    });
});

// --- 6. treatment default and the inline degrade -----------------------------------

describe('derivedTreatment', () => {
    it('inline for a single value, list for everything else', () => {
        expect(derivedTreatment(1)).toBe('inline');
        expect(derivedTreatment(-1)).toBe('list');
        expect(derivedTreatment(5)).toBe('list');
        expect(derivedTreatment(0)).toBe('list');
    });

    it('the derived value of the two handoff references matches artboard 6b', () => {
        // outgoing is 0..*, substates is 0..1: List and Inline in the mockup.
        expect(derivedTreatment(row('outgoing').upperBound)).toBe('list');
        expect(derivedTreatment(row('substates').upperBound)).toBe('inline');
    });

    it('a declared inline on a multivalued feature is NOT rewritten by the helpers', () => {
        // The row shows it degraded to list (spec addendum sez. 6) but the key stays as
        // authored until the author picks a segment: nothing is repaired in silence.
        const spec: FormSpec = { features: { outgoing: 'inline' } };
        expect(spec.features?.outgoing).toBe('inline');
        expect(withFormEntry(spec, 'features', 'outgoing', 'list')).toEqual({ features: { outgoing: 'list' } });
    });
});

// --- 7. ignored overrides ----------------------------------------------------------

describe('ignoredOverrides', () => {
    it('flags an override on a feature the metaclass does not have', () => {
        const out = ignoredOverrides({ widgets: { ghost: 'text' } as any }, ROWS);
        expect(out).toEqual([{ name: 'ghost', value: 'text', reason: 'unknown-feature' }]);
    });

    it('flags the slip the interpreter drops: a checkbox on an EString', () => {
        const out = ignoredOverrides({ widgets: { name: 'checkbox' } }, ROWS);
        expect(out).toEqual([{ name: 'name', value: 'checkbox', reason: 'incompatible', derived: 'text' }]);
    });

    it('a compatible override is not ignored, on an attribute or on a reference', () => {
        expect(ignoredOverrides({ widgets: { entryAction: 'textarea' } }, ROWS)).toEqual([]);
        expect(ignoredOverrides({ widgets: { outgoing: 'select' } }, ROWS)).toEqual([]);
    });

    it('no widgets map, nothing ignored', () => {
        expect(ignoredOverrides(undefined, ROWS)).toEqual([]);
        expect(ignoredOverrides({ theme: 'card' }, ROWS)).toEqual([]);
    });
});

// --- 8. the sections adapter -------------------------------------------------------

describe('sectionsForAuthoring', () => {
    it('with no compartments gives the three natural groups, empty ones dropped', () => {
        const out = sectionsForAuthoring([], ROWS);
        expect(out.map(s => s.key)).toEqual(['attributes', 'references', 'children']);
        expect(out.map(s => s.title)).toEqual(['Attributes', 'References', 'Children']);
        expect(out[0].fields.map(f => f.name)).toEqual(['name', 'kind', 'entryAction', 'timeout', 'isHistory']);
        expect(out[1].fields.map(f => f.name)).toEqual(['outgoing']);
        expect(out[2].fields.map(f => f.name)).toEqual(['substates']);
    });

    it('R-FRM-1: a single attributes compartment does not make the rest disappear', () => {
        const out = sectionsForAuthoring([compartment('attributes', 'attributes')], ROWS);
        expect(out.map(s => s.key)).toEqual(['attributes-0', 'residual-references', 'residual-children']);
    });

    it('an authored title wins, an unauthored one is the id capitalized', () => {
        const out = sectionsForAuthoring(
            [compartment('props', 'attributes', 'Properties'), compartment('links', 'references')],
            ROWS,
        );
        expect(out.map(s => s.title)).toEqual(['Properties', 'Links', 'Children']);
    });

    it('an empty section is dropped, as IRForm drops it', () => {
        const attrsOnly = ROWS.filter(r => !r.isReference && !r.isComposition);
        expect(sectionsForAuthoring([], attrsOnly).map(s => s.key)).toEqual(['attributes']);
    });

    it('the residual key cannot collide with an authored one', () => {
        // Worst case: a compartment whose id IS `residual`. Authored keys always end in
        // `-<index>`, so the two namespaces stay apart.
        const out = sectionsForAuthoring([compartment('residual', 'attributes')], ROWS);
        expect(out.map(s => s.key)).toEqual(['residual-0', 'residual-references', 'residual-children']);
    });
});

// --- 9. characterization: a feature named `op` (discovery Q5) -----------------------

describe('a feature named `op` inside FormSpec.widgets', () => {
    const irWith = (form: FormSpec): VertexViewIR => ({ ...defaultObjectViewIR(), form });

    it('a normal FormSpec validates', () => {
        expect(validateIR('v_ok', irWith({ theme: 'card', widgets: { name: 'textarea' } }))).toEqual({ ok: true });
    });

    /**
     * Characterization, NOT a wish. `irValidate.findUnknownPredicateOp` walks the whole ir
     * and reads `.op` off every object, so a widgets map keyed by a feature actually named
     * `op` is read as a predicate. The spec addendum (sez. 2) states the constraint for the
     * STRUCTURE of FormSpec; a dynamic key carrying a feature name is the case it does not
     * cover. Pinned here so the behaviour cannot change without someone noticing, and left
     * as it is: making the scan targeted is exactly what that module's doc argues against.
     */
    it('is rejected at commit, with a message about predicate operators', () => {
        const res = validateIR('v_op', irWith({ widgets: { op: 'text' } as any }));
        expect(res.ok).toBe(false);
        if (!res.ok) expect(res.error).toContain('unknown predicate operator');
    });

    it('the same key inside `features` is rejected too, for the same reason', () => {
        const res = validateIR('v_op2', irWith({ features: { op: 'hidden' } as any }));
        expect(res.ok).toBe(false);
    });
});
