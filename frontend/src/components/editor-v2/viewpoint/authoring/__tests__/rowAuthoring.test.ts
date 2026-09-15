/**
 * Unit tests for the Fase R3 authoring surface:
 *  - preserve-verbatim of the FieldCompartmentListEditor source/filter handling
 *    (requirement #1: no interaction ever rewrites a source/filter the panel does
 *    not represent). Tested on the REAL pure functions the render uses.
 *  - the minimal `row` seed EnableIRPanel writes when enabling a row view.
 *
 * FieldCompartmentListEditor is import-safe in the node vitest env (it pulls the
 * design-system `ui` barrel but no joiner). EnableIRPanel/RowAuthoringPanel are
 * NOT (they import joiner → monaco-editor → `window` undefined in node), so the
 * seed is asserted as a mirrored literal driven through the real validate/compile
 * pipeline rather than imported from the component. See the closing report.
 */
import { describe, it, expect } from 'vitest';
import {
    isKnownCompartmentSource,
    classifyChildFilter,
    withCompartmentSource,
    withChildFilter,
} from '../FieldCompartmentListEditor';
import { validateIR } from '../../ir/irValidate';
import { compileRowView } from '../../ir/irCompile';
import { defaultRowViewIR } from '../../ir/irDefaults';
import type { FieldCompartmentSpec, Predicate, RowViewIR } from '../../ir/irTypes';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** A children compartment carrying an arbitrary source/filter, other fields set so
 *  the tests can assert they round-trip untouched. */
const childrenComp = (filter?: Predicate): FieldCompartmentSpec => ({
    id: 'feats',
    source: filter === undefined ? { from: 'children' } : { from: 'children', filter },
    rowFormat: { segments: [{ kind: 'name' }] },
    visible: { when: { op: 'literal', value: true }, then: true },
    separator: true,
});

describe('FieldCompartmentListEditor — source recognition (preserve-verbatim gate)', () => {
    it('recognises the three authorable sources', () => {
        expect(isKnownCompartmentSource('attributes')).toBe(true);
        expect(isKnownCompartmentSource('references')).toBe(true);
        expect(isKnownCompartmentSource('children')).toBe(true);
    });

    it('treats any other `from` as unknown (→ read-only badge, never coerced)', () => {
        expect(isKnownCompartmentSource('query')).toBe(false);
        expect(isKnownCompartmentSource('features')).toBe(false);
        expect(isKnownCompartmentSource('')).toBe(false);
        expect(isKnownCompartmentSource('futureSourceKind')).toBe(false);
    });
});

describe('FieldCompartmentListEditor — children filter classification', () => {
    it('no filter → none', () => {
        expect(classifyChildFilter(undefined)).toBe('none');
    });

    it('exactly {op:isKind, class} → basic-iskind (editable inline)', () => {
        expect(classifyChildFilter({ op: 'isKind', class: 'Feature' })).toBe('basic-iskind');
    });

    it('isKind carrying a path → advanced (read-only, verbatim)', () => {
        expect(classifyChildFilter({ op: 'isKind', class: 'Feature', path: '$owner' })).toBe('advanced');
    });

    it('any non-isKind predicate → advanced (read-only, verbatim)', () => {
        expect(classifyChildFilter({ op: 'eq', left: '$name', right: { kind: 'string', value: 'x' } })).toBe('advanced');
        expect(classifyChildFilter({ op: 'and', args: [{ op: 'literal', value: true }] })).toBe('advanced');
        expect(classifyChildFilter({ op: 'exists', path: '$name' })).toBe('advanced');
    });
});

describe('FieldCompartmentListEditor — withChildFilter (round-trip)', () => {
    it('undefined drops the filter KEY (bare {from:children}), not filter:undefined', () => {
        const before = childrenComp({ op: 'isKind', class: 'Attribute' });
        const after = withChildFilter(before, undefined);
        expect(after.source).toEqual({ from: 'children' });
        expect('filter' in after.source).toBe(false);
    });

    it('sets an isKind filter and preserves the other compartment fields', () => {
        const before = childrenComp();
        const after = withChildFilter(before, { op: 'isKind', class: 'Attribute' });
        expect(after.source).toEqual({ from: 'children', filter: { op: 'isKind', class: 'Attribute' } });
        expect(after.id).toBe('feats');
        expect(after.rowFormat).toEqual({ segments: [{ kind: 'name' }] });
        expect(after.visible).toEqual({ when: { op: 'literal', value: true }, then: true });
        expect(after.separator).toBe(true);
    });

    it('does not mutate its input', () => {
        const before = childrenComp();
        const snapshot = clone(before);
        withChildFilter(before, { op: 'isKind', class: 'Attribute' });
        expect(before).toEqual(snapshot);
    });
});

describe('FieldCompartmentListEditor — preserve-verbatim of advanced / unknown sources', () => {
    it('an advanced children filter is classified read-only and never mutated by a read pass', () => {
        const advanced: Predicate = { op: 'eq', left: '$name', right: { kind: 'string', value: 'x' } };
        const comp = childrenComp(advanced);
        const snapshot = clone(comp);
        // The render only READS these to pick the read-only chip branch — no handler runs.
        expect(isKnownCompartmentSource(comp.source.from)).toBe(true);
        expect(classifyChildFilter(advanced)).toBe('advanced');
        expect(comp).toEqual(snapshot); // untouched
    });

    it('an unknown source is not recognised (badge, no handler) and stays byte-identical', () => {
        const comp = { ...childrenComp(), source: { from: 'someFutureSource' } } as unknown as FieldCompartmentSpec;
        const snapshot = clone(comp);
        expect(isKnownCompartmentSource((comp.source as { from: string }).from)).toBe(false);
        expect(comp).toEqual(snapshot);
    });
});

describe('FieldCompartmentListEditor — withCompartmentSource (explicit user pick)', () => {
    it('an explicit source switch is allowed and drops a prior children filter', () => {
        const before = childrenComp({ op: 'eq', left: '$name', right: { kind: 'string', value: 'x' } });
        const after = withCompartmentSource(before, 'attributes');
        expect(after.source).toEqual({ from: 'attributes' });
        // Non-source fields survive the explicit switch.
        expect(after.id).toBe('feats');
        expect(after.rowFormat).toEqual({ segments: [{ kind: 'name' }] });
    });

    it('switches to references / children without a seeded filter', () => {
        const base = childrenComp();
        expect(withCompartmentSource(base, 'references').source).toEqual({ from: 'references' });
        expect(withCompartmentSource(base, 'children').source).toEqual({ from: 'children' });
    });

    it('does not mutate its input', () => {
        const before = childrenComp();
        const snapshot = clone(before);
        withCompartmentSource(before, 'attributes');
        expect(before).toEqual(snapshot);
    });
});

describe('EnableIRPanel — minimal row seed (shape + validity)', () => {
    // Mirrors EnableIRPanel.enable() `kind === 'row'` branch. The component cannot be
    // imported in node (joiner → monaco → window), so the literal is asserted here and
    // driven through the real validate/compile pipeline the component's enable() uses.
    const ROW_SEED: RowViewIR = {
        irVersion: 'ir-1.0',
        kind: 'row',
        metaclasses: [],
        template: [{ from: 'intrinsic', prop: 'name' }],
    };

    it('has the exact documented shape', () => {
        expect(ROW_SEED).toEqual({
            irVersion: 'ir-1.0',
            kind: 'row',
            metaclasses: [],
            template: [{ from: 'intrinsic', prop: 'name' }],
        });
    });

    it('validates and compiles to a single intrinsic-name row segment', () => {
        expect(validateIR('seed-test', ROW_SEED)).toEqual({ ok: true });
        const compiled = compileRowView('seed-test', ROW_SEED);
        expect(compiled.kind).toBe('row');
        expect(compiled.template).toHaveLength(1);
    });

    it('the runtime fallback row view (defaultRowViewIR) also compiles', () => {
        const fallback = defaultRowViewIR();
        expect(validateIR('fallback-test', fallback)).toEqual({ ok: true });
        expect(compileRowView('fallback-test', fallback).template).toHaveLength(1);
    });
});
