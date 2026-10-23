import { describe, expect, it } from 'vitest';
import { WITH_REFUSED, templateMarkers } from '../templateMarkers';

describe('templateMarkers: parse errors at their line and column of the body', () => {
    it('a body that parses has no marker', () => {
        expect(templateMarkers('"class ${c.name} {\n}"')).toEqual([]);
    });

    it('an error on the second line is on line 2 (mutant: line off by one)', () => {
        const [m, ...rest] = templateMarkers('"a\n  ${x.}"');
        expect(rest).toEqual([]);
        expect(m).toEqual({ startLineNumber: 2, startColumn: 7, endLineNumber: 2, endColumn: 8, message: "Expected property name after '.'" });
    });

    it('an error inside a hole is at its column of the body, not at the hole (mutant: column of the hole)', () => {
        // line 2 is `  ${ "q${y.}" }"`: the hole opens at column 3, the nested hole at 8, the error is the `}` at 12.
        const [m] = templateMarkers('"a\n  ${ "q${y.}" }"');
        expect([m.startLineNumber, m.startColumn, m.endColumn]).toEqual([2, 12, 13]);
    });

    it('an unterminated string is marked where the lexer stops', () => {
        expect(templateMarkers('"abc').map(m => [m.startLineNumber, m.startColumn, m.message])).toEqual([[1, 4, 'Unterminated string']]);
    });

    it('a `with … do` is refused at its position, as the engine refuses it', () => {
        const markers = templateMarkers('"x"\n + (with s do name)');
        expect(markers.map(m => m.message)).toEqual([WITH_REFUSED]);
        expect(markers[0].startLineNumber).toBe(2);
    });
});
