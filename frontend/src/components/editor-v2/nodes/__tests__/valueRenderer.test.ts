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
    absoluteDate,
    detectColor,
    detectValueRenderer,
    isEmptySlot,
    isNamedColor,
    isSyntacticColor,
    parseBoolean,
    relativeAge,
    toCssColor,
    traceLadder,
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


describe('detectValueRenderer — what the model settles', () => {
    it('settles emptiness before anything else', () => {
        expect(detectValueRenderer({ value: '', isReference: true }).kind).toBe('dash');
        expect(detectValueRenderer({ value: '—', isReference: true }).kind).toBe('dash');
    });

    it('a broken reference outranks emptiness: losing a target is not the same fact as never having one', () => {
        expect(detectValueRenderer({ value: '', isReference: true, isBroken: true }).kind).toBe('brokenRef');
    });

    it('reads a reference from the model, not from the value', () => {
        expect(detectValueRenderer({ value: 'Config', isReference: true }).kind).toBe('refPill');
    });

    it('reads a collection from cardinality, and a declared many with one element is still a collection', () => {
        expect(detectValueRenderer({ value: 'a', values: ['a', 'b'] }).kind).toBe('collection');
        expect(detectValueRenderer({ value: 'Green', values: ['Green'], isMany: true }).kind).toBe('collection');
    });

    it('a single-valued slot that happens to hold one value is not a collection', () => {
        expect(detectValueRenderer({ value: 'Green', values: ['Green'] }).kind).toBe('truncatedText');
    });

    it('cardinality outranks the colour ladder: a colour list renders as chips', () => {
        const d = detectValueRenderer({ value: 'Green', values: ['Green', 'Red'], typeName: 'Color' });
        expect(d.kind).toBe('collection');
    });

    it('paints the swatch of a scalar colour and says which rule decided', () => {
        const d = detectValueRenderer({ value: '#22c55e', values: ['#22c55e'], featureName: 'color' });
        expect(d.kind).toBe('swatch');
        expect(d.swatch).toBe('#22c55e');
        expect(d.reason).toContain('syntax');
    });

    it('falls back to the text renderer when no rung fires', () => {
        expect(detectValueRenderer({ value: 'Shape_0', featureName: 'label' }).kind).toBe('truncatedText');
    });

    it('an enumeration whose literals are not colours renders as a chip', () => {
        const d = detectValueRenderer({
            value: 'DASHED', typeName: 'Stroke',
            enumLiteralNames: ['SOLID', 'DASHED', 'DOTTED'],
        });
        expect(d.kind).toBe('enumChip');
    });

    it('an enumeration whose literals are ALL colours takes the swatch instead', () => {
        const d = detectValueRenderer({
            value: 'Green', typeName: 'Palette',
            enumLiteralNames: ['Red', 'Green', 'Blue'],
        });
        expect(d.kind).toBe('swatch');
    });
});

describe('detectValueRenderer — the typed renderers', () => {
    it('EBoolean renders as a boolean, with the parsed value', () => {
        expect(detectValueRenderer({ value: 'true', typeName: 'EBoolean' }))
            .toMatchObject({ kind: 'boolean', boolValue: true });
        expect(detectValueRenderer({ value: 'false', typeName: 'EBoolean' }))
            .toMatchObject({ kind: 'boolean', boolValue: false });
    });

    it('an EBoolean holding neither true nor false stays text rather than claiming false', () => {
        expect(detectValueRenderer({ value: 'maybe', typeName: 'EBoolean' }).kind).toBe('truncatedText');
    });

    it('EDate renders as a date, absolute half first', () => {
        const d = detectValueRenderer({ value: '2026-08-28', typeName: 'EDate' });
        expect(d.kind).toBe('date');
        expect(d.dateIso).toBe('2026-08-28');
    });

    it('a numeric type with no unit annotation shows NO unit', () => {
        // The acceptance criterion, stated as a test: naming the attribute after
        // a unit must change nothing. Only `jjodel/unit=` puts a unit on a row.
        const named = detectValueRenderer({ value: '240', typeName: 'EInt', featureName: 'widthPx' });
        expect(named.kind).toBe('numberUnit');
        expect(named.unit).toBeUndefined();

        const declared = detectValueRenderer({ value: '240', typeName: 'EInt', featureName: 'width', unit: 'px' });
        expect(declared.unit).toBe('px');
    });

    it('a numeric type with BOTH bounds renders progress, and the ratio is the position between them', () => {
        const d = detectValueRenderer({ value: '0.68', typeName: 'EDouble', min: 0, max: 1 });
        expect(d.kind).toBe('progress');
        expect(d.ratio).toBeCloseTo(0.68, 5);
    });

    it('removing either bound falls back to numberUnit, with nothing else changed', () => {
        const both = detectValueRenderer({ value: '5', typeName: 'EInt', min: 0, max: 10, unit: 'kg' });
        const noMax = detectValueRenderer({ value: '5', typeName: 'EInt', min: 0, unit: 'kg' });
        const noMin = detectValueRenderer({ value: '5', typeName: 'EInt', max: 10, unit: 'kg' });
        expect(both.kind).toBe('progress');
        expect(noMax.kind).toBe('numberUnit');
        expect(noMin.kind).toBe('numberUnit');
        // The unit rides along either way: the fallback changes the renderer and
        // nothing else about how the value reads.
        expect(noMax.unit).toBe('kg');
        expect(noMin.unit).toBe('kg');
    });

    it('degenerate bounds fall back too rather than dividing by zero', () => {
        expect(detectValueRenderer({ value: '5', typeName: 'EInt', min: 3, max: 3 }).kind).toBe('numberUnit');
    });

    it('the ratio is clamped, so a value outside its declared range still paints', () => {
        expect(detectValueRenderer({ value: '99', typeName: 'EInt', min: 0, max: 10 }).ratio).toBe(1);
        expect(detectValueRenderer({ value: '-5', typeName: 'EInt', min: 0, max: 10 }).ratio).toBe(0);
    });

    it('a declared type outranks a value that merely looks like something else', () => {
        // `0xFF00AA` is a colour by rule 2, but in an EInt it is a number written
        // in hex. Only a rule-1 declaration may say otherwise.
        expect(detectValueRenderer({ value: '0xFF00AA', typeName: 'EInt' }).kind).toBe('numberUnit');
    });
});

describe('detectValueRenderer — the rule-1 override', () => {
    it('a declared renderer wins outright', () => {
        const d = detectValueRenderer({ value: 'self.width > 0', typeName: 'EString', rendererOverride: 'code' });
        expect(d.kind).toBe('code');
    });

    it('the override beats the declared type, which is what makes it an override', () => {
        expect(detectValueRenderer({ value: '3', typeName: 'EInt', rendererOverride: 'truncatedText' }).kind)
            .toBe('truncatedText');
    });

    it('a declared renderer whose value cannot support it degrades instead of drawing a lie', () => {
        // Declaring `swatch` on `Bananas` yields no paintable colour, and the
        // handoff is explicit that the swatch never replaces the text — so the
        // value stays readable rather than becoming a blank chip.
        expect(detectValueRenderer({ value: 'Bananas', rendererOverride: 'swatch' }).kind).toBe('truncatedText');
    });

    it('an unknown renderer name is ignored rather than blanking the row', () => {
        expect(detectValueRenderer({ value: 'Shape_0', rendererOverride: 'hologram' }).kind).toBe('truncatedText');
    });

    it('brokenness and cardinality still outrank it: they are facts, not inferences', () => {
        expect(detectValueRenderer({ value: 'x', isBroken: true, rendererOverride: 'code' }).kind).toBe('brokenRef');
        expect(detectValueRenderer({ value: 'a', values: ['a', 'b'], rendererOverride: 'code' }).kind).toBe('collection');
    });
});

describe('traceLadder — the whole ladder, not the outcome', () => {
    const colourEnum = {
        value: 'Green',
        typeName: 'Palette',
        featureName: 'color',
        enumLiteralNames: ['Red', 'Green', 'Blue'],
    };

    it('reports four rungs, always', () => {
        expect(traceLadder(colourEnum).rungs).toHaveLength(4);
        expect(traceLadder({ value: '' }).rungs).toHaveLength(4);
    });

    it('the handoff worked example: rung 3 wins and rung 4 is never evaluated', () => {
        const t = traceLadder(colourEnum);
        expect(t.winner).toBe(3);
        expect(t.rungs[0].status).toBe('not-fired');
        expect(t.rungs[1].status).toBe('not-fired');
        expect(t.rungs[2].status).toBe('fired');
        expect(t.rungs[3].status).toBe('not-evaluated');
    });

    it('a discarded rung states WHY it did not fire, which is what makes rule 4 safe to keep', () => {
        const t = traceLadder(colourEnum);
        expect(t.rungs[0].evidence).toContain('nessuna annotazione');
        expect(t.rungs[1].evidence).toContain('non è un colore letterale');
    });

    it('the winning rung states its evidence, not just its verdict', () => {
        const t = traceLadder(colourEnum);
        // «all 3 literals of Palette are CSS colour names: Red, Green, Blue»
        expect(t.rungs[2].evidence).toContain('3');
        expect(t.rungs[2].evidence).toContain('Palette');
        expect(t.rungs[2].evidence).toContain('Red, Green, Blue');
    });

    it('an unreached rung carries no evidence: inventing one is the failure this panel prevents', () => {
        const t = traceLadder(colourEnum);
        expect(t.rungs[3].evidence).toBe('');
    });

    it('a rule-1 override stops the ladder at rung 1', () => {
        const t = traceLadder({ ...colourEnum, rendererOverride: 'enumChip' });
        expect(t.winner).toBe(1);
        expect(t.rungs[0].evidence).toContain('jjodel/renderer=enumChip');
        expect(t.rungs[1].status).toBe('not-evaluated');
        expect(t.rungs[2].status).toBe('not-evaluated');
        expect(t.rungs[3].status).toBe('not-evaluated');
    });

    it('rung 3 names the literal that disqualified the set', () => {
        const t = traceLadder({ value: 'Green', typeName: 'Status', enumLiteralNames: ['Green', 'Pending'] });
        expect(t.rungs[2].status).toBe('not-fired');
        expect(t.rungs[2].evidence).toContain('Pending');
    });

    it('with no rung firing every one of the four is reported as asked and answered', () => {
        const t = traceLadder({ value: 'Shape_0', featureName: 'label' });
        expect(t.winner).toBeNull();
        expect(t.rungs.every(r => r.status === 'not-fired')).toBe(true);
    });
});

describe('boolean, date and age helpers', () => {
    it('parses the words and the digits, and nothing else', () => {
        expect(parseBoolean('TRUE')).toBe(true);
        expect(parseBoolean('0')).toBe(false);
        expect(parseBoolean('maybe')).toBeNull();
    });

    it('an ISO date is read from its own calendar fields, not through a timezone', () => {
        // `new Date('2026-08-28')` is UTC midnight; formatting it back west of
        // Greenwich prints the 27th. A model is a document, and a document must
        // not change date when opened in another office.
        expect(absoluteDate('2026-08-28')).toBe('2026-08-28');
        expect(absoluteDate('2026-08-28T23:30:00Z')).toBe('2026-08-28');
        expect(absoluteDate('not a date')).toBeNull();
    });

    it('the age is coarse, and it is only ever the suffix', () => {
        const now = Date.parse('2026-08-28T20:00:00Z');
        expect(relativeAge('2026-08-28T01:00:00Z', now)).toBe('19h');
        expect(relativeAge('2026-08-25T20:00:00Z', now)).toBe('3g');
        expect(relativeAge('2026-06-28T20:00:00Z', now)).toBe('2 mesi');
        expect(relativeAge('2025-06-28T20:00:00Z', now)).toBe('1 anno');
        expect(relativeAge('not a date', now)).toBeNull();
    });
});
