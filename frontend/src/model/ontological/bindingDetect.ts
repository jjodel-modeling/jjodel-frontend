/**
 * bindingDetect — the UML binding proposed from a metamodel's names, and the bag the binding editor writes
 * (P-2026-11-08-0113, discovery 2026-11-08 §3.5 and §5 lane B).
 *
 * Detect is the probe's name table (scripts/probe/onto-s2-instantiate.ts, the console setup), not a general
 * heuristic: a (class, feature) pair per role, the feature searched on the named class and then on its ancestors.
 * Feature names repeat across a UML metamodel (`value` on three literals, `type` on two classes), so a feature is
 * matched by its owner and its name, never by its name alone. A sketch with no `InstanceSpecification.classifier`
 * is not UML: nothing is proposed, and the editor's table is the declaration. The `link` record carries the four
 * slot roles too, its `valueKinds` the same as `object`'s, so it passes `checkBindings` (question 3, ratified as
 * recommended, unattended).
 *
 * The editor edits two records, `object` and `link`. Its bag keeps every other record (a DCN metamodel's
 * `featureSources` records, any foreign record) and every key of the root it does not know, so the DCN front reads
 * them as they were (R-DCN-1). Remove takes the two records out and keeps the rest; the list is empty only when there
 * is no other record. The key is never removed (Info.tsx, `simEnabled`: the undo of a removed `_state` key does not
 * restore it).
 *
 * Pure: the imports are the codec and a type.
 */

import { decodeOntoBindings, encodeOntoBindings } from './bindingCodec';
import type { MetamodelSketch } from '../simulation/profileBinder';
import type { OntoBinding, OntoBindings, OntoValueKind } from './bindingCodec';

/** The records the editor edits; any other record of the bag is kept as it is. */
export const EDITED_RECORDS = ['object', 'link'] as const;
export type EditedRecord = typeof EDITED_RECORDS[number];

export const isEditedRecord = (name: string): name is EditedRecord => (EDITED_RECORDS as readonly string[]).includes(name);

/**
 * A role of a record, as a path: an id role (`typeReference`), a part of the generalization (`generalization.via`),
 * or a part of a value kind (`valueKinds.0.field`).
 */
export type RolePath = string;

export type RoleSort = 'reference' | 'attribute' | 'class';

/** One row of Detect: the role, the (class, feature) it looked for, and the id it found. */
export interface DetectRow {
    record: EditedRecord;
    path: RolePath;
    className: string;
    /** The feature looked for; absent for a class (the `create` of a value kind). */
    featureName?: string;
    status: 'found' | 'missing';
    id?: string;
}

export interface DetectResult {
    /** The proposed records, `object` then `link`; empty on a sketch that is not UML. */
    bindings: OntoBinding[];
    rows: DetectRow[];
}

/** The id roles of the table, in the order a record is written. */
const OBJECT_ROLES: ReadonlyArray<[RolePath, string, string]> = [
    ['typeReference', 'InstanceSpecification', 'classifier'],
    ['featureContainer', 'Class', 'ownedAttributes'],
    ['generalization.via', 'Classifier', 'generalizations'],
    ['generalization.general', 'Generalization', 'general'],
    ['slotContainer', 'InstanceSpecification', 'slots'],
    ['definingFeature', 'Slot', 'definingFeature'],
    ['valueHolder', 'Slot', 'values'],
    ['abstractFlag', 'Classifier', 'isAbstract'],
    ['featureType', 'TypedElement', 'type'],
    ['defaultValue', 'Property', 'defaultValue'],
];

const LINK_ROLES: ReadonlyArray<[RolePath, string, string]> = [
    ['typeReference', 'InstanceSpecification', 'classifier'],
    ['featureContainer', 'Association', 'memberEnds'],
    ['slotContainer', 'InstanceSpecification', 'slots'],
    ['definingFeature', 'Slot', 'definingFeature'],
    ['valueHolder', 'Slot', 'values'],
];

/** The value kinds: `when`, the literal metaclass, the feature that holds the value. */
const VALUE_KINDS: ReadonlyArray<[string, string, string]> = [
    ['primitive:Boolean', 'LiteralBoolean', 'value'],
    ['primitive:String', 'LiteralString', 'value'],
    ['primitive:Integer', 'LiteralInteger', 'value'],
    ['instance', 'InstanceValue', 'instance'],
];

/** The id a role path holds in `b`, `undefined` when unset. */
export function roleValue(b: OntoBinding, path: RolePath): string | undefined {
    const [head, a, c] = path.split('.');
    if (head === 'generalization') {
        const g = b.generalization as Record<string, unknown> | undefined;
        const v = g?.[a];
        return typeof v === 'string' ? v : undefined;
    }
    if (head === 'valueKinds') {
        const k = b.valueKinds?.[Number(a)] as Record<string, unknown> | undefined;
        const v = k?.[c];
        return typeof v === 'string' ? v : undefined;
    }
    const v = b[head];
    return typeof v === 'string' ? v : undefined;
}

/**
 * `b` with the role at `path` set to `id`, or unset for `undefined`. A generalization or a value kind left with a part
 * unset keeps it unset; the codec refuses such a record, so the editor shows the defect before Confirm.
 */
export function withRoleValue(b: OntoBinding, path: RolePath, id: string | undefined): OntoBinding {
    const [head, a, c] = path.split('.');
    const out: OntoBinding = { ...b };
    if (head === 'generalization') {
        const g: Record<string, unknown> = { ...(b.generalization ?? {}) };
        if (id === undefined) delete g[a]; else g[a] = id;
        if (Object.keys(g).length === 0) delete out.generalization; else out.generalization = g as OntoBinding['generalization'];
        return out;
    }
    if (head === 'valueKinds') {
        const kinds = [...(b.valueKinds ?? [])];
        const k: Record<string, unknown> = { ...(kinds[Number(a)] ?? {}) };
        if (id === undefined) delete k[c]; else k[c] = id;
        kinds[Number(a)] = k as OntoValueKind;
        out.valueKinds = kinds;
        return out;
    }
    if (id === undefined) delete out[head]; else out[head] = id;
    return out;
}

/** The sort a role path needs, as bindingCheck.ts judges it. */
export function roleSorts(path: RolePath): RoleSort[] {
    const [head, , c] = path.split('.');
    if (head === 'valueKinds') return c === 'create' ? ['class'] : ['reference', 'attribute'];
    if (head === 'valueHolder') return ['reference', 'attribute'];
    if (head === 'abstractFlag' || head === 'defaultValue') return ['attribute'];
    return ['reference'];
}

/** The role paths of a record as the editor lists them: the id roles, the generalization, each value kind. */
export function rolePaths(b: OntoBinding): RolePath[] {
    const g = b.generalization as Record<string, unknown> | undefined;
    const generalization = g && 'direct' in g ? ['generalization.direct'] : ['generalization.via', 'generalization.general'];
    const paths: RolePath[] = [
        'typeReference', 'featureContainer', ...generalization, 'slotContainer', 'definingFeature', 'valueHolder', 'abstractFlag', 'featureType', 'defaultValue',
    ];
    (b.valueKinds ?? []).forEach((_, i) => paths.push(`valueKinds.${i}.create`, `valueKinds.${i}.field`));
    return paths;
}

/** The feature named `featureName` on the class `classId` or, failing that, on its ancestors, nearest first. */
function featureOf(sketch: MetamodelSketch, classId: string, featureName: string): string | undefined {
    const supers = new Map(sketch.classes.map(c => [c.id, c.supers]));
    const features = [...sketch.attributes, ...sketch.references];
    const seen = new Set<string>();
    const queue = [classId];
    while (queue.length > 0) {
        const c = queue.shift() as string;
        if (seen.has(c)) continue;
        seen.add(c);
        const hit = features.find(f => f.owner === c && f.name === featureName);
        if (hit) return hit.id;
        queue.push(...(supers.get(c) ?? []));
    }
    return undefined;
}

/** The binding the UML name table finds in the sketch; nothing when the sketch has no `InstanceSpecification.classifier`. */
export function detectOntoBindings(sketch: MetamodelSketch): DetectResult {
    const classByName = new Map<string, string>();
    for (const c of sketch.classes) if (!classByName.has(c.name)) classByName.set(c.name, c.id);
    const rows: DetectRow[] = [];
    const find = (record: EditedRecord, path: RolePath, className: string, featureName?: string): string | undefined => {
        const classId = classByName.get(className);
        const id = classId === undefined ? undefined : featureName === undefined ? classId : featureOf(sketch, classId, featureName);
        rows.push({
            record, path, className, ...(featureName !== undefined ? { featureName } : {}), status: id ? 'found' : 'missing', ...(id ? { id } : {}),
        });
        return id;
    };

    const recordOf = (record: EditedRecord, roles: ReadonlyArray<[RolePath, string, string]>): OntoBinding => {
        let b = { name: record } as OntoBinding;
        for (const [path, c, f] of roles) {
            const id = find(record, path, c, f);
            if (id !== undefined) b = withRoleValue(b, path, id);
        }
        // Half a generalization does not decode: proposed whole or not at all, its rows say which part is missing.
        const g = b.generalization as Record<string, unknown> | undefined;
        if (g && (g.via === undefined || g.general === undefined)) delete b.generalization;
        const kinds: OntoValueKind[] = [];
        VALUE_KINDS.forEach(([when, c, f], i) => {
            const create = find(record, `valueKinds.${i}.create`, c);
            const field = find(record, `valueKinds.${i}.field`, c, f);
            if (create !== undefined && field !== undefined) kinds.push({ when, create, field });
        });
        if (kinds.length > 0) b.valueKinds = kinds;
        return b;
    };

    const object = recordOf('object', OBJECT_ROLES);
    const link = recordOf('link', LINK_ROLES);
    if (object.typeReference === undefined) return { bindings: [], rows };
    const bindings = [object];
    if (link.featureContainer !== undefined) bindings.push(link);
    return { bindings, rows };
}

/** The keys a record has that the editor does not list (`featureSources`, any unknown key): kept as they are. */
export function keptKeys(b: OntoBinding): string[] {
    const listed = new Set([
        'name', 'typeReference', 'featureContainer', 'generalization', 'slotContainer', 'definingFeature', 'valueHolder', 'abstractFlag', 'featureType',
        'defaultValue', 'valueKinds',
    ]);
    return Object.keys(b).filter(k => !listed.has(k));
}

/**
 * The draft's record after Detect: the roles the editor lists are Detect's, set or unset; the keys it does not list
 * are the stored record's.
 */
export function detectedRecord(stored: OntoBinding | undefined, detected: OntoBinding): OntoBinding {
    const out: OntoBinding = { ...detected };
    if (stored) for (const k of keptKeys(stored)) out[k] = stored[k];
    return out;
}

/** The records the editor edits, in the bag's order. */
export function editedRecords(bag: OntoBindings): OntoBinding[] {
    return bag.bindings.filter(b => isEditedRecord(b.name));
}

/** The records the editor keeps and does not show. */
export function foreignRecords(bag: OntoBindings): OntoBinding[] {
    return bag.bindings.filter(b => !isEditedRecord(b.name));
}

/**
 * The bag with the edited records replaced by `records`: a stored record is replaced where it stands, a new one is
 * appended, a stored one absent from `records` is taken out. Every other record and the root's unknown keys stay.
 */
export function bagWithRecords(base: OntoBindings, records: readonly OntoBinding[]): OntoBindings {
    const byName = new Map(records.map(r => [r.name, r]));
    const placed = new Set<string>();
    const bindings: OntoBinding[] = [];
    for (const b of base.bindings) {
        if (!isEditedRecord(b.name)) { bindings.push(b); continue; }
        const r = byName.get(b.name);
        if (r && !placed.has(b.name)) { bindings.push(r); placed.add(b.name); }
    }
    for (const r of records) if (!placed.has(r.name)) { bindings.push(r); placed.add(r.name); }
    return { ...base, v: 1, bindings };
}

/** The string Confirm writes: `bagWithRecords`, encoded. */
export function bagAfterConfirm(base: OntoBindings, records: readonly OntoBinding[]): string {
    return encodeOntoBindings(bagWithRecords(base, records));
}

/** The string Remove writes: the edited records out, the rest kept; `{"v":1,"bindings":[]}` when nothing else is there. */
export function bagAfterRemove(base: OntoBindings): string {
    return encodeOntoBindings(bagWithRecords(base, []));
}

/** The stored bag as the editor's base: the decoded value, or the decode errors. */
export function editorBase(raw: unknown): { ok: true; base: OntoBindings } | { ok: false; errors: string[] } {
    const d = decodeOntoBindings(raw);
    return d.ok ? { ok: true, base: d.value } : { ok: false, errors: d.errors };
}
