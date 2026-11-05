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

import type { ConcreteGrammar, ExprOperator, GrammarNode, ObjectRule } from './concreteGrammar';
import { applyCase, derivedName } from './concreteGrammar';
import { isOuterRef } from './metamodel';
import type { OuterRef, TextObject } from './metamodel';
import { expressionWords, tokenizeText } from './parser';
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
            if (c.kind === 'emitted' && c.start === c.end) {
                // C3b: an INDENT or a DEDENT, zero-width: exactly the one mark read at its place.
                const t = read[k];
                if (k < read.length - 1 && t.start === c.start && t.end === c.end) { const leaf: SyntaxToken = { ...t, role: c.role }; tokens.push(leaf); children.push(leaf); k++; } else ok = false;
            } else if (c.kind === 'emitted') {
                // A zero-width mark at the end of this token is the next chunk's (C3b).
                for (; k < read.length - 1 && read[k].start >= c.start && read[k].end <= c.end && read[k].end > read[k].start; k++) {
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
 * Test-only (#205): the objects the name resolution of `printTextModel` examines, summed over every reference it
 * prints. A load-independent measure of its growth; nothing in the printer reads it.
 */
export const printerNameLookups = { count: 0 };

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
                    const list = contained.get(o.id);
                    if (list) list.push(id); else contained.set(o.id, [id]);
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
        // D4 (P-2026-11-04-0345): a line break cannot stand in a doubling-style string, the lexer stops a string at a line
        // end; it prints as a joined character code, `'line1'#10'line2'`. The first piece is always quoted, empty or not.
        if (style.string.escape === 'double') {
            return s.split(/([\n\r])/).map((part, k) => (k % 2 ? `#${part.charCodeAt(0)}` : k && !part ? '' : q + part.split(q).join(q + q) + q)).join('');
        }
        return q + s.replace(/\\/g, '\\\\').split(q).join(`\\${q}`).replace(/\n/g, '\\n') + q;
    };
    // An expression's word symbol or call word is no name either (C1b; parser.ts `expressionWords`).
    // R-TXT-41 (D3): a name equal to a word that can stand at an optional head name's place is quoted (C1d).
    const words = new Set([...style.reservedNames, ...expressionWords(g), ...(g.headWords ?? [])]);
    const name = (s: string): string => (IDENTIFIER.test(s) && !words.has(s) ? s : quote(s));
    const nameOf = (o: TextObject): unknown => (ruleOf(o).named ? o.slots.name : undefined);
    // Linear resolution (step A): the objects by name, built once, in place of a scan of all objects per reference.
    const byName = new Map<string, TextObject[]>();
    for (const o of objects) {
        const nm = nameOf(o);
        if (typeof nm !== 'string') continue;
        const list = byName.get(nm);
        if (list) list.push(o); else byName.set(nm, [o]);
    }

    // R-TXT-4: the target's name when it is unique among the instances of the reference's type, else its path.
    const ref = (n: Extract<GrammarNode, { t: 'xref' }>, t: TextObject): string => {
        const nm = nameOf(t);
        const candidates = typeof nm === 'string' ? byName.get(nm) ?? [] : [];
        printerNameLookups.count += candidates.length;
        if (typeof nm === 'string' && candidates.filter(x => n.targets.includes(x.cls)).length === 1) return name(nm);
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
    // C1b: no space before the next token (after an expression's open or call word), and the non-word prefix symbol just
    // printed, glued to the next token when the two still read as they print.
    let glueNext = false;
    let prefixed: string | undefined;
    const readsApart = (a: string, b: string): boolean => {
        const key = (s: string): string[] => tokenizeText(s, g).tokens.map(t => `${t.k}:${t.v}`);
        const glued = key(a + b);
        return glued.join(' ') === [...key(a).slice(0, -1), ...key(b)].join(' ');
    };
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

    // C3b: the INDENT and DEDENT of an indented block, zero-width, placed where the next token is written (or at the end).
    let marks: { kind: 'emitted'; start: number; end: number; role: TokenRole }[] = [];
    const mark = (): void => {
        const m = { kind: 'emitted' as const, start: 0, end: 0, role: 'punctuation' as const };
        cur().children.push(m);
        marks.push(m);
    };
    const placeMarks = (): void => { for (const m of marks) m.start = m.end = out.length; marks = []; };
    const token = (s: string, punct = false, role: TokenRole = punct ? 'punctuation' : 'keyword', tight = false): void => {
        if (breakPending) { out += blankPending ? '\n\n' : '\n'; breakPending = false; atLineStart = true; }
        blankPending = false;
        bodyStart = false;
        if (atLineStart) out += ' '.repeat(depth * style.indent);
        else if (prefixed !== undefined ? !readsApart(prefixed, s) : !tight && !glueNext && !(punct && glueBefore.has(s)) && !(lastPunct && glueAfter.has(last))) out += ' ';
        placeMarks();
        glueNext = false;
        prefixed = undefined;
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

    // Step C lane C1b: an expression, printed as the parser reads it back (parser.ts `climb`). A slot is read by a climb
    // from a minimum precedence; a child in it prints without parentheses only where that climb reads it whole and stops
    // where the slot ends. The left operand is read in its parent's climb: the child's last operand must stop before the
    // parent's symbol, and an n-ary child of the parent's own symbol would take the parent's operands into its chain.
    type Expr = Extract<GrammarNode, { t: 'expr' }>;
    const exprs = new Map(g.rules.flatMap(r => (r.t === 'choice' && r.body.t === 'expr' ? [[r.name, r.body] as const] : [])));
    const operatorOf = (e: Expr, c: TextObject): ExprOperator | undefined => e.operators.find(x => x.cls === c.cls);
    const isWord = (s: string): boolean => /^\w/.test(s);
    /** Printed in call form: an n-ary operator with fewer than two operands and a call word. */
    const callForm = (op: ExprOperator, c: TextObject): boolean => op.fixity === 'nary' && op.call !== undefined && asArray(c.slots[op.operands[0]]).length < 2;
    /** The minimum the last operand of `c` is read from, in a climb from `min`. */
    const lastMin = (op: ExprOperator, min: number): number =>
        op.fixity === 'prefix' ? Math.max(op.precedence + 1, min) : op.fixity === 'binary' && op.assoc === 'right' ? op.precedence : op.precedence + 1;
    /** Whether `c` needs parentheses in a slot read from `min`; `parent` when it is the parent's left operand. */
    const parens = (e: Expr, c: TextObject, min: number, parent?: ExprOperator): boolean => {
        const op = operatorOf(e, c);
        if (!op || callForm(op, c)) return false;
        if (parent) return !(parent.precedence < lastMin(op, min)) || (op.fixity === 'nary' && op.symbol === parent.symbol);
        return op.fixity !== 'prefix' && op.precedence < min;
    };
    /** One operand of `o`'s feature `feat`, in an item node; `min` and `parent` as `parens` reads them. */
    const slot = (e: Expr, v: unknown, feat: string, min: number, parent?: ExprOperator): void => {
        const c = resolve(v);
        if (!c) return;
        within({ kind: 'item', feature: feat }, () => {
            if (!parens(e, c, min, parent)) { operand(e, c, min); return; }
            within({ kind: 'paren' }, () => {
                token(e.open, true);
                glueNext = true;
                operand(e, c, -Infinity);
                token(e.close, true, 'punctuation', true);
            });
        });
    };
    /** `c` as an operand read in a climb from `min`: an operator object in its notation, a primary as its rule prints it. */
    const operand = (e: Expr, c: TextObject, min: number): void => {
        const op = operatorOf(e, c);
        if (!op) { object(c); return; }
        const sym = (): void => token(op.symbol, !isWord(op.symbol), isWord(op.symbol) ? 'keyword' : 'punctuation');
        const [a, b] = op.operands;
        opening.push(c.id);
        within({ kind: 'object', id: c.id, cls: c.cls, rule: c.cls, state: 'complete' }, () => {
            if (op.fixity === 'prefix') {
                sym();
                if (!isWord(op.symbol)) prefixed = op.symbol;
                slot(e, c.slots[a], a, lastMin(op, min));
            } else if (op.fixity === 'binary') {
                slot(e, c.slots[a], a, min, op);
                sym();
                slot(e, c.slots[b], b, lastMin(op, min));
            } else if (callForm(op, c)) {
                token(op.call!, false, 'class');
                token(e.open, true, 'punctuation', true);
                glueNext = true;
                asArray(c.slots[a]).forEach((v, i) => { if (i) token(e.separator, true, 'punctuation', true); slot(e, v, a, -Infinity); });
                token(e.close, true, 'punctuation', true);
            } else {
                // The flat chain. With fewer than two operands and no call word no text reads the object back: its operands print alone.
                asArray(c.slots[a]).forEach((v, i) => { if (i) sym(); slot(e, v, a, i ? lastMin(op, min) : min, i ? undefined : op); });
            }
        });
        spans.push({ id: c.id, start: starts.get(c.id) ?? out.length, end: out.length });
    };

    /** `o` and `feat`: the object and feature a reference token is written for. */
    const value = (n: GrammarNode, v: unknown, o?: TextObject, feat?: string): void => {
        switch (n.t) {
            case 'rule': {
                const c = resolve(v);
                const e = exprs.get(n.name);
                if (c && e) operand(e, c, -Infinity); else if (c) object(c, n.name);
                return;
            }
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
            case 'p':
                // C1d: the call layout's parentheses and commas, `Word(32)`.
                token(n.text, true, 'punctuation', n.tight !== undefined);
                if (n.tight === 'around') glueNext = true;
                return;
            case 'alt': {
                // C1d: the first alternative the object fills, else the one that needs nothing (`{}` for a nameless Ref).
                const a = n.alts.find(x => present(x, o)) ?? n.alts.find(x => x.t === 'block');
                if (a) emit(a, o, elem);
                return;
            }
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
                if (style.layout === 'indent') {
                    // C3b: the items on the lines under the head, one level deeper; an empty body prints nothing, no node.
                    if (!n.items.some(x => present(x, o))) return;
                    within({ kind: 'block', closed: true }, () => {
                        newline();
                        bodyStart = true;
                        depth++;
                        mark();
                        for (const x of n.items) emit(x, o, elem);
                        newline();
                        depth--;
                        mark();
                    });
                    return;
                }
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
    placeMarks();

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
