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
