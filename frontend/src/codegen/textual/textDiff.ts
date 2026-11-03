/**
 * Step T6 of the textual notation, parts 2 to 4 and the lines of part 5 (P-2026-11-02-2327; R-TXT-19, R-TXT-21 (5, 6),
 * R-TXT-26, R-TXT-30): the minimal diff between a model and an edited text of it, the reasons not to apply it, and the
 * JjScript lines that apply it. Pure, on plain objects; the run is textApply.ts.
 *
 * The diff (R-TXT-19): create, update an attribute, update a reference, delete. Only the features the object's rule
 * prints are compared: what the notation does not show is preserved, never cleared. A reference target outside the
 * printed objects prints as `@"id"` (R-TXT-32): kept as printed it asks no change, deleted it is cleared or unlinked,
 * anywhere else (an edited id, another owner or feature, a new object) it is refused. An attribute omitted because unset
 * reads back as unset. A
 * many-valued feature compares as a multiset unless declared ordered (R-TXT-21 (5)).
 *
 * Step T7 (P-2026-11-03-1225, P-2026-11-03-1251; R-TXT-19): a matched object in another container, or at the top level,
 * is a move, written as the containment write the core moves an object by (`+=` into a many-valued slot, `=` into a
 * single one, `-=` out of the old slot to the top level). A reorder of an ordered feature re-appends, `-=` then `+=`,
 * what follows the longest prefix of the text order the slot already holds in that order: JjScript appends only.
 *
 * A value the model reads through a default (eval.ts `emptyAttributeDefault`: a declared default, or a mandatory
 * enumeration left empty read as its first literal) is stored empty: the text that prints that default, or omits the
 * attribute, asks for no change, and applying never writes the default unasked (the ticket of P-2026-11-02-2113).
 *
 * The lines (R-TXT-21 (6)) address every model object by a handle that the run registers, before its first line,
 * against the object's id (`executor/handleRegistry.ts`): no name lookup, no new JjScript syntax. In order: the
 * links taken away and the references cleared, the deletions (a container takes its contents, `delete` cleans the
 * pointers to it), the creations in text order, the attributes, the links added and the references set. T7 adds the
 * moves into existing containers or to the top level before the deletions, the moves into created containers in text
 * order with the creations, and the reorders last.
 */

import type { ConcreteGrammar } from './concreteGrammar';
import { isOuterRef } from './metamodel';
import type { TextFeature, TextMetamodel, TextObject } from './metamodel';
import { isWord, jjscriptString, valueText } from './modelLines';
import type { LineProblem } from './modelLines';
import { isApplicableParse } from './parser';
import type { TextParseResult } from './parser';
import type { ObjectSpan, UnprintedObject } from './printer';
import { hasUnprinted } from './printer';
import { featureTable, identityOf, matchObjects, placesOf, sameValue, shownFeatures } from './textMatch';
import type { ObjectMatch, TextMatch } from './textMatch';

/**
 * An object of the model (`model`) or a new one of the text (`text`); the ids of the two sides may coincide. `outer`: a
 * reference target outside the printed objects, by its id (R-TXT-32).
 */
export type ObjectRef = { readonly model: string } | { readonly text: string } | { readonly outer: string };

export type DiffOp =
    | { readonly op: 'create'; readonly text: string; readonly cls: string; readonly into?: { readonly owner: ObjectRef; readonly feature: string } }
    /** `value` null clears the attribute; an array replaces the values of a many-valued one. */
    | { readonly op: 'attribute'; readonly target: ObjectRef; readonly feature: string; readonly value: unknown }
    /** A single-valued reference: `to` null clears it. */
    | { readonly op: 'reference'; readonly target: ObjectRef; readonly feature: string; readonly to: ObjectRef | null }
    | { readonly op: 'link' | 'unlink'; readonly target: ObjectRef; readonly feature: string; readonly to: ObjectRef }
    /** Takes the objects it contains with it. */
    | { readonly op: 'delete'; readonly model: string }
    /**
     * T7: the model object into another containment slot (`into`), or to the top level (`into` null) out of `from`, its
     * slot when the op runs (null when it is at the top level).
     */
    | { readonly op: 'move'; readonly model: string; readonly into: { readonly owner: ObjectRef; readonly feature: string } | null;
        readonly from: { readonly owner: string; readonly feature: string } | null }
    /** T7: `to` taken out of the ordered many-valued slot and appended again at its end. */
    | { readonly op: 'reorder'; readonly target: ObjectRef; readonly feature: string; readonly to: ObjectRef };

/** What the diff could not express before step T7: a move, or a reorder of an ordered feature. None is reported since T7. */
export interface UnsupportedChange {
    readonly kind: 'move' | 'reorder';
    readonly model: string;
    readonly feature: string;
}

/** R-TXT-32: an `@"id"` of the text that is not where the model holds that id: an edited id, another owner or feature, a new object. */
export interface MisplacedOuter {
    readonly target: ObjectRef;
    readonly feature: string;
    readonly id: string;
}

export interface TextDiff {
    readonly match: TextMatch;
    readonly ops: readonly DiffOp[];
    readonly unsupported: readonly UnsupportedChange[];
    /** R-TXT-32: refused with `outer`; absent when none. */
    readonly outer?: readonly MisplacedOuter[];
}

export interface DiffInput {
    readonly mm: TextMetamodel;
    readonly grammar: ConcreteGrammar;
    /** The model's objects as the printer took them: an empty slot holds what the eval context reads (a default). */
    readonly model: readonly TextObject[];
    /** The attribute slots read through a default, empty in the model: object id to feature names. */
    readonly defaults?: ReadonlyMap<string, ReadonlySet<string>>;
    readonly parsed: TextParseResult;
    /** The previous print's spans, carried over the edit (R-TXT-22). */
    readonly previous?: readonly ObjectSpan[];
    /** Whether a feature is declared ordered (R-TXT-19); by default its `ordered` in the metamodel, absent read as unordered. */
    readonly ordered?: (cls: string, feature: string) => boolean;
}

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);
const isUnset = (v: unknown): boolean => asArray(v).length === 0;
const keyOf = (r: ObjectRef): string => ('model' in r ? `m:${r.model}` : 'text' in r ? `t:${r.text}` : `o:${r.outer}`);

/** The diff between the model and the parsed text (R-TXT-19). The parse must be applicable (`isApplicableParse`). */
export function diffText(input: DiffInput): TextDiff {
    const { grammar: g, model, parsed } = input;
    const featuresOf = featureTable(input.mm);
    const ordered = input.ordered ?? ((cls: string, feature: string) => featuresOf(cls).some(f => f.name === feature && f.ordered === true));
    const match = matchObjects(input);
    const modelOf = new Map<string, ObjectMatch>(match.matches.map(m => [m.text, m]));
    const modelById = new Map(model.map(o => [o.id, o]));
    const deleted = new Set(match.deleted);
    const ref = (textId: string): ObjectRef => { const m = modelOf.get(textId); return m ? { model: m.model } : { text: textId }; };
    const modelPlace = placesOf(model, featuresOf);
    const textPlace = placesOf(parsed.objects, featuresOf);

    const removals: DiffOp[] = [];
    const creates: DiffOp[] = [];
    const attributes: DiffOp[] = [];
    const additions: DiffOp[] = [];
    const moves: { readonly model: string; readonly into: { readonly owner: ObjectRef; readonly feature: string } | null; readonly from: { readonly owner: string; readonly feature: string } | null }[] = [];
    const unsupported: UnsupportedChange[] = [];
    const outer: MisplacedOuter[] = [];

    /** A reference slot's targets as the text prints them: a model object, or by its id one outside them (R-TXT-32). */
    const modelTargets = (v: unknown): ObjectRef[] =>
        asArray(v).filter((id): id is string => typeof id === 'string').map(id => (modelById.has(id) ? { model: id } : { outer: id }));
    const parsedTargets = (v: unknown): ObjectRef[] => asArray(v).flatMap((id): ObjectRef[] =>
        (typeof id === 'string' ? [ref(id)] : isOuterRef(id) ? [{ outer: id.outer }] : []));
    const misplaced = (target: ObjectRef, feature: string, r: ObjectRef): boolean => {
        if (!('outer' in r)) return false;
        outer.push({ target, feature, id: r.outer });
        return true;
    };

    const compare = (target: ObjectRef, t: TextObject, m: TextObject | undefined): void => {
        const rule = g.objects[t.cls];
        if (!rule) return;
        const shown = shownFeatures(rule);
        for (const f of featuresOf(t.cls)) {
            if (!shown.has(f.name) || f.kind === 'containment') continue;
            if (f.kind === 'attribute') attribute(target, f, t, m);
            else reference(target, f, t, m);
        }
    };

    const attribute = (target: ObjectRef, f: TextFeature, t: TextObject, m: TextObject | undefined): void => {
        const now = t.slots[f.name];
        if (!m) {
            if (!isUnset(now)) attributes.push({ op: 'attribute', target, feature: f.name, value: f.many ? asArray(now) : now });
            return;
        }
        const was = m.slots[f.name];
        if (sameValue(now, was, f.many && ordered(t.cls, f.name))) return;
        // Read through a default: the slot is empty, so a text that leaves it out asks for no change either.
        if (input.defaults?.get(m.id)?.has(f.name) && isUnset(now)) return;
        attributes.push({ op: 'attribute', target, feature: f.name, value: f.many ? asArray(now) : isUnset(now) ? null : now });
    };

    const reference = (target: ObjectRef, f: TextFeature, t: TextObject, m: TextObject | undefined): void => {
        const now = parsedTargets(t.slots[f.name]);
        const was = m ? modelTargets(m.slots[f.name]) : [];
        if (!f.many) {
            const to = now[0] ?? null;
            const from = was[0] ?? null;
            if ((to && keyOf(to)) === (from && keyOf(from))) return;
            if (to && misplaced(target, f.name, to)) return;
            if (to === null && m && !isUnset(m.slots[f.name]) && from === null) return; // a target the text cannot name
            if (to === null && from && 'model' in from && deleted.has(from.model)) return; // `delete` clears it
            (to === null ? removals : additions).push({ op: 'reference', target, feature: f.name, to });
            return;
        }
        const rest = [...was];
        const added: ObjectRef[] = [];
        for (const r of now) {
            const i = rest.findIndex(x => keyOf(x) === keyOf(r));
            if (i >= 0) rest.splice(i, 1); else added.push(r);
        }
        for (const r of rest) if (!('model' in r && deleted.has(r.model))) removals.push({ op: 'unlink', target, feature: f.name, to: r });
        for (const r of added) if (!misplaced(target, f.name, r)) additions.push({ op: 'link', target, feature: f.name, to: r });
    };

    for (const t of parsed.objects) {
        const mt = modelOf.get(t.id);
        if (!mt) {
            const place = textPlace.get(t.id);
            creates.push({ op: 'create', text: t.id, cls: t.cls, ...(place ? { into: { owner: ref(place.owner), feature: place.feature } } : {}) });
            compare({ text: t.id }, t, undefined);
            continue;
        }
        const m = modelById.get(mt.model)!;
        compare({ model: m.id }, t, m);
        // The container: a matched object elsewhere is a move (T7), in text order, a container before what it holds.
        const tp = textPlace.get(t.id);
        const mp = modelPlace.get(m.id);
        const tOwner = tp ? keyOf(ref(tp.owner)) : '';
        const mOwner = mp ? keyOf({ model: mp.owner }) : '';
        if (tOwner !== mOwner || (tp?.feature ?? '') !== (mp?.feature ?? '')) {
            moves.push({ model: m.id, into: tp ? { owner: ref(tp.owner), feature: tp.feature } : null, from: mp ? { owner: mp.owner, feature: mp.feature } : null });
        }
    }

    // A move into a created container waits for its creation, in text order with the creations; one out of a container
    // the deletions take goes before them: to the top level first when its new container is yet to be created.
    const movedIds = new Set(moves.map(x => x.model));
    const doomed = (id: string): boolean => {
        for (let p = modelPlace.get(id); p; p = modelPlace.get(p.owner)) {
            if (movedIds.has(p.owner)) return false;
            if (deleted.has(p.owner)) return true;
        }
        return false;
    };
    // A move into a single-valued slot whose object the deletions take waits for them: the slot is emptied first.
    const evicts = (x: typeof moves[number]): boolean => {
        if (!x.into || !('model' in x.into.owner)) return false;
        const owner = modelById.get(x.into.owner.model);
        const f = owner ? featuresOf(owner.cls).find(g => g.name === x.into!.feature) : undefined;
        const now = owner ? asArray(owner.slots[x.into.feature])[0] : undefined;
        return !!f && !f.many && typeof now === 'string' && deleted.has(now);
    };
    const early: DiffOp[] = [];
    for (const x of moves) {
        if (evicts(x)) { if (doomed(x.model)) early.push(moveOp({ ...x, into: null })); }
        else if (!x.into || !('text' in x.into.owner)) early.push(moveOp(x));
        else if (doomed(x.model)) early.push(moveOp({ ...x, into: null }));
    }
    const evicting = moves.filter(evicts).map(x => moveOp({ ...x, from: doomed(x.model) ? null : x.from }));
    const late = new Map(moves.filter(x => x.into && 'text' in x.into.owner).map(x => [x.model, moveOp({ ...x, from: doomed(x.model) ? null : x.from })]));

    // Deletions: the topmost only, a container takes what it contains.
    const deletions: DiffOp[] = match.deleted
        .filter(id => { const p = modelPlace.get(id); return !(p && deleted.has(p.owner)); })
        .map(id => ({ op: 'delete', model: id }));

    const createOf = new Map(creates.flatMap(c => (c.op === 'create' ? [[c.text, c] as const] : [])));
    const placedOps: DiffOp[] = parsed.objects.flatMap((t): DiffOp[] => {
        const op = createOf.get(t.id) ?? late.get(modelOf.get(t.id)?.model ?? '');
        return op ? [op] : [];
    });
    const ops = [...removals, ...early, ...deletions, ...evicting, ...placedOps, ...attributes, ...additions];
    ops.push(...reorders(ops));
    return { match, ops, unsupported, ...(outer.length ? { outer } : {}) };

    /**
     * The reorders: the ops run on a copy of every ordered many-valued slot the text prints, then each slot is compared
     * with the text's order. What follows the longest prefix of the text order the slot holds in that order is
     * re-appended, in text order (append only: that prefix is what can stay).
     */
    function reorders(run: readonly DiffOp[]): DiffOp[] {
        const slots = new Map<string, string[]>();
        const at = new Map<string, string>();
        const refOf = new Map<string, ObjectRef>();
        const slotKey = (owner: ObjectRef, feature: string): string => `${keyOf(owner)}\u0000${feature}`;
        const keyed = (r: ObjectRef): string => { const k = keyOf(r); refOf.set(k, r); return k; };
        const slot = (k: string): string[] => { let s = slots.get(k); if (!s) slots.set(k, s = []); return s; };
        const take = (k: string): void => { const s = at.get(k); if (s === undefined) return; const xs = slot(s); const i = xs.indexOf(k); if (i >= 0) xs.splice(i, 1); at.delete(k); };
        for (const o of model) {
            for (const f of featuresOf(o.cls)) {
                if (!f.many || f.kind === 'attribute') continue;
                const k = slotKey({ model: o.id }, f.name);
                const xs = f.kind === 'containment'
                    ? asArray(o.slots[f.name]).filter((id): id is string => typeof id === 'string' && modelById.has(id)).map(id => keyed({ model: id }))
                    : modelTargets(o.slots[f.name]).map(keyed);
                slots.set(k, xs);
                if (f.kind === 'containment') xs.forEach(x => at.set(x, k));
            }
        }
        const many = (owner: ObjectRef, feature: string): boolean => {
            const o = 'model' in owner ? modelById.get(owner.model) : 'text' in owner ? parsed.objects.find(x => x.id === owner.text) : undefined;
            return !!o && featuresOf(o.cls).some(f => f.name === feature && f.many);
        };
        const gone = deletedObjects(input.mm, model, run);
        for (const op of run) {
            if (op.op === 'create' && op.into && many(op.into.owner, op.into.feature)) {
                const k = slotKey(op.into.owner, op.into.feature);
                const x = keyed({ text: op.text });
                slot(k).push(x);
                at.set(x, k);
            } else if (op.op === 'move') {
                const x = keyed({ model: op.model });
                take(x);
                if (op.into && many(op.into.owner, op.into.feature)) { const k = slotKey(op.into.owner, op.into.feature); slot(k).push(x); at.set(x, k); }
            } else if (op.op === 'link') slot(slotKey(op.target, op.feature)).push(keyed(op.to));
            else if (op.op === 'unlink') { const xs = slot(slotKey(op.target, op.feature)); const i = xs.indexOf(keyOf(op.to)); if (i >= 0) xs.splice(i, 1); }
        }
        // `delete` takes the object out of its slot and cleans every pointer to it.
        const dead = new Set([...gone].map(id => keyOf({ model: id })));
        for (const [k, xs] of slots) slots.set(k, xs.filter(x => !dead.has(x)));
        const out: DiffOp[] = [];
        for (const t of parsed.objects) {
            const rule = g.objects[t.cls];
            if (!rule) continue;
            const shown = shownFeatures(rule);
            const owner = ref(t.id);
            for (const f of featuresOf(t.cls)) {
                if (!f.many || f.kind === 'attribute' || !shown.has(f.name) || !ordered(t.cls, f.name)) continue;
                const want = (f.kind === 'containment'
                    ? asArray(t.slots[f.name]).filter((id): id is string => typeof id === 'string').map(ref)
                    : parsedTargets(t.slots[f.name])).map(keyed);
                const have = slots.get(slotKey(owner, f.name)) ?? [];
                if (want.join('\u0000') === have.join('\u0000')) continue;
                let from = 0;
                let kept = 0;
                for (const x of want) { const i = have.indexOf(x, from); if (i < 0) break; from = i + 1; kept++; }
                for (const x of want.slice(kept)) if (have.includes(x)) out.push({ op: 'reorder', target: owner, feature: f.name, to: refOf.get(x)! });
            }
        }
        return out;
    }
}

function moveOp(x: { readonly model: string; readonly into: { readonly owner: ObjectRef; readonly feature: string } | null; readonly from: { readonly owner: string; readonly feature: string } | null }): DiffOp {
    return { op: 'move', model: x.model, into: x.into, from: x.from };
}

/** Why a diff is not applied (R-TXT-26, R-TXT-30, R-TXT-21 (8)); none means it may be. */
export interface ApplyRefusal {
    readonly code: 'parse' | 'uncertain' | 'referenced' | 'unprinted' | 'outer' | 'unsupported' | 'unwritable';
    readonly message: string;
}

export interface RefusalInput {
    readonly parsed: TextParseResult;
    readonly diff: TextDiff;
    /** The objects the previous print left out (printer.ts `printTextModel`, R-TXT-30). */
    readonly unprinted: readonly UnprintedObject[];
    /** The model objects another model references. */
    readonly referencedElsewhere?: ReadonlySet<string>;
    /** Every model object, to find what a deletion takes with it. */
    readonly model: readonly TextObject[];
    readonly mm: TextMetamodel;
}

/** The model objects the deletions of `ops` remove: each deleted object and what it contains, at any depth. */
export function deletedObjects(mm: TextMetamodel, model: readonly TextObject[], ops: readonly DiffOp[]): Set<string> {
    const places = placesOf(model, featureTable(mm));
    const contents = new Map<string, string[]>();
    for (const [id, p] of places) contents.set(p.owner, [...(contents.get(p.owner) ?? []), id]);
    // A moved object leaves its container before the deletions (T7), and takes its own contents with it.
    const moved = new Set(ops.flatMap(op => (op.op === 'move' ? [op.model] : [])));
    const gone = new Set<string>();
    const take = (id: string): void => { if (gone.has(id) || moved.has(id)) return; gone.add(id); (contents.get(id) ?? []).forEach(take); };
    for (const op of ops) if (op.op === 'delete') take(op.model);
    return gone;
}

/** The reasons not to apply, in this order: parse, uncertain matches, references from other models, unprinted objects, misplaced outer references (R-TXT-32), T7. */
export function refusalsOf(input: RefusalInput): ApplyRefusal[] {
    const out: ApplyRefusal[] = [];
    if (!isApplicableParse(input.parsed)) {
        out.push({ code: 'parse', message: `the text has ${input.parsed.errors.length || 'unread'} error${input.parsed.errors.length === 1 ? '' : 's'}` });
    }
    const uncertain = input.diff.match.matches.filter(m => m.uncertain);
    for (const by of ['homonym', 'move', 'rename'] as const) {
        const n = uncertain.filter(m => m.by === by).length;
        if (n) out.push({ code: 'uncertain', message: `${n} ${by === 'homonym' ? 'homonym matched by order' : by === 'move' ? 'object matched elsewhere in the model (a move)' : 'object matched by similarity (a rename)'}${n === 1 ? '' : 's'} to confirm` });
    }
    const elsewhere = input.referencedElsewhere;
    if (elsewhere?.size) {
        const hit = [...deletedObjects(input.mm, input.model, input.diff.ops)].filter(id => elsewhere.has(id)).length;
        if (hit) out.push({ code: 'referenced', message: `${hit} deleted object${hit === 1 ? ' is' : 's are'} referenced from another model` });
    }
    if (hasUnprinted(input)) out.push({ code: 'unprinted', message: `${input.unprinted.length} object${input.unprinted.length === 1 ? ' is' : 's are'} not in the text` });
    const outer = input.diff.outer?.length ?? 0;
    if (outer) out.push({ code: 'outer', message: `${outer} reference${outer === 1 ? '' : 's'} outside the text not where ${outer === 1 ? 'it was' : 'they were'} printed: such a value can only be kept, deleted or replaced` });
    for (const kind of ['move', 'reorder'] as const) {
        const n = input.diff.unsupported.filter(u => u.kind === kind).length;
        if (n) out.push({ code: 'unsupported', message: `${n} ${kind}${n === 1 ? '' : 's'}, not applied before step T7` });
    }
    return out;
}

export interface DiffLines {
    readonly lines: readonly string[];
    readonly problems: readonly LineProblem[];
    /** The handle of every model object the lines address, to register against its id before the run. */
    readonly handles: ReadonlyMap<string, string>;
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** The JjScript lines of a diff (R-TXT-21 (6)). */
export function diffLines(mm: TextMetamodel, g: ConcreteGrammar, model: readonly TextObject[], parsed: TextParseResult, diff: TextDiff): DiffLines {
    const featuresOf = featureTable(mm);
    const modelById = new Map(model.map(o => [o.id, o]));
    const textById = new Map(parsed.objects.map(o => [o.id, o]));
    const objectOf = (r: ObjectRef): TextObject | undefined => ('model' in r ? modelById.get(r.model) : 'text' in r ? textById.get(r.text) : undefined);

    // Handles: a name no other object on either side carries, else `<Class>_<n>` free of every name.
    const owners = new Map<string, Set<string>>();
    const own = (name: string | null, key: string): void => { if (name !== null) owners.set(name, (owners.get(name) ?? new Set()).add(key)); };
    const matchedModel = new Map(diff.match.matches.map(m => [m.text, m.model]));
    for (const o of model) own(identityOf(g, o), `m:${o.id}`);
    for (const o of parsed.objects) { const m = matchedModel.get(o.id); own(identityOf(g, o), m ? `m:${m}` : `t:${o.id}`); }
    const metaNames = new Set([...mm.classes.map(c => c.name), ...mm.enumerations.map(e => e.name)]);
    const taken = new Set([...owners.keys(), ...metaNames]);
    const handleOf = new Map<string, string>();
    const next = new Map<string, number>();
    const handle = (r: ObjectRef): string => {
        const key = keyOf(r);
        const known = handleOf.get(key);
        if (known) return known;
        const o = objectOf(r);
        const name = o ? identityOf(g, o) : null;
        let h: string;
        if (name !== null && owners.get(name)?.size === 1 && isWord(name) && !metaNames.has(name) && ![...handleOf.values()].includes(name)) h = name;
        else {
            const base = o && isWord(o.cls) ? o.cls : 'Object';
            let i = next.get(base) ?? 0;
            do h = `${base}_${++i}`; while (taken.has(h));
            next.set(base, i);
        }
        taken.add(h);
        handleOf.set(key, h);
        return h;
    };

    const lines: string[] = [];
    const problems: LineProblem[] = [];
    const writable = (id: string, feature: string): boolean => {
        if (IDENTIFIER.test(feature)) return true;
        problems.push({ id, feature, message: `the feature name ${feature} is not writable by JjScript yet` });
        return false;
    };
    const idOf = (r: ObjectRef): string => ('model' in r ? r.model : 'text' in r ? r.text : r.outer);
    const literalsOf = (cls: string, feature: string): readonly string[] | undefined => {
        const f = featuresOf(cls).find(x => x.name === feature);
        return f ? mm.enumerations.find(e => e.name === f.type)?.literals : undefined;
    };

    for (const op of diff.ops) {
        switch (op.op) {
            case 'delete': lines.push(`delete ${handle({ model: op.model })}`); break;
            case 'create': {
                const o = textById.get(op.text)!;
                if (!isWord(o.cls)) problems.push({ id: op.text, feature: '', message: `the class name ${o.cls} is not writable by JjScript yet` });
                const h = handle({ text: op.text });
                const into = op.into && writable(op.text, op.into.feature) ? ` in ${handle(op.into.owner)}.${op.into.feature}` : '';
                lines.push(`create instance of ${o.cls} ${jjscriptString(h)}${into}`);
                // A nameless object of a class with a name takes its handle as name, as any instance created without one.
                const name = identityOf(g, o);
                if (name !== null && name !== h) lines.push(`set ${h}.name = ${jjscriptString(name)}`);
                break;
            }
            case 'attribute': {
                const o = objectOf(op.target)!;
                if (!writable(idOf(op.target), op.feature)) break;
                const h = handle(op.target);
                if (op.feature === 'name' && 'text' in op.target) break; // written with the creation
                const literals = literalsOf(o.cls, op.feature);
                const text = Array.isArray(op.value) ? `[${op.value.map(v => valueText(v, literals)).join(', ')}]`
                    : op.value == null ? 'null' : valueText(op.value, literals);
                lines.push(`set ${h}.${op.feature} = ${text}`);
                break;
            }
            case 'reference':
                if (writable(idOf(op.target), op.feature)) lines.push(`set ${handle(op.target)}.${op.feature} = ${op.to ? handle(op.to) : 'null'}`);
                break;
            case 'link': case 'unlink':
                if (writable(idOf(op.target), op.feature)) lines.push(`set ${handle(op.target)}.${op.feature} ${op.op === 'link' ? '+=' : '-='} ${handle(op.to)}`);
                break;
            case 'move': {
                const h = handle({ model: op.model });
                if (op.into) {
                    if (!writable(op.model, op.into.feature)) break;
                    const owner = objectOf(op.into.owner);
                    const many = !!owner && featuresOf(owner.cls).some(f => f.name === op.into!.feature && f.many);
                    lines.push(`set ${handle(op.into.owner)}.${op.into.feature} ${many ? '+=' : '='} ${h}`);
                } else if (op.from && writable(op.model, op.from.feature)) lines.push(`set ${handle({ model: op.from.owner })}.${op.from.feature} -= ${h}`);
                break;
            }
            case 'reorder':
                if (!writable(idOf(op.target), op.feature)) break;
                lines.push(`set ${handle(op.target)}.${op.feature} -= ${handle(op.to)}`, `set ${handle(op.target)}.${op.feature} += ${handle(op.to)}`);
                break;
        }
    }
    const handles = new Map<string, string>();
    // R-TXT-32: a target outside the text is addressed by its id like a model object (the registry resolves any id).
    for (const [key, h] of handleOf) if (key.startsWith('m:') || key.startsWith('o:')) handles.set(h, key.slice(2));
    return { lines, problems, handles };
}

/** What applying an edited text would do, and whether it may (R-TXT-26). */
export interface TextEditPlan {
    readonly diff: TextDiff | null;
    readonly refusals: readonly ApplyRefusal[];
    /** Null when refused; empty when the text asks for no change. */
    readonly lines: readonly string[] | null;
    /** Handle to model object id, registered before the run. */
    readonly handles: ReadonlyMap<string, string>;
}

export interface PlanInput extends DiffInput {
    readonly unprinted: readonly UnprintedObject[];
    readonly referencedElsewhere?: ReadonlySet<string>;
    /** The refusals the user confirmed in the Text tab's panel (R-TXT-26): only `uncertain` and `referenced` can be. */
    readonly confirmed?: readonly ApplyRefusal['code'][];
}

/** The refusals a user may confirm: the uncertain matches and the deletion of objects other models reference (R-TXT-26). */
export const CONFIRMABLE: readonly ApplyRefusal['code'][] = ['uncertain', 'referenced'];

/** Parse result, model and evidence to a plan: the diff, the refusals and, when none, the lines. A confirmed refusal is dropped. */
export function planTextEdit(input: PlanInput): TextEditPlan {
    if (!isApplicableParse(input.parsed)) {
        return { diff: null, refusals: refusalsOf({ ...input, diff: { match: { matches: [], created: [], deleted: [] }, ops: [], unsupported: [] } }), lines: null, handles: new Map() };
    }
    const diff = diffText(input);
    const confirmed = (input.confirmed ?? []).filter(c => CONFIRMABLE.includes(c));
    const refusals = refusalsOf({ ...input, diff }).filter(r => !confirmed.includes(r.code));
    const built = diffLines(input.mm, input.grammar, input.model, input.parsed, diff);
    for (const p of built.problems) refusals.push({ code: 'unwritable', message: p.message });
    return { diff, refusals, lines: refusals.length ? null : built.lines, handles: built.handles };
}
