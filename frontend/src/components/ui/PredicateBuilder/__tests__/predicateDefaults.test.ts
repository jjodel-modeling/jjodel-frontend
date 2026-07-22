/**
 * Unit tests for predicateDefaults (authoring phase B2b-i enabling layer).
 * Covers every forPredicateKind factory, isLiteralOperand on both operand
 * shapes, and attributeTypeToLiteralKind on each bucket + an unknown type.
 */
import { describe, it, expect } from 'vitest';
import {
    forPredicateKind,
    isLiteralOperand,
    attributeTypeToLiteralKind,
    PREDICATE_KIND_OPTIONS,
    type PredicateKind,
} from '../predicateDefaults';

describe('forPredicateKind', () => {
    it('and/or seed empty args', () => {
        expect(forPredicateKind('and')).toEqual({ op: 'and', args: [] });
        expect(forPredicateKind('or')).toEqual({ op: 'or', args: [] });
    });

    it('not seeds a literal-true child', () => {
        expect(forPredicateKind('not')).toEqual({ op: 'not', arg: { op: 'literal', value: true } });
    });

    it('the six comparators seed empty string literals on both sides', () => {
        for (const op of ['eq', 'neq', 'lt', 'lte', 'gt', 'gte'] as PredicateKind[]) {
            expect(forPredicateKind(op)).toEqual({
                op,
                left: { kind: 'string', value: '' },
                right: { kind: 'string', value: '' },
            });
        }
    });

    it('exists/empty seed an empty path', () => {
        expect(forPredicateKind('exists')).toEqual({ op: 'exists', path: '' });
        expect(forPredicateKind('empty')).toEqual({ op: 'empty', path: '' });
    });

    it('isKind seeds class from the first classNames entry, else empty', () => {
        expect(forPredicateKind('isKind', ['State', 'Transition'])).toEqual({ op: 'isKind', class: 'State' });
        expect(forPredicateKind('isKind')).toEqual({ op: 'isKind', class: '' });
        expect(forPredicateKind('isKind', [])).toEqual({ op: 'isKind', class: '' });
    });

    it('isKind seed omits the optional path key (self)', () => {
        expect('path' in forPredicateKind('isKind', ['State'])).toBe(false);
    });

    it('literal seeds value true', () => {
        expect(forPredicateKind('literal')).toEqual({ op: 'literal', value: true });
    });

    it('produces a node for every option in PREDICATE_KIND_OPTIONS', () => {
        for (const opt of PREDICATE_KIND_OPTIONS) {
            expect(forPredicateKind(opt.value).op).toBe(opt.value);
        }
        expect(PREDICATE_KIND_OPTIONS).toHaveLength(13);
    });
});

describe('isLiteralOperand', () => {
    it('is true for a Literal object', () => {
        expect(isLiteralOperand({ kind: 'string', value: 'x' })).toBe(true);
        expect(isLiteralOperand({ kind: 'number', value: 3 })).toBe(true);
        expect(isLiteralOperand({ kind: 'boolean', value: true })).toBe(true);
    });

    it('is false for a PathExpr string', () => {
        expect(isLiteralOperand('$name.value')).toBe(false);
        expect(isLiteralOperand('')).toBe(false);
    });
});

describe('attributeTypeToLiteralKind', () => {
    it('maps boolean type names', () => {
        for (const t of ['EBoolean', 'Boolean', 'boolean']) {
            expect(attributeTypeToLiteralKind(t)).toBe('boolean');
        }
    });

    it('maps numeric type names (native + Ecore + bare)', () => {
        for (const t of ['EInt', 'EDouble', 'EFloat', 'ELong', 'EByte', 'EShort', 'EBigInteger', 'EBigDecimal', 'Integer', 'int', 'double']) {
            expect(attributeTypeToLiteralKind(t)).toBe('number');
        }
    });

    it('maps string-family and unknown type names to string', () => {
        for (const t of ['EString', 'EChar', 'EDate', 'EVoid', 'Color', 'MyEnum', '']) {
            expect(attributeTypeToLiteralKind(t)).toBe('string');
        }
    });
});
