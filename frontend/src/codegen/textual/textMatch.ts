/**
 * Step T6 of the textual notation, part 1 (P-2026-11-02-2327; R-TXT-18, R-TXT-22): which object of the model each object
 * of an edited text is. Pure, on plain objects (metamodel.ts), so it tests without the app.
 *
 * The evidence, strongest first:
 * 1. The previous print's spans (R-TXT-22), as the editor carries them over the edit (decorations): a parsed object
 *    whose span overlaps a model object's carried span by at least half of their union, same class, is that object.
 *    A span collapsed to nothing (a cut) is no evidence.
 * 2. Class and name in the same container and containment feature (R-TXT-18). Homonyms there pair by their order
 *    among the homonyms and are uncertain; a nameless object counts as named `null`, so a lone nameless object in a
 *    slot is matched, two of them are homonyms.
 * 3. Class and name elsewhere in the model, a single candidate: a move. Uncertain (moves are step T7).
 * 4. Attribute and reference similarity among the unmatched objects of one class (§A.5 step 4, R-TXT-21 (7)): the
 *    share of the set features with equal values, at least 0.6 and 0.2 ahead of the second. A rename. Uncertain.
 *
 * A parsed object matched by none is a creation, a model object matched by none a deletion.
 */

import type { ConcreteGrammar, GrammarNode, ObjectRule } from './concreteGrammar';
import { classFeatures } from './metamodel';
import type { TextFeature, TextMetamodel, TextObject } from './metamodel';
import type { ObjectSpan } from './printer';

export type MatchEvidence = 'span' | 'name' | 'homonym' | 'move' | 'rename';

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
    for (const t of parsed.objects) {
        if (toModel.has(t.id)) continue;
        const tp = textPlace.get(t.id);
        const key = containerKey(tp);
        if (key === null) continue;
        const name = identityOf(g, t);
        const siblings = parsed.objects.filter(x => !toModel.has(x.id) && x.cls === t.cls && identityOf(g, x) === name
            && (textPlace.get(x.id)?.owner ?? '') === (tp?.owner ?? '') && slotOf(textPlace.get(x.id)) === slotOf(tp));
        const position = (id: string): number => modelPlace.get(id)?.index ?? modelOrder.get(id) ?? 0;
        const candidates = model.filter(m => !taken.has(m.id) && m.cls === t.cls && identityOf(g, m) === name
            && (modelPlace.get(m.id)?.owner ?? '') === key && slotOf(modelPlace.get(m.id)) === slotOf(tp))
            .sort((a, b) => position(a.id) - position(b.id));
        const homonyms = siblings.length > 1 || candidates.length > 1;
        siblings.forEach((s, i) => {
            const m = candidates[i];
            if (m) accept({ text: s.id, model: m.id, by: homonyms ? 'homonym' : 'name', uncertain: homonyms });
        });
    }

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
    freeText.forEach((t, order) => {
        const rule = g.objects[t.cls];
        if (!rule) return;
        const shown = shownFeatures(rule);
        const fs = featuresOf(t.cls).filter(f => f.kind !== 'containment' && f.name !== 'name' && shown.has(f.name));
        const scores = freeModel.filter(m => m.cls === t.cls).map(m => ({ m, score: similarity(fs, t, m, toModel) }))
            .sort((a, b) => b.score - a.score);
        const [best, second] = scores;
        if (best && best.score >= RENAME_THRESHOLD && best.score - (second?.score ?? 0) >= RENAME_MARGIN) {
            scored.push({ text: t.id, model: best.m.id, score: best.score, order });
        }
    });
    scored.sort((a, b) => b.score - a.score || a.order - b.order);
    for (const s of scored) if (!taken.has(s.model)) accept({ text: s.text, model: s.model, by: 'rename', uncertain: true, score: s.score });

    return {
        matches: parsed.objects.flatMap(t => { const m = toModel.get(t.id); return m ? [m] : []; }),
        created: parsed.objects.filter(t => !toModel.has(t.id)).map(t => t.id),
        deleted: model.filter(m => !taken.has(m.id)).map(m => m.id),
    };
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
        const mapped = f.kind === 'attribute' ? tv : tv.map(id => (typeof id === 'string' ? toModel.get(id)?.model : undefined));
        if (sameValue(mapped, mv, false)) equal++;
    }
    return union === 0 ? 0 : equal / union;
}
