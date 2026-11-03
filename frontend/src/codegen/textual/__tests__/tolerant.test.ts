/**
 * Step A of the textual IDE, parser half (P-2026-11-03-2120; R-TXT-21 (1), (8), R-TXT-22; the design of
 * docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md): tokens with trivia, the lossless tree, recovery,
 * two-tier diagnostics, linear resolution, the display-only match of a broken parse.
 */

import { describe, it, expect } from 'vitest';
import { tokenizeText } from '../parser';
import { grammarOf } from './corpus';
import { FIXTURE } from './spec';
import { mutantsOf, tolerantCases } from './tolerantCorpus';

const CASES = tolerantCases();

describe('(i) tokens keep their trivia', () => {
    it.each(CASES.map(c => [c.name, c] as const))('%s: on every mutant the tokens and their trivia are the text, byte for byte', (_, c) => {
        const { text, mutants } = mutantsOf(c);
        for (const t of [text, ...mutants.map(m => m.text)]) {
            const { tokens } = tokenizeText(t, c.g);
            expect(tokens.map(k => k.leading + k.raw + k.trailing).join('')).toBe(t);
        }
    });

    it('trailing trivia runs to the end of its line; the rest is leading trivia of the next token; EOF carries the final trivia', () => {
        const text = '// head\nPart a { // same line\n  /* own */ size 1\n  kind FAST /* x */ peers [a]\n}\n\n// tail\n';
        const { tokens, errors } = tokenizeText(text, grammarOf(FIXTURE));
        expect(errors).toEqual([]);
        const at = (raw: string) => tokens.find(t => t.raw === raw)!;
        expect(at('Part').leading).toBe('// head\n');
        expect(at('{').trailing).toBe(' // same line\n');
        expect(at('size').leading).toBe('  /* own */ ');
        expect(at('FAST').trailing).toBe('');
        expect(at('peers').leading).toBe(' /* x */ ');
        expect(at('}').trailing).toBe('\n');
        const eof = tokens[tokens.length - 1];
        expect([eof.k, eof.raw, eof.leading, eof.trailing]).toEqual(['EOF', '', '\n// tail\n', '']);
    });

    it('a stray character and an unterminated comment stay in the trivia, with their errors', () => {
        const g = grammarOf(FIXTURE);
        for (const text of ['Part a { § }', 'Part a {} /* open', 'Part "a {\n}']) {
            const { tokens, errors } = tokenizeText(text, g);
            expect(errors.length).toBe(1);
            expect(tokens.map(k => k.leading + k.raw + k.trailing).join('')).toBe(text);
        }
    });
});
