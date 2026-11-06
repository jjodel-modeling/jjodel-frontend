import { describe, it, expect } from 'vitest';
import { jjscriptHast, jjscriptRuleFor, jjscriptStylesheet, type HastNode } from '../editor/jjscriptHighlight';

// The shape of the JjTL theme rules (jjtlTheme.ts imports the joiner barrel, which does not load
// under vitest), with the colours of four of them.
const RULES = [
    { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
    { token: 'keyword', foreground: '0ea5e9', fontStyle: 'bold' },
    { token: 'string', foreground: '10b981' },
    { token: 'operator', foreground: '64748b' },
    { token: 'operator.arrow', foreground: '0ea5e9', fontStyle: 'bold' },
    { token: '@brackets', foreground: '475569' },
];

function text(nodes: HastNode[]): string {
    return nodes.map(n => (n.type === 'text' ? n.value : n.children[0].value)).join('');
}

function classOf(nodes: HastNode[], value: string): string | undefined {
    const n = nodes.find(x => x.type === 'element' && x.children[0].value === value);
    return n && n.type === 'element' ? n.properties.className.join(' ') : undefined;
}

describe('jjscriptRuleFor', () => {
    it('strips the .jjscript postfix and takes the longest dot-segment prefix', () => {
        expect(jjscriptRuleFor('keyword.jjscript', RULES)?.token).toBe('keyword');
        expect(jjscriptRuleFor('operator.arrow.jjscript', RULES)?.token).toBe('operator.arrow');
        expect(jjscriptRuleFor('operator.jjscript', RULES)?.token).toBe('operator');
    });

    it('matches whole segments only, and never an @ rule', () => {
        expect(jjscriptRuleFor('keywords.jjscript', RULES)).toBeUndefined();
        expect(jjscriptRuleFor('white.jjscript', RULES)).toBeUndefined();
        expect(jjscriptRuleFor('', RULES)).toBeUndefined();
    });
});

describe('jjscriptStylesheet', () => {
    it('one entry per paintable rule, colour and font style', () => {
        const sheet = jjscriptStylesheet(RULES);
        expect(sheet['jjs-keyword']).toEqual({ color: '#0ea5e9', fontWeight: 'bold' });
        expect(sheet['jjs-comment']).toEqual({ color: '#94a3b8', fontStyle: 'italic' });
        expect(sheet['jjs-operator-arrow']).toEqual({ color: '#0ea5e9', fontWeight: 'bold' });
        expect(Object.keys(sheet).some(k => k.includes('@'))).toBe(false);
    });
});

describe('jjscriptHast', () => {
    const code = '// tag\ncreate class "A"\n';
    const tokens = [
        [{ offset: 0, type: 'comment.jjscript' }],
        [
            { offset: 0, type: 'keyword.jjscript' },
            { offset: 6, type: 'white.jjscript' },
            { offset: 7, type: 'keyword.jjscript' },
            { offset: 12, type: 'white.jjscript' },
            { offset: 13, type: 'string.jjscript' },
        ],
        [],
    ];

    it('keeps the text verbatim, newlines included', () => {
        expect(text(jjscriptHast(code, tokens, RULES))).toBe(code);
    });

    it('a keyword, a string and a comment each get the class of their rule', () => {
        const nodes = jjscriptHast(code, tokens, RULES);
        expect(classOf(nodes, 'create')).toBe('token jjs-keyword');
        expect(classOf(nodes, 'class')).toBe('token jjs-keyword');
        expect(classOf(nodes, '"A"')).toBe('token jjs-string');
        expect(classOf(nodes, '// tag')).toBe('token jjs-comment');
    });

    it('an unpainted token stays plain text', () => {
        const nodes = jjscriptHast(code, tokens, RULES);
        expect(nodes.filter(n => n.type === 'text' && n.value === ' ')).toHaveLength(2);
    });

    it('a line with no tokens, or text before the first offset, is kept as text', () => {
        expect(jjscriptHast('ab\ncd', [[{ offset: 1, type: 'keyword.jjscript' }]], RULES)).toEqual([
            { type: 'text', value: 'a' },
            { type: 'element', tagName: 'span', properties: { className: ['token', 'jjs-keyword'] }, children: [{ type: 'text', value: 'b' }] },
            { type: 'text', value: '\n' },
            { type: 'text', value: 'cd' },
        ]);
    });
});
