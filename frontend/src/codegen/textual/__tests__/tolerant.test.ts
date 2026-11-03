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
import { printTextModel } from '../printer';
import { libraryObjects, mutantsOf, tolerantCases } from './tolerantCorpus';

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

describe('(iii) recovery: insertion, deletion, descent into skipped blocks; unclosed is not partial', () => {
    const LIB = CASES[0];
    const text = printTextModel(LIB.g, libraryObjects(2, 2)).text;
    const parse = (t: string) => parseText(t, LIB.g);
    const shape = (t: string) => {
        const r = parse(t);
        const nodes = objectNodes(r.tree!);
        return {
            errors: r.errors.map(e => e.message),
            objects: nodes.map(n => `${n.cls}:${n.state}${n.orphan ? ':orphan' : ''}`),
            recovered: r.recovered, unclosed: r.unclosed,
        };
    };
    const all = (cls: string[], state = 'complete') => cls.map(c => `${c}:${state}`);

    it('a missing "{" is inserted where the next token starts an item of the block: a single root keeps its outline', () => {
        expect(text.startsWith('Library city {\n  books {\n    Book book0 {')).toBe(true);
        const s = shape(text.replace('Library city {', 'Library city'));
        expect(s.errors).toEqual(['expected "{"; found name "books"']);
        expect(s.objects).toEqual(['Library:partial', ...all(['Book', 'Book', 'Member', 'Member'])]);
        expect(s.recovered).toEqual(['t1']);
        const r = parse(text.replace('Book book0 {', 'Book book0'));
        expect(r.objects.map(o => o.slots.name)).toEqual(['city', 'book0', 'book1', 'reader0', 'reader1']);
        expect(r.objects[1].slots).toEqual({ name: 'book0', genre: 'FICTION' });
        expect(r.recovered).toEqual(['t2']);
    });

    it('a missing "{}" is inserted where the next line starts an item of an enclosing body', () => {
        const s = shape(text.replace('Member reader0 {}', 'Member reader0'));
        expect(s.errors).toEqual(['expected "{"; found name "Member"']);
        expect(s.objects).toEqual(['Library:complete', 'Book:complete', 'Book:complete', 'Member:partial', 'Member:complete']);
    });

    it('an extra token before an expected one is deleted', () => {
        const r = parse(text.replace('Book book0 {', 'Book book0 junk {'));
        expect(r.errors.map(e => `${e.line}:${e.col} ${e.message}`)).toEqual(['3:16 expected "{"; found name "junk"']);
        expect(r.objects[1].slots).toEqual({ name: 'book0', genre: 'FICTION' });
        expect(r.recovered).toEqual(['t2']);
    });

    it('a block skipped after an error is read for the objects its lines start: orphans, whose container is unknown', () => {
        const s = shape(text.replace('  members {', '  {'));
        expect(s.errors).toHaveLength(1);
        expect(s.objects).toEqual(['Library:partial', 'Book:complete', 'Book:complete', 'Member:complete:orphan', 'Member:complete:orphan']);
        expect(s.recovered).toEqual(['t1', 't4', 't5']);
    });

    it('a deleted class keyword is not inferred (deferred): the root is lost, what it contains is read as orphans', () => {
        const s = shape(text.replace('Library city {', 'city {'));
        expect(s.errors).toEqual(['expected "Library", "Book" or "Member"; found name "city"']);
        expect(s.objects).toEqual(['Book:complete:orphan', 'Book:complete:orphan', 'Member:complete:orphan', 'Member:complete:orphan']);
    });

    it('a cut text: the objects read in full inside an open block are unclosed, the one cut inside is partial', () => {
        const cut = text.indexOf('Book book1');
        const s = shape(text.slice(0, cut));
        expect(s.objects).toEqual(['Library:unclosed', 'Book:unclosed']);
        expect(s.recovered).toEqual(['t1', 't2']);
        expect(s.unclosed).toEqual(['t1', 't2']);
        const mid = shape(text.slice(0, text.indexOf('SCIENCE')));
        expect(mid.objects).toEqual(['Library:unclosed', 'Book:unclosed', 'Book:partial']);
        expect(mid.unclosed).toEqual(['t1', 't2']);
        expect(mid.recovered).toEqual(['t1', 't2', 't3']);
    });

    it('a deleted token no longer stops the parse: the objects after it keep their spans (measured, probe of 2120)', () => {
        // Per case, the deletion mutants after which no object past the fault kept its span; 20 of 542 before recovery.
        const stopped = CASES.map(c => {
            const { text: base, mutants } = mutantsOf(c);
            const r0 = parseText(base, c.g);
            const orig = r0.spans.map(s => ({ ...s, cls: r0.objects.find(o => o.id === s.id)!.cls }));
            return mutants.filter(mu => mu.kind === 'delete').filter(mu => {
                const r = parseText(mu.text, c.g);
                if (!r.errors.length) return false;
                const cls = new Map(r.objects.map(o => [o.id, o.cls]));
                const kept = new Set(r.spans.map(s => `${cls.get(s.id)}:${s.start}:${s.end}`));
                const after = orig.filter(o => o.start >= mu.at + mu.removed);
                return after.length > 0 && after.every(o => !kept.has(`${o.cls}:${o.start - mu.removed}:${o.end - mu.removed}`));
            }).length;
        });
        expect(stopped).toEqual([0, 0, 1, 0, 0, 0, 0]);
    });

    it('an orphan is no top-level object: a path does not reach it', () => {
        expect(text).toContain('borrowedBy reader1');
        const broken = text.replace('  members {', '  {').replace('borrowedBy reader1', 'borrowedBy Member[0]');
        const r = parse(broken);
        expect(r.errors.map(e => e.message)).toContain('there is no top-level Member[0]: the text has 0');
        expect(r.refs!.filter(x => x.feature === 'borrowedBy').map(x => x.to)).toEqual([undefined]);
    });
});
