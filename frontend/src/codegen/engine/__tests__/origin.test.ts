/**
 * origin — the origin of every fragment (slice S2, P-2026-10-10-0945; spec §5, R-GEN-5, discovery §B.3, §B.4, U9, U10).
 *
 * One test per row of the §B.3 table, plus the owner of a read, the literal positions, the absent value and the
 * explicit null. Executed through `generate` (P11) over a synthetic record shaped like `buildEvalContext`'s (plain
 * handles carrying `id` and their features by name): `buildEvalContext` does not import under the node bench (the
 * joiner writes on `window`, measured in this lane), so the record is synthetic, as in guardContext.test.ts.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { generate } from '../generate';
import type { TemplateRecord } from '../templates';
import type { Origin, TextFragment } from '../text';

/** s2 (a State, `title` = 'unlocked State', `n` = 3) and t1 (a Transition, `label` = 'Coin', `next` = s2). */
function fixture() {
    const lookup: Record<string, any> = {
        MM: { className: 'DModel', id: 'MM', name: 'mm' },
        M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM' },
        s2: { className: 'DObject', id: 's2', name: 's2', father: 'M', features: ['v_s2_title', 'v_s2_n'] },
        t1: { className: 'DObject', id: 't1', name: 't1', father: 'M', features: ['v_t1_label', 'v_t1_next'] },
        v_s2_title: { className: 'DValue', id: 'v_s2_title', instanceof: 'A_title', values: ['unlocked State'], father: 's2' },
        v_s2_n: { className: 'DValue', id: 'v_s2_n', instanceof: 'A_n', values: [3], father: 's2' },
        v_t1_label: { className: 'DValue', id: 'v_t1_label', instanceof: 'A_label', values: ['Coin'], father: 't1' },
        v_t1_next: { className: 'DValue', id: 'v_t1_next', instanceof: 'R_next', values: ['s2'], father: 't1' },
        A_title: { className: 'DAttribute', id: 'A_title', name: 'title' },
        A_n: { className: 'DAttribute', id: 'A_n', name: 'n' },
        A_label: { className: 'DAttribute', id: 'A_label', name: 'label' },
        R_next: { className: 'DReference', id: 'R_next', name: 'next' },
    };
    const s = { id: 's2', __type: 'Object', name: 's2', title: 'unlocked State', n: 3 };
    const t = { id: 't1', __type: 'Object', name: 't1', label: 'Coin', next: s };
    return { lookup, globals: { instances: [s, t], s, t, n: null } as Record<string, any> };
}

const T = (body: string): TemplateRecord => ({ name: 'main', params: [], body });

function gen(body: string) {
    const { lookup, globals } = fixture();
    return generate(globals, lookup, 'M', [T(body)], 'main');
}

/** The one fragment that is not literal text. */
function holeFragment(body: string): TextFragment {
    const out = gen(body);
    expect(out.errors).toEqual([]);
    const frags = out.text.fragments.filter(f => f.kind !== 'literal');
    expect(frags).toHaveLength(1);
    return frags[0];
}

const TITLE = { elementId: 's2', feature: 'A_title', featureName: 'title' };
const LABEL = { elementId: 't1', feature: 'A_label', featureName: 'label' };

describe('§B.3 row 1, identity: a bare feature read', () => {
    it('carries (element id, feature id, identity) (mutant: the feature id not read from idlookup)', () => {
        const f = holeFragment('"${s.title}"');
        expect(f.text).toBe('unlocked State');
        expect(f.origin).toEqual({ kind: 'model', ...TITLE, transformation: { name: 'identity' } });
    });

    it('the dual form o.p() and a number feature are reads too', () => {
        expect(holeFragment('"${s.title()}"').origin).toEqual({ kind: 'model', ...TITLE, transformation: { name: 'identity' } });
        const f = holeFragment('"${s.n}"');
        expect([f.text, f.origin]).toEqual(['3', { kind: 'model', elementId: 's2', feature: 'A_n', featureName: 'n', transformation: { name: 'identity' } }]);
    });

    it('the element id is the owner of the feature read, not the receiver the navigation starts from (mutant: the receiver id)', () => {
        const f = holeFragment('"${t.next.title}"');
        expect(f.origin).toEqual({ kind: 'model', ...TITLE, transformation: { name: 'identity' } });
    });
});

describe('§B.3 row 2, character-aligned builtins: their name', () => {
    it.each([
        ['toUpper()', 'UNLOCKED STATE', 'toUpper'], ['toLower()', 'unlocked state', 'toLower'],
        ['capitalize()', 'Unlocked State', 'capitalize'], ['uncapitalize()', 'unlocked State', 'uncapitalize'],
        ['reverse()', 'etatS dekcolnu', 'reverse'], ['toUpper', 'UNLOCKED STATE', 'toUpper'], ['toUpperCase', 'UNLOCKED STATE', 'toUpper'],
    ])('s.title.%s (mutant: the transformation name dropped)', (call, text, name) => {
        const f = holeFragment('"${s.title.' + call + '}"');
        expect([f.text, f.origin]).toEqual([text, { kind: 'model', ...TITLE, transformation: { name } }]);
    });
});

describe('§B.3 row 3, sub-range builtins: their name and arguments', () => {
    it.each([
        ['trim()', 'trim', []], ['trimStart()', 'trimStart', []], ['trimEnd()', 'trimEnd', []], ['trim', 'trim', []],
        ['substring(0, 8)', 'substring', [0, 8]], ['slice(2)', 'slice', [2]], ['slice(-5)', 'slice', [-5]], ['charAt(0)', 'charAt', [0]],
    ])('s.title.%s (mutant: the arguments dropped)', (call, name, args) => {
        const f = holeFragment('"${s.title.' + call + '}"');
        expect(f.origin).toEqual({ kind: 'model', ...TITLE, transformation: { name, args } });
    });
});

describe('§B.3 row 4, lossy whole-value builtins: their name', () => {
    it.each([
        ['camelCase()', 'camelCase'], ['pascalCase()', 'pascalCase'], ['snakeCase()', 'snakeCase'], ['kebabCase()', 'kebabCase'],
        ['padStart(20, "*")', 'padStart'], ['padEnd(20)', 'padEnd'], ['quote()', 'quote'],
    ])('s.title.%s', (call, name) => {
        expect(holeFragment('"${s.title.' + call + '}"').origin).toEqual({ kind: 'model', ...TITLE, transformation: { name } });
    });
});

describe('§B.3 row 5, anything else: opaque, with the reads observed in the hole', () => {
    it.each([
        ['s.title.replace("u", "U")', [TITLE]], ['s.title.replaceAll("e", "E")', [TITLE]], ['s.title.repeat(2)', [TITLE]],
        ['s.title * 2', [TITLE]], ['s.title + t.label', [TITLE, LABEL]], ['s.title.substring(s.n)', [TITLE, { elementId: 's2', feature: 'A_n', featureName: 'n' }]],
        ['t.label + t.label', [LABEL]], ['"x"', []],
    ])('%s (mutant: the reads not recorded)', (expr, reads) => {
        expect(holeFragment('"${' + expr + '}"').origin).toEqual({ kind: 'opaque', reads });
    });
});

describe('§B.3 literal text: template name, offset, line and column', () => {
    it('each literal span carries its position in the template source, newlines and escapes included (mutant: offsets of the unescaped value)', () => {
        // source offsets: 0 '"', 1-2 '\\t', 3 'A', 4 newline, 5 'B', 6-7 '${', 8-14 's.title', 15 '}', 16 '!'.
        const out = gen('"\\tA\nB${s.title}!"');
        const lits = out.text.fragments.filter(f => f.kind === 'literal').map(f => [f.text, f.origin]);
        expect(lits).toEqual([
            ['\tA\n', { kind: 'literal', template: 'main', offset: 1, line: 1, column: 2 }],
            ['B', { kind: 'literal', template: 'main', offset: 5, line: 2, column: 1 }],
            ['!', { kind: 'literal', template: 'main', offset: 16, line: 2, column: 12 }],
        ]);
        expect(out.code).toBe('\tA\nBunlocked State!');
    });

    it('the literal text of a string nested in a hole has its own absolute position', () => {
        const out = gen('"[${[s].map(x => "<${x.title}>").join("")}]"');
        const lits = out.text.fragments.filter(f => f.kind === 'literal').map(f => [f.text, (f.origin as any).offset]);
        expect(lits).toEqual([['[', 1], ['<', 18], ['>', 29], [']', 42]]);
    });
});

describe('the absent value and the explicit null (U10)', () => {
    it('navigation on null is an error fragment at the hole\'s template position with the exception message; generation continues', () => {
        const out = gen('"a\n  ${t.missing.title} b ${s.title}"');
        expect(out.hasErrors).toBe(true);
        const err = out.text.fragments.find(f => f.kind === 'error')!;
        expect(err.origin).toEqual({ kind: 'error', template: 'main', offset: 7, line: 2, column: 5, message: "Cannot access property 'title' of null" });
        expect(out.errors).toEqual([{ template: 'main', offset: 7, line: 2, column: 5, message: "Cannot access property 'title' of null" }]);
        expect(out.code).toBe('a\n   b unlocked State');
    });

    it('an explicit null renders \'\' in interpolation and in a Text join, and is no error', () => {
        const out = gen('"<${n}>${["${s.title}", n, "z"].join(",")}"');
        expect(out.errors).toEqual([]);
        expect(out.hasErrors).toBe(false);
        expect(out.code).toBe('<>unlocked State,,z');
    });

    it('origins are kept through a Text join and a Text concatenation', () => {
        const out = gen('"${["${s.title}", "${t.label}"].join(", ") + "${t.label}"}"');
        const origins: Origin[] = out.text.fragments.filter(f => f.kind === 'model').map(f => f.origin);
        expect(origins.map(o => (o as any).elementId)).toEqual(['s2', 't1', 't1']);
        expect(out.code).toBe('unlocked State, CoinCoin');
    });
});
