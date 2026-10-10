/**
 * text — the Text value and its rendering (slice S2, P-2026-10-10-0945; spec §4, §5, R-GEN-5).
 *
 * Executes `makeText`, `isText` and `renderText` on hand-built fragments (P11): what the code panel (S5) and the
 * runtime errors (S4) read is `renderText(...).map`, so the map is asserted line by line, column by column.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { fragment, isText, makeText, renderText, textErrors } from '../text';
import type { Origin } from '../text';

const lit = (offset: number): Origin => ({ kind: 'literal', template: 'main', offset, line: 1, column: offset + 1 });
const model: Origin = { kind: 'model', elementId: 's2', feature: 'A_title', featureName: 'title', transformation: { name: 'identity' } };

describe('the Text value', () => {
    it('is frozen, fragments and origins included, and only a Text the module built is one (mutant: a look-alike accepted)', () => {
        const t = makeText([fragment('a', lit(1))]);
        expect(isText(t)).toBe(true);
        expect(Object.isFrozen(t)).toBe(true);
        expect(Object.isFrozen(t.fragments)).toBe(true);
        expect(Object.isFrozen(t.fragments[0])).toBe(true);
        expect(t.__type).toBe('Text');
        expect(isText({ __type: 'Text', fragments: [] })).toBe(false);
        expect(isText('a')).toBe(false);
        expect(isText(null)).toBe(false);
    });

    it('a fragment\'s kind is its origin\'s', () => {
        expect(fragment('x', model).kind).toBe('model');
        expect(fragment('', { kind: 'error', template: 'main', offset: 3, line: 1, column: 4, message: 'boom' }).kind).toBe('error');
    });
});

describe('renderText: code and map', () => {
    it('the code is the fragments in order, with no indentation level', () => {
        const t = makeText([fragment('let ', lit(1)), fragment('Unlocked', model), fragment(';\n', lit(13))]);
        expect(renderText(t).code).toBe('let Unlocked;\n');
    });

    it('maps each output line and column range to its fragment and origin, 1-based lines, 0-based half-open columns (mutant: a column off by one)', () => {
        const a = fragment('let ', lit(1));
        const b = fragment('Unlocked', model);
        const c = fragment(';\nend', lit(13));
        const { map } = renderText(makeText([a, b, c]));
        expect(map.map(e => [e.line, e.start, e.end, e.fragment, e.origin])).toEqual([
            [1, 0, 4, a, a.origin],
            [1, 4, 12, b, model],
            [1, 12, 13, c, c.origin],
            [2, 0, 3, c, c.origin],
        ]);
    });

    it('an error fragment writes nothing and has a zero-width entry where it stands; textErrors lists it (mutant: errors dropped from the map)', () => {
        const err: Origin = { kind: 'error', template: 'main', offset: 5, line: 1, column: 6, message: "Cannot access property 'x' of null" };
        const { code, map } = renderText(makeText([fragment('ab', lit(1)), fragment('', err), fragment('cd', lit(9))]));
        expect(code).toBe('abcd');
        expect(map.filter(e => e.origin.kind === 'error').map(e => [e.line, e.start, e.end])).toEqual([[1, 2, 2]]);
        expect(textErrors(makeText([fragment('', err)]))).toEqual([err]);
    });

    it('an indentation prefix is written and mapped to no fragment: the columns after it shift (mutant: the prefix mapped to the fragment)', () => {
        const level = { id: 1, prefix: '    ' };
        const f = fragment('a\nb', model, [level]);
        const { code, map } = renderText(makeText([f]));
        expect(code).toBe('a\n    b');
        expect(map.map(e => [e.line, e.start, e.end])).toEqual([[1, 0, 1], [2, 4, 5]]);
    });
});
