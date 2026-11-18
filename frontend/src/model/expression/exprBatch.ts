/**
 * exprBatch — the fold of a model and the texts of its owners, computed once per idlookup (R-EXP-5, R-EXP-7, R-EXP-12,
 * slice S1).
 *
 * Render reads these and never calls the printer per node. A model's batch hangs on the identity of the idlookup. The
 * printed texts hang on the identity of the DObject records: an entry is reused iff its DValue records and the entries of
 * its children are the very same, so editing a constant reprints only its chain up to the owner.
 *
 * The unit of folding is a slot, closed downward along the composition references; a metaclass alone does not decide. A
 * missing or invalid binding folds nothing and says why, in `exprBindingStatus`.
 *
 * Pure: it reads the raw idlookup it is given, never a store or a proxy.
 */

import { EXPR_BINDING_KEY, EXPR_FOLD_KEY, decodeExprBinding, mapIds } from './exprBinding';
import type { ExprBinding, ExprSlot } from './exprBinding';
import { computeSharedNames, createExprPrinter } from './exprPrinter';
import type { ExprMemo, ExprRead } from './exprPrinter';

type DRecord = Record<string, any>;
export type ExprLookup = Record<string, DRecord>;

/** The pseudo slot of `exprTextOf` that returns the definitions of the sharing pass. */
export const EXPR_SHARED_SLOT = '@shared';

export type ExprBindingStatus =
    | { kind: 'none' }
    | { kind: 'invalid'; errors: string[] }
    | { kind: 'ok'; roots: number; folded: number; owners: number };

interface Batch {
    status: ExprBindingStatus;
    folded: ReadonlySet<string>;
    owners: readonly string[];
    /** `owner\nfeatureName` to text. */
    texts: ReadonlyMap<string, string>;
    /** Owner to its texts, in slot order. */
    snapshots: ReadonlyMap<string, string>;
    shared: string;
}

interface Scope {
    modelOf: Map<string, string | undefined>;
    batches: Map<string, Batch>;
}

/** What was printed for a DObject. `on` holds the texts with sharing, valid for the names table `table`. */
interface Entry {
    binding: string;
    feats: readonly unknown[];
    kids: ReadonlyArray<Entry | undefined>;
    off: Map<string, string>;
    on: Map<string, string>;
    table: string;
}

const scopes = new WeakMap<object, Scope>();
const entriesByRecord = new WeakMap<object, Entry>();

const EMPTY_SET: ReadonlySet<string> = new Set();
const EMPTY_MAP: ReadonlyMap<string, string> = new Map();

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const same = (a: readonly unknown[], b: readonly unknown[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);

function scopeOf(lookup: ExprLookup): Scope {
    let scope = scopes.get(lookup);
    if (!scope) {
        scope = { modelOf: new Map(), batches: new Map() };
        scopes.set(lookup, scope);
    }
    return scope;
}

/** The DModel above an element, walking `father`. Forward links can be stale right after a parse; `father` is not. */
function modelOf(lookup: ExprLookup, scope: Scope, id: string): string | undefined {
    const path = new Set<string>();
    let current: string | undefined = id;
    let found: string | undefined;
    while (current !== undefined && !path.has(current)) {
        if (scope.modelOf.has(current)) {
            found = scope.modelOf.get(current);
            break;
        }
        const record: DRecord | undefined = lookup[current];
        if (!record) break;
        if (record.className === 'DModel') {
            found = current;
            break;
        }
        path.add(current);
        current = typeof record.father === 'string' ? record.father : undefined;
    }
    for (const p of path) scope.modelOf.set(p, found);
    return found;
}

function readerOf(lookup: ExprLookup): ExprRead {
    const slotsByObject = new Map<string, Map<string, DRecord>>();
    const lineages = new Map<string, string[]>();
    const slotsOf = (id: string): Map<string, DRecord> => {
        let slots = slotsByObject.get(id);
        if (!slots) {
            slots = new Map();
            for (const f of strings(lookup[id]?.features)) {
                const value = lookup[f];
                if (value) slots.set(value.instanceof, value);
            }
            slotsByObject.set(id, slots);
        }
        return slots;
    };
    const lineageOf = (classId: string): string[] => {
        let lineage = lineages.get(classId);
        if (!lineage) {
            const seen = new Set<string>();
            const visit = (c: string): void => {
                if (seen.has(c)) return;
                seen.add(c);
                strings(lookup[c]?.extends).forEach(visit);
            };
            visit(classId);
            lineage = [...seen];
            lineages.set(classId, lineage);
        }
        return lineage;
    };
    return {
        classOf: id => lookup[id]?.instanceof,
        classNameOf: c => lookup[c]?.name ?? c,
        lineageOf,
        values: (id, feature) => slotsOf(id).get(feature)?.values ?? [],
        isObject: v => typeof v === 'string' && lookup[v]?.className === 'DObject',
    };
}

const bindingKeyOf = (raw: unknown): string => (typeof raw === 'string' ? raw : JSON.stringify(raw) ?? '');

function emptyBatch(status: ExprBindingStatus): Batch {
    return { status, folded: EMPTY_SET, owners: [], texts: EMPTY_MAP, snapshots: EMPTY_MAP, shared: '' };
}

function checkedBinding(lookup: ExprLookup, raw: unknown): { binding: ExprBinding } | { status: ExprBindingStatus } {
    const decoded = decodeExprBinding(raw);
    if (!decoded.ok) return { status: { kind: 'invalid', errors: decoded.errors } };
    if (!decoded.value) return { status: { kind: 'none' } };
    const exists = (id: string): string | undefined => (lookup[id] ? id : undefined);
    const checked = mapIds(decoded.value, exists, (_owner, feature) => exists(feature));
    return checked.ok ? { binding: checked.value } : { status: { kind: 'invalid', errors: checked.errors } };
}

function buildBatch(lookup: ExprLookup, scope: Scope, modelId: string): Batch {
    const metamodel = lookup[lookup[modelId]?.instanceof];
    const raw = metamodel?._state?.[EXPR_BINDING_KEY];
    const checked = checkedBinding(lookup, raw);
    if ('status' in checked) return emptyBatch(checked.status);
    const { binding } = checked;
    const bindingKey = bindingKeyOf(raw);
    const read = readerOf(lookup);

    const objects: string[] = [];
    for (const id in lookup) {
        if (lookup[id]?.className === 'DObject' && modelOf(lookup, scope, id) === modelId) objects.push(id);
    }

    const slotsByClass = new Map<string, ExprSlot[]>();
    for (const slot of binding.slots) slotsByClass.set(slot.class, [...(slotsByClass.get(slot.class) ?? []), slot]);
    const slotsOfObject = (id: string): ExprSlot[] => {
        const c = read.classOf(id);
        return c === undefined ? [] : read.lineageOf(c).flatMap(x => slotsByClass.get(x) ?? []);
    };
    const objectValues = (id: string, feature: string): string[] => read.values(id, feature).filter(read.isObject) as string[];

    const folded = new Set<string>();
    const close = (id: string): void => {
        if (folded.has(id)) return;
        folded.add(id);
        for (const f of strings(lookup[id]?.features)) {
            const value = lookup[f];
            if (!value || !lookup[value.instanceof]?.composition) continue;
            for (const kid of strings(value.values)) if (read.isObject(kid)) close(kid);
        }
    };
    const withSlots = objects.filter(id => slotsOfObject(id).length > 0);
    for (const id of withSlots) {
        for (const slot of slotsOfObject(id)) objectValues(id, slot.feature).forEach(close);
    }
    const owners = withSlots.filter(id => !folded.has(id));
    const roots = new Set(owners.flatMap(id => slotsOfObject(id).flatMap(slot => objectValues(id, slot.feature))));

    // The identity memo. Only reference values are read here: an attribute's are read when it is printed.
    const entries = new Map<string, Entry | undefined>();
    const entryOf = (id: string): Entry | undefined => {
        if (entries.has(id)) return entries.get(id);
        entries.set(id, undefined);
        const record = lookup[id];
        if (!record) return undefined;
        const feats = strings(record.features).map(f => lookup[f]);
        const kids: Array<Entry | undefined> = [];
        for (const value of feats) {
            if (lookup[value?.instanceof]?.className !== 'DReference') continue;
            for (const kid of strings(value.values)) if (read.isObject(kid)) kids.push(entryOf(kid));
        }
        const prior = entriesByRecord.get(record);
        const entry = prior && prior.binding === bindingKey && same(prior.feats, feats) && same(prior.kids, kids)
            ? prior
            : { binding: bindingKey, feats, kids, off: new Map(), on: new Map(), table: '' };
        entriesByRecord.set(record, entry);
        entries.set(id, entry);
        return entry;
    };
    let table = '';
    const textsOf = (id: string, key: string): Map<string, string> | undefined => {
        const entry = entryOf(id);
        if (!entry || !key.endsWith('/1')) return entry?.off;
        if (entry.table !== table) {
            entry.on.clear();
            entry.table = table;
        }
        return entry.on;
    };
    const memo: ExprMemo = {
        get: (id, key) => textsOf(id, key)?.get(key),
        set: (id, key, text) => void textsOf(id, key)?.set(key, text),
    };

    const plain = createExprPrinter(binding, read, { memo });
    const names = computeSharedNames(binding, read, id => plain.printNode(id, 0, '', false), objects);
    table = JSON.stringify([...names]);
    const printer = createExprPrinter(binding, read, { memo, shared: names });

    const texts = new Map<string, string>();
    const snapshots = new Map<string, string>();
    for (const owner of owners) {
        const own: string[] = [];
        for (const slot of slotsOfObject(owner)) {
            const text = read.values(owner, slot.feature)
                .filter(v => v !== undefined && v !== null)
                .map(v => (read.isObject(v) ? printer.printNode(v as string, 0, '', true) : String(v)))
                .join(', ');
            texts.set(`${owner}\n${lookup[slot.feature]?.name ?? slot.feature}`, text);
            own.push(text);
        }
        snapshots.set(owner, own.join('\n'));
    }

    return {
        status: { kind: 'ok', roots: roots.size, folded: folded.size, owners: owners.length },
        folded,
        owners,
        texts,
        snapshots,
        shared: [...names].map(([text, name]) => `${name} = ${text}`).join('\n'),
    };
}

function batchOf(lookup: ExprLookup, modelId: string): Batch {
    const scope = scopeOf(lookup);
    let batch = scope.batches.get(modelId);
    if (!batch) {
        batch = buildBatch(lookup, scope, modelId);
        scope.batches.set(modelId, batch);
    }
    return batch;
}

function batchOfObject(lookup: ExprLookup, objectId: string): Batch | undefined {
    const modelId = modelOf(lookup, scopeOf(lookup), objectId);
    return modelId === undefined ? undefined : batchOf(lookup, modelId);
}

/** The text of a slot of an owner, by feature name; `''` when there is none. `@shared` gives the `D1 = ...` lines. */
export function exprTextOf(lookup: ExprLookup, ownerId: string, slot: string): string {
    const batch = batchOfObject(lookup, ownerId);
    if (!batch) return '';
    return slot === EXPR_SHARED_SLOT ? batch.shared : batch.texts.get(`${ownerId}\n${slot}`) ?? '';
}

/** All the slot texts of an owner, for a render snapshot; `''` for anything else. */
export function exprSnapshotOf(lookup: ExprLookup, ownerId: string): string {
    return batchOfObject(lookup, ownerId)?.snapshots.get(ownerId) ?? '';
}

/** The objects a model's slots fold away: empty when the binding is missing or invalid. */
export function exprFoldedObjects(lookup: ExprLookup, modelId: string): ReadonlySet<string> {
    return batchOf(lookup, modelId).folded;
}

/** The objects that keep their node and show the texts: they have a slot and are not folded themselves. */
export function exprOwnersOf(lookup: ExprLookup, modelId: string): readonly string[] {
    return batchOf(lookup, modelId).owners;
}

/** Whether the binding of a model works, and why not (R-EXP-12). */
export function exprBindingStatus(lookup: ExprLookup, modelId: string): ExprBindingStatus {
    return batchOf(lookup, modelId).status;
}

/** Whether a viewpoint activates the fold (R-EXP-4). */
export function exprFoldActive(lookup: ExprLookup, viewpointId: string): boolean {
    return !!lookup[viewpointId]?._state?.[EXPR_FOLD_KEY];
}

/** A memo dependency: `''` when the viewpoint does not fold, else the raw binding of the model's metamodel. */
export function exprFoldDep(lookup: ExprLookup, viewpointId: string, modelId: string): string {
    if (!exprFoldActive(lookup, viewpointId)) return '';
    const raw = lookup[lookup[modelId]?.instanceof]?._state?.[EXPR_BINDING_KEY];
    return raw === undefined || raw === null ? '' : bindingKeyOf(raw);
}
