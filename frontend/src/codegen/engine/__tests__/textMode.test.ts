/**
 * Text mode in the engine (slice S5, P-2026-10-23-2030; R-GEN-25, R-GEN-26, discovery 2026-10-23 §2.3 T1 to T3).
 *
 * Every template saved before the `mode` field keeps its bytes (T1), its parse (T3) and its output (T2): the golden
 * hashes are the `code` of `generate(…, 'main')` on both gallery examples, measured on the base `26a267f18` (the code of `84b057765`) before any
 * change of this slice. Then a text body generates, and its literal origins are in body coordinates.
 * Mutations each test kills are in its name.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { parseTemplate } from '../../../jjel';
import { generate } from '../generate';
import { decodeTemplates, encodeTemplates, GEN_TEMPLATES_KEY } from '../templateCodec';
import { modeOf, parseTemplateBody } from '../templates';
import type { TemplateRecord } from '../templates';
import { EXAMPLES, loadExample, recordOf } from '../../oracle/__tests__/exampleFixture';

const GOLDEN: Record<(typeof EXAMPLES)[number], { length: number; sha256: string }> = {
    turnstile: { length: 26326, sha256: 'c8b904a0ececd96c4a8b2674ac3d21a46fe0d7d833ad002c1957e15b207896a3' },
    'petri-producer-consumer': { length: 25829, sha256: '25b4b5c6e6214dee74b49cf9f4b052e2608dcc711cd375fac1b6aebafdc8e6aa' },
};

const stored = (name: (typeof EXAMPLES)[number]) => {
    const ex = loadExample(name);
    return { ex, raw: ex.lookup[ex.metamodelId]._state[GEN_TEMPLATES_KEY] as string };
};

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

describe.each(EXAMPLES)('saved templates of %s keep bytes, parse and output', name => {
    it('T1 decodes and re-encodes byte-identical, no record gains a mode (mutant: encoder writes mode by default)', () => {
        const { raw } = stored(name);
        const decoded = decodeTemplates(raw);
        expect(decoded.defects).toEqual([]);
        expect(decoded.templates.every(t => !('mode' in t))).toBe(true);
        expect(encodeTemplates(decoded.templates)).toBe(raw);
    });

    it('T2 generates the golden code of the base (mutant: absence read as text)', () => {
        const { ex, raw } = stored(name);
        const out = generate(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, decodeTemplates(raw).templates, 'main');
        expect(out.errors).toEqual([]);
        expect({ length: out.code.length, sha256: sha(out.code) }).toEqual(GOLDEN[name]);
    });

    it('T3 parseTemplateBody with no mode deep-equals parseTemplate (mutant: default flipped to text)', () => {
        const { raw } = stored(name);
        for (const t of decodeTemplates(raw).templates) {
            expect(modeOf(t)).toBe('expression');
            expect(parseTemplateBody(t)).toEqual(parseTemplate(t.body));
            expect(parseTemplateBody({ ...t, mode: 'expression' })).toEqual(parseTemplate(t.body));
        }
    });
});

describe('the mode field in the codec', () => {
    const TEXT: TemplateRecord = { name: 'q', params: ['c'], body: 'SELECT "${c}"', mode: 'text', target: 'sql' };

    it('is written after body and before target, only when present', () => {
        expect(encodeTemplates([TEXT])).toBe('{"v":1,"templates":[{"name":"q","params":["c"],"body":"SELECT \\"${c}\\"","mode":"text","target":"sql"}]}');
        expect(decodeTemplates(encodeTemplates([TEXT])).templates).toEqual([TEXT]);
        expect(decodeTemplates(encodeTemplates([{ ...TEXT, mode: 'expression' }])).templates[0].mode).toBe('expression');
    });

    it('a mode that is neither text nor expression is a defect of that template only', () => {
        const raw = '{"v":1,"templates":[{"name":"a","params":[],"body":"x","mode":"TEXT"},{"name":"b","params":[],"body":"\\"y\\""}]}';
        const decoded = decodeTemplates(raw);
        expect(decoded.templates.map(t => t.name)).toEqual(['b']);
        expect(decoded.defects).toEqual([{ index: 0, name: 'a', message: 'a: the mode is neither text nor expression.' }]);
    });
});

describe('a text body generates', () => {
    const gen = (templates: TemplateRecord[], globals: Record<string, any> = {}) => generate(globals, {}, 'M', templates, 'main');

    it('quotes, backslashes and holes, with calls between modes', () => {
        const out = gen([
            { name: 'main', params: [], body: 'SELECT "${col("id")}" FROM t\\n;\n\\${x}', mode: 'text' },
            { name: 'col', params: ['c'], body: '"[" + c + "]"' },
        ]);
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('SELECT "[id]" FROM t\\n;\n${x}');
    });

    it('a parse error of a text body is at its own line and column', () => {
        const out = gen([{ name: 'main', params: [], body: 'one\ntwo\nabcd${)x}', mode: 'text' }]);
        expect(out.errors[0]).toMatchObject({ template: 'main', line: 3, column: 7, offset: 14 });
    });

    it('literal origins are in body coordinates, no quote to skip (mutant: +1 kept for a text root)', () => {
        const body = 'ab ${n}\n\\${cd';
        const out = gen([{ name: 'main', params: [], body, mode: 'text' }], { n: 1 });
        const lits = out.text.fragments.filter(f => f.kind === 'literal').map(f => [f.text, f.origin]);
        expect(lits).toEqual([
            ['ab ', { kind: 'literal', template: 'main', offset: 0, line: 1, column: 1 }],
            ['\n', { kind: 'literal', template: 'main', offset: 7, line: 1, column: 8 }],
            ['${cd', { kind: 'literal', template: 'main', offset: 8, line: 2, column: 1 }],
        ]);
    });
});
