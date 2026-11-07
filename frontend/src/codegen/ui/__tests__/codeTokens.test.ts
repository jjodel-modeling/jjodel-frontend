/**
 * codeTokens — syntax colouring of the generated text (P-2026-10-24-1516). Executed without Monaco: the tokens are
 * data in the shape `monaco.editor.tokenize` returns (`{ offset, type }` per line, types like `keyword.js`); the
 * real tokenizer is exercised by the probe (scripts/probe/codegen-generator-tab.ts).
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { colourLines, languageOf, tokenClass, tokenStyles } from '../codeTokens';
import type { LineToken } from '../codeTokens';
import { linesOf } from '../codeLines';
import { fragment, makeText, renderText } from '../../engine/text';
import type { Origin } from '../../engine/text';
import { generateGenerator } from '../../engine/generateFiles';
import { readModelGenerators } from '../../engine/generatorCodec';
import { loadExample, recordOf } from '../../oracle/__tests__/exampleFixture';

const lit: Origin = { kind: 'literal', template: 'main', offset: 0, line: 1, column: 1 };
const model: Origin = { kind: 'model', elementId: 's2', feature: null, featureName: 'title', transformation: { name: 'main' } };

const JS_KEYWORDS = new Set(['const', 'let', 'function', 'return', 'if', 'else', 'new', 'export', 'for', 'of']);

/** A stand-in for Monaco's javascript tokenizer: words, strings, numbers and delimiters, typed as Monaco types them. */
function stubTokenize(code: string): LineToken[][] {
    return code.split('\n').map(line => {
        const out: LineToken[] = [];
        const re = /(\s+)|('[^']*'|"[^"]*")|(\d+)|([A-Za-z_$][\w$]*)|(.)/g;
        for (let m = re.exec(line); m; m = re.exec(line)) {
            const type = m[1] ? '' : m[2] ? 'string.js' : m[3] ? 'number.js' : m[4] ? (JS_KEYWORDS.has(m[4]) ? 'keyword.js' : 'identifier.js') : 'delimiter.js';
            out.push({ offset: m.index, type });
        }
        return out;
    });
}

describe('colourLines', () => {
    it('a piece split at a token boundary keeps its provenance entry on both halves (kills: entry dropped on the second half)', () => {
        const { code, map } = renderText(makeText([fragment('x = ', lit, []), fragment("'on'+1", model, [])]));
        const lines = colourLines(linesOf(code, map), stubTokenize(code));
        const halves = lines[0].filter(p => p.entry?.origin === model);
        expect(halves.map(p => [p.text, p.token])).toEqual([["'on'", 'string'], ['+', 'delimiter'], ['1', 'number']]);
        expect(lines[0].map(p => p.text).join('')).toBe(code);
    });

    it('a token spanning two pieces colours both, each with its own entry (kills: class taken only at a token start)', () => {
        const { code, map } = renderText(makeText([fragment('con', lit, []), fragment('st', model, [])]));
        const [line] = colourLines(linesOf(code, map), [[{ offset: 0, type: 'keyword.js' }]]);
        expect(line.map(p => [p.text, p.token, p.entry?.origin])).toEqual([['con', 'keyword', lit], ['st', 'keyword', model]]);
    });

    it('the turnstile default output has keyword pieces on const and function (kills: map empty)', () => {
        const ex = loadExample('turnstile');
        const def = readModelGenerators(ex.lookup, ex.modelId).generators[0];
        const { code, map } = generateGenerator(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, def).files[0].result;
        const pieces = colourLines(linesOf(code, map), stubTokenize(code)).flat();
        for (const word of ['const', 'function']) {
            expect(pieces.some(p => p.text === word && p.token === 'keyword'), word).toBe(true);
        }
    });

    it('a line with no tokens stays uncoloured and whole (kills: tokens of another line applied)', () => {
        const { code, map } = renderText(makeText([fragment('a\nb', lit, [])]));
        const lines = colourLines(linesOf(code, map), [[{ offset: 0, type: 'keyword.js' }]]);
        expect(lines[1]).toEqual([{ text: 'b', entry: lines[1][0].entry, token: null }]);
    });
});

describe('languageOf', () => {
    const registered = ['javascript', 'typescript', 'systemverilog', 'json', 'python'];

    it('an unknown extension yields no language, so no classes (kills: javascript assumed)', () => {
        expect(languageOf('out.txt', registered)).toBeNull();
        expect(languageOf('Makefile', registered)).toBeNull();
        expect(languageOf('dir.js/README', registered)).toBeNull();
    });

    it('maps the extension to a registered id, the first registered candidate for .v (kills: candidates not filtered by registration)', () => {
        expect(languageOf('main.js', registered)).toBe('javascript');
        expect(languageOf('top.v', registered)).toBe('systemverilog');
        expect(languageOf('top.v', [...registered, 'verilog'])).toBe('verilog');
        expect(languageOf('page.html', registered)).toBeNull();
    });
});

describe('tokenClass and tokenStyles', () => {
    it('classes by the first segment of the type (kills: whole type matched)', () => {
        expect(tokenClass('type.identifier.ts')).toBe('type');
        expect(tokenClass('string.key.json')).toBe('string');
        expect(tokenClass('delimiter.bracket.js')).toBe('delimiter');
        expect(tokenClass('')).toBeNull();
    });

    it('reads each class from the theme, falling back to the first rule under it (kills: fallback rule ignored)', () => {
        const styles = tokenStyles([
            { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
            { token: 'keyword', foreground: '0ea5e9', fontStyle: 'bold' },
            { token: 'type.identifier', foreground: '8b5cf6' },
        ]);
        expect(styles.comment).toEqual({ color: '#94a3b8', fontStyle: 'italic' });
        expect(styles.keyword).toEqual({ color: '#0ea5e9', fontWeight: 'bold' });
        expect(styles.type).toEqual({ color: '#8b5cf6' });
        expect(styles.string).toEqual({});
    });
});
