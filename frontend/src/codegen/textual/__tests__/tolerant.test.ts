/**
 * Step A of the textual IDE, parser half (P-2026-11-03-2120; R-TXT-21 (1), (8), R-TXT-22; the design of
 * docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md): tokens with trivia, the lossless tree, recovery,
 * two-tier diagnostics, linear resolution, the display-only match of a broken parse.
 */

import { describe, it, expect } from 'vitest';
import { commentsOf, parseText, tokenizeText } from '../parser';
import type { ObjectNode, SyntaxElement, SyntaxNode, SyntaxToken, TextNode } from '../parser';
import { grammarOf } from './corpus';
import { FIXTURE } from './spec';
import { mutantsOf, tolerantCases } from './tolerantCorpus';

const CASES = tolerantCases();

const leavesOf = (n: SyntaxNode): SyntaxToken[] => n.children.flatMap((c: SyntaxElement) => (c.kind === 'token' ? [c] : leavesOf(c)));
const nodesOf = (n: SyntaxNode): SyntaxNode[] => [n, ...n.children.flatMap((c: SyntaxElement) => (c.kind === 'token' ? [] : nodesOf(c)))];
const objectNodes = (n: SyntaxNode): ObjectNode[] => nodesOf(n).filter((x): x is ObjectNode => x.kind === 'object');
const treeOf = (text: string, g = grammarOf(FIXTURE)): TextNode => parseText(text, g).tree!;

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

describe('(ii) the lossless tree', () => {
    it.each(CASES.map(c => [c.name, c] as const))('%s: on every mutant the tree holds every token once, in order; objects and spans are its object nodes', (_, c) => {
        const { text, mutants } = mutantsOf(c);
        for (const t of [text, ...mutants.map(m => m.text)]) {
            const r = parseText(t, c.g);
            const tree = r.tree!;
            const leaves = leavesOf(tree);
            expect(leaves.length).toBe(tree.tokens.length);
            leaves.forEach((k, i) => expect(k).toBe(tree.tokens[i]));
            expect(leaves.map(k => k.leading + k.raw + k.trailing).join('')).toBe(t);
            const objs = objectNodes(tree);
            expect(objs.map(n => n.id)).toEqual(r.objects.map(o => o.id));
            expect(objs.map(n => ({ id: n.id, start: n.start, end: n.end }))).toEqual(r.spans);
            for (const n of nodesOf(tree)) for (const k of n.children) if (k.start < k.end) expect(k.start >= n.start && k.end <= n.end).toBe(true);
        }
    });

    it('every token read has its role; a reference token is in a reference node with what it names', () => {
        const tree = treeOf('Part a {\n  size 1\n  kind FAST\n  peers [b]\n}\nPart b {}');
        expect(leavesOf(tree).map(k => `${k.raw}:${k.role ?? '-'}`)).toEqual([
            'Part:class', 'a:name', '{:punctuation', 'size:keyword', '1:value', 'kind:keyword', 'FAST:literal', 'peers:keyword', '[:punctuation', 'b:reference', ']:punctuation', '}:punctuation',
            'Part:class', 'b:name', '{}:punctuation', ':-',
        ]);
        const ref = nodesOf(tree).find(n => n.kind === 'ref')!;
        expect(ref.kind === 'ref' && [ref.feature, ref.ref?.to, ref.ref?.text]).toEqual(['peers', 't2', 'b']);
        const items = nodesOf(tree).filter(n => n.kind === 'item').map(n => n.kind === 'item' && n.feature);
        expect(items).toEqual(['name', 'size', 'kind', 'peers', 'name']);
    });

    it('skipped tokens are an error node at the place they were skipped', () => {
        const tree = treeOf('Part a {\n  colour 3\n  size 1\n}');
        const err = nodesOf(tree).find(n => n.kind === 'error')!;
        expect(leavesOf(err).map(k => k.raw)).toEqual(['colour', '3']);
        expect(err.kind === 'error' && err.message).toBe('expected "doc", "size", "kind", "peers" or "}"; found name "colour"');
        expect(nodesOf(tree).find(n => n.children.includes(err))!.kind).toBe('block');
    });

    it('comments belong, derived: own-line to the node the next token starts, same-line to the item of the token before, before a close to the block', () => {
        const text = '// head\nPart a { // brace\n  size 1 // one\n  /* before close */\n}\n// tail\n';
        const owners = commentsOf(treeOf(text), grammarOf(FIXTURE)).map(c => `${c.text} -> ${c.owner.kind}${c.owner.kind === 'item' ? `(${c.owner.feature})` : ''}${c.trailing ? ' trailing' : ''}`);
        expect(owners).toEqual(['// head -> object', '// brace -> object trailing', '// one -> item(size) trailing', '/* before close */ -> block', '// tail -> text']);
    });
});
