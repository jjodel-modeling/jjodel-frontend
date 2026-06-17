import { describe, it, expect } from 'vitest';
import { inferAttributeType } from '../attributeTypeInference';

// The function returns ShortAttribETypes values, which are a string enum
// (ShortAttribETypes.EBoolean === 'EBoolean'). The utility deliberately avoids a
// runtime import of the enum (it would pull the framework barrel and break the
// node-env suite), so assertions compare against the equivalent string literals.

describe('inferAttributeType', () => {
    describe('booleans', () => {
        it.each([
            'isActive', 'hasChildren', 'canEdit', 'shouldRetry', 'allowDuplicates',
        ])('infers EBoolean from prefix: %s', name => {
            expect(inferAttributeType(name)).toBe('EBoolean');
        });

        it('infers EBoolean from the Required suffix', () => {
            expect(inferAttributeType('loginRequired')).toBe('EBoolean');
        });

        it.each(['enabled', 'Active'])('infers EBoolean from exact/suffix name: %s', name => {
            expect(inferAttributeType(name)).toBe('EBoolean');
        });
    });

    describe('dates', () => {
        it.each([
            'createdAt', 'birthDate', 'startTime', 'deadline', 'timestamp',
        ])('infers EDate from: %s', name => {
            expect(inferAttributeType(name)).toBe('EDate');
        });
    });

    describe('doubles', () => {
        it.each([
            'taxRate', 'totalPrice', 'discountPercent', 'weight', 'latitude',
        ])('infers EDouble from: %s', name => {
            expect(inferAttributeType(name)).toBe('EDouble');
        });
    });

    describe('ints', () => {
        it.each([
            'itemCount', 'rowIndex', 'maxRetries', 'numItems', 'age', 'version',
        ])('infers EInt from: %s', name => {
            expect(inferAttributeType(name)).toBe('EInt');
        });
    });

    describe('precedence (semantic suffix beats quantifier prefix)', () => {
        it('minDate → EDate (not EInt)', () => {
            expect(inferAttributeType('minDate')).toBe('EDate');
        });
        it('maxPrice → EDouble (not EInt)', () => {
            expect(inferAttributeType('maxPrice')).toBe('EDouble');
        });
    });

    describe('traps (must fall through to null / EString)', () => {
        it.each([
            'isbn', 'island', 'hash', 'hasty', 'cannon', 'candidate',
            'phoneNumber', 'serialNumber', 'id', 'code', 'name', 'address',
        ])('does not infer for: %s', name => {
            expect(inferAttributeType(name)).toBeNull();
        });
    });

    describe('snake_case normalization', () => {
        it('is_active → EBoolean', () => {
            expect(inferAttributeType('is_active')).toBe('EBoolean');
        });
        it('created_at → EDate', () => {
            expect(inferAttributeType('created_at')).toBe('EDate');
        });
        it('item_count → EInt', () => {
            expect(inferAttributeType('item_count')).toBe('EInt');
        });
    });

    describe('edge cases', () => {
        it('empty string → null', () => {
            expect(inferAttributeType('')).toBeNull();
        });
        it('whitespace-only → null', () => {
            expect(inferAttributeType('   ')).toBeNull();
        });
        it('"is" (no uppercase boundary) → null', () => {
            expect(inferAttributeType('is')).toBeNull();
        });
        it('"isA" → EBoolean', () => {
            expect(inferAttributeType('isA')).toBe('EBoolean');
        });
    });
});
