/**
 * The printer: a model as text, by walking the concrete grammar with each object
 * (docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.4, serialization rule). Every choice is decided by the
 * data: an optional part prints iff its feature is set (R-TXT-5), a star iterates the feature's values in model order,
 * a rule over several classes takes the object's own class. The JjGen generator
 * `public/examples/codegen/default-text.generator.json` is the reference it must agree with (R-TXT-14).
 *
 * The span of each object (from its first token to its last) is returned with the text: the origins that step T6
 * matches a re-parsed text against (R-TXT-22). So is the span of each reference token, with the target it names: a
 * token the user did not retype keeps that target (R-TXT-35).
 *
 * So is the lossless tree of the text (step A, design item 8): the nodes `parseText` builds when it reads the text back,
 * so that a printed text and its parse give equal trees and step T10 can splice nodes.
 */

import type { ConcreteGrammar, GrammarNode, ObjectRule } from './concreteGrammar';
import { applyCase, derivedName } from './concreteGrammar';
import { isOuterRef } from './metamodel';
import type { OuterRef, TextObject } from './metamodel';
import { tokenizeText } from './parser';
import type { ObjectNode, ParsedRef, SyntaxNode, SyntaxToken, TextNode, TokenRole } from './parser';

/** `[start, end)` offsets into the printed text. */
export interface ObjectSpan {
    readonly id: string;
    readonly start: number;
    readonly end: number;
}

/**
 * R-TXT-35: a reference token of the print: `[start, end)` offsets, the token as printed, the object and feature it is
 * written for and the id of the target it names (an object outside the text too, R-TXT-32).
 */
export interface RefSpan {
    readonly owner: string;
    readonly feature: string;
    readonly target: string;
    readonly text: string;
    readonly start: number;
    readonly end: number;
}

export interface TextPrintResult {
    readonly text: string;
    /** One per printed object, in text order (an object before the objects it contains). */
    readonly spans: readonly ObjectSpan[];
    /** One per printed reference token, in text order (R-TXT-35). */
    readonly refs?: readonly RefSpan[];
}

/**
 * R-TXT-30: an object a grouped containment holds and no group prints, because its grouping attribute is unset or is
 * none of the literals of any subset. It is not in the text; neither are the objects it contains.
 */
export interface UnprintedObject {
    readonly id: string;
    /** The object holding it, which the text does print. */
    readonly owner: string;
    readonly feature: string;
    readonly cls: string;
    /** The grouping attribute. */
    readonly attr: string;
    readonly reason: 'unset' | 'outside';
    /** The objects contained in it, at any depth: absent from the text with it, and not listed on their own. */
    readonly inside: number;
}

/** What `printTextModel` returns: the text, its spans, and the objects it leaves out. */
export interface TextPrintReport extends TextPrintResult {
    readonly unprinted: readonly UnprintedObject[];
    /**
     * The lossless tree of the text, equal to the one `parseText` builds from it, the object ids being the model's
     * (step A). Absent when the tokens read in the text do not match the tokens printed.
     */
    readonly tree?: TextNode;
}

/** R-TXT-30: whether the text leaves objects out. Step T6 never applies a text while it does: their absence would read as a deletion. */
export const hasUnprinted = (r: Pick<TextPrintReport, 'unprinted'>): boolean => r.unprinted.length > 0;

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * R-TXT-28: the word a path's first segment starts with, read off the concrete grammar: the class keyword the text
 * prints (the head of the class's object rule), or, for a positional class, which prints none, the class name.
 */
export function pathKeyword(g: ConcreteGrammar, cls: string): string {
    const body = g.objects[cls]?.body;
    const head = body?.t === 'seq' ? body.items[0] : body;
    return head?.t === 'kw' ? head.text : applyCase(cls, g.classCase);
}

/** The node of a containment `feat` in an object rule's body: its `opt` without a group filter. */
function containmentNode(n: GrammarNode | undefined, feat: string): Extract<GrammarNode, { t: 'opt' }> | undefined {
    if (!n) return undefined;
    if (n.t === 'opt') return n.feat === feat && !n.where ? n : undefined;
    const items = n.t === 'seq' || n.t === 'block' ? n.items : [];
    for (const x of items) { const found = containmentNode(x, feat); if (found) return found; }
    return undefined;
}

/**
 * R-TXT-29: the word a later path segment starts with, read off the concrete grammar: the keyword the text prints before
 * the containment's block, or the feature name when none is printed (the keyword dropped, or the containment inline).
 */
export function featureKeyword(g: ConcreteGrammar, cls: string, feat: string): string {
    const node = containmentNode(g.objects[cls]?.body, feat);
    const items = node?.item.t === 'seq' ? node.item.items.filter(x => x.t !== 'nl') : [];
    // Inline, the first item is the content (a star, or a group's opt), never a keyword followed by the block.
    return items[0]?.t === 'kw' && items[1]?.t === 'block' ? items[0].text : feat;
}

/** The group stars of a grouped containment, in the order the text prints them; none for an ungrouped one. */
function groupStars(n: GrammarNode | undefined): Extract<GrammarNode, { t: 'star' }>[] {
    if (!n) return [];
    if (n.t === 'star') return n.where ? [n] : [];
    if (n.t === 'opt') return groupStars(n.item);
    return n.t === 'seq' || n.t === 'block' ? n.items.flatMap(groupStars) : [];
}

/** A token as printed, before the tokenizer reads it: a reference prints as one, and may read as several. */
interface Emitted {
    readonly kind: 'emitted';
    readonly start: number;
    readonly end: number;
    readonly role: TokenRole;
}

/** A node of the tree while the print builds it. */
interface Building {
    readonly kind: SyntaxNode['kind'];
    start: number;
    end: number;
    children: (Building | Emitted | SyntaxToken)[];
    readonly id?: string;
    readonly cls?: string;
    readonly rule?: string;
    readonly state?: ObjectNode['state'];
    readonly feature?: string;
    readonly closed?: boolean;
    ref?: ParsedRef;
    tokens?: readonly SyntaxToken[];
}

/**
 * The tree of a printed text: each printed token is replaced by the tokens the tokenizer reads in it, with its role (in
 * a reference, the punctuation of a path is punctuation, as the parser reads it), and each node spans its tokens as
 * `parseText` seals it. A node that printed nothing is dropped. Undefined when a token read lies outside every printed one.
 */
function treeOf(g: ConcreteGrammar, text: string, root: Building): TextNode | undefined {
    const read = tokenizeText(text, g).tokens;
    const tokens: SyntaxToken[] = [];
    let k = 0;
    let ok = true;
    const fill = (n: Building): boolean => {
        const children: Building['children'] = [];
        for (const c of n.children) {
            if (c.kind === 'emitted') {
                for (; k < read.length - 1 && read[k].start >= c.start && read[k].end <= c.end; k++) {
                    const t = read[k];
                    const role: TokenRole = c.role === 'reference' && t.k === 'P' && t.v !== '@' ? 'punctuation' : c.role;
                    const leaf: SyntaxToken = { ...t, role };
                    tokens.push(leaf);
                    children.push(leaf);
                }
                if (k < read.length - 1 && read[k].start < c.end) ok = false;
            } else if (c.kind !== 'token' && fill(c)) children.push(c);
        }
        n.children = children;
        if (!children.length) return false;
        n.start = children[0].start;
        n.end = children[children.length - 1].end;
        return true;
    };
    fill(root);
    if (!ok || k !== read.length - 1) return undefined;
    const eof = read[read.length - 1];
    tokens.push(eof);
    root.children.push(eof);
    root.start = root.children[0].start;
    root.end = eof.end;
    root.tokens = tokens;
    return root as unknown as TextNode;
}

const isSet = (v: unknown): boolean => v != null && !(Array.isArray(v) && v.length === 0);
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);

/**
 * Prints the objects of a model. The roots are the objects no other object contains, in the order given; a
 * reference or containment slot names its targets by id. A containment of an id that names no object is skipped; a
 * reference to one prints `@` and the id as a string (R-TXT-32), as does an `OuterRef` the parser read.
 */
export function printTextModel(g: ConcreteGrammar, objects: readonly TextObject[]): TextPrintReport {
    const style = g.style;
    const byId = new Map(objects.map(o => [o.id, o]));
    const ruleOf = (o: TextObject): ObjectRule => {
        const r = g.objects[o.cls];
        if (!r) throw new Error(`no rule for class ${o.cls} (abstract, or not in the metamodel)`);
        return r;
    };
    // The object rules by name: a grouping's derived rules print the objects of their class (concreteGrammar.ts).
    const ruleNamed = new Map(g.rules.flatMap(r => (r.t === 'object' ? [[r.name, r] as const] : [])));

    const resolve = (id: unknown): TextObject | undefined => (typeof id === 'string' ? byId.get(id) : undefined);
    /** R-TXT-32: the id of a reference target the text does not print. */
    const outerOf = (v: unknown): string | undefined => (isOuterRef(v) ? v.outer : typeof v === 'string' && !byId.has(v) ? v : undefined);

    /** The values a star iterates: with `where`, those whose object's attribute is one of the group's literals, in the
     *  literals' order (ties in model order). */
    const values = (n: Extract<GrammarNode, { t: 'opt' | 'star' }>, o: TextObject): unknown[] => {
        const vs = n.feat === undefined ? [] : asArray(o.slots[n.feat]);
        const w = n.where;
        if (!w) return vs;
        const rank = (v: unknown): number => { const c = resolve(v); return c ? w.literals.indexOf(String(c.slots[w.attr])) : -1; };
        return vs.filter(v => rank(v) >= 0).sort((a, b) => rank(a) - rank(b));
    };

    // The containment tree: each object's container and its path segment, `f[i]` even for a single containment. R-TXT-29:
    // f is the feature's printed keyword, the feature name when none is printed; i is the object's position in the feature
    // as the text gives it, the one the parser reads back: the model order, but a grouped containment prints its values
    // group by group (those no group prints come after them, and a path to them names no object).
    const parent = new Map<string, { readonly owner: TextObject; readonly segment: string }>();
    const contained = new Map<string, string[]>();
    // R-TXT-30: the values of a grouped containment that no group prints, kept until the walk says which owners print.
    const left: Omit<UnprintedObject, 'inside'>[] = [];
    for (const o of objects) {
        const rule = ruleOf(o);
        for (const f of rule.features) {
            if (f.kind !== 'containment') continue;
            const all = asArray(o.slots[f.name]);
            const stars = groupStars(containmentNode(rule.body, f.name));
            const grouped = stars.flatMap(n => values(n, o));
            const order = stars.length ? [...grouped, ...all.filter(v => !grouped.includes(v))] : all;
            const kw = featureKeyword(g, o.cls, f.name);
            order.forEach((id, i) => {
                if (typeof id === 'string' && byId.has(id)) {
                    parent.set(id, { owner: o, segment: `${kw}[${i}]` });
                    contained.set(o.id, [...(contained.get(o.id) ?? []), id]);
                }
            });
            const attr = stars[0]?.where?.attr;
            if (attr === undefined) continue;
            for (const id of all) {
                const c = grouped.includes(id) ? undefined : resolve(id);
                if (c) left.push({ id: c.id, owner: o.id, feature: f.name, cls: c.cls, attr, reason: isSet(c.slots[attr]) ? 'outside' : 'unset' });
            }
        }
    }
    const roots = objects.filter(o => !parent.has(o.id));
    const rootIndex = new Map<string, number>();
    const rootsOf = new Map<string, number>();
    for (const r of roots) {
        rootIndex.set(r.id, rootsOf.get(r.cls) ?? 0);
        rootsOf.set(r.cls, (rootIndex.get(r.id) ?? 0) + 1);
    }

    // R-TXT-25 (5, 6), R-TXT-28, R-TXT-29: a root is `keyword[k]`, the class keyword as printed (the class name when
    // dropped), k its position among the top-level objects of its class; a contained object adds `.f[i]`, f the feature
    // keyword as printed (the feature name when dropped or inline). Every segment carries an index, so a path is never a
    // bare identifier, never a name.
    const path = (t: TextObject): string => {
        const up = parent.get(t.id);
        return up ? `${path(up.owner)}.${up.segment}` : `${pathKeyword(g, t.cls)}[${rootIndex.get(t.id)}]`;
    };

    const quote = (s: string): string => {
        const q = style.string.quote;
        const body = style.string.escape === 'double'
            ? s.split(q).join(q + q)
            : s.replace(/\\/g, '\\\\').split(q).join(`\\${q}`).replace(/\n/g, '\\n');
        return q + body + q;
    };
    const name = (s: string): string => (IDENTIFIER.test(s) && !style.reservedNames.includes(s) ? s : quote(s));
    const nameOf = (o: TextObject): unknown => (ruleOf(o).named ? o.slots.name : undefined);

    // R-TXT-4: the target's name when it is unique among the instances of the reference's type, else its path.
    const ref = (n: Extract<GrammarNode, { t: 'xref' }>, t: TextObject): string => {
        const nm = nameOf(t);
        if (typeof nm === 'string' && objects.filter(x => n.targets.includes(x.cls) && nameOf(x) === nm).length === 1) return name(nm);
        return path(t);
    };

    // Output: a token goes on the current line, after the indentation or a space; a line break is written lazily, so
    // the text never ends with one. Punctuation that closes or separates sticks to the token before it.
    const glueBefore = new Set([style.list.separator, style.list.close, ...style.terminator]);
    const glueAfter = new Set([style.list.open]);
    let out = '';
    let atLineStart = true;
    let breakPending = false;
    let depth = 0;
    let last = '';
    let lastPunct = false;
    let opening: string[] = [];
    // A blank line asked by a `blank` node, written with the next line break; never at the start of a body.
    let blankPending = false;
    let bodyStart = true;
    const spans: ObjectSpan[] = [];
    const starts = new Map<string, number>();
    const refs: RefSpan[] = [];

    // The tree (step A): the nodes the parser opens for each part it reads, opened by the walk where the part prints.
    const root: Building = { kind: 'text', start: 0, end: 0, children: [] };
    const stack: Building[] = [root];
    const cur = (): Building => stack[stack.length - 1];
    const within = (n: Omit<Building, 'start' | 'end' | 'children'>, fn: (b: Building) => void): void => {
        const b: Building = { ...n, start: 0, end: 0, children: [] };
        cur().children.push(b);
        stack.push(b);
        try { fn(b); } finally { stack.pop(); }
    };
    /** An item node for a value of `feat`, unless the current node is one already, or a list of it (as `parseText` opens them). */
    const itemFor = (feat: string, fn: () => void): void => {
        const c = cur();
        if ((c.kind === 'item' || c.kind === 'list') && c.feature === feat) fn();
        else within({ kind: 'item', feature: feat }, fn);
    };
    /** The first keyword of an object rule's body: its class keyword (`parseText` reads it with the role `class`). */
    const classKeywords = new Set<GrammarNode>(g.rules.flatMap(r => (r.t === 'object' && r.body.t === 'seq' && r.body.items[0]?.t === 'kw' ? [r.body.items[0]] : [])));

    const token = (s: string, punct = false, role: TokenRole = punct ? 'punctuation' : 'keyword'): void => {
        if (breakPending) { out += blankPending ? '\n\n' : '\n'; breakPending = false; atLineStart = true; }
        blankPending = false;
        bodyStart = false;
        if (atLineStart) out += ' '.repeat(depth * style.indent);
        else if (!(punct && glueBefore.has(s)) && !(lastPunct && glueAfter.has(last))) out += ' ';
        for (const id of opening) starts.set(id, out.length);
        opening = [];
        cur().children.push({ kind: 'emitted', start: out.length, end: out.length + s.length, role });
        out += s;
        atLineStart = false;
        last = s;
        lastPunct = punct;
    };
    const newline = (): void => { if (!atLineStart) breakPending = true; };

    const object = (o: TextObject, ruleName?: string): void => {
        const named = ruleName !== undefined ? ruleNamed.get(ruleName) : undefined;
        const rule = named?.cls === o.cls ? named : ruleOf(o);
        opening.push(o.id);
        within({ kind: 'object', id: o.id, cls: o.cls, rule: rule.name, state: 'complete' }, () => emit(rule.body, o, undefined));
        spans.push({ id: o.id, start: starts.get(o.id) ?? out.length, end: out.length });
    };

    /** Whether an opt prints: its feature is set, a value passes its filter, and a name differs from its derived one. */
    const shown = (n: Extract<GrammarNode, { t: 'opt' }>, o: TextObject): boolean => {
        if (!isSet(o.slots[n.feat])) return false;
        if (n.where && !values(n, o).length) return false;
        return !(n.derive && o.slots[n.feat] === derivedName(g, ruleOf(o), o.slots, n.derive));
    };

    const present = (n: GrammarNode, o: TextObject): boolean => {
        switch (n.t) {
            case 'opt': return shown(n, o);
            case 'star': return n.feat === undefined || values(n, o).length > 0;
            case 'list': case 'assign': return n.feat === undefined || isSet(o.slots[n.feat]);
            case 'seq': return n.items.some(x => present(x, o));
            default: return false;
        }
    };

    /** `o` and `feat`: the object and feature a reference token is written for. */
    const value = (n: GrammarNode, v: unknown, o?: TextObject, feat?: string): void => {
        switch (n.t) {
            case 'rule': { const c = resolve(v); if (c) object(c, n.name); return; }
            case 'xref': {
                const t = resolve(v);
                const outer = t ? undefined : outerOf(v);
                const s = t ? ref(n, t) : outer !== undefined ? `@${quote(outer)}` : undefined;
                if (s === undefined) return;
                within({ kind: 'ref', feature: feat }, b => {
                    token(s, false, 'reference');
                    if (o && feat !== undefined) {
                        const to: string | OuterRef = t ? t.id : { outer: outer! };
                        b.ref = { owner: o.id, feature: feat, start: out.length - s.length, end: out.length, text: s, outer: !t, to };
                    }
                });
                if (o && feat !== undefined) refs.push({ owner: o.id, feature: feat, target: t ? t.id : outer!, text: s, start: out.length - s.length, end: out.length });
                return;
            }
            case 'lit': token(applyCase(String(v), g.literalCase), false, 'literal'); return;
            case 'tok':
                if (n.terminal === 'STRING') token(quote(String(v)), false, 'value');
                else if (n.terminal === 'NAME') token(name(String(v)), false, feat === 'name' ? 'name' : 'value');
                else token(String(v), false, 'value');
                return;
            default: throw new Error(`a ${n.t} node is not a value`);
        }
    };

    /** `elem` is the current value when walking inside a star or a list, else undefined (the slot is read). */
    const emit = (n: GrammarNode, o: TextObject, elem: unknown): void => {
        switch (n.t) {
            case 'seq': for (const x of n.items) emit(x, o, elem); return;
            case 'opt': if (shown(n, o)) within({ kind: 'item', feature: n.feat }, () => emit(n.item, o, elem)); return;
            case 'star':
                for (const v of values(n, o)) {
                    if (n.feat !== undefined) within({ kind: 'item', feature: n.feat }, () => emit(n.item, o, v));
                    else emit(n.item, o, v);
                }
                return;
            case 'kw': token(n.text, false, classKeywords.has(n) ? 'class' : 'keyword'); return;
            case 'p': token(n.text, true); return;
            case 'nl': if (!n.blank) newline(); else if (!bodyStart) blankPending = true; return;
            case 'assign': {
                // A required name left unset prints nothing: the text then reads back with the error at its place.
                if (elem === undefined && o.slots[n.feat] == null) return;
                const item = n.item;
                itemFor(n.feat, () => value(item, elem !== undefined ? elem : o.slots[n.feat], o, n.feat));
                return;
            }
            case 'list': {
                const vs = asArray(o.slots[n.feat]).filter(v => !(n.item.t === 'assign' && n.item.item.t === 'xref') || resolve(v) || outerOf(v) !== undefined);
                within({ kind: 'list', feature: n.feat }, () => {
                    token(n.open, true);
                    vs.forEach((v, i) => { if (i) token(n.separator, true); emit(n.item, o, v); });
                    token(n.close, true);
                });
                return;
            }
            case 'block':
                // Open, close and empty block are punctuation to the parser, words included.
                within({ kind: 'block', closed: true }, () => {
                    if (!n.items.some(x => present(x, o))) { for (const s of n.empty) token(s, !/^\w/.test(s), 'punctuation'); return; }
                    for (const s of n.open) token(s, !/^\w/.test(s), 'punctuation');
                    newline();
                    bodyStart = true;
                    depth++;
                    for (const x of n.items) emit(x, o, elem);
                    newline();
                    depth--;
                    for (const s of n.close) token(s, !/^\w/.test(s), 'punctuation');
                });
                return;
            default: throw new Error(`a ${n.t} node is not printed inside an object`);
        }
    };

    for (const r of roots) { object(r); newline(); }

    // R-TXT-30: a value left out by a printed owner; one inside an owner left out is counted in it, not listed.
    const printed = new Set(spans.map(s => s.id));
    const insideOf = (id: string, seen = new Set<string>([id])): number => {
        let n = 0;
        for (const c of contained.get(id) ?? []) if (!seen.has(c)) { seen.add(c); n += 1 + insideOf(c, seen); }
        return n;
    };
    const unprinted = left.filter(u => printed.has(u.owner)).map(u => ({ ...u, inside: insideOf(u.id) }));
    return { text: out, spans: [...spans].sort((a, b) => a.start - b.start), refs, unprinted, tree: treeOf(g, out, root) };
}
