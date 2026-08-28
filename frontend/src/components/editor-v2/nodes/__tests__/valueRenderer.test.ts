/**
 * valueRenderer — the detection ladder of the instance node.
 *
 * The handoff's ladder is a priority order, so the tests walk it rung by rung
 * and, for each, check the two things that matter: that the rung fires when it
 * should, and that it does NOT fire on the case the handoff names as the reason
 * the rung sits where it does.
 */

import { describe, it, expect } from 'vitest';
import {
    detectColor,
    detectValueRenderer,
    isEmptySlot,
    isNamedColor,
    isSyntacticColor,
    toCssColor,
} from '../valueRenderer';

describe('isSyntacticColor', () => {
    it('accepts every unambiguous form', () => {
        expect(isSyntacticColor('#22c55e')).toBe(true);
        expect(isSyntacticColor('#fff')).toBe(true);
        expect(isSyntacticColor('#ff00aa80')).toBe(true);
        expect(isSyntacticColor('0xFF00AA')).toBe(true);
        expect(isSyntacticColor('rgb(34, 197, 94)')).toBe(true);
        expect(isSyntacticColor('rgba(34,197,94,0.5)')).toBe(true);
        expect(isSyntacticColor('oklch(0.7 0.15 150)')).toBe(true);
        expect(isSyntacticColor('hsl(140 60% 45%)')).toBe(true);
    });

    it('rejects strings that merely look colour-adjacent', () => {
        expect(isSyntacticColor('Green')).toBe(false);   // a name, not syntax
        expect(isSyntacticColor('#xyzxyz')).toBe(false);
        expect(isSyntacticColor('#12345')).toBe(false);  // no 5-digit hex
        expect(isSyntacticColor('12345')).toBe(false);
        expect(isSyntacticColor('')).toBe(false);
    });
});

describe('toCssColor', () => {
    it('rewrites 0xRRGGBB, the one accepted form CSS cannot read', () => {
        expect(toCssColor('0xFF00AA')).toBe('#FF00AA');
    });

    it('passes CSS forms through untouched', () => {
        expect(toCssColor('#22c55e')).toBe('#22c55e');
        expect(toCssColor('rgb(1,2,3)')).toBe('rgb(1,2,3)');
        expect(toCssColor('Green')).toBe('Green');
    });

    it('returns null for what the browser could not paint', () => {
        expect(toCssColor('Bananas')).toBeNull();
        expect(toCssColor('')).toBeNull();
    });
});

describe('isNamedColor', () => {
    it('ignores case, as CSS does', () => {
        expect(isNamedColor('Green')).toBe(true);
        expect(isNamedColor('REBECCAPURPLE')).toBe(true);
        expect(isNamedColor('  teal ')).toBe(true);
    });

    it('rejects non-colours', () => {
        expect(isNamedColor('Pending')).toBe(false);
        expect(isNamedColor('Large')).toBe(false);
    });
});

describe('isEmptySlot', () => {
    it('treats no values, a blank value and the placeholder dash as empty', () => {
        expect(isEmptySlot({ value: '' })).toBe(true);
        expect(isEmptySlot({ value: '   ' })).toBe(true);
        expect(isEmptySlot({ value: '—' })).toBe(true);          // jjomTransformers' empty reference
        expect(isEmptySlot({ value: '', values: [] })).toBe(true);
        expect(isEmptySlot({ value: 'x', values: ['', '  '] })).toBe(true);
    });

    it('does not treat falsy-looking data as empty', () => {
        expect(isEmptySlot({ value: '0' })).toBe(false);
        expect(isEmptySlot({ value: 'false' })).toBe(false);
        expect(isEmptySlot({ value: 'a', values: ['a'] })).toBe(false);
    });
});

describe('detectColor — rung 1, the metamodel declaration', () => {
    it('fires on a declared Color type, even for a literal with no RGB of its own', () => {
        const got = detectColor({ value: 'Green', typeName: 'Color' });
        expect(got?.swatch).toBe('Green');
        expect(got?.reason).toContain('metamodel');
    });

    it('yields nothing paintable — and so no swatch — when the declared value is not a colour', () => {
        expect(detectColor({ value: 'Bananas', typeName: 'Color' })).toBeNull();
    });
});

describe('detectColor — rung 2, the value parsed', () => {
    it('fires with no model knowledge at all', () => {
        const got = detectColor({ value: '#22c55e' });
        expect(got?.swatch).toBe('#22c55e');
        expect(got?.reason).toContain('syntax');
    });

    it('normalises 0xRRGGBB into something the swatch can paint', () => {
        expect(detectColor({ value: '0xFF00AA' })?.swatch).toBe('#FF00AA');
    });
});

describe('detectColor — rung 3, the enum whose every literal is a colour', () => {
    it('fires on the handoff\'s own worked example, Status { Green, Amber, Red }', () => {
        // `amber` is not a CSS keyword, which is why NON_CSS_COLOR_WORDS exists:
        // without it the rule's only stated example — and the traffic-light enum
        // the rule is most obviously for — would never get a swatch.
        const got = detectColor({
            value: 'Green',
            typeName: 'Status',
            enumLiteralNames: ['Green', 'Amber', 'Red'],
        });
        expect(got?.swatch).toBe('Green');
        expect(got?.reason).toContain('CSS colour enum');
    });

    it('paints the widened word with the colour it denotes, not with the word', () => {
        const got = detectColor({
            value: 'Amber',
            typeName: 'Status',
            enumLiteralNames: ['Green', 'Amber', 'Red'],
        });
        expect(got?.swatch).toBe('#f59e0b');
    });

    it('does NOT fire when one literal is not a colour — the whole-set test is the safety', () => {
        expect(detectColor({
            value: 'Green',
            typeName: 'Phase',
            enumLiteralNames: ['Green', 'Pending', 'Done'],
        })).toBeNull();
    });
});

describe('detectColor — rung 4, the name, only as a tie-break', () => {
    it('breaks the tie when the value already names a colour', () => {
        const got = detectColor({ value: 'Teal', featureName: 'background' });
        expect(got?.swatch).toBe('Teal');
        expect(got?.reason).toContain('tie-break');
    });

    it('is never a sole trigger: the CMYK integer on a Printer stays a scalar', () => {
        // The handoff's own counter-example. `color` is the most colour-ish name
        // there is, and it must not be enough on its own.
        expect(detectColor({ value: '42', featureName: 'color' })).toBeNull();
        expect(detectColor({ value: '0,0,0,100', featureName: 'color' })).toBeNull();
    });

    it('does not fire on a colour-named value under an unrelated attribute name', () => {
        // `Green` under `status` is a plain enum literal, not a colour: no rung
        // fires, because rung 3 needs the whole set and rung 4 needs the name.
        expect(detectColor({ value: 'Green', featureName: 'status' })).toBeNull();
    });
});

describe('detectValueRenderer', () => {
    it('settles emptiness before anything else', () => {
        expect(detectValueRenderer({ value: '', isReference: true }).kind).toBe('empty');
        expect(detectValueRenderer({ value: '—', isReference: true }).kind).toBe('empty');
    });

    it('reads a reference from the model, not from the value', () => {
        const d = detectValueRenderer({ value: 'Config', isReference: true });
        expect(d.kind).toBe('reference');
    });

    it('reads a collection from cardinality, and a declared many with one element is still a collection', () => {
        expect(detectValueRenderer({ value: 'a', values: ['a', 'b'] }).kind).toBe('collection');
        expect(detectValueRenderer({ value: 'Green', values: ['Green'], isMany: true }).kind).toBe('collection');
    });

    it('a single-valued slot that happens to hold one value is not a collection', () => {
        expect(detectValueRenderer({ value: 'Green', values: ['Green'] }).kind).toBe('scalar');
    });

    it('cardinality outranks the colour ladder: a colour list renders as chips', () => {
        const d = detectValueRenderer({
            value: 'Green',
            values: ['Green', 'Red'],
            typeName: 'Color',
        });
        expect(d.kind).toBe('collection');
    });

    it('paints the swatch of a scalar colour and says which rule decided', () => {
        const d = detectValueRenderer({ value: '#22c55e', values: ['#22c55e'], featureName: 'color' });
        expect(d.kind).toBe('color');
        expect(d.swatch).toBe('#22c55e');
        expect(d.reason).toContain('syntax');
    });

    it('falls back to scalar when no rung fires', () => {
        const d = detectValueRenderer({ value: 'Shape_0', featureName: 'label' });
        expect(d.kind).toBe('scalar');
    });
});
