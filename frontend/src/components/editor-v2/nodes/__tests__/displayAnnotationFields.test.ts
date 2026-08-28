/**
 * The gating and the commit rules of the Display group.
 *
 * Pure on purpose, and tested here rather than through the component: the
 * component imports the write path, the write path imports the joiner barrel,
 * and the barrel pulls Monaco in, which dereferences `window` at import time and
 * makes the module unloadable in this environment.
 */

import { describe, it, expect } from 'vitest';
import {
    boundToWrite,
    displayFieldsFor,
    hasNoDisplayFields,
    unitToWrite,
} from '../displayAnnotationFields';

describe('displayFieldsFor', () => {
    it('a numeric type carries a unit and bounds, and no monospace', () => {
        for (const t of ['EInt', 'EDouble', 'elong', 'Number']) {
            expect(displayFieldsFor(t, false)).toEqual({ unit: true, bounds: true, code: false });
        }
    });

    it('a string type carries monospace and nothing else', () => {
        expect(displayFieldsFor('EString', false)).toEqual({ unit: false, bounds: false, code: true });
    });

    it('a user-defined datatype reads as text: the library floor is truncatedText', () => {
        expect(displayFieldsFor('Markdown', false).code).toBe(true);
    });

    it('boolean, date and colour types carry no Display field at all', () => {
        for (const t of ['EBoolean', 'EDate', 'Color']) {
            expect(hasNoDisplayFields(displayFieldsFor(t, false))).toBe(true);
        }
    });

    it('an enumeration is not text: its chip is not a monospace decision', () => {
        expect(displayFieldsFor('Palette', true).code).toBe(false);
    });

    it('an absent type name still reads as text rather than crashing', () => {
        expect(displayFieldsFor(undefined, false)).toEqual({ unit: false, bounds: false, code: true });
    });
});

describe('boundToWrite', () => {
    it('an empty field REMOVES the annotation, it does not write an empty one', () => {
        expect(boundToWrite('')).toEqual({ action: 'clear' });
        expect(boundToWrite('   ')).toEqual({ action: 'clear' });
    });

    it('a number is written as a number, negatives and decimals included', () => {
        expect(boundToWrite('0')).toEqual({ action: 'write', value: 0 });
        expect(boundToWrite('-2.5')).toEqual({ action: 'write', value: -2.5 });
        expect(boundToWrite(' 100 ')).toEqual({ action: 'write', value: 100 });
    });

    it('half-typed garbage is IGNORED, so it cannot delete a good declaration', () => {
        expect(boundToWrite('-')).toEqual({ action: 'ignore' });
        expect(boundToWrite('abc')).toEqual({ action: 'ignore' });
    });
});

describe('unitToWrite', () => {
    it('blank clears', () => {
        expect(unitToWrite('')).toEqual({ action: 'clear' });
        expect(unitToWrite('  ')).toEqual({ action: 'clear' });
    });

    it('anything else is written trimmed', () => {
        expect(unitToWrite(' px ')).toEqual({ action: 'write', value: 'px' });
        expect(unitToWrite('ms')).toEqual({ action: 'write', value: 'ms' });
    });
});
