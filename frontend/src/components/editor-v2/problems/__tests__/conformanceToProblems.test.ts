import { describe, it, expect } from 'vitest';
import { aggregateConformanceByObject } from '../conformanceToProblems';

// aggregateConformanceByObject is a pure function over a ConformanceResult shape;
// plain duck-typed objects cast `as any` suffice (same convention as
// ConformanceValidator.test.ts — no framework barrel, node-env safe).

type AnyObj = Record<string, any>;

function result(modelId: string, violations: AnyObj[]): any {
    return { modelId, status: 'errors', violations, checkedAt: 0 };
}
function v(o: AnyObj): AnyObj {
    return { objectId: 'o1', violationType: 'missing_required_attr', severity: 'error', message: 'msg', ...o };
}

describe('aggregateConformanceByObject', () => {
    it('returns [] for a null result', () => {
        expect(aggregateConformanceByObject(null)).toEqual([]);
    });

    it('returns [] for a conformant result (no violations)', () => {
        expect(aggregateConformanceByObject(result('m', []))).toEqual([]);
    });

    it('excludes model-level violations (objectId === modelId)', () => {
        const r = result('m', [
            v({ objectId: 'm', violationType: 'check_failed', severity: 'warning' }),
        ]);
        expect(aggregateConformanceByObject(r)).toEqual([]);
    });

    it('excludes violations without an objectId', () => {
        const r = result('m', [v({ objectId: undefined })]);
        expect(aggregateConformanceByObject(r)).toEqual([]);
    });

    it('carries metamodelElementName through to the aggregate', () => {
        // The name of the violated metamodel element is what lets a consumer attach the
        // violation to a field. It was being dropped in the push, which is why the form
        // could count problems but never point at one.
        const r = result('m', [
            v({ objectId: 'A', violationType: 'missing_required_attr', severity: 'error', message: 'kind is required', metamodelElementName: 'kind' }),
            // A check that names a CLASS, not a feature: same field, different meaning, and
            // the aggregate must not try to tell them apart.
            v({ objectId: 'A', violationType: 'abstract_instantiation', severity: 'error', message: 'abstract', metamodelElementName: 'State' }),
            // A violation that names nothing stays undefined rather than becoming ''.
            v({ objectId: 'A', violationType: 'check_failed', severity: 'warning', message: 'skipped' }),
        ]);
        const out = aggregateConformanceByObject(r);
        expect(out[0].violations.map(x => x.metamodelElementName)).toEqual(['kind', 'State', undefined]);
    });

    it('aggregates multiple violations of one object into a single entry', () => {
        const r = result('m', [
            v({ objectId: 'A', objectName: 'A_0', violationType: 'missing_required_attr', severity: 'error', message: 'e1' }),
            v({ objectId: 'A', violationType: 'invalid_enum_literal', severity: 'warning', message: 'w1' }),
        ]);
        const out = aggregateConformanceByObject(r);
        expect(out).toHaveLength(1);
        expect(out[0].objectId).toBe('A');
        expect(out[0].objectName).toBe('A_0');
        expect(out[0].violations).toHaveLength(2);
        expect(out[0].violations.map(x => x.violationType)).toEqual([
            'missing_required_attr',
            'invalid_enum_literal',
        ]);
    });

    it('takes the max severity (error wins over warning), regardless of order', () => {
        const warnFirst = result('m', [
            v({ objectId: 'A', severity: 'warning', message: 'w' }),
            v({ objectId: 'A', severity: 'error', message: 'e' }),
        ]);
        expect(aggregateConformanceByObject(warnFirst)[0].severity).toBe('error');

        const allWarn = result('m', [
            v({ objectId: 'A', severity: 'warning', message: 'w1' }),
            v({ objectId: 'A', severity: 'warning', message: 'w2' }),
        ]);
        expect(aggregateConformanceByObject(allWarn)[0].severity).toBe('warning');
    });

    it('produces one entry per distinct object', () => {
        const r = result('m', [
            v({ objectId: 'A', message: 'a' }),
            v({ objectId: 'B', message: 'b' }),
        ]);
        const out = aggregateConformanceByObject(r);
        expect(out.map(x => x.objectId).sort()).toEqual(['A', 'B']);
    });

    it('backfills objectName from a later violation if the first lacked it', () => {
        const r = result('m', [
            v({ objectId: 'A', objectName: undefined, message: 'a1' }),
            v({ objectId: 'A', objectName: 'A_0', message: 'a2' }),
        ]);
        expect(aggregateConformanceByObject(r)[0].objectName).toBe('A_0');
    });
});
