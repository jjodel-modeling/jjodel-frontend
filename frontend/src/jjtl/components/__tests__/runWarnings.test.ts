import { describe, it, expect } from 'vitest';
import { formatRunWarnings, MAX_LISTED_WARNINGS } from '../runWarnings';

// #520: the warnings of a run reach the Output panel, capped so that a run with many does not flood it.
describe('formatRunWarnings', () => {
    it('prints nothing for a run without warnings', () => {
        expect(formatRunWarnings([])).toEqual([]);
        expect(formatRunWarnings(undefined)).toEqual([]);
    });

    it('prints the count and every warning, in order, when under the cap', () => {
        const w = "Rule 'Attribute -> Column', binding 'nullable' at line 27, column 5: 'nullable' is not a feature of target class 'Column'; the value is not written to the model.";
        expect(formatRunWarnings([w, 'second'])).toEqual([
            '2 warning(s):',
            `Warning: ${w}`,
            'Warning: second',
        ]);
    });

    it('prints exactly the cap without an overflow line', () => {
        const ws = Array.from({ length: MAX_LISTED_WARNINGS }, (_, i) => `w${i}`);
        const lines = formatRunWarnings(ws);
        expect(lines).toHaveLength(MAX_LISTED_WARNINGS + 1);
        expect(lines[lines.length - 1]).toBe(`Warning: w${MAX_LISTED_WARNINGS - 1}`);
    });

    it('caps a long list and names how many more there are and where', () => {
        const ws = Array.from({ length: MAX_LISTED_WARNINGS + 7 }, (_, i) => `w${i}`);
        const lines = formatRunWarnings(ws);
        expect(lines[0]).toBe(`${MAX_LISTED_WARNINGS + 7} warning(s):`);
        expect(lines).toHaveLength(MAX_LISTED_WARNINGS + 2);
        expect(lines[MAX_LISTED_WARNINGS]).toBe(`Warning: w${MAX_LISTED_WARNINGS - 1}`);
        expect(lines[MAX_LISTED_WARNINGS + 1]).toBe('... and 7 more, listed in the Trace tab.');
    });

    it('honours a cap passed by the caller', () => {
        expect(formatRunWarnings(['a', 'b', 'c'], 1)).toEqual([
            '3 warning(s):',
            'Warning: a',
            '... and 2 more, listed in the Trace tab.',
        ]);
    });
});
