/**
 * The printer: a model as text, by walking the concrete grammar with each object
 * (docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.4, serialization rule). Every choice is decided by the
 * data: an optional part prints iff its feature is set (R-TXT-5), a star iterates the feature's values in model order,
 * a rule over several classes takes the object's own class. The JjGen generator
 * `public/examples/codegen/default-text.generator.json` is the reference it must agree with (R-TXT-14).
 *
 * The span of each object (from its first token to its last) is returned with the text: the origins that step T6
 * matches a re-parsed text against (R-TXT-22).
 */

import type { ConcreteGrammar, GrammarNode, ObjectRule } from './concreteGrammar';
import { applyCase } from './concreteGrammar';
import type { TextObject } from './metamodel';

/** `[start, end)` offsets into the printed text. */
export interface ObjectSpan {
    readonly id: string;
    readonly start: number;
    readonly end: number;
}

export interface TextPrintResult {
    readonly text: string;
    /** One per printed object, in text order (an object before the objects it contains). */
    readonly spans: readonly ObjectSpan[];
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

const isSet = (v: unknown): boolean => v != null && !(Array.isArray(v) && v.length === 0);
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);

/**
 * Prints the objects of a model. The roots are the objects no other object contains, in the order given; a
 * reference or containment slot names its targets by id, and an id that names no object is skipped.
 */
export function printTextModel(g: ConcreteGrammar, objects: readonly TextObject[]): TextPrintResult {
    const style = g.style;
    const byId = new Map(objects.map(o => [o.id, o]));
    const ruleOf = (o: TextObject): ObjectRule => {
        const r = g.objects[o.cls];
        if (!r) throw new Error(`no rule for class ${o.cls} (abstract, or not in the metamodel)`);
        return r;
    };

    // The containment tree: each object's container and its path segment (`parts[1]`, or `f` when single-valued).
    const parent = new Map<string, { readonly owner: TextObject; readonly segment: string }>();
    for (const o of objects) {
        for (const f of ruleOf(o).features) {
            if (f.kind !== 'containment') continue;
            const v = o.slots[f.name];
            asArray(v).forEach((id, i) => {
                if (typeof id === 'string' && byId.has(id)) parent.set(id, { owner: o, segment: Array.isArray(v) ? `${f.name}[${i}]` : f.name });
            });
        }
    }
    const roots = objects.filter(o => !parent.has(o.id));
    const rootIndex = new Map(roots.map((r, i) => [r.id, i]));

    // R-TXT-11: a path from the root, `[k]` first when there are several roots; the only root itself is `[0]`.
    const path = (t: TextObject): string => {
        const up = parent.get(t.id);
        if (!up) return `[${rootIndex.get(t.id)}]`;
        const prefix = !parent.has(up.owner.id) && roots.length === 1 ? '' : `${path(up.owner)}.`;
        return prefix + up.segment;
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
    const resolve = (id: unknown): TextObject | undefined => (typeof id === 'string' ? byId.get(id) : undefined);

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
    const spans: ObjectSpan[] = [];
    const starts = new Map<string, number>();

    const token = (s: string, punct = false): void => {
        if (breakPending) { out += '\n'; breakPending = false; atLineStart = true; }
        if (atLineStart) out += ' '.repeat(depth * style.indent);
        else if (!(punct && glueBefore.has(s)) && !(lastPunct && glueAfter.has(last))) out += ' ';
        for (const id of opening) starts.set(id, out.length);
        opening = [];
        out += s;
        atLineStart = false;
        last = s;
        lastPunct = punct;
    };
    const newline = (): void => { if (!atLineStart) breakPending = true; };

    const object = (o: TextObject): void => {
        opening.push(o.id);
        emit(ruleOf(o).body, o, undefined);
        spans.push({ id: o.id, start: starts.get(o.id) ?? out.length, end: out.length });
    };

    const present = (n: GrammarNode, o: TextObject): boolean => {
        switch (n.t) {
            case 'opt': case 'star': case 'list': case 'assign': return n.feat === undefined || isSet(o.slots[n.feat]);
            case 'seq': return n.items.some(x => present(x, o));
            default: return false;
        }
    };

    const value = (n: GrammarNode, v: unknown): void => {
        switch (n.t) {
            case 'rule': { const c = resolve(v); if (c) object(c); return; }
            case 'xref': { const t = resolve(v); if (t) token(ref(n, t)); return; }
            case 'lit': token(applyCase(String(v), g.literalCase)); return;
            case 'tok':
                if (n.terminal === 'STRING') token(quote(String(v)));
                else if (n.terminal === 'NAME') token(name(String(v)));
                else token(String(v));
                return;
            default: throw new Error(`a ${n.t} node is not a value`);
        }
    };

    /** `elem` is the current value when walking inside a star or a list, else undefined (the slot is read). */
    const emit = (n: GrammarNode, o: TextObject, elem: unknown): void => {
        switch (n.t) {
            case 'seq': for (const x of n.items) emit(x, o, elem); return;
            case 'opt': if (isSet(o.slots[n.feat])) emit(n.item, o, elem); return;
            case 'star': if (n.feat !== undefined) for (const v of asArray(o.slots[n.feat])) emit(n.item, o, v); return;
            case 'kw': token(n.text); return;
            case 'p': token(n.text, true); return;
            case 'nl': newline(); return;
            case 'assign': value(n.item, elem !== undefined ? elem : o.slots[n.feat]); return;
            case 'list': {
                const vs = asArray(o.slots[n.feat]).filter(v => !(n.item.t === 'assign' && n.item.item.t === 'xref') || resolve(v));
                token(n.open, true);
                vs.forEach((v, i) => { if (i) token(n.separator, true); emit(n.item, o, v); });
                token(n.close, true);
                return;
            }
            case 'block':
                if (!n.items.some(x => present(x, o))) { for (const s of n.empty) token(s, !/^\w/.test(s)); return; }
                for (const s of n.open) token(s, !/^\w/.test(s));
                newline();
                depth++;
                for (const x of n.items) emit(x, o, elem);
                newline();
                depth--;
                for (const s of n.close) token(s, !/^\w/.test(s));
                return;
            default: throw new Error(`a ${n.t} node is not printed inside an object`);
        }
    };

    for (const r of roots) { object(r); newline(); }
    return { text: out, spans: [...spans].sort((a, b) => a.start - b.start) };
}
