/**
 * Probe of P-2026-11-04-0005 (step B2 discovery), points (1) and (2). Read-only on the code; moved to
 * docs/discovery/harness/ after its run.
 *
 * (1) The tree between an object and its contained objects: for every contained object of every case, the chain of
 *     nodes from its container object down to it, each item with the keyword token it holds; and every item of a
 *     single value (attributes, references) with its keyword, so inline, positional and dropped keywords show.
 * (2) Labels of the unnamed objects under four candidate rules, computed from the tree of the text (what the outline
 *     reads): on the printer's tree (model ids) and on the parser's tree of the same text (equal by text order), and
 *     after a reprint of the model with every containment and the top level in reverse order (labels by model id).
 */
import { describe, it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseText } from '../parser';
import type { ObjectNode, SyntaxElement, SyntaxNode, SyntaxToken, TextNode } from '../parser';
import { printTextModel, pathKeyword } from '../printer';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { ElementIds } from '../annotations';
import type { TextMetamodel, TextObject } from '../metamodel';
import { textualNotation } from '../syntaxRecord';
import { tolerantCases, LIBRARY_IDS, TS } from './tolerantCorpus';

const HARNESS = new URL('../../../../../docs/discovery/harness/probe_2026-11-04_textual_b2_app/', import.meta.url);
const DEMO = JSON.parse(readFileSync(new URL('demoesm.json', HARNESS), 'utf8'));

interface Case { name: string; mm: TextMetamodel; g: ConcreteGrammar; objects: readonly TextObject[]; ids: ElementIds | null }

const NO_IDS: ElementIds = { classes: {}, features: {}, enums: {} };
function cases(): Case[] {
    const idsOf = (n: string): ElementIds | null => (n.startsWith('library') ? LIBRARY_IDS : n.startsWith('turnstile') ? TS.ids : null);
    const out: Case[] = tolerantCases().map(c => ({ ...c, ids: idsOf(c.name) }));
    out.unshift({ name: 'demoESM', mm: DEMO.mm, g: textualNotation(DEMO.mm, DEMO.stored.decoded, DEMO.stored.ids).grammar, objects: DEMO.objects, ids: DEMO.stored.ids });
    // Added variants, not in the corpus: the names cleared, so the rule meets unnamed objects of every class.
    const cleared = (c: Case): Case => ({ ...c, name: `${c.name}, names cleared`, objects: c.objects.map(o => ('name' in o.slots ? { ...o, slots: { ...o.slots, name: null } } : o)) });
    const lib = out.find(c => c.name === 'library, plain')!;
    const gar = out.find(c => c.name === 'garage, c-like')!;
    out.push(cleared(lib), cleared(gar));
    return out;
}

const isTok = (c: SyntaxElement): c is SyntaxToken => c.kind === 'token';
const textOf = (text: string, n: { start: number; end: number }): string => text.slice(n.start, n.end);

/** The objects of a tree with their container object and the chain of nodes between. */
interface Placed { node: ObjectNode; parent: ObjectNode | null; chain: SyntaxNode[] }
function placed(tree: TextNode): Placed[] {
    const out: Placed[] = [];
    const walk = (n: SyntaxNode, parent: ObjectNode | null, chain: SyntaxNode[]): void => {
        for (const c of n.children) {
            if (isTok(c)) continue;
            if (c.kind === 'object') { out.push({ node: c, parent, chain }); walk(c, c, []); }
            else walk(c, parent, [...chain, c]);
        }
    };
    walk(tree, null, []);
    return out;
}

/** The keyword tokens an item holds directly (not inside a nested object or block). */
const ownKeywords = (n: SyntaxNode): string[] => n.children.filter(isTok).filter(t => t.role === 'keyword').map(t => t.raw);

/** The single-valued items of an object, in text order: feature, keyword, value text, kind of value. */
interface Slot { feature: string; keyword: string | null; value: string; kind: 'name-ref' | 'path-ref' | 'outer-ref' | 'literal' | 'value' }
function slotsOf(text: string, o: ObjectNode): { named: string | null; slots: Slot[] } {
    let named: string | null = null;
    const slots: Slot[] = [];
    const walk = (n: SyntaxNode, inList: boolean): void => {
        for (const c of n.children) {
            if (isTok(c)) { if (c.role === 'name' && n.kind === 'item' && (n as any).feature === 'name') named = c.v; continue; }
            if (c.kind === 'object') continue;
            if (c.kind === 'list') continue; // many-valued
            if (c.kind === 'item' && !inList) {
                const holdsObject = c.children.some(x => !isTok(x) && (x.kind === 'object' || x.kind === 'block'));
                if (!holdsObject && c.feature !== 'name') {
                    const kw = ownKeywords(c)[0] ?? null;
                    const ref = c.children.find((x): x is Extract<SyntaxNode, { kind: 'ref' }> => !isTok(x) && x.kind === 'ref');
                    const vt = c.children.filter(isTok).find(t => t.role === 'value' || t.role === 'literal');
                    if (ref) {
                        const v = textOf(text, ref);
                        slots.push({ feature: c.feature, keyword: kw, value: v, kind: v.startsWith('@') ? 'outer-ref' : /^[A-Za-z_][A-Za-z0-9_]*$/.test(v) ? 'name-ref' : 'path-ref' });
                    } else if (vt) slots.push({ feature: c.feature, keyword: kw, value: vt.raw, kind: vt.role === 'literal' ? 'literal' : 'value' });
                }
            }
            walk(c, inList || c.kind === 'list');
        }
    };
    walk(o, false);
    return { named, slots };
}

function mandatory(ids: ElementIds | null, mm: TextMetamodel, cls: string, feat: string): boolean {
    if (!ids) return false;
    const up = (c: string): string[] => [c, ...(mm.classes.find(x => x.name === c)?.supers ?? []).flatMap(up)];
    return Object.values(ids.features).some(f => f.name === feat && up(cls).includes(f.owner) && (f.lower ?? 0) >= 1);
}

const short = (v: string): string => (v.length > 24 ? `${v.slice(0, 23)}…` : v);

/** The four candidate labels of an unnamed object; `fallback` is `Class[k]`, k the index its path segment prints. */
function labels(c: Case, text: string, p: Placed, k: number): Record<string, string> {
    const kw = pathKeyword(c.g, p.node.cls);
    const { slots } = slotsOf(text, p.node);
    const fallback = `${kw}[${k}]`;
    const lab = (s: Slot | undefined): string => (s ? `${kw} ${short(s.value)}` : fallback);
    const C1 = slots[0];
    const C2 = slots.find(s => mandatory(c.ids, c.mm, p.node.cls, s.feature));
    const C3 = slots.find(s => s.kind.endsWith('-ref'));
    const C4 = slots.find(s => s.kind === 'name-ref' || s.kind === 'literal') ?? slots.find(s => s.kind === 'value') ?? slots.find(s => s.kind.endsWith('-ref'));
    return { C1: lab(C1), C2: lab(C2), C3: lab(C3), C4: lab(C4), C4feature: C4 ? (C4.keyword ?? `(${C4.feature})`) : '' };
}

/** k for each placed object: its index among the objects of the same feature of its container, or among the roots of its class. */
function indices(list: Placed[]): Map<ObjectNode, number> {
    const m = new Map<ObjectNode, number>();
    const seen = new Map<string, number>();
    for (const p of list) {
        const feat = [...p.chain].reverse().find(x => x.kind === 'item' || x.kind === 'list') as any;
        const key = p.parent ? `${p.parent.id}.${feat?.feature}` : `root.${p.node.cls}`;
        const i = seen.get(key) ?? 0;
        m.set(p.node, i);
        seen.set(key, i + 1);
    }
    return m;
}

function labelTable(c: Case, text: string, tree: TextNode): { id: string; cls: string; named: boolean; parent: string | null; l: Record<string, string> }[] {
    const list = placed(tree);
    const ks = indices(list);
    return list.map(p => {
        const named = slotsOf(text, p.node).named;
        return { id: p.node.id, cls: p.node.cls, named: named !== null, parent: p.parent?.id ?? null, l: named !== null ? { name: named } : labels(c, text, p, ks.get(p.node)!) };
    });
}

/** The model with every containment list and the top level in reverse order. */
function reversed(c: Case): TextObject[] {
    const containments = new Set(c.mm.classes.flatMap(k => (k.references ?? []).filter(r => r.containment && r.many).map(r => r.name)));
    return [...c.objects].reverse().map(o => ({ ...o, slots: Object.fromEntries(Object.entries(o.slots).map(([f, v]) => [f, containments.has(f) && Array.isArray(v) ? [...v].reverse() : v])) }));
}

describe('probe P-2026-11-04-0005', () => {
    it('outline structure and unnamed labels', () => {
        const report: any[] = [];
        for (const c of cases()) {
            const printed = printTextModel(c.g, c.objects);
            const text = printed.text;
            const tree = printed.tree!;
            const parsed = parseText(text, c.g);
            // (1) chains.
            const shapes = new Map<string, number>();
            for (const p of placed(tree)) {
                if (!p.parent) continue;
                const sig = p.chain.map(n => (n.kind === 'item' || n.kind === 'list' ? `${n.kind}(${(n as any).feature}${ownKeywords(n).length ? `, kw ${ownKeywords(n).join(' ')}` : ''})` : n.kind)).join(' > ');
                const key = `${p.parent.cls} > ${sig} > ${p.node.cls}`;
                shapes.set(key, (shapes.get(key) ?? 0) + 1);
            }
            const singles = new Map<string, string>();
            for (const p of placed(tree)) for (const s of slotsOf(text, p.node).slots) singles.set(`${p.node.cls}.${s.feature}`, `${s.keyword === null ? 'no keyword' : `kw ${s.keyword}`}, ${s.kind}`);
            // (2) labels: printer's tree, parser's tree, reprint reversed.
            const L = labelTable(c, text, tree);
            const P = labelTable(c, text, parsed.tree!);
            const sameAsParse = L.length === P.length && L.every((x, i) => JSON.stringify(x.l) === JSON.stringify(P[i].l));
            const re = printTextModel(c.g, reversed(c));
            const R = new Map(labelTable(c, re.text, re.tree!).map(x => [x.id, x.l]));
            const unnamed = L.filter(x => !x.named);
            const changed: Record<string, number> = { C1: 0, C2: 0, C3: 0, C4: 0 };
            for (const x of unnamed) for (const k of Object.keys(changed)) if (R.get(x.id)?.[k] !== x.l[k]) changed[k]++;
            const dup: Record<string, number> = { C1: 0, C2: 0, C3: 0, C4: 0 };
            for (const k of Object.keys(dup)) {
                const seen = new Map<string, number>();
                for (const x of unnamed) { const key = `${x.parent}|${x.l[k]}`; seen.set(key, (seen.get(key) ?? 0) + 1); }
                dup[k] = [...seen.values()].filter(n => n > 1).reduce((a, n) => a + n, 0);
            }
            report.push({ case: c.name, objects: L.length, unnamed: unnamed.length, parseErrors: parsed.errors.length, sameAsParse, changedAfterReverse: changed, duplicateSiblings: dup, shapes: Object.fromEntries(shapes), singles: Object.fromEntries(singles), unnamedLabels: unnamed.map(x => ({ id: x.id, cls: x.cls, ...x.l })), text: c.name.startsWith('library') || c.name.startsWith('garage') || c.name.startsWith('turnstile') || c.name === 'demoESM' ? text : undefined });
            console.log(`CASE ${c.name}: objects ${L.length}, unnamed ${unnamed.length}, parse errors ${parsed.errors.length}, labels print = parse ${sameAsParse}, changed after reverse ${JSON.stringify(changed)}, duplicate siblings ${JSON.stringify(dup)}`);
        }
        writeFileSync(new URL('probe_b2_outline.json', HARNESS), JSON.stringify(report, null, 1));
    });

    // Run 3: demoESM broken three ways; the chains (error nodes included), orphan and state flags, and the C4 labels.
    it('broken texts', () => {
        const c = cases()[0];
        const text = printTextModel(c.g, c.objects).text;
        const at = (s: string, from = 0): number => text.indexOf(s, from);
        const open = at('{', at('transitions'));
        const close = at('  }\n}', at('event stop'));
        const mid = at('effect', at('guard'));
        const mutants: Record<string, string> = {
            'transitions { deleted': text.slice(0, open) + text.slice(open + 1),
            'transitions } deleted': text.slice(0, close) + text.slice(close + 4),
            'truncated in the 2nd Transition': text.slice(0, mid),
            'event of the 1st Transition deleted': text.replace('      event coin\n', ''),
        };
        const out: any[] = [];
        for (const [name, t] of Object.entries(mutants)) {
            const parsed = parseText(t, c.g);
            const list = placed(parsed.tree!);
            const ks = indices(list);
            const rows = list.map(p => ({
                cls: p.node.cls, state: p.node.state, orphan: !!p.node.orphan, parent: p.parent?.cls ?? null,
                chain: p.chain.map(n => (n.kind === 'item' || n.kind === 'list' ? `${n.kind}(${(n as any).feature}${ownKeywords(n).length ? `, kw ${ownKeywords(n).join(' ')}` : ''})` : n.kind)).join(' > '),
                label: slotsOf(t, p.node).named ?? labels(c, t, p, ks.get(p.node)!).C4,
            }));
            out.push({ mutant: name, errors: parsed.errors.map(e => `${e.line}:${e.col} ${e.message}`), rows });
        }
        writeFileSync(new URL('probe_b2_broken.json', HARNESS), JSON.stringify(out, null, 1));
    });
});
