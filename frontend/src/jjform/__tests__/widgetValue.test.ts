/**
 * widgetValue — the pure half of the extended widgets (FL3).
 *
 * No DOM, no React: everything here is a function of its arguments, which is what
 * the prompt asks of the validation half. The RENDERED half — the read/write
 * round-trip and the read-only variant — is exercised in
 * `components/editor-v2/viewpoint/ir/widgets/__tests__/extendedWidgets.test.ts`,
 * where the components are.
 */

import { describe, expect, it } from 'vitest';
import {
    checkEmail,
    checkUrl,
    controlClass,
    controlDecision,
    durationValueIn,
    formatDuration,
    isHexColor,
    normalizeHex,
    normalizeIsoDate,
    normalizeIsoDateTime,
    parseDuration,
} from '../widgetValue';

describe('checkEmail', () => {
    it('accepts an address with a local part, an @ and a dotted domain', () => {
        for (const v of ['a@b.co', 'alfonso.pierantonio@gmail.com', 'x+tag@sub.domain.org', 'UPPER@Example.COM']) {
            expect(checkEmail(v).status, v).toBe('valid');
        }
    });

    it('rejects the four mistakes a person actually makes', () => {
        const cases: [string, string][] = [
            ['nobody.example.com', 'the missing @'],
            ['@example.com', 'the missing local part'],
            ['a@example', 'the missing TLD'],
            ['a b@example.com', 'the stray space'],
        ];
        for (const [v, why] of cases) {
            expect(checkEmail(v).status, why).toBe('invalid');
            expect(checkEmail(v).reason, why).toBeTruthy();
        }
    });

    it('rejects a doubled @ and an empty domain label', () => {
        expect(checkEmail('a@@b.com').status).toBe('invalid');
        expect(checkEmail('a@b..com').status).toBe('invalid');
    });

    it('reports an empty field as empty and NOT as invalid', () => {
        // Whether a blank slot is a problem is the cardinality's answer, drawn by the
        // read side as `missingRequired`. A red cross here would be the form scolding
        // the user for something the metamodel allows.
        expect(checkEmail('').status).toBe('empty');
        expect(checkEmail('   ').status).toBe('empty');
        expect(checkEmail('').reason).toBeUndefined();
    });
});

describe('checkUrl', () => {
    it('accepts a URL with a scheme, and hands back the href verbatim', () => {
        const r = checkUrl('https://jjodel.io/docs?a=1#x');
        expect(r.status).toBe('valid');
        expect(r.href).toBe('https://jjodel.io/docs?a=1#x');
        expect(r.schemeAdded).toBeUndefined();
    });

    it('accepts a URL WITHOUT a scheme and completes the href with https', () => {
        const r = checkUrl('example.com/path');
        expect(r.status).toBe('valid');
        expect(r.href).toBe('https://example.com/path');
        expect(r.schemeAdded).toBe(true);
    });

    it('rejects a bare word: it is prose in a mistyped field, not a hostname', () => {
        expect(checkUrl('draft').status).toBe('invalid');
        expect(checkUrl('todo').status).toBe('invalid');
    });

    it('rejects spaces', () => {
        expect(checkUrl('not a url').status).toBe('invalid');
        expect(checkUrl('https://example.com/a b').status).toBe('invalid');
    });

    it('refuses to hand an href to a scheme that executes', () => {
        // The open-link affordance turns a value the MODEL holds into a navigation,
        // and a model travels between people. These stay visible and editable; what
        // they do not get is a button.
        for (const v of ['javascript:alert(1)', 'data:text/html,<script>x</script>', 'vbscript:x']) {
            const r = checkUrl(v);
            expect(r.status, v).toBe('invalid');
            expect(r.href, v).toBeUndefined();
        }
    });

    it('accepts the schemes a document legitimately carries', () => {
        expect(checkUrl('mailto:a@b.co').href).toBe('mailto:a@b.co');
        expect(checkUrl('ftp://files.example.com/x').status).toBe('valid');
    });

    it('reports an empty field as empty', () => {
        expect(checkUrl('').status).toBe('empty');
        expect(checkUrl('').href).toBeUndefined();
    });
});

describe('parseDuration', () => {
    it('parses the written forms', () => {
        expect(parseDuration('250ms')).toEqual({ amount: 250, unit: 'ms', ms: 250 });
        expect(parseDuration('2s')).toEqual({ amount: 2, unit: 's', ms: 2000 });
        expect(parseDuration('1.5 s')).toEqual({ amount: 1.5, unit: 's', ms: 1500 });
        expect(parseDuration('250 MS')).toEqual({ amount: 250, unit: 'ms', ms: 250 });
    });

    it('reads a bare number in the DECLARED unit, and refuses one without', () => {
        // The unit is a parameter and never an inference: the same rule the read side
        // obeys when it prints no unit for `durationSeconds`.
        expect(parseDuration('250', 'ms')).toEqual({ amount: 250, unit: 'ms', ms: 250 });
        expect(parseDuration('250')).toBeNull();
    });

    it('lets the written unit win over the declared one', () => {
        expect(parseDuration('2s', 'ms')).toEqual({ amount: 2, unit: 's', ms: 2000 });
    });

    it('returns null on garbage rather than a NaN', () => {
        for (const v of ['garbage', '', '  ', 'ms', '12x', '1.2.3', '2 minutes', '250m']) {
            expect(parseDuration(v, 'ms'), v).toBeNull();
        }
    });

    it('formats back to the written form', () => {
        expect(formatDuration({ amount: 250, unit: 'ms', ms: 250 })).toBe('250ms');
        expect(formatDuration({ amount: 2, unit: 's', ms: 2000 })).toBe('2s');
    });
});

describe('durationValueIn', () => {
    it('is what the slot stores: the number, in the declared unit', () => {
        expect(durationValueIn('250ms', 'ms')).toBe('250');
        expect(durationValueIn('2s', 'ms')).toBe('2000');
        expect(durationValueIn('250', 'ms')).toBe('250');
        expect(durationValueIn('1500ms', 's')).toBe('1.5');
    });

    it('does not print binary floating-point noise', () => {
        expect(durationValueIn('100ms', 's')).toBe('0.1');
        expect(durationValueIn('2500ms', 's')).toBe('2.5');
    });

    it('is null on garbage, which the widget reads as "snap back"', () => {
        expect(durationValueIn('garbage', 'ms')).toBeNull();
    });
});

describe('normalizeHex', () => {
    it('canonicalises every accepted spelling to one form', () => {
        expect(normalizeHex('#0AF')).toBe('#00aaff');
        expect(normalizeHex('0af')).toBe('#00aaff');
        expect(normalizeHex('#00AAFF')).toBe('#00aaff');
        expect(normalizeHex('00aaff')).toBe('#00aaff');
        expect(normalizeHex('0x00AAFF')).toBe('#00aaff');
        expect(normalizeHex('  #0ea5e9  ')).toBe('#0ea5e9');
    });

    it('doubles each nibble of the short forms, alpha included', () => {
        expect(normalizeHex('#0af8')).toBe('#00aaff88');
        expect(normalizeHex('#00AAFF88')).toBe('#00aaff88');
    });

    it('is null for what is not hex — which is NOT the same as "not a colour"', () => {
        // `Green` and `rgb(0,0,0)` are colours this function says nothing about: the
        // widget hands those to the read side's own toCssColor untouched.
        for (const v of ['', '  ', 'Green', 'rgb(0,0,0)', '#12345', 'zzz', '#00aaffff00']) {
            expect(normalizeHex(v), v).toBeNull();
        }
    });

    it('isHexColor answers the same question', () => {
        expect(isHexColor('#0af')).toBe(true);
        expect(isHexColor('Green')).toBe(false);
    });
});

describe('normalizeIsoDate / normalizeIsoDateTime', () => {
    it('reads the calendar fields verbatim, with no timezone shift', () => {
        // The read side spells out why: a plain ISO date parsed as UTC midnight
        // prints the day before west of Greenwich, and a model is a document.
        expect(normalizeIsoDate('2026-08-31')).toBe('2026-08-31');
        expect(normalizeIsoDate('2026-01-01')).toBe('2026-01-01');
        expect(normalizeIsoDate('2026-08-31T23:30')).toBe('2026-08-31');
    });

    it('rejects a hand-edited impossible date', () => {
        for (const v of ['2026-13-01', '2026-00-10', '2026-05-32', '2026-05-00', 'yesterday', '31/08/2026', '']) {
            expect(normalizeIsoDate(v), v).toBeNull();
        }
    });

    it('keeps date and minute, and drops seconds the control never offered', () => {
        expect(normalizeIsoDateTime('2026-08-31T14:30')).toBe('2026-08-31T14:30');
        expect(normalizeIsoDateTime('2026-08-31 14:30')).toBe('2026-08-31T14:30');
        expect(normalizeIsoDateTime('2026-08-31T14:30:45')).toBe('2026-08-31T14:30');
    });

    it('reads a bare date as that day at midnight', () => {
        expect(normalizeIsoDateTime('2026-08-31')).toBe('2026-08-31T00:00');
    });

    it('rejects an impossible clock', () => {
        expect(normalizeIsoDateTime('2026-08-31T24:00')).toBeNull();
        expect(normalizeIsoDateTime('2026-08-31T10:60')).toBeNull();
    });
});

describe('controlDecision', () => {
    it('read-only is the one that decides interactivity', () => {
        expect(controlDecision({}).interactive).toBe(true);
        expect(controlDecision({ invalid: true }).interactive).toBe(true);
        expect(controlDecision({ readOnly: true }).interactive).toBe(false);
        expect(controlDecision({ readOnly: true, invalid: true }).interactive).toBe(false);
    });

    it('read-only and invalid are orthogonal, not ranked', () => {
        // A derived slot can hold a non-conforming value, and irFormStyle already
        // draws that pair: `.ir-field--error .ir-field__readonly` has the red border.
        expect(controlDecision({ readOnly: true, invalid: true }).modifiers).toEqual(['readonly', 'invalid']);
    });

    it('orders the modifiers stably, so two renders of one state agree', () => {
        expect(controlDecision({ invalid: true, readOnly: true }).modifiers)
            .toEqual(controlDecision({ readOnly: true, invalid: true }).modifiers);
    });
});

describe('controlClass', () => {
    it('builds block plus one modifier class each', () => {
        expect(controlClass('ir-datefield', controlDecision({}))).toBe('ir-datefield');
        expect(controlClass('ir-datefield', controlDecision({ readOnly: true })))
            .toBe('ir-datefield ir-datefield--readonly');
        expect(controlClass('ir-chipinput', controlDecision({ readOnly: true, invalid: true }), 'ir-chipinput--ref'))
            .toBe('ir-chipinput ir-chipinput--readonly ir-chipinput--invalid ir-chipinput--ref');
    });
});
