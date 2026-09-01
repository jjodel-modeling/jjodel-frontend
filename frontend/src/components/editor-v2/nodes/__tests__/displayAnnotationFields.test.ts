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
    multilineOverriddenBy,
    unitToWrite,
} from '../displayAnnotationFields';

describe('displayFieldsFor', () => {
    it('a numeric type carries a unit and bounds, and no monospace', () => {
        for (const t of ['EInt', 'EDouble', 'elong', 'Number']) {
            expect(displayFieldsFor(t, false))
                .toEqual({ unit: true, bounds: true, code: false, multiline: false });
        }
    });

    it('a string type carries monospace and multiline, and nothing else', () => {
        expect(displayFieldsFor('EString', false))
            .toEqual({ unit: false, bounds: false, code: true, multiline: true });
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
        expect(displayFieldsFor(undefined, false))
            .toEqual({ unit: false, bounds: false, code: true, multiline: true });
    });

    it('multiline rides the SAME textual reading as code, never a second one', () => {
        // Two gates that could drift apart are two gates that will. The toggle must be
        // offered exactly where `widthOf` can honour it, which is the string/unknown floor.
        for (const [t, isEnum] of [['EString', false], ['Markdown', false], ['EInt', false],
                                   ['EBoolean', false], ['EDate', false], ['Color', false],
                                   ['Palette', true]] as Array<[string, boolean]>) {
            const g = displayFieldsFor(t, isEnum);
            expect(g.multiline, `${t} enum=${isEnum}`).toBe(g.code);
        }
    });
});

describe('multilineOverriddenBy — the hint, not a prohibition', () => {
    it('names the renderer that is taking the width decision', () => {
        // The two toggles may both be on; the panel says which one the ladder reads first.
        expect(multilineOverriddenBy('code')).toBe('code');
        expect(multilineOverriddenBy('swatch')).toBe('swatch');
    });

    it('is silent when no renderer is declared', () => {
        expect(multilineOverriddenBy(undefined)).toBeNull();
        expect(multilineOverriddenBy('')).toBeNull();
    });

    it('is silent for a renderer that settles no width — it overrides nothing', () => {
        // `enumChip` and `progress` declare a notation over a type whose width rung 1
        // already fixed; they are absent from `RENDERER_WIDTH_KIND` for that reason, and
        // reading that same map is what keeps this hint from claiming a precedence that
        // does not exist.
        expect(multilineOverriddenBy('enumChip')).toBeNull();
        expect(multilineOverriddenBy('progress')).toBeNull();
        expect(multilineOverriddenBy('not-a-renderer')).toBeNull();
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
