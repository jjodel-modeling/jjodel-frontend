import { describe, it, expect } from 'vitest';
import { validateConformance } from '../ConformanceValidator';

// ------------------------------------------------------------------
// Fixtures. validateConformance is a pure function that only performs
// property reads on its LModel/LClass/LObject/LValue/LAttribute/LReference
// arguments, so plain duck-typed objects cast `as any` suffice — no real
// proxies, no framework/barrel import (same convention as
// model/__tests__/attributeTypeInference.test.ts, which avoids the barrel
// to keep the node-env suite green).
// ------------------------------------------------------------------

type AnyObj = Record<string, any>;

function attr(o: AnyObj): AnyObj {
    return { lowerBound: 0, upperBound: 1, isID: false, type: { name: 'EString' }, ...o };
}
function ref(o: AnyObj): AnyObj {
    return { lowerBound: 0, upperBound: 1, ...o };
}
function klass(o: AnyObj): AnyObj {
    return { abstract: false, extendsChain: [], allAttributes: [], allReferences: [], ...o };
}
// a feature value on an object; `metaId` links it to its metamodel feature (attr/ref) by id
function val(metaId: string, o: AnyObj): AnyObj {
    return { instanceof: { id: metaId }, value: undefined, values: undefined, ...o };
}
function obj(o: AnyObj): AnyObj {
    return { features: [], ...o };
}
function run(objects: AnyObj[], classes: AnyObj[]) {
    const model: AnyObj = { id: 'M', name: 'Model', objects };
    const metamodel: AnyObj = { id: 'MM', name: 'MM', classes };
    return validateConformance(model as any, metamodel as any);
}
function types(res: AnyObj): string[] {
    return res.violations.map((v: AnyObj) => v.violationType);
}

// ==================================================================
// CHECK 7 — abstract_instantiation
// ==================================================================
describe('CHECK 7 — abstract_instantiation', () => {
    it('flags an instance of an abstract class', () => {
        const C = klass({ id: 'C', name: 'Shape', abstract: true });
        const o = obj({ id: 'o1', name: 'x', instanceof: C });
        const res = run([o], [C]);
        expect(types(res)).toContain('abstract_instantiation');
        expect(res.status).toBe('errors');
    });

    it('accepts an instance of a concrete class', () => {
        const C = klass({ id: 'C', name: 'Circle', abstract: false });
        const o = obj({ id: 'o1', name: 'x', instanceof: C });
        const res = run([o], [C]);
        expect(types(res)).not.toContain('abstract_instantiation');
    });

    it('does not fire for an orphan object (no cascade past CHECK 1)', () => {
        const o = obj({ id: 'o1', name: 'ghost', instanceof: undefined });
        const res = run([o], []);
        expect(types(res)).toContain('orphan_object');
        expect(types(res)).not.toContain('abstract_instantiation');
    });
});

// ==================================================================
// CHECK 8 — reference_target_type_mismatch
// ==================================================================
describe('CHECK 8 — reference_target_type_mismatch', () => {
    const A = klass({ id: 'A', name: 'Animal' });
    const B = klass({ id: 'B', name: 'Dog', extendsChain: [A] });
    const X = klass({ id: 'X', name: 'Car' });
    const r = ref({ id: 'r', name: 'pet', type: A, upperBound: -1 });
    const Host = klass({ id: 'H', name: 'Host', allReferences: [r] });

    function hostWith(target: AnyObj): AnyObj {
        return obj({ id: 'h1', name: 'host', instanceof: Host, features: [val('r', { values: [target] })] });
    }

    it('accepts a target of the exact declared type', () => {
        const a = obj({ id: 'a1', name: 'a', instanceof: A });
        const res = run([hostWith(a), a], [A, B, X, Host]);
        expect(types(res)).not.toContain('reference_target_type_mismatch');
    });

    it('accepts a target of a subclass (kind-of via extendsChain)', () => {
        const b = obj({ id: 'b1', name: 'b', instanceof: B });
        const res = run([hostWith(b), b], [A, B, X, Host]);
        expect(types(res)).not.toContain('reference_target_type_mismatch');
    });

    it('flags a target of an unrelated type', () => {
        const x = obj({ id: 'x1', name: 'x', instanceof: X });
        const res = run([hostWith(x), x], [A, B, X, Host]);
        expect(types(res)).toContain('reference_target_type_mismatch');
        expect(res.status).toBe('errors');
    });

    it('does not double-flag a dangling target (leaves it to CHECK 6)', () => {
        const ghost = { id: 'gone', name: 'gone', instanceof: X };
        const host = obj({ id: 'h1', name: 'host', instanceof: Host, features: [val('r', { values: [ghost] })] });
        const res = run([host], [A, B, X, Host]); // target NOT in the model
        expect(types(res)).toContain('dangling_reference');
        expect(types(res)).not.toContain('reference_target_type_mismatch');
    });
});

// ==================================================================
// CHECK 9 — attr_multiplicity_upper_exceeded
// ==================================================================
describe('CHECK 9 — attr_multiplicity_upper_exceeded', () => {
    it('flags more values than upperBound', () => {
        const a = attr({ id: 'a', name: 'tags', upperBound: 2 });
        const C = klass({ id: 'C', name: 'Item', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'i', instanceof: C, features: [val('a', { values: ['x', 'y', 'z'] })] });
        const res = run([o], [C]);
        expect(types(res)).toContain('attr_multiplicity_upper_exceeded');
        expect(res.status).toBe('errors');
    });

    it('accepts values within upperBound', () => {
        const a = attr({ id: 'a', name: 'tags', upperBound: 2 });
        const C = klass({ id: 'C', name: 'Item', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'i', instanceof: C, features: [val('a', { values: ['x', 'y'] })] });
        const res = run([o], [C]);
        expect(types(res)).not.toContain('attr_multiplicity_upper_exceeded');
    });

    it('treats upperBound -1 as unlimited', () => {
        const a = attr({ id: 'a', name: 'tags', upperBound: -1 });
        const C = klass({ id: 'C', name: 'Item', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'i', instanceof: C, features: [val('a', { values: ['x', 'y', 'z', 'w'] })] });
        const res = run([o], [C]);
        expect(types(res)).not.toContain('attr_multiplicity_upper_exceeded');
    });
});

// ==================================================================
// CHECK 9b — attr_multiplicity_below_min (no double-report with CHECK 2)
// ==================================================================
describe('CHECK 9b — attr_multiplicity_below_min', () => {
    it('warns when values are present but below lowerBound', () => {
        const a = attr({ id: 'a', name: 'coords', lowerBound: 2, upperBound: 5 });
        const C = klass({ id: 'C', name: 'Point', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'p', instanceof: C, features: [val('a', { values: ['1'] })] });
        const res = run([o], [C]);
        expect(types(res)).toContain('attr_multiplicity_below_min');
    });

    it('does NOT double-report at zero values (that is CHECK 2 territory)', () => {
        const a = attr({ id: 'a', name: 'coords', lowerBound: 2, upperBound: 5 });
        const C = klass({ id: 'C', name: 'Point', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'p', instanceof: C, features: [] });
        const res = run([o], [C]);
        const t = types(res);
        expect(t).toContain('missing_required_attr');          // CHECK 2 fires
        expect(t).not.toContain('attr_multiplicity_below_min'); // 9b suppressed at 0
    });
});

// ==================================================================
// CHECK 10 — invalid_enum_literal
// ==================================================================
describe('CHECK 10 — invalid_enum_literal', () => {
    const enumType = { name: 'Color', isEnum: true, literals: [{ name: 'RED' }, { name: 'GREEN' }] };

    it('flags a value that is not a current literal', () => {
        const a = attr({ id: 'a', name: 'color', type: enumType });
        const C = klass({ id: 'C', name: 'Widget', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'w', instanceof: C, features: [val('a', { value: 'BLUE' })] });
        const res = run([o], [C]);
        expect(types(res)).toContain('invalid_enum_literal');
        expect(res.status).toBe('warnings');
    });

    it('accepts a valid literal', () => {
        const a = attr({ id: 'a', name: 'color', type: enumType });
        const C = klass({ id: 'C', name: 'Widget', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'w', instanceof: C, features: [val('a', { value: 'RED' })] });
        const res = run([o], [C]);
        expect(types(res)).not.toContain('invalid_enum_literal');
    });

    it('flags a value made stale by literal removal', () => {
        const staleEnum = { name: 'Color', isEnum: true, literals: [{ name: 'RED' }] }; // GREEN removed
        const a = attr({ id: 'a', name: 'color', type: staleEnum });
        const C = klass({ id: 'C', name: 'Widget', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'w', instanceof: C, features: [val('a', { value: 'GREEN' })] });
        const res = run([o], [C]);
        expect(types(res)).toContain('invalid_enum_literal');
    });

    it('ignores a null/empty value (CHECK 2 territory)', () => {
        const a = attr({ id: 'a', name: 'color', type: enumType });
        const C = klass({ id: 'C', name: 'Widget', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'w', instanceof: C, features: [val('a', { value: '' })] });
        const res = run([o], [C]);
        expect(types(res)).not.toContain('invalid_enum_literal');
    });
});

// ==================================================================
// CHECK 10 — pointer form (R-FRM-3)
//
// The canonical value of an enum attribute is the POINTER to the DEnumLiteral;
// the literal NAME is a legacy form accepted on read, with no expiry. Before
// this, the check compared names only, so every enum written by an editor was
// flagged. The four cases above keep the legacy form honest; these keep the
// canonical one honest, and the two must never diverge.
//
// Note the fixtures here declare literals with BOTH `id` and `name`, unlike the
// legacy ones above, which have `name` only. That difference is the subject of
// the last case.
// ==================================================================
describe('CHECK 10 — enum literal pointers (R-FRM-3)', () => {
    const enumType = {
        name: 'Color', isEnum: true,
        literals: [{ id: 'lit_red', name: 'RED' }, { id: 'lit_green', name: 'GREEN' }],
    };
    const widget = (feature: AnyObj) => {
        const a = attr({ id: 'a', name: 'color', type: enumType });
        const C = klass({ id: 'C', name: 'Widget', allAttributes: [a] });
        return { C, o: obj({ id: 'o', name: 'w', instanceof: C, features: [feature] }) };
    };

    it('accepts a pointer to a literal of the enum, read from __raw.values', () => {
        // The production path: validateConformance prefers `feat.__raw.values`, and every case
        // in this file before R-FRM-3 exercised only the `feat.values` fallback. This one goes
        // through the array the app actually writes.
        const { C, o } = widget(val('a', { __raw: { values: ['lit_red'] } }));
        expect(types(run([o], [C]))).not.toContain('invalid_enum_literal');
    });

    it('accepts a pointer through the values fallback too', () => {
        const { C, o } = widget(val('a', { value: 'lit_green' }));
        expect(types(run([o], [C]))).not.toContain('invalid_enum_literal');
    });

    it('still accepts the legacy literal name, on both read paths', () => {
        // The half that must not regress: tolerance was added, nothing was replaced.
        const raw = widget(val('a', { __raw: { values: ['RED'] } }));
        expect(types(run([raw.o], [raw.C]))).not.toContain('invalid_enum_literal');
        const fallback = widget(val('a', { value: 'GREEN' }));
        expect(types(run([fallback.o], [fallback.C]))).not.toContain('invalid_enum_literal');
    });

    it('flags a pointer that belongs to no literal of THIS enum', () => {
        // A pointer to a literal of another enum is a type error, not an alternative spelling:
        // the id set is built from this enum's literals only, so it is caught with no special
        // handling.
        const { C, o } = widget(val('a', { __raw: { values: ['lit_of_another_enum'] } }));
        expect(types(run([o], [C]))).toContain('invalid_enum_literal');
    });

    it('accepts a resolved LEnumLiteral object on either of its identities', () => {
        // Pre-existing behaviour, preserved: the L getter maps enum values to proxies, and a
        // fixture may hand one over. Valid by name, and now also valid by id alone - a proxy
        // whose name failed to resolve is not thereby an invalid value.
        const byName = widget(val('a', { value: { name: 'RED' } }));
        expect(types(run([byName.o], [byName.C]))).not.toContain('invalid_enum_literal');
        const byId = widget(val('a', { value: { id: 'lit_green' } }));
        expect(types(run([byId.o], [byId.C]))).not.toContain('invalid_enum_literal');
        const neither = widget(val('a', { value: { name: 'BLUE', id: 'lit_blue' } }));
        expect(types(run([neither.o], [neither.C]))).toContain('invalid_enum_literal');
    });

    it('flags a numeric ordinal, which is neither accepted form', () => {
        // Ordinals are the residue of a separate defect in the .jmm loader; tolerating them here
        // would turn a third, unratified form into a valid one by accident.
        const { C, o } = widget(val('a', { __raw: { values: [1] } }));
        expect(types(run([o], [C]))).toContain('invalid_enum_literal');
    });

    it('with literals that carry no id, still flags and never prints undefined', () => {
        // The legacy fixture shape (`{ name: 'RED' }`, no id). An id set built without filtering
        // would hold `undefined`; this pins that it does not, and that the message stays legible.
        const idlessEnum = { name: 'Color', isEnum: true, literals: [{ name: 'RED' }] };
        const a = attr({ id: 'a', name: 'color', type: idlessEnum });
        const C = klass({ id: 'C', name: 'Widget', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'w', instanceof: C, features: [val('a', { value: 'BLUE' })] });
        const res = run([o], [C]);
        expect(types(res)).toContain('invalid_enum_literal');
        const msg = res.violations.find((v: AnyObj) => v.violationType === 'invalid_enum_literal')?.message ?? '';
        expect(msg).toContain('"BLUE"');
        expect(msg).not.toContain('undefined');
    });

    it('reports the offending value and says both forms were checked', () => {
        const { C, o } = widget(val('a', { __raw: { values: ['lit_of_another_enum'] } }));
        const msg = run([o], [C]).violations
            .find((v: AnyObj) => v.violationType === 'invalid_enum_literal')?.message ?? '';
        expect(msg).toContain('lit_of_another_enum');
        expect(msg).toContain('by name or id');
        expect(msg).toContain('"Color"');
    });

    it('flags every bad value of a multivalued attribute and none of the good ones', () => {
        const a = attr({ id: 'a', name: 'colors', type: enumType, upperBound: -1 });
        const C = klass({ id: 'C', name: 'Widget', allAttributes: [a] });
        // Mixed on purpose: a pointer, a legacy name, and one of each that is wrong.
        const o = obj({ id: 'o', name: 'w', instanceof: C, features: [
            val('a', { __raw: { values: ['lit_red', 'GREEN', 'lit_bogus', 'PURPLE'] } }),
        ] });
        const res = run([o], [C]);
        const enumViolations = res.violations.filter((v: AnyObj) => v.violationType === 'invalid_enum_literal');
        expect(enumViolations).toHaveLength(2);
        expect(enumViolations.map((v: AnyObj) => v.message).join(' ')).toContain('lit_bogus');
        expect(enumViolations.map((v: AnyObj) => v.message).join(' ')).toContain('PURPLE');
    });
});

// ==================================================================
// CHECK 11 — duplicate_id_value
// ==================================================================
describe('CHECK 11 — duplicate_id_value', () => {
    it('flags two instances sharing a non-null isID value (one violation each)', () => {
        const a = attr({ id: 'a', name: 'code', isID: true });
        const C = klass({ id: 'C', name: 'Product', allAttributes: [a] });
        const o1 = obj({ id: 'o1', name: 'p1', instanceof: C, features: [val('a', { value: 'X1' })] });
        const o2 = obj({ id: 'o2', name: 'p2', instanceof: C, features: [val('a', { value: 'X1' })] });
        const res = run([o1, o2], [C]);
        const dup = res.violations.filter((v: AnyObj) => v.violationType === 'duplicate_id_value');
        expect(dup).toHaveLength(2);
        expect(dup.map((v: AnyObj) => v.objectId).sort()).toEqual(['o1', 'o2']);
        expect(res.status).toBe('errors');
    });

    it('accepts distinct isID values', () => {
        const a = attr({ id: 'a', name: 'code', isID: true });
        const C = klass({ id: 'C', name: 'Product', allAttributes: [a] });
        const o1 = obj({ id: 'o1', name: 'p1', instanceof: C, features: [val('a', { value: 'X1' })] });
        const o2 = obj({ id: 'o2', name: 'p2', instanceof: C, features: [val('a', { value: 'X2' })] });
        const res = run([o1, o2], [C]);
        expect(types(res)).not.toContain('duplicate_id_value');
    });

    it('scopes uniqueness across subclasses that inherit the id slot', () => {
        const a = attr({ id: 'a', name: 'code', isID: true });
        const Base = klass({ id: 'Base', name: 'Base', allAttributes: [a] });
        const Sub = klass({ id: 'Sub', name: 'Sub', extendsChain: [Base], allAttributes: [a] }); // same attr id
        const o1 = obj({ id: 'o1', name: 'b', instanceof: Base, features: [val('a', { value: 'DUP' })] });
        const o2 = obj({ id: 'o2', name: 's', instanceof: Sub, features: [val('a', { value: 'DUP' })] });
        const res = run([o1, o2], [Base, Sub]);
        expect(res.violations.filter((v: AnyObj) => v.violationType === 'duplicate_id_value')).toHaveLength(2);
    });

    it('ignores null/empty id values', () => {
        const a = attr({ id: 'a', name: 'code', isID: true });
        const C = klass({ id: 'C', name: 'Product', allAttributes: [a] });
        const o1 = obj({ id: 'o1', name: 'p1', instanceof: C, features: [val('a', { value: '' })] });
        const o2 = obj({ id: 'o2', name: 'p2', instanceof: C, features: [val('a', { value: '' })] });
        const res = run([o1, o2], [C]);
        expect(types(res)).not.toContain('duplicate_id_value');
    });
});

// ==================================================================
// Non-regression — the original 6 checks are unchanged
// ==================================================================
describe('non-regression (original 6 checks intact)', () => {
    it('a model conformant under the original checks stays conformant', () => {
        const nameAttr = attr({ id: 'n', name: 'name', lowerBound: 1, upperBound: 1, type: { name: 'EString' } });
        const C = klass({ id: 'C', name: 'Person', allAttributes: [nameAttr] });
        const o = obj({ id: 'o', name: 'alice', instanceof: C, features: [val('n', { value: 'Alice' })] });
        const res = run([o], [C]);
        expect(res.status).toBe('conformant');
        expect(res.violations).toHaveLength(0);
    });

    it('still reports the original orphan_object / missing_required_attr checks', () => {
        const nameAttr = attr({ id: 'n', name: 'name', lowerBound: 1 });
        const C = klass({ id: 'C', name: 'Person', allAttributes: [nameAttr] });
        const missing = obj({ id: 'o1', name: 'nobody', instanceof: C, features: [] });
        const ghost = obj({ id: 'o2', name: 'ghost', instanceof: undefined });
        const res = run([missing, ghost], [C]);
        const t = types(res);
        expect(t).toContain('missing_required_attr');
        expect(t).toContain('orphan_object');
    });
});

// ==================================================================
// Fail-visible — a per-check catch emits a synthetic check_failed
// so status can never be 'conformant' with a check that never ran
// ==================================================================
describe('fail-visible (check_failed)', () => {
    it('emits check_failed and is not conformant when a per-check evaluation throws', () => {
        const C = klass({ id: 'C', name: 'Boom' });
        // Force CHECK 7's `classInMM.abstract === true` read to throw at runtime.
        Object.defineProperty(C, 'abstract', { get() { throw new Error('boom'); }, configurable: true });
        const o = obj({ id: 'o1', name: 'x', instanceof: C });
        const res = run([o], [C]);
        const cf = res.violations.filter((v: AnyObj) => v.violationType === 'check_failed');
        expect(cf).toHaveLength(1);
        expect(cf[0].severity).toBe('warning');
        expect(cf[0].objectId).toBe('o1');
        expect(res.status).not.toBe('conformant');
    });
});

// ==================================================================
// Shape-live — the checks read the untruncated/unmapped raw slot,
// not the L-proxy `feat.values` (capped to upperBound; enum→objects)
// ==================================================================
describe('shape-live (raw values / enum objects)', () => {
    it('CHECK 9 counts from untruncated __raw.values (proxy truncates values to upperBound)', () => {
        const a = attr({ id: 'a', name: 'tags', upperBound: 2 });
        const C = klass({ id: 'C', name: 'Item', allAttributes: [a] });
        // Simulate the live proxy: feat.values capped to 2, __raw.values holds the real 3.
        const o = obj({ id: 'o', name: 'i', instanceof: C,
            features: [val('a', { values: ['x', 'y'], __raw: { values: ['x', 'y', 'z'] } })] });
        const res = run([o], [C]);
        expect(types(res)).toContain('attr_multiplicity_upper_exceeded');
    });

    it('CHECK 10 compares enum values that arrive as LEnumLiteral objects (by .name)', () => {
        const enumType = { name: 'Color', isEnum: true, literals: [{ name: 'RED' }, { name: 'GREEN' }] };
        const a = attr({ id: 'a', name: 'color', type: enumType });
        const C = klass({ id: 'C', name: 'Widget', allAttributes: [a] });
        const bad = obj({ id: 'o1', name: 'w', instanceof: C, features: [val('a', { values: [{ name: 'BLUE' }] })] });
        const good = obj({ id: 'o2', name: 'w2', instanceof: C, features: [val('a', { values: [{ name: 'RED' }] })] });
        expect(types(run([bad], [C]))).toContain('invalid_enum_literal');
        expect(types(run([good], [C]))).not.toContain('invalid_enum_literal');
    });

    it('CHECK 11 accumulates id values from __raw.values (two instances share "X1")', () => {
        const a = attr({ id: 'a', name: 'code', isID: true });
        const C = klass({ id: 'C', name: 'Product', allAttributes: [a] });
        const o1 = obj({ id: 'o1', name: 'p1', instanceof: C, features: [val('a', { __raw: { values: ['X1'] } })] });
        const o2 = obj({ id: 'o2', name: 'p2', instanceof: C, features: [val('a', { __raw: { values: ['X1'] } })] });
        const res = run([o1, o2], [C]);
        expect(res.violations.filter((v: AnyObj) => v.violationType === 'duplicate_id_value')).toHaveLength(2);
    });

    it('CHECK 11 gate: default isID=false accumulates nothing (no false duplicate)', () => {
        const a = attr({ id: 'a', name: 'code' }); // isID defaults false
        const C = klass({ id: 'C', name: 'Product', allAttributes: [a] });
        const o1 = obj({ id: 'o1', name: 'p1', instanceof: C, features: [val('a', { value: 'X1' })] });
        const o2 = obj({ id: 'o2', name: 'p2', instanceof: C, features: [val('a', { value: 'X1' })] });
        expect(types(run([o1, o2], [C]))).not.toContain('duplicate_id_value');
    });
});

// ==================================================================
// CHECK 4 & 5 — reference multiplicity reads untruncated __raw.values
// (the L-proxy feat.values caps to upperBound / can pad to lowerBound,
//  so the same WP1 raw read used by CHECK 9 must apply here too)
// ==================================================================
describe('CHECK 4 & 5 — reference multiplicity (raw values)', () => {
    const B = klass({ id: 'B', name: 'B' });
    const bObj = (id: string) => obj({ id, name: id, instanceof: B });

    // A has a reference r:B with multiplicity lb..ub. proxyLen simulates the
    // L-proxy truncation/padding of feat.values; __raw.values holds the real links
    // (pointer id strings, as the D-layer stores them).
    function aWith(rawIds: string[], proxyLen: number, lb: number, ub: number) {
        const r = ref({ id: 'r', name: 'r', type: B, lowerBound: lb, upperBound: ub });
        const A = klass({ id: 'A', name: 'A', allReferences: [r] });
        const a0 = obj({ id: 'A_0', name: 'A_0', instanceof: A,
            features: [val('r', { values: rawIds.slice(0, proxyLen), __raw: { values: rawIds } })] });
        return { A, a0 };
    }

    it('flags 4 links against upperBound 3 from __raw (proxy truncates to 3)', () => {
        const { A, a0 } = aWith(['b0', 'b1', 'b2', 'b3'], 3, 2, 3);
        const res = run([a0, bObj('b0'), bObj('b1'), bObj('b2'), bObj('b3')], [A, B]);
        expect(types(res)).toContain('multiplicity_upper_exceeded');
        expect(res.status).toBe('errors');
    });

    it('warns on 1 link against lowerBound 2 from __raw', () => {
        const { A, a0 } = aWith(['b0'], 1, 2, 3);
        const res = run([a0, bObj('b0')], [A, B]);
        expect(types(res)).toContain('multiplicity_below_min');
    });

    it('is silent for a conformant count (2 links within 2..3)', () => {
        const { A, a0 } = aWith(['b0', 'b1'], 2, 2, 3);
        const res = run([a0, bObj('b0'), bObj('b1')], [A, B]);
        expect(types(res)).not.toContain('multiplicity_upper_exceeded');
        expect(types(res)).not.toContain('multiplicity_below_min');
    });

    it('CHECK 6 sees links beyond upperBound (4th link dangling when its target is missing)', () => {
        const { A, a0 } = aWith(['b0', 'b1', 'b2', 'b3'], 3, 2, 3);
        // b3 intentionally NOT in the model — with the old truncated read it would
        // be invisible (proxy stops at 3); the raw read must still flag it dangling.
        const res = run([a0, bObj('b0'), bObj('b1'), bObj('b2')], [A, B]);
        expect(types(res)).toContain('dangling_reference');
    });
});

// ==================================================================
// CHECK 3 — type_mismatch reads the raw stored value
// (the L-proxy feat.value coerces per-type before delivering — a string
//  on EInt arrives as a number, a string on EBoolean as a boolean — so
//  the check must judge __raw.values, the form the D-layer stores)
// ==================================================================
describe('CHECK 3 — type_mismatch (raw values)', () => {
    function itemWith(typeName: string, feature: AnyObj) {
        const a = attr({ id: 'a', name: 'index', type: { name: typeName } });
        const C = klass({ id: 'C', name: 'C2', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'i', instanceof: C, features: [val('a', feature)] });
        return run([o], [C]);
    }

    it('flags a raw string on EInt even when the proxy delivers the coerced number', () => {
        // Live-battery row #3: __raw holds 'aaa', the proxy value is the coerced 0.
        const res = itemWith('EInt', { value: 0, __raw: { values: ['aaa'] } });
        expect(types(res)).toContain('type_mismatch');
        expect(res.status).toBe('warnings');
        const v = res.violations.find((x: AnyObj) => x.violationType === 'type_mismatch')!;
        expect(v.message).toContain('EInt');
        expect(v.message).toContain('aaa');
    });

    it('accepts a valid integer on EInt in both stored forms (widget string, raw number)', () => {
        expect(types(itemWith('EInt', { __raw: { values: ['42'] } }))).not.toContain('type_mismatch');
        expect(types(itemWith('EInt', { __raw: { values: [42] } }))).not.toContain('type_mismatch');
    });

    it('flags a non-integer numeric on EInt', () => {
        expect(types(itemWith('EInt', { __raw: { values: ['3.7'] } }))).toContain('type_mismatch');
    });

    it('accepts numerics on EDouble, flags a non-numeric string', () => {
        expect(types(itemWith('EDouble', { __raw: { values: ['3.7'] } }))).not.toContain('type_mismatch');
        expect(types(itemWith('EDouble', { __raw: { values: ['aaa'] } }))).toContain('type_mismatch');
    });

    it('accepts booleans on EBoolean in both stored forms, flags an arbitrary string', () => {
        expect(types(itemWith('EBoolean', { __raw: { values: [true] } }))).not.toContain('type_mismatch');
        expect(types(itemWith('EBoolean', { __raw: { values: ['false'] } }))).not.toContain('type_mismatch');
        expect(types(itemWith('EBoolean', { __raw: { values: ['aaa'] } }))).toContain('type_mismatch');
    });

    it('accepts any value on EString', () => {
        expect(types(itemWith('EString', { __raw: { values: ['whatever 123'] } }))).not.toContain('type_mismatch');
    });

    it('is silent on null/absent values (CHECK 2 territory)', () => {
        expect(types(itemWith('EInt', { __raw: { values: [null] } }))).not.toContain('type_mismatch');
        expect(types(itemWith('EInt', { __raw: { values: [] } }))).not.toContain('type_mismatch');
    });

    it('still works on flat fixtures without __raw (fallback chain)', () => {
        expect(types(itemWith('EInt', { value: 'aaa' }))).toContain('type_mismatch');
        expect(types(itemWith('EInt', { value: '42' }))).not.toContain('type_mismatch');
    });
});

// ==================================================================
// CHECK 2 — missing_required_attr judges presence on raw values
// (the L-proxy f.value fabricates presence: an empty required EInt
//  slot is padded to lowerBound and numbercast to 0, an empty EChar
//  becomes 'A', the name:EString slot falls back to initialName —
//  presence must be judged on the stored form; 0/false ARE values)
// ==================================================================
describe('CHECK 2 — missing_required_attr (raw presence)', () => {
    function requiredWith(typeName: string, feature: AnyObj | null) {
        const a = attr({ id: 'a', name: 'index', lowerBound: 1, type: { name: typeName } });
        const C = klass({ id: 'C', name: 'C2', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'i', instanceof: C, features: feature ? [val('a', feature)] : [] });
        return run([o], [C]);
    }

    it('flags an empty required EInt even when the proxy delivers the padded/coerced 0', () => {
        // The blind case: __raw.values is empty, proxy value is the fabricated 0.
        const res = requiredWith('EInt', { value: 0, __raw: { values: [] } });
        expect(types(res)).toContain('missing_required_attr');
        expect(res.status).toBe('errors');
    });

    it('accepts a required EInt whose stored value is 0 (0 is a value, not an absence)', () => {
        expect(types(requiredWith('EInt', { __raw: { values: [0] } }))).not.toContain('missing_required_attr');
        expect(types(requiredWith('EInt', { __raw: { values: ['0'] } }))).not.toContain('missing_required_attr');
    });

    it('accepts a required EBoolean whose stored value is false', () => {
        expect(types(requiredWith('EBoolean', { __raw: { values: [false] } }))).not.toContain('missing_required_attr');
    });

    it('flags a required EString whose stored values are all empty strings', () => {
        expect(types(requiredWith('EString', { __raw: { values: [''] } }))).toContain('missing_required_attr');
        expect(types(requiredWith('EString', { __raw: { values: ['x'] } }))).not.toContain('missing_required_attr');
    });

    it('judges the name slot on raw too (no initialName fallback masking)', () => {
        // Simulate the identity-slot fallback: proxy value carries the owner's
        // initialName while the stored slot is empty — must still flag missing.
        const a = attr({ id: 'n', name: 'name', lowerBound: 1, type: { name: 'EString' } });
        const C = klass({ id: 'C', name: 'Person', allAttributes: [a] });
        const o = obj({ id: 'o', name: 'p', instanceof: C,
            features: [val('n', { value: 'fallbackName', __raw: { values: [''] } })] });
        expect(types(run([o], [C]))).toContain('missing_required_attr');
    });

    it('still flags a wholly absent feature (no slot at all)', () => {
        expect(types(requiredWith('EInt', null))).toContain('missing_required_attr');
    });
});

// ==================================================================
// CHECK 12 — missing_name / invalid_name_format
// Re-hosted from the `Naming error view` of the seeded `Default Validation`
// viewpoint, inert since the classic shutdown (Fase 5a).
// ==================================================================
describe('CHECK 12 — name shape', () => {
    const C = klass({ id: 'C', name: 'Person' });

    it('flags an object with no name', () => {
        const res = run([obj({ id: 'o1', name: '', instanceof: C })], [C]);
        expect(types(res)).toContain('missing_name');
    });

    it('flags a name that does not begin with a letter', () => {
        const res = run([obj({ id: 'o1', name: '1st', instanceof: C })], [C]);
        expect(types(res)).toContain('invalid_name_format');
    });

    it('flags a name carrying a forbidden character', () => {
        const res = run([obj({ id: 'o1', name: 'a-b', instanceof: C })], [C]);
        expect(types(res)).toContain('invalid_name_format');
    });

    it('accepts a well-formed name', () => {
        const res = run([obj({ id: 'o1', name: 'alice', instanceof: C })], [C]);
        expect(types(res)).not.toContain('missing_name');
        expect(types(res)).not.toContain('invalid_name_format');
    });

    it('is a warning, so a name problem alone never reports errors', () => {
        const res = run([obj({ id: 'o1', name: '', instanceof: C })], [C]);
        expect(res.status).toBe('warnings');
    });

    it('runs before CHECK 1, so an unnamed orphan is told both things', () => {
        const res = run([obj({ id: 'o1', name: '', instanceof: undefined })], []);
        expect(types(res)).toContain('missing_name');
        expect(types(res)).toContain('orphan_object');
    });

    it('attaches the violation to the object, with the id as fallback label', () => {
        const res = run([obj({ id: 'o1', name: '', instanceof: C })], [C]);
        const v = res.violations.find((x: AnyObj) => x.violationType === 'missing_name')!;
        expect(v.objectId).toBe('o1');
        expect(v.message).toContain('o1');
    });
});
