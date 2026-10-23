/**
 * codeLines — the lines and spans of a generated text (slice S3, P-2026-10-23-2225), moved from CodePanel.tsx with
 * no test of its own there. Executed over `renderText` of a Text the engine builds, so the map is the real one.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { linesOf } from '../codeLines';
import { fragment, makeText, renderText } from '../../engine/text';
import type { Origin } from '../../engine/text';

const lit: Origin = { kind: 'literal', template: 'main', offset: 0, line: 1, column: 1 };
const model: Origin = { kind: 'model', elementId: 's2', feature: null, featureName: 'title', transformation: { name: 'main' } };
const error: Origin = { kind: 'error', template: 'main', offset: 0, line: 1, column: 1, message: 'boom' };

function render(parts: readonly [string, Origin][], indent: { id: number; prefix: string }[] = []) {
    return renderText(makeText(parts.map(([t, o]) => fragment(t, o, indent))));
}

describe('linesOf', () => {
    it('cuts each line at its map entries, in order (kills: pieces not split at entries; entries of another line taken)', () => {
        const { code, map } = render([['a ', lit], ['X', model], [' b\nc', lit]]);
        const lines = linesOf(code, map);
        expect(lines.map(l => l.map(p => p.text))).toEqual([['a ', 'X', ' b'], ['c']]);
        expect(lines[0][1].entry?.origin).toEqual(model);
    });

    it('a trailing newline adds no empty line (kills: last empty line kept)', () => {
        const { code, map } = render([['a\n', lit]]);
        expect(linesOf(code, map).length).toBe(1);
    });

    it('an empty code is one empty line (kills: the pop applied to a single line)', () => {
        expect(linesOf('', [])).toEqual([[]]);
    });

    it('a zero-width entry, an error fragment, writes nothing (kills: zero-width entries rendered)', () => {
        const { code, map } = render([['a', lit], ['', error], ['b', lit]]);
        expect(map.some(e => e.end === e.start)).toBe(true);
        const pieces = linesOf(code, map)[0];
        expect(pieces.map(p => p.text)).toEqual(['a', 'b']);
        expect(pieces.every(p => p.entry !== null)).toBe(true);
    });

    it('text not covered by an entry, an indentation prefix or a tail, is a plain piece (kills: uncovered prefix or tail dropped)', () => {
        const pieces = linesOf('  ab;', [{ line: 1, start: 2, end: 4, fragment: fragment('ab', lit), origin: lit }])[0];
        expect(pieces).toEqual([{ text: '  ', entry: null }, { text: 'ab', entry: expect.objectContaining({ start: 2 }) }, { text: ';', entry: null }]);
    });

    it('the text of the pieces is the line, character for character (kills: slice bounds off by one)', () => {
        const { code, map } = render([['if (', lit], ['locked', model], [') {\n\treturn ', lit], ['1', model], [';\n}', lit]]);
        expect(linesOf(code, map).map(l => l.map(p => p.text).join(''))).toEqual(code.split('\n'));
    });
});
