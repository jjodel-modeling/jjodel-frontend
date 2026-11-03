/**
 * Step T6 of the textual notation, parts 2 to 4 and the lines of part 5 (P-2026-11-02-2327; R-TXT-19, R-TXT-21 (5, 6),
 * R-TXT-26, R-TXT-30): the minimal diff between a model and an edited text of it, the reasons not to apply it, and the
 * JjScript lines that apply it. Pure, on plain objects; the run is textApply.ts.
 *
 * The diff (R-TXT-19): create, update an attribute, update a reference, delete. Only the features the object's rule
 * prints are compared: what the notation does not show is preserved, never cleared, and so is a reference target the
 * text cannot name (an object outside the printed ones). An attribute omitted because unset reads back as unset. A
 * many-valued feature compares as a multiset unless declared ordered (R-TXT-21 (5)); a reorder of an ordered one, and a
 * move, are step T7 and block the application.
 *
 * A value the model reads through a default (eval.ts `emptyAttributeDefault`: a declared default, or a mandatory
 * enumeration left empty read as its first literal) is stored empty: the text that prints that default, or omits the
 * attribute, asks for no change, and applying never writes the default unasked (the ticket of P-2026-11-02-2113).
 *
 * The lines (R-TXT-21 (6)) address every model object by a handle that the run registers, before its first line,
 * against the object's id (`executor/handleRegistry.ts`): no name lookup, no new JjScript syntax. In order: the
 * links taken away and the references cleared, the deletions (a container takes its contents, `delete` cleans the
 * pointers to it), the creations in text order, the attributes, the links added and the references set.
 */

import type { ConcreteGrammar } from './concreteGrammar';
import type { TextFeature, TextMetamodel, TextObject } from './metamodel';
import { isWord, jjscriptString, valueText } from './modelLines';
import type { LineProblem } from './modelLines';
import { isApplicableParse } from './parser';
import type { TextParseResult } from './parser';
import type { ObjectSpan, UnprintedObject } from './printer';
import { hasUnprinted } from './printer';
import { featureTable, identityOf, matchObjects, placesOf, sameValue, shownFeatures } from './textMatch';
import type { ObjectMatch, TextMatch } from './textMatch';

/** An object of the model (`model`) or a new one of the text (`text`); the ids of the two sides may coincide. */
export type ObjectRef = { readonly model: string } | { readonly text: string };

export type DiffOp =
    | { readonly op: 'create'; readonly text: string; readonly cls: string; readonly into?: { readonly owner: ObjectRef; readonly feature: string } }
    /** `value` null clears the attribute; an array replaces the values of a many-valued one. */
    | { readonly op: 'attribute'; readonly target: ObjectRef; readonly feature: string; readonly value: unknown }
    /** A single-valued reference: `to` null clears it. */
    | { readonly op: 'reference'; readonly target: ObjectRef; readonly feature: string; readonly to: ObjectRef | null }
    | { readonly op: 'link' | 'unlink'; readonly target: ObjectRef; readonly feature: string; readonly to: ObjectRef }
    /** Takes the objects it contains with it. */
    | { readonly op: 'delete'; readonly model: string };

/** What the diff cannot express before step T7: a move, or a reorder of an ordered feature. */
export interface UnsupportedChange {
    readonly kind: 'move' | 'reorder';
    readonly model: string;
    readonly feature: string;
}

export interface TextDiff {
    readonly match: TextMatch;
    readonly ops: readonly DiffOp[];
    readonly unsupported: readonly UnsupportedChange[];
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
    /** Whether a feature is declared ordered (R-TXT-19); none is by default. */
    readonly ordered?: (cls: string, feature: string) => boolean;
}

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);
const isUnset = (v: unknown): boolean => asArray(v).length === 0;
const keyOf = (r: ObjectRef): string => ('model' in r ? `m:${r.model}` : `t:${r.text}`);

/** The diff between the model and the parsed text (R-TXT-19). The parse must be applicable (`isApplicableParse`). */
export function diffText(input: DiffInput): TextDiff {
    const { grammar: g, model, parsed } = input;
    const featuresOf = featureTable(input.mm);
    const ordered = input.ordered ?? (() => false);
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
    const unsupported: UnsupportedChange[] = [];

    /** A reference slot's targets the text can name: the printed objects. The others are preserved. */
    const printable = (v: unknown): string[] => asArray(v).filter((id): id is string => typeof id === 'string' && modelById.has(id));
    const parsedTargets = (v: unknown): ObjectRef[] => asArray(v).filter((id): id is string => typeof id === 'string').map(ref);

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
        const was = m ? printable(m.slots[f.name]).map(id => ({ model: id }) as ObjectRef) : [];
        if (!f.many) {
            const to = now[0] ?? null;
            const from = was[0] ?? null;
            if ((to && keyOf(to)) === (from && keyOf(from))) return;
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
        for (const r of added) additions.push({ op: 'link', target, feature: f.name, to: r });
        if (m && ordered(t.cls, f.name)) {
            const kept = was.filter(x => !rest.includes(x)).map(keyOf);
            const after = [...kept, ...added.map(keyOf)];
            if (after.join('\u0000') !== now.map(keyOf).join('\u0000')) unsupported.push({ kind: 'reorder', model: m.id, feature: f.name });
        }
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
        // The container: a matched object elsewhere is a move (T7).
        const tp = textPlace.get(t.id);
        const mp = modelPlace.get(m.id);
        const tOwner = tp ? keyOf(ref(tp.owner)) : '';
        const mOwner = mp ? keyOf({ model: mp.owner }) : '';
        if (tOwner !== mOwner || (tp?.feature ?? '') !== (mp?.feature ?? '')) unsupported.push({ kind: 'move', model: m.id, feature: tp?.feature ?? '' });
    }

    // A reorder of an ordered containment among the objects that stay.
    for (const t of parsed.objects) {
        const mt = modelOf.get(t.id);
        if (!mt) continue;
        const m = modelById.get(mt.model)!;
        for (const f of featuresOf(t.cls)) {
            if (f.kind !== 'containment' || !f.many || !ordered(t.cls, f.name)) continue;
            const kept = (ids: unknown, side: (id: string) => string | undefined): string[] =>
                asArray(ids).flatMap(id => { const k = typeof id === 'string' ? side(id) : undefined; return k ? [k] : []; });
            const textOrder = kept(t.slots[f.name], id => modelOf.get(id)?.model);
            const modelOrder = kept(m.slots[f.name], id => (deleted.has(id) ? undefined : id)).filter(id => textOrder.includes(id));
            if (textOrder.join('\u0000') !== modelOrder.join('\u0000')) unsupported.push({ kind: 'reorder', model: m.id, feature: f.name });
        }
    }

    // Deletions: the topmost only, a container takes what it contains.
    const deletions: DiffOp[] = match.deleted
        .filter(id => { const p = modelPlace.get(id); return !(p && deleted.has(p.owner)); })
        .map(id => ({ op: 'delete', model: id }));

    return { match, ops: [...removals, ...deletions, ...creates, ...attributes, ...additions], unsupported };
}

/** Why a diff is not applied (R-TXT-26, R-TXT-30, R-TXT-21 (8)); none means it may be. */
export interface ApplyRefusal {
    readonly code: 'parse' | 'uncertain' | 'referenced' | 'unprinted' | 'unsupported' | 'unwritable';
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
    const gone = new Set<string>();
    const take = (id: string): void => { if (gone.has(id)) return; gone.add(id); (contents.get(id) ?? []).forEach(take); };
    for (const op of ops) if (op.op === 'delete') take(op.model);
    return gone;
}

/** The reasons not to apply, in this order: parse, uncertain matches, references from other models, unprinted objects, T7. */
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
    const objectOf = (r: ObjectRef): TextObject | undefined => ('model' in r ? modelById.get(r.model) : textById.get(r.text));

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
    const idOf = (r: ObjectRef): string => ('model' in r ? r.model : r.text);
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
        }
    }
    const handles = new Map<string, string>();
    for (const [key, h] of handleOf) if (key.startsWith('m:')) handles.set(h, key.slice(2));
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
