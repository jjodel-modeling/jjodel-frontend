/**
 * Step T6 of the textual notation, part 1 (P-2026-11-02-2327; R-TXT-18, R-TXT-22): which object of the model each object
 * of an edited text is. Pure, on plain objects (metamodel.ts), so it tests without the app.
 *
 * The evidence, strongest first:
 * 0. The id in the text (step T8a; R-TXT-18, R-TXT-55 F9), the `@id` comment at the end of the object's head line
 *    (`textIdsOf`): the model object of that id and class. An id the model does not hold, or holds for another class, is
 *    no evidence; an id on two objects pairs neither of them by id, with a warning.
 * 1. The previous print's spans (R-TXT-22), as the editor carries them over the edit (decorations): a parsed object
 *    whose span overlaps a model object's carried span by at least half of their union, same class, is that object.
 *    A span collapsed to nothing (a cut) is no evidence.
 * 2. Class and name in the same container and containment feature (R-TXT-18). Homonyms there, two or more on each side,
 *    pair by the similarity of step 4, their order among the homonyms the tie-break (T8e); fewer pair by order. All are
 *    uncertain; a nameless object counts as named `null`, so a lone nameless object in a slot is matched, two of them are
 *    homonyms.
 * 2b. Nameless expression objects (the operators and primaries of an expression rule, P-2026-11-04-1158): under each
 *    matched object, the unmatched ones below it in the text pair with the unmatched ones below its match in the model,
 *    equal subtrees first (class, shown attributes, reference targets through the matches, children), then by class
 *    in the slot of a matched parent, the same position first. Certain (evidence `slot`). Step 2 leaves them out.
 * 3. Class and name elsewhere in the model, a single candidate: a move. Uncertain (moves are step T7).
 * 4. Attribute and reference similarity among the unmatched objects of one class (§A.5 step 4, R-TXT-21 (7)): the
 *    share of the set features with equal values, at least 0.6 and 0.2 ahead of the second. A rename. Uncertain.
 *
 * A parsed object matched by none is a creation, a model object matched by none a deletion.
 */

import type { ConcreteGrammar, GrammarNode, ObjectRule } from './concreteGrammar';
import { classFeatures, isOuterRef } from './metamodel';
import type { TextFeature, TextMetamodel, TextObject } from './metamodel';
import { commentsOf } from './parser';
import type { SyntaxNode, TextNode, TextParseResult } from './parser';
import { ID_COMMENT_TAG } from './printer';
import type { ObjectSpan } from './printer';

export type MatchEvidence = 'id' | 'span' | 'name' | 'homonym' | 'move' | 'rename' | 'slot';

export interface ObjectMatch {
    /** The parsed object's id. */
    readonly text: string;
    /** The model object's id. */
    readonly model: string;
    readonly by: MatchEvidence;
    /** Homonym, move or rename: never applied before the user confirms it (R-TXT-18, R-TXT-26). */
    readonly uncertain: boolean;
    /** The similarity of a rename. */
    readonly score?: number;
}

export interface TextMatch {
    /** In text order. */
    readonly matches: readonly ObjectMatch[];
    /** The parsed objects no model object matches, in text order. */
    readonly created: readonly string[];
    /** The model objects no parsed object matches, in model order. */
    readonly deleted: readonly string[];
    /** T8a: one per id the text repeats; absent when there is none. */
    readonly warnings?: readonly MatchWarning[];
}

/** T8a (R-TXT-18): an id written on several objects of the text, which pairs none of them by id. */
export interface MatchWarning {
    readonly id: string;
    /** The parsed objects that carry it, in text order. */
    readonly text: readonly string[];
    readonly message: string;
}

/** R-TXT-21 (7): the cascade's thresholds, to be calibrated in step T8. */
export const RENAME_THRESHOLD = 0.6;
export const RENAME_MARGIN = 0.2;
/** The least overlap, over the union, of a carried span and a parsed span of one object. */
export const SPAN_OVERLAP = 0.5;

/** Where an object sits: its container and the containment feature, or nothing for a top-level object. */
export interface Place {
    readonly owner: string;
    readonly feature: string;
    /** The position in the feature's values. */
    readonly index: number;
}

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);

/** The features an object rule prints: those a node of its body names. A feature it does not name is not in the text. */
export function shownFeatures(rule: ObjectRule): Set<string> {
    const out = new Set<string>();
    const walk = (n: GrammarNode): void => {
        switch (n.t) {
            case 'seq': case 'block': n.items.forEach(walk); return;
            case 'alt': n.alts.forEach(walk); return;
            case 'opt': out.add(n.feat); walk(n.item); return;
            case 'star': if (n.feat !== undefined) out.add(n.feat); walk(n.item); return;
            case 'assign': case 'list': out.add(n.feat); walk(n.item); return;
            default: return;
        }
    };
    walk(rule.body);
    return out;
}

/** The features of each class, cached. */
export function featureTable(mm: TextMetamodel): (cls: string) => readonly TextFeature[] {
    const cache = new Map<string, TextFeature[]>();
    return cls => {
        let fs = cache.get(cls);
        if (!fs) {
            const c = mm.classes.find(k => k.name === cls);
            fs = c ? classFeatures(mm, c) : [];
            cache.set(cls, fs);
        }
        return fs;
    };
}

/** The place of every contained object, read off the containment slots. */
export function placesOf(objects: readonly TextObject[], featuresOf: (cls: string) => readonly TextFeature[]): Map<string, Place> {
    const known = new Set(objects.map(o => o.id));
    const out = new Map<string, Place>();
    for (const o of objects) {
        for (const f of featuresOf(o.cls)) {
            if (f.kind !== 'containment') continue;
            asArray(o.slots[f.name]).forEach((id, index) => {
                if (typeof id === 'string' && known.has(id) && !out.has(id)) out.set(id, { owner: o.id, feature: f.name, index });
            });
        }
    }
    return out;
}

/** The object's identity slot when its rule prints one and it is a string, else null (R-TXT-3). */
export function identityOf(g: ConcreteGrammar, o: TextObject): string | null {
    return g.objects[o.cls]?.named && typeof o.slots.name === 'string' ? o.slots.name : null;
}

/** Equality of two attribute values as the notation reads them: unset is null, an empty list or undefined. */
export function sameValue(a: unknown, b: unknown, ordered: boolean): boolean {
    const xs = asArray(a);
    const ys = asArray(b);
    if (xs.length !== ys.length) return false;
    if (ordered || xs.length <= 1) return xs.every((x, i) => Object.is(x, ys[i]) || x === ys[i]);
    const rest = [...ys];
    for (const x of xs) {
        const i = rest.findIndex(y => Object.is(x, y) || x === y);
        if (i < 0) return false;
        rest.splice(i, 1);
    }
    return true;
}

export interface MatchInput {
    readonly mm: TextMetamodel;
    readonly grammar: ConcreteGrammar;
    /** The model's objects, as the printer took them. */
    readonly model: readonly TextObject[];
    /** The objects of the edited text, in text order, with their spans. */
    readonly parsed: { readonly objects: readonly TextObject[]; readonly spans: readonly ObjectSpan[] };
    /** The previous print's spans (model ids), carried over the edit; absent outside the editor. */
    readonly previous?: readonly ObjectSpan[];
    /** Parsed objects whose container is unknown (orphans of a broken parse): never matched by step 2. */
    readonly unplaced?: ReadonlySet<string>;
    /** T8a: the id each parsed object's head comment carries (`textIdsOf`); absent or empty when the text has none. */
    readonly ids?: ReadonlyMap<string, string>;
    /** T8e: the least similarity of a rename (step 4), `RENAME_THRESHOLD` when absent; only the calibration bench sets it. */
    readonly renameThreshold?: number;
    /** T8e: how far ahead of the second a rename's similarity must be (step 4), `RENAME_MARGIN` when absent; only the calibration bench sets it. */
    readonly renameMargin?: number;
}

/**
 * T8a (R-TXT-55 F9): the id each object of a parsed text carries, by parsed id. A comment of the shape `@id <id>` (in
 * the style's line or block form, nothing else in it) on a line belongs to the first object that starts on that line,
 * the outermost at one offset, as the printer writes it (`printTextModel` with `printIds`); one on a line no object
 * starts on is not an id, nor is any other comment. A second id comment on one line is ignored.
 */
export function textIdsOf(tree: TextNode, g: ConcreteGrammar): Map<string, string> {
    const { line, block } = g.style.comments;
    const shape = new RegExp(`^\\s*${ID_COMMENT_TAG}\\s+(\\S+)\\s*$`);
    const idIn = (text: string): string | undefined => {
        const body = line && text.startsWith(line) ? text.slice(line.length)
            : block && text.length >= block[0].length + block[1].length && text.startsWith(block[0]) && text.endsWith(block[1]) ? text.slice(block[0].length, text.length - block[1].length)
                : undefined;
        return body === undefined ? undefined : shape.exec(body)?.[1];
    };
    // The offset each line starts at, from the text the tokens hold byte for byte.
    const text = tree.tokens.map(t => t.leading + t.raw + t.trailing).join('');
    const lineStarts = [0];
    for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1)) lineStarts.push(i + 1);
    const lineOf = (at: number): number => {
        let lo = 0;
        let hi = lineStarts.length - 1;
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= at) lo = mid; else hi = mid - 1; }
        return lo;
    };
    // Pre-order is text order, a container before what it contains: the first object seen on a line heads it.
    const heads = new Map<number, string>();
    const walk = (n: SyntaxNode): void => {
        if (n.kind === 'object' && n.end > n.start && !heads.has(lineOf(n.start))) heads.set(lineOf(n.start), n.id);
        for (const c of n.children) if (c.kind !== 'token') walk(c);
    };
    walk(tree);
    const out = new Map<string, string>();
    for (const c of commentsOf(tree, g)) {
        const id = idIn(c.text);
        const head = id === undefined ? undefined : heads.get(lineOf(c.start));
        if (head !== undefined && !out.has(head)) out.set(head, id!);
    }
    return out;
}

/** Matches the parsed objects to the model objects (R-TXT-18, R-TXT-22). */
export function matchObjects(input: MatchInput): TextMatch {
    const { grammar: g, model, parsed } = input;
    const featuresOf = featureTable(input.mm);
    const modelPlace = placesOf(model, featuresOf);
    const textPlace = placesOf(parsed.objects, featuresOf);
    const modelById = new Map(model.map(o => [o.id, o]));
    const modelOrder = new Map(model.map((o, i) => [o.id, i]));

    const toModel = new Map<string, ObjectMatch>();
    const taken = new Set<string>();
    const accept = (m: ObjectMatch): void => { toModel.set(m.text, m); taken.add(m.model); };

    // 0. Ids in the text (T8a): an id on two objects is no evidence for either, and a warning.
    let warnings: MatchWarning[] | undefined;
    if (input.ids?.size) {
        const holders = new Map<string, TextObject[]>();
        for (const t of parsed.objects) {
            const id = input.ids.get(t.id);
            if (id === undefined) continue;
            const ts = holders.get(id);
            if (ts) ts.push(t); else holders.set(id, [t]);
        }
        for (const [id, ts] of holders) {
            if (ts.length > 1) {
                (warnings ??= []).push({ id, text: ts.map(t => t.id), message: `The id ${id} is written on ${ts.length} objects: none of them keeps it.` });
                continue;
            }
            const m = modelById.get(id);
            if (m && m.cls === ts[0].cls && !taken.has(m.id)) accept({ text: ts[0].id, model: m.id, by: 'id', uncertain: false });
        }
    }

    // 1. Spans (R-TXT-22).
    if (input.previous?.length) {
        const textSpan = new Map(parsed.spans.map(s => [s.id, s]));
        const pairs: { text: string; model: string; overlap: number; order: number }[] = [];
        parsed.objects.forEach((t, order) => {
            const ts = textSpan.get(t.id);
            if (!ts) return;
            for (const ms of input.previous!) {
                const m = modelById.get(ms.id);
                if (!m || m.cls !== t.cls || ms.end <= ms.start) continue;
                const inter = Math.min(ts.end, ms.end) - Math.max(ts.start, ms.start);
                const union = Math.max(ts.end, ms.end) - Math.min(ts.start, ms.start);
                const overlap = inter > 0 && union > 0 ? inter / union : 0;
                if (overlap >= SPAN_OVERLAP) pairs.push({ text: t.id, model: m.id, overlap, order });
            }
        });
        pairs.sort((a, b) => b.overlap - a.overlap || a.order - b.order);
        for (const p of pairs) if (!toModel.has(p.text) && !taken.has(p.model)) accept({ text: p.text, model: p.model, by: 'span', uncertain: false });
    }

    // 2. Class and name in the same container, top-down: text order puts a container before what it contains.
    const containerKey = (place: Place | undefined): string | null => {
        if (!place) return '';
        const owner = toModel.get(place.owner);
        return owner ? owner.model : null;
    };
    const slotOf = (place: Place | undefined): string => (place ? place.feature : '');
    /** The features `similarity` compares for a class: what its rule prints, other than the name and what it contains. */
    const contentFeatures = (cls: string): readonly TextFeature[] => {
        const rule = g.objects[cls];
        if (!rule) return [];
        const shown = shownFeatures(rule);
        return featuresOf(cls).filter(f => f.kind !== 'containment' && f.name !== 'name' && shown.has(f.name));
    };
    const expr = expressionClasses(g);
    for (const t of parsed.objects) {
        if (toModel.has(t.id) || input.unplaced?.has(t.id) || expr.has(t.cls)) continue;
        const tp = textPlace.get(t.id);
        const key = containerKey(tp);
        if (key === null) continue;
        const name = identityOf(g, t);
        const siblings = parsed.objects.filter(x => !toModel.has(x.id) && !input.unplaced?.has(x.id) && x.cls === t.cls && identityOf(g, x) === name
            && (textPlace.get(x.id)?.owner ?? '') === (tp?.owner ?? '') && slotOf(textPlace.get(x.id)) === slotOf(tp));
        const position = (id: string): number => modelPlace.get(id)?.index ?? modelOrder.get(id) ?? 0;
        const candidates = model.filter(m => !taken.has(m.id) && !expr.has(m.cls) && m.cls === t.cls && identityOf(g, m) === name
            && (modelPlace.get(m.id)?.owner ?? '') === key && slotOf(modelPlace.get(m.id)) === slotOf(tp))
            .sort((a, b) => position(a.id) - position(b.id));
        const homonyms = siblings.length > 1 || candidates.length > 1;
        const paired = siblings.length > 1 && candidates.length > 1 ? pairByContent(siblings, candidates, contentFeatures(t.cls), toModel)
            : siblings.flatMap((s, i) => (candidates[i] ? [[s, candidates[i]] as const] : []));
        for (const [s, m] of paired) accept({ text: s.id, model: m.id, by: homonyms ? 'homonym' : 'name', uncertain: homonyms });
    }

    // 2b. Nameless expression objects, by slot under the matched objects.
    if (expr.size) matchExpressions({ g, expr, featuresOf, model, parsed: parsed.objects, unplaced: input.unplaced, textPlace, modelPlace, toModel, taken, accept });

    // 3. Class and name elsewhere in the model: a move, when one candidate only.
    for (const t of parsed.objects) {
        if (toModel.has(t.id)) continue;
        const name = identityOf(g, t);
        if (name === null) continue;
        const candidates = model.filter(m => !taken.has(m.id) && m.cls === t.cls && identityOf(g, m) === name);
        if (candidates.length === 1) accept({ text: t.id, model: candidates[0].id, by: 'move', uncertain: true });
    }

    // 4. Similarity among the unmatched of one class: a rename.
    const freeText = parsed.objects.filter(t => !toModel.has(t.id));
    const freeModel = model.filter(m => !taken.has(m.id));
    const scored: { text: string; model: string; score: number; order: number }[] = [];
    const renameThreshold = input.renameThreshold ?? RENAME_THRESHOLD;
    const renameMargin = input.renameMargin ?? RENAME_MARGIN;
    freeText.forEach((t, order) => {
        const rule = g.objects[t.cls];
        if (!rule) return;
        const fs = contentFeatures(t.cls);
        const scores = freeModel.filter(m => m.cls === t.cls).map(m => ({ m, score: similarity(fs, t, m, toModel) }))
            .sort((a, b) => b.score - a.score);
        const [best, second] = scores;
        if (best && best.score >= renameThreshold && best.score - (second?.score ?? 0) >= renameMargin) {
            scored.push({ text: t.id, model: best.m.id, score: best.score, order });
        }
    });
    scored.sort((a, b) => b.score - a.score || a.order - b.order);
    for (const s of scored) if (!taken.has(s.model)) accept({ text: s.text, model: s.model, by: 'rename', uncertain: true, score: s.score });

    return {
        matches: parsed.objects.flatMap(t => { const m = toModel.get(t.id); return m ? [m] : []; }),
        created: parsed.objects.filter(t => !toModel.has(t.id)).map(t => t.id),
        deleted: model.filter(m => !taken.has(m.id)).map(m => m.id),
        ...(warnings ? { warnings } : {}),
    };
}

/** An object read inside a skipped block (step B's `unknown container`), and the model object it matched, if any. */
export interface OrphanMatch {
    readonly text: string;
    readonly model?: string;
}

/**
 * R-TXT-22 on a text that may be broken, for the outline and the synced selection only: never for the diff, which a text
 * with an error never reaches (R-TXT-21 (8)). The orphans of the parse are matched by span, move or rename, never by
 * class and name in a container, which they have none of.
 */
export function displayMatch(input: Omit<MatchInput, 'parsed' | 'unplaced'> & { readonly parsed: TextParseResult }): { readonly match: TextMatch; readonly orphans: readonly OrphanMatch[] } {
    const ids: string[] = [];
    const walk = (n: SyntaxNode): void => {
        if (n.kind === 'object' && n.orphan) ids.push(n.id);
        for (const c of n.children) if (c.kind !== 'token') walk(c);
    };
    if (input.parsed.tree) walk(input.parsed.tree);
    const match = matchObjects({ ...input, unplaced: new Set(ids) });
    const byText = new Map(match.matches.map(m => [m.text, m.model]));
    return { match, orphans: ids.map(id => { const model = byText.get(id); return model === undefined ? { text: id } : { text: id, model }; }) };
}

/** The classes of nameless objects an expression rule reads: its operators and its primaries, unnamed. */
export function expressionClasses(g: ConcreteGrammar): Set<string> {
    const out = new Set<string>();
    for (const r of g.rules) {
        if (r.body.t !== 'expr') continue;
        for (const o of r.body.operators) out.add(o.cls);
        for (const p of r.body.primaries) if (p.t === 'rule') out.add(p.name);
    }
    for (const c of [...out]) if (!g.objects[c] || g.objects[c].named) out.delete(c);
    return out;
}

interface ExprMatchInput {
    readonly g: ConcreteGrammar;
    readonly expr: ReadonlySet<string>;
    readonly featuresOf: (cls: string) => readonly TextFeature[];
    readonly model: readonly TextObject[];
    readonly parsed: readonly TextObject[];
    readonly unplaced?: ReadonlySet<string>;
    readonly textPlace: ReadonlyMap<string, Place>;
    readonly modelPlace: ReadonlyMap<string, Place>;
    readonly toModel: ReadonlyMap<string, ObjectMatch>;
    readonly taken: ReadonlySet<string>;
    readonly accept: (m: ObjectMatch) => void;
}

/** Step 2b of `matchObjects`. */
function matchExpressions(x: ExprMatchInput): void {
    const { g, expr, featuresOf, toModel, taken } = x;
    const textById = new Map(x.parsed.map(o => [o.id, o]));
    const modelById = new Map(x.model.map(o => [o.id, o]));
    const children = (o: TextObject, byId: ReadonlyMap<string, TextObject>): [string, TextObject[]][] =>
        featuresOf(o.cls).filter(f => f.kind === 'containment')
            .map(f => [f.name, asArray(o.slots[f.name]).flatMap(id => { const c = typeof id === 'string' ? byId.get(id) : undefined; return c ? [c] : []; })]);
    const freeText = (o: TextObject): boolean => expr.has(o.cls) && !toModel.has(o.id) && !x.unplaced?.has(o.id);
    const freeModel = (o: TextObject): boolean => expr.has(o.cls) && !taken.has(o.id);
    /** The free expression objects below `root`, in pre-order, not through a matched or a named object. */
    const below = (root: TextObject, byId: ReadonlyMap<string, TextObject>, free: (o: TextObject) => boolean): TextObject[] => {
        const out: TextObject[] = [];
        const walk = (o: TextObject): void => { for (const [, cs] of children(o, byId)) for (const c of cs) if (free(c)) { out.push(c); walk(c); } };
        walk(root);
        return out;
    };
    // The deep signature of a subtree: what the text shows of it, references through the matches.
    const signature = (o: TextObject, byId: ReadonlyMap<string, TextObject>, side: 'text' | 'model', memo: Map<string, string>): string => {
        const known = memo.get(o.id);
        if (known !== undefined) return known;
        const rule = g.objects[o.cls];
        const shown = rule ? shownFeatures(rule) : new Set<string>();
        const parts: string[] = [o.cls];
        for (const f of featuresOf(o.cls)) {
            if (!shown.has(f.name) && f.kind !== 'containment') continue;
            const vs = asArray(o.slots[f.name]);
            if (f.kind === 'attribute') parts.push(`${f.name}=${JSON.stringify(vs)}`);
            else if (f.kind === 'containment') {
                parts.push(`${f.name}[${vs.map(id => { const c = typeof id === 'string' ? byId.get(id) : undefined; return c ? signature(c, byId, side, memo) : '?'; }).join(',')}]`);
            } else {
                const target = (id: unknown): string => (isOuterRef(id) ? `o:${id.outer}` : typeof id !== 'string' ? '?' : side === 'model' ? id : toModel.get(id)?.model ?? `t:${id}`);
                parts.push(`${f.name}->${vs.map(target).join(',')}`);
            }
        }
        const sig = `${parts.join(' ')}`;
        memo.set(o.id, sig);
        return sig;
    };
    const pairDeep = (t: TextObject, m: TextObject): void => {
        x.accept({ text: t.id, model: m.id, by: 'slot', uncertain: false });
        const mc = new Map(children(m, modelById));
        for (const [f, ts] of children(t, textById)) ts.forEach((c, i) => { const d = mc.get(f)?.[i]; if (d && freeText(c) && freeModel(d)) pairDeep(c, d); });
    };
    const textMemo = new Map<string, string>();
    const modelMemo = new Map<string, string>();
    for (const t0 of x.parsed) {
        const anchor = toModel.get(t0.id);
        if (!anchor) continue;
        const m0 = modelById.get(anchor.model);
        if (!m0) continue;
        // Equal subtrees, in pre-order.
        for (const t of below(t0, textById, freeText)) {
            if (!freeText(t)) continue;
            const sig = signature(t, textById, 'text', textMemo);
            const m = below(m0, modelById, freeModel).find(c => signature(c, modelById, 'model', modelMemo) === sig);
            if (m) pairDeep(t, m);
        }
        // The rest: by class in the slot of a matched parent, the same position first.
        for (const t of below(t0, textById, freeText)) {
            if (!freeText(t)) continue;
            const tp = x.textPlace.get(t.id);
            const parent = tp ? toModel.get(tp.owner)?.model : undefined;
            if (!tp || parent === undefined) continue;
            const options = below(m0, modelById, freeModel).filter(c => c.cls === t.cls && x.modelPlace.get(c.id)?.owner === parent && x.modelPlace.get(c.id)?.feature === tp.feature);
            const m = options.find(c => x.modelPlace.get(c.id)?.index === tp.index) ?? options[0];
            if (m) x.accept({ text: t.id, model: m.id, by: 'slot', uncertain: false });
        }
    }
}

/**
 * T8e (step 2): homonyms, two or more on each side, paired by `similarity`, the highest first; among equal scores the
 * text order, then the model order, so identical homonyms pair by order. As many pairs as the shorter side: the lowest
 * score pairs too, the pairing stays uncertain.
 */
function pairByContent(ts: readonly TextObject[], ms: readonly TextObject[], fs: readonly TextFeature[], toModel: ReadonlyMap<string, ObjectMatch>): (readonly [TextObject, TextObject])[] {
    const scored = ts.flatMap((t, i) => ms.map((m, j) => ({ t, m, i, j, score: similarity(fs, t, m, toModel) })));
    scored.sort((a, b) => b.score - a.score || a.i - b.i || a.j - b.j);
    const usedText = new Set<string>();
    const usedModel = new Set<string>();
    const out: (readonly [TextObject, TextObject])[] = [];
    for (const { t, m } of scored) {
        if (usedText.has(t.id) || usedModel.has(m.id)) continue;
        usedText.add(t.id);
        usedModel.add(m.id);
        out.push([t, m]);
    }
    return out;
}

/** Equal set features over the features set on either side; a reference is equal when its targets match. */
function similarity(fs: readonly TextFeature[], t: TextObject, m: TextObject, toModel: ReadonlyMap<string, ObjectMatch>): number {
    let union = 0;
    let equal = 0;
    for (const f of fs) {
        const tv = asArray(t.slots[f.name]);
        const mv = asArray(m.slots[f.name]);
        if (tv.length === 0 && mv.length === 0) continue;
        union++;
        // R-TXT-32: an outer target is its own id on both sides.
        const mapped = f.kind === 'attribute' ? tv : tv.map(id => (typeof id === 'string' ? toModel.get(id)?.model : isOuterRef(id) ? id.outer : undefined));
        if (sameValue(mapped, mv, false)) equal++;
    }
    return union === 0 ? 0 : equal / union;
}
