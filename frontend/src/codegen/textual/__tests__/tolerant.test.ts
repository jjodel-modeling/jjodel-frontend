/**
 * Step A of the textual IDE, parser half (P-2026-11-03-2120; R-TXT-21 (1), (8), R-TXT-22; the design of
 * docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md): tokens with trivia, the lossless tree, recovery,
 * two-tier diagnostics, linear resolution, the display-only match of a broken parse.
 */

import { describe, it, expect } from 'vitest';
import { commentsOf, parseText, parserNameLookups, tokenizeText } from '../parser';
import type { ObjectNode, SyntaxElement, SyntaxNode, SyntaxToken, TextNode } from '../parser';
import { grammarOf } from './corpus';
import { FIXTURE, objectsOf } from './spec';
import { printTextModel, printerNameLookups } from '../printer';
import { libraryObjects, mutantsOf, tolerantCases } from './tolerantCorpus';
import { nearleyGrammarOf, parseCount } from './oracle';
import { planTextEdit } from '../textDiff';
import { displayMatch } from '../textMatch';
import { BOOL_CLIKE, BOOL_PASCAL, BOOL_PRINTS, arithGrammar, boolGrammar, boolSheet } from './boolCorpus';

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
        expect(r.errors.map(e => e.message)).toContainEqual(expect.stringMatching(/^there is no top-level Member\[0\]: the text has 0 \(may follow from/));
        expect(r.refs!.filter(x => x.feature === 'borrowedBy').map(x => x.to)).toEqual([undefined]);
    });
});

describe('(iv) two-tier diagnostics; a text with a syntax error is never applied', () => {
    const LIB = CASES[0];
    const text = printTextModel(LIB.g, libraryObjects(2, 2)).text;

    it('after a syntax error, a reference error is a secondary warning, listed after the syntax errors', () => {
        const r = parseText(`${text.replace('borrowedBy reader1', 'borrowedBy nobody')}junk\n`, LIB.g);
        const syntax = r.errors[0];
        expect(syntax.message).toBe('expected "Library", "Book" or "Member"; found name "junk"');
        expect('secondary' in syntax || 'severity' in syntax).toBe(false);
        expect(r.errors.slice(1)).toEqual([expect.objectContaining({
            message: `no object of type Member is named "nobody" (may follow from the error at ${syntax.line}:${syntax.col})`,
            secondary: true, severity: 'warning',
        })]);
        expect(r.errors[1].start).toBeLessThan(syntax.start);
    });

    it('without a syntax error, a reference error keeps its shape: an error, not secondary', () => {
        const r = parseText(text.replace('borrowedBy reader1', 'borrowedBy nobody'), LIB.g);
        expect(r.errors.map(e => Object.keys(e).sort().join(','))).toEqual(['col,end,line,message,start']);
    });

    it.each(CASES.map(c => [c.name, c] as const))('%s: every mutant outside the language has a syntax error, and its diff is null (oracle)', (_, c) => {
        const { mutants } = mutantsOf(c);
        const ng = nearleyGrammarOf(c.g);
        const print = printTextModel(c.g, c.objects);
        let outside = 0;
        for (const mu of mutants) {
            let n = 0;
            try { n = parseCount(c.g, mu.text, ng); } catch { n = 0; }
            if (n > 0) continue;
            outside++;
            const parsed = parseText(mu.text, c.g);
            expect(parsed.errors.some(e => !(e as { secondary?: boolean }).secondary), mu.text).toBe(true);
            const plan = planTextEdit({ mm: c.mm, grammar: c.g, model: c.objects, parsed, unprinted: [], previous: print.spans });
            expect(plan.diff).toBeNull();
        }
        expect(outside).toBeGreaterThan(mutants.length / 2);
    });
});

describe('(v) linear name resolution', () => {
    const LIB = CASES[0];
    /** The least of seven runs: the noise of a shared machine only adds time. */
    const best = (text: string): number => {
        let least = Infinity;
        for (let i = 0; i < 7; i++) { const s = performance.now(); parseText(text, LIB.g); least = Math.min(least, performance.now() - s); }
        return least;
    };
    const small = printTextModel(LIB.g, libraryObjects(800, 200)).text;
    const mid = printTextModel(LIB.g, libraryObjects(1600, 400)).text;
    const large = printTextModel(LIB.g, libraryObjects(9600, 2400)).text;

    it('1,001 objects, a third of the books borrowed by name, parse within the 50 ms budget per keystroke (measured)', () => {
        expect(parseText(small, LIB.g).errors).toEqual([]);
        expect(best(small)).toBeLessThan(50);
    });

    it('six times the objects, at most six times the lookups: the resolution is not quadratic (counted, #205)', () => {
        // The objects the resolution examines, not the time: a count the load of the machine cannot move. 2,001 against
        // 12,001 objects: a scan per reference examines every object, a count growing as n·n; an index, the few named alike.
        const lookups = (text: string): [number, number] => { parserNameLookups.count = 0; const r = parseText(text, LIB.g); return [r.objects.length, parserNameLookups.count]; };
        const [n, first] = lookups(mid);
        // c from the first count, 1% over it: n counts the one library object, the references do not (n grows 5.997 times, they 6).
        const c = (first / n) * 1.01;
        const s = performance.now();
        const [N, k] = lookups(large);
        const ms = performance.now() - s;
        expect([n, N]).toEqual([2001, 12001]);
        expect(c, 'no lookup counted: the counter is not wired').toBeGreaterThan(0);
        expect(k, `${k} lookups for ${N} objects, ${c.toFixed(3)} per object at ${n}`).toBeLessThanOrEqual(c * N);
        expect(k).toBeLessThan(c * N * (N / n));
        // A guard against a blow-up, not a budget.
        expect(ms).toBeLessThan(1000);
    });
});

describe('(vi) the match of a broken parse, for display only', () => {
    const LIB = CASES[0];
    const model = libraryObjects(2, 2);
    const print = printTextModel(LIB.g, model);
    const broken = print.text.replace('  members {', '  {');

    it('returns the match and the orphans, each with the model object it matched, if any', () => {
        const parsed = parseText(broken, LIB.g);
        const r = displayMatch({ mm: LIB.mm, grammar: LIB.g, model, parsed, previous: print.spans });
        expect(r.orphans).toEqual([{ text: 't4', model: 'm0' }, { text: 't5', model: 'm1' }]);
        expect(r.match.matches.map(m => `${m.text}=${m.model}`)).toEqual(['t1=lib', 't2=b0', 't3=b1', 't4=m0', 't5=m1']);
        expect(r.match.deleted).toEqual([]);
    });

    it('an orphan is not matched by class and name at the top level: its container is unknown', () => {
        // A top-level homonym of reader0: as a top-level object the orphan would take it, certain, by name.
        const withTop = [...model, { id: 'mx', cls: 'Member', slots: { name: 'reader0' } }];
        const parsed = parseText(broken, LIB.g);
        const r = displayMatch({ mm: LIB.mm, grammar: LIB.g, model: withTop, parsed });
        expect(r.orphans).toEqual([{ text: 't4' }, { text: 't5', model: 'm1' }]);
        expect(r.match.matches.find(m => m.text === 't5')).toMatchObject({ by: 'move', uncertain: true });
    });

    it('an orphan is no homonym of a top-level object: the top-level one keeps its certain match by name', () => {
        const withTop = [...model, { id: 'mx', cls: 'Member', slots: { name: 'reader0' } }];
        const parsed = parseText(`Member reader0 {}\n${broken}`, LIB.g);
        const r = displayMatch({ mm: LIB.mm, grammar: LIB.g, model: withTop, parsed });
        expect(r.orphans.map(o => o.text)).toEqual(['t5', 't6']);
        expect(r.match.matches[0]).toEqual({ text: 't1', model: 'mx', by: 'name', uncertain: false });
    });

    it('a text without a tree or orphans: the plain match, no orphans', () => {
        const parsed = parseText(print.text, LIB.g);
        const r = displayMatch({ mm: LIB.mm, grammar: LIB.g, model, parsed, previous: print.spans });
        expect(r.orphans).toEqual([]);
        expect(r.match.created).toEqual([]);
    });
});

describe('(vii) the printer builds the same tree (P-2026-11-03-2220)', () => {
    /**
     * A tree as plain data, every field compared and none skipped, but the object ids replaced by their place in text
     * order: a print names the model's ids, a parse its own `t1`, `t2`, ...
     */
    const plain = (tree: TextNode): unknown => {
        const ids = new Map(objectNodes(tree).map((n, i) => [n.id, `#${i}`]));
        const id = (v: unknown): unknown => (typeof v === 'string' ? ids.get(v) ?? `unknown ${v}` : v);
        const defined = (x: object): Record<string, unknown> => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined));
        const node = (n: SyntaxElement): unknown => {
            if (n.kind === 'token') return defined(n);
            const out = defined(n);
            if (n.kind === 'object') out.id = id(n.id);
            if (n.kind === 'text') out.tokens = n.tokens.map(node);
            if (n.kind === 'ref' && n.ref) out.ref = { ...defined(n.ref), owner: id(n.ref.owner), to: id(n.ref.to) };
            out.children = n.children.map(node);
            return out;
        };
        return node(tree);
    };

    it.each(CASES.map(c => [c.name, c] as const))('%s: the tree of the print and the tree of its parse are equal, node for node, token for token', (_, c) => {
        const print = printTextModel(c.g, c.objects);
        const parsed = parseText(print.text, c.g);
        expect(parsed.errors).toEqual([]);
        expect(print.tree).toBeDefined();
        expect(plain(print.tree!)).toStrictEqual(plain(parsed.tree!));
    });

    // Step C lane C1b: the expression nodes, operator objects and `paren` nodes, on BOOL in both styles and on ARITH.
    const EXPRESSIONS = [
        ['BOOL, C-like', boolGrammar(BOOL_CLIKE), BOOL_PRINTS.map(([w]) => w)],
        ['BOOL, Pascal/Ada', boolGrammar(BOOL_PASCAL), BOOL_PRINTS.map(([w]) => w).filter(w => !/\b(and|or)\(/.test(w))],
        ['ARITH', arithGrammar(), ['st - ld + rdy', '-st - (ld + -1)', '- 1 + st', '--st', 'st & -(ld - 1)']],
    ] as const;
    it.each(EXPRESSIONS)('%s: the tree of the print and the tree of its parse are equal on expressions', (name, g, whens) => {
        // The model is read from C-like text, the style of the metamodel's own C-like grammar.
        const source = name === 'ARITH' ? arithGrammar() : boolGrammar(BOOL_CLIKE);
        const print = printTextModel(g, parseText(boolSheet(...whens), source).objects);
        const parsed = parseText(print.text, g);
        expect(parsed.errors).toEqual([]);
        expect(print.tree).toBeDefined();
        expect(plain(print.tree!)).toStrictEqual(plain(parsed.tree!));
    });

    it('a part that prints nothing opens no node: a contained id that names no object; every node spans a token, the leaves are the text', () => {
        const spec = { ...FIXTURE, objects: FIXTURE.objects.map(o => (o.id === 's1' ? { ...o, slots: { ...o.slots, parts: [...(o.slots.parts as string[]), 'ghost'] } } : o)) };
        const print = printTextModel(grammarOf(spec), objectsOf(spec));
        const tree = print.tree!;
        expect(leavesOf(tree).map(k => k.leading + k.raw + k.trailing).join('')).toBe(print.text);
        for (const n of nodesOf(tree)) expect(n.children.length, n.kind).toBeGreaterThan(0);
    });

    it('a print whose tokens read across the printed ones has no tree: a value of an integer list holding a quote', () => {
        const spec = { classes: [{ name: 'Box', attributes: [{ name: 'name', type: 'EString' }, { name: 'nums', type: 'EInt', many: true }] }], enums: {}, objects: [{ id: 'b', cls: 'Box', slots: { name: 'b', nums: ['"x', 2] } }] };
        const print = printTextModel(grammarOf(spec), objectsOf(spec));
        expect(print.text).toContain('"x, 2]');
        expect(print.tree).toBeUndefined();
    });
});

describe('(viii) linear name resolution in the printer (P-2026-11-03-2220)', () => {
    const LIB = CASES[0];
    /** The least of seven runs: the noise of a shared machine only adds time. */
    const best = (objects: ReturnType<typeof libraryObjects>): number => {
        let least = Infinity;
        for (let i = 0; i < 7; i++) { const s = performance.now(); printTextModel(LIB.g, objects); least = Math.min(least, performance.now() - s); }
        return least;
    };
    const small = libraryObjects(800, 200);
    const large = libraryObjects(4800, 1200);

    it('1,001 objects, a third of the books borrowed by name, print within the 50 ms budget per keystroke (measured)', () => {
        expect(printTextModel(LIB.g, small).tree).toBeDefined();
        expect(best(small)).toBeLessThan(50);
    });

    it('six times the objects, at most six times the lookups: the resolution is not quadratic (counted, #205)', () => {
        // The objects the resolution examines, not the time: a count the load of the machine cannot move. 1,001 against
        // 6,001 objects: a scan per reference examines every object, a count growing as n·n; an index, the few named alike.
        const lookups = (objects: ReturnType<typeof libraryObjects>): number => { printerNameLookups.count = 0; printTextModel(LIB.g, objects); return printerNameLookups.count; };
        const [n, N] = [small.length, large.length];
        // c from the first count, 1% over it: n counts the one library object, the references do not.
        const c = (lookups(small) / n) * 1.01;
        const s = performance.now();
        const k = lookups(large);
        const ms = performance.now() - s;
        expect([n, N]).toEqual([1001, 6001]);
        expect(c, 'no lookup counted: the counter is not wired').toBeGreaterThan(0);
        expect(k, `${k} lookups for ${N} objects, ${c.toFixed(3)} per object at ${n}`).toBeLessThanOrEqual(c * N);
        expect(k).toBeLessThan(c * N * (N / n));
        // A guard against a blow-up, not a budget.
        expect(ms).toBeLessThan(1000);
    });
});

describe('(ix) D3a: structured fixes on parse errors (P-2026-11-06-2328; report §4.3, decision D6)', () => {
    const LIB = CASES[0];
    const text = printTextModel(LIB.g, libraryObjects(2, 2)).text;
    const fixed = (t: string, g = LIB.g) => parseText(t, g, { fixes: true });
    const apply = (t: string, f: { start: number; end: number; text: string }): string => t.slice(0, f.start) + f.text + t.slice(f.end);

    it('(1) a token the repair inserted: the fix inserts it where it is missing, and the text reads again in full', () => {
        const fixture = grammarOf(FIXTURE);
        const cases: [string, string, ReturnType<typeof grammarOf>][] = [
            [text.replace('Library city {', 'Library city'), 'insert "{"', LIB.g],
            [text.replace('Member reader0 {}', 'Member reader0'), 'insert "{}"', LIB.g],
            [text.slice(0, text.lastIndexOf('\n')), 'insert "}"', LIB.g],
            ['Part a {\n  peers b]\n}\nPart b {}\n', 'insert "["', fixture],
            ['Part a {\n  peers [b\n}\nPart b {}\n', 'insert "]"', fixture],
        ];
        for (const [broken, title, g] of cases) {
            const r = fixed(broken, g);
            expect(r.errors.length, broken).toBe(1);
            const fix = r.errors[0].fix ?? [];
            expect(fix.map(f => f.title), broken).toEqual([title]);
            expect(fix[0].start).toBe(fix[0].end);
            const again = parseText(apply(broken, fix[0]), g);
            expect(again.errors, apply(broken, fix[0])).toEqual([]);
            expect(again.recovered).toEqual([]);
        }
        expect(apply(text.replace('Library city {', 'Library city'), fixed(text.replace('Library city {', 'Library city')).errors[0].fix![0])).toBe(text);
        expect(apply(text.slice(0, text.lastIndexOf('\n')), fixed(text.slice(0, text.lastIndexOf('\n'))).errors[0].fix![0])).toBe(text);
    });

    it('(2) an unknown reference: one fix per near name among the targets, nearest first, written as the printer writes it', () => {
        const broken = text.replace('borrowedBy reader1', 'borrowedBy reder1');
        const r = fixed(broken);
        expect(r.errors.map(e => e.message)).toEqual(['no object of type Member is named "reder1"']);
        const fix = r.errors[0].fix ?? [];
        expect(fix.map(f => f.text)).toEqual(['reader1', 'reader0']);
        expect(fix.map(f => f.title)).toEqual(['replace with "reader1"', 'replace with "reader0"']);
        expect(broken.slice(fix[0].start, fix[0].end)).toBe('reder1');
        expect(apply(broken, fix[0])).toBe(text);
        // A name of a class outside the targets is no candidate: "book1" is a Book, and no Member is named near it.
        const other = fixed(text.replace('borrowedBy reader1', 'borrowedBy book1'));
        expect(other.errors.map(e => e.message)).toEqual(['no object of type Member is named "book1"']);
        expect('fix' in other.errors[0]).toBe(false);
    });

    it('(2) a near name carried by two targets is written as their paths, never `@"id"`; so is an ambiguous name', () => {
        const twice = text.replace('Member reader0 {}', 'Member reader1 {}');
        for (const broken of [twice.replace('borrowedBy reader1', 'borrowedBy reder1'), twice]) {
            const r = fixed(broken);
            expect(r.errors.length, broken).toBe(1);
            const fix = r.errors[0].fix ?? [];
            expect(fix.map(f => f.text)).toEqual(['Library[0].members[0]', 'Library[0].members[1]']);
            fix.forEach((f, k) => {
                const again = parseText(apply(broken, f), LIB.g);
                expect(again.errors).toEqual([]);
                const ref = again.refs!.find(x => x.feature === 'borrowedBy')!;
                expect(again.objects.find(o => o.id === ref.to)!, f.text).toBe(again.objects.filter(o => o.cls === 'Member')[k]);
            });
        }
    });

    it('(4) without `fixes`, no error carries a fix', () => {
        const r = parseText(text.replace('Library city {', 'Library city'), LIB.g);
        expect(r.errors.length).toBe(1);
        expect('fix' in r.errors[0]).toBe(false);
    });
});
