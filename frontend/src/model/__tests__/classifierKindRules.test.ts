import { describe, it, expect } from 'vitest';
import {
    isClassKind,
    isTypeKindAllowed,
    isDataTypeExtendsWriteAllowed,
} from '../classifierKindRules';

/**
 * Enum step B (R-EDGE-2, P-2026-09-27-1806): the rules the model-layer setters apply.
 * The setters live in `LModelElement.tsx`, which the bench cannot import, so the rules are
 * executed here. The browser probe of the lane executes the wiring.
 */

describe('isClassKind: only a DClass', () => {
    it('a class is a class', () => {
        expect(isClassKind('DClass')).toBe(true);
    });
    it('an enum, a data type, a package, an object are not', () => {
        for (const cn of ['DEnumerator', 'DDataType', 'DPackage', 'DObject']) expect(isClassKind(cn)).toBe(false);
    });
    it('an unresolved element is not a class', () => {
        expect(isClassKind(undefined)).toBe(false);
        expect(isClassKind(null)).toBe(false);
    });
});

describe('isTypeKindAllowed (B1): a reference is typed by a class', () => {
    it('refuses a reference typed by an enum, a data type or a package', () => {
        for (const cn of ['DEnumerator', 'DDataType', 'DPackage']) expect(isTypeKindAllowed('DReference', cn)).toBe(false);
    });
    it('lets a reference be typed by a class', () => {
        expect(isTypeKindAllowed('DReference', 'DClass')).toBe(true);
    });
    it('lets an unresolved pointer or name through, as set-by-name does today', () => {
        expect(isTypeKindAllowed('DReference', undefined)).toBe(true);
    });
    it('does not constrain attributes, operations or parameters', () => {
        expect(isTypeKindAllowed('DAttribute', 'DEnumerator')).toBe(true);
        expect(isTypeKindAllowed('DOperation', 'DEnumerator')).toBe(true);
        expect(isTypeKindAllowed('DParameter', 'DDataType')).toBe(true);
    });
});

describe('isDataTypeExtendsWriteAllowed (B3): removals pass, additions do not', () => {
    it('refuses the first supertype of an enum (S5b)', () => {
        expect(isDataTypeExtendsWriteAllowed([], ['Pointer_Person'])).toBe(false);
        expect(isDataTypeExtendsWriteAllowed(undefined, ['Pointer_Person'])).toBe(false);
    });
    it('allows removing a saved supertype (Dummy.dclass, syncDeleteEdge)', () => {
        expect(isDataTypeExtendsWriteAllowed(['Pointer_Person'], [])).toBe(true);
        expect(isDataTypeExtendsWriteAllowed(['Pointer_A', 'Pointer_B'], ['Pointer_B'])).toBe(true);
    });
    it('refuses a write that removes one and adds another', () => {
        expect(isDataTypeExtendsWriteAllowed(['Pointer_A'], ['Pointer_B'])).toBe(false);
    });
    it('allows rewriting the same list and clearing an absent one', () => {
        expect(isDataTypeExtendsWriteAllowed(['Pointer_A'], ['Pointer_A'])).toBe(true);
        expect(isDataTypeExtendsWriteAllowed(undefined, [])).toBe(true);
        expect(isDataTypeExtendsWriteAllowed(null, [])).toBe(true);
    });
    it('does not read or mutate its inputs beyond membership', () => {
        const prev = ['Pointer_A', 'Pointer_B'];
        const next = ['Pointer_A'];
        isDataTypeExtendsWriteAllowed(prev, next);
        expect(prev).toEqual(['Pointer_A', 'Pointer_B']);
        expect(next).toEqual(['Pointer_A']);
    });
});
