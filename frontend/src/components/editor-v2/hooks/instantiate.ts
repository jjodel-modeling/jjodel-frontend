/**
 * instantiate — the ontological instantiation services of the editor-v2 canvas (R-OI-2, R-OI-3, R-OI-10; discovery
 * 2026-10-20 §3.2, §3.3, slice S2; plan `docs/discovery/discovery_2026-10-20_onto_s2_plan.md`).
 *
 * Two halves in one file, split the way `createAdapter.ts` / `createDraw.ts` are split:
 *
 *  - the READ half is pure. It takes `get`, a lookup of the store's D records by id (`store.getState().idlookup` in the
 *    app, a plain object in the bench), and imports nothing from the joiner, whose barrel reaches monaco and fails at
 *    import under vitest. `ontoReadView` is the `OntoReadView` of `bindingReader.ts` over those records; the menu
 *    options and the synthesis plan are computed from it. Reads only.
 *  - the WRITE half, `instantiate`, reaches the store and `createInstance` (`createAdapter.ts:491`) through a dynamic
 *    `import()`, so the bench never loads them. It writes through `createInstance` only. The instance's vertex is the
 *    one `useJjomSync` Step 2bis gives a new root: a `createVertexForObject` at the click point, right after the
 *    create, left the instantiation out of the undo history (measured, P-2026-10-21-0100: Cmd+Z never removed it and
 *    walked back the entries before it instead; without it one Cmd+Z removes the instance and its slots).
 *
 * ── The synthesis ─────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * One instance of the record's instance metaclass (the owner of `typeReference`) with `typeReference = classifier`;
 * then, for each feature of `featureClosure` in order, one slot (the type of `slotContainer`) whose `definingFeature`
 * is the feature; then, when the feature has a `defaultValue` and `valueKinds` an entry for its type, one value object
 * in the slot's `valueHolder`. Every create is contained, so each waits for its owner's slot to exist: the DValues of a
 * new object come from its constructor actions, which have not run when `addObject` returns (`createAdapter.ts`
 * header, «The values arrive with the create, not after it»). Each slot is also awaited in its owner's list before the
 * next one is made, so the order of the list is the closure's.
 *
 * No outer TRANSACTION (rule 12): `addObject` opens its own. One instantiation is therefore several undo entries; S2u
 * makes it one, and the count is measured and declared until then.
 */

import { decodeOntoBindings, ONTO_BINDINGS_KEY, type OntoBinding, type OntoValueKind } from '../../../model/ontological/bindingCodec';
import { featureClosure, instantiableClassifiers, type OntoReadView } from '../../../model/ontological/bindingReader';

/** A D record of the store by id, `undefined` when there is none. */
export type DGet = (id: string) => any;

/** The record of the bindings that feeds the creation menu (R-OI-8: links are the `link` record, S4). */
export const OBJECT_RECORD = 'object';

const isId = (v: unknown): v is string => typeof v === 'string' && v !== '';

/** The DValue of the M1 object `objectId` that instantiates the M2 feature `featureId`. */
function featureValue(get: DGet, objectId: string, featureId: string): any {
    for (const vid of get(objectId)?.features ?? []) {
        const v = isId(vid) ? get(vid) : undefined;
        if (v?.instanceof === featureId) return v;
    }
    return undefined;
}

/** The `OntoReadView` over the store's D records. */
export function ontoReadView(get: DGet): OntoReadView {
    return {
        metaclassOf: id => {
            const m = get(id)?.instanceof;
            return isId(m) ? m : undefined;
        },
        referenceTargets: (objectId, referenceId) =>
            ((featureValue(get, objectId, referenceId)?.values ?? []) as unknown[]).filter(isId).filter(t => get(t) !== undefined),
        attributeValue: (objectId, attributeId) => featureValue(get, objectId, attributeId)?.values?.[0],
        ownerOf: featureId => {
            const f = get(featureId)?.father;
            return isId(f) ? f : undefined;
        },
        conformsTo: (metaclassId, superId) => {
            const seen = new Set<string>();
            const stack = [metaclassId];
            while (stack.length > 0) {
                const c = stack.pop()!;
                if (c === superId) return true;
                if (seen.has(c)) continue;
                seen.add(c);
                for (const s of get(c)?.extends ?? []) if (isId(s)) stack.push(s);
            }
            return false;
        },
    };
}

/** The bindings declared on the metamodel of the M1 model `modelId`; none when the key is absent or unreadable. */
export function readOntoBindings(get: DGet, modelId: string): OntoBinding[] {
    const metamodel = get(modelId)?.instanceof;
    if (!isId(metamodel)) return [];
    const decoded = decodeOntoBindings(get(metamodel)?._state?.[ONTO_BINDINGS_KEY]);
    return decoded.ok ? decoded.value.bindings : [];
}

/** The `object` record of the model's metamodel, `null` without one. */
export function objectRecord(get: DGet, modelId: string): OntoBinding | null {
    return readOntoBindings(get, modelId).find(b => b.name === OBJECT_RECORD) ?? null;
}

/** The M1 objects of the model: its roots, then breadth first every object contained in their slots; each once. */
export function modelObjectIds(get: DGet, modelId: string): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    const queue: string[] = ((get(modelId)?.objects ?? []) as unknown[]).filter(isId);
    while (queue.length > 0) {
        const id = queue.shift()!;
        if (seen.has(id) || get(id)?.className !== 'DObject') continue;
        seen.add(id);
        out.push(id);
        for (const vid of get(id)?.features ?? []) {
            for (const child of (get(vid)?.values ?? []) as unknown[]) {
                if (isId(child) && get(child)?.father === vid) queue.push(child);
            }
        }
    }
    return out;
}

export interface CreationOption {
    id: string;
    name: string;
}

/** The classifiers the record lets an instance be made of, sorted by name. */
export function creationOptions(get: DGet, binding: OntoBinding, modelId: string): CreationOption[] {
    const ids = instantiableClassifiers(ontoReadView(get), binding, modelObjectIds(get, modelId));
    return ids
        .map(id => ({ id, name: String(get(id)?.name ?? id) }))
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** True when the M2 class `classId`, or one of its ancestors, has a feature named `name`. */
function hasFeatureNamed(get: DGet, classId: string, name: string): boolean {
    const seen = new Set<string>();
    const stack = [classId];
    while (stack.length > 0) {
        const c = stack.pop()!;
        if (seen.has(c)) continue;
        seen.add(c);
        const cls = get(c);
        for (const f of [...(cls?.attributes ?? []), ...(cls?.references ?? [])]) if (get(f)?.name === name) return true;
        for (const s of cls?.extends ?? []) if (isId(s)) stack.push(s);
    }
    return false;
}

/** The classifier name with its first letter lowered, then the first integer from 1 no object of the model has. */
export function instanceName(get: DGet, modelId: string, classifierName: string): string {
    const base = (classifierName.charAt(0).toLowerCase() + classifierName.slice(1)) || 'instance';
    const taken = new Set(modelObjectIds(get, modelId).map(id => get(id)?.name));
    let n = 1;
    while (taken.has(`${base}${n}`)) n++;
    return `${base}${n}`;
}

/** A default value typed by the M2 attribute that will hold it; `undefined` when it does not parse. */
function typedDefault(get: DGet, fieldId: string, raw: string): string | number | boolean | undefined {
    const typeName = String(get(get(fieldId)?.type)?.name ?? '');
    if (typeName === 'EBoolean') return raw.trim().toLowerCase() === 'true';
    if (/^E(Int|Short|Long|Byte|BigInteger)$/.test(typeName)) {
        const n = Number.parseInt(raw, 10);
        return Number.isNaN(n) ? undefined : n;
    }
    if (/^E(Float|Double|BigDecimal)$/.test(typeName)) {
        const n = Number.parseFloat(raw);
        return Number.isNaN(n) ? undefined : n;
    }
    return raw;
}

export interface PlannedValue {
    /** M2 class name of the value object. */
    metaclass: string;
    /** Its seed: the value-kind field, by name. */
    seed: Record<string, string | number | boolean>;
}

export interface PlannedSlot {
    /** The defining feature (M1 id). */
    feature: string;
    /** Its seed: the defining-feature reference, by name. */
    seed: Record<string, string>;
    value: PlannedValue | null;
}

export interface SynthesisPlan {
    modelId: string;
    classifier: string;
    /** M2 class name of the instance. */
    instanceMetaclass: string;
    instanceSeed: Record<string, string>;
    /** Name of the slot container on the instance, `null` when the record has no slot roles. */
    slotKey: string | null;
    slotMetaclass: string | null;
    /** Name of the value holder on the slot. */
    valueKey: string | null;
    slots: PlannedSlot[];
    cycles: string[][];
}

/** The M1 model that owns `objectId`, walking `father`. */
export function modelOf(get: DGet, objectId: string): string | undefined {
    let id: unknown = objectId;
    for (let i = 0; i < 64 && isId(id); i++) {
        const r = get(id);
        if (r?.className === 'DModel') return id;
        id = r?.father;
    }
    return undefined;
}

/** The value kind of the record for a feature typed by `typeId`; `null` when the record has none. */
function valueKindFor(get: DGet, view: OntoReadView, binding: OntoBinding, typeId: string): OntoValueKind | null {
    const kinds = binding.valueKinds ?? [];
    const typeName = String(get(typeId)?.name ?? '');
    const primitive = kinds.find(k => k.when === `primitive:${typeName}`);
    if (primitive) return primitive;
    // An instance value names an object classified by the type (an enumeration literal): a type the record itself
    // instantiates (a Class) gives no default (discovery §3.3).
    const owner = binding.featureContainer !== undefined ? view.ownerOf(binding.featureContainer) : undefined;
    const meta = view.metaclassOf(typeId);
    if (owner !== undefined && meta !== undefined && view.conformsTo(meta, owner)) return null;
    return kinds.find(k => k.when === 'instance') ?? null;
}

/** The value object a feature's default asks for, or `null`. */
function plannedValue(get: DGet, view: OntoReadView, binding: OntoBinding, modelId: string, feature: string): PlannedValue | null {
    if (binding.defaultValue === undefined || binding.featureType === undefined) return null;
    const raw = view.attributeValue(feature, binding.defaultValue);
    if (raw === undefined || raw === null || String(raw) === '') return null;
    const type = view.referenceTargets(feature, binding.featureType)[0];
    if (type === undefined) return null;
    const kind = valueKindFor(get, view, binding, type);
    if (!kind) return null;
    const metaclass = get(kind.create)?.name;
    const field = get(kind.field)?.name;
    if (!isId(metaclass) || !isId(field)) return null;
    if (kind.when === 'instance') {
        const target = modelObjectIds(get, modelId).find(id =>
            view.referenceTargets(id, binding.typeReference)[0] === type && get(id)?.name === String(raw));
        return target !== undefined ? { metaclass, seed: { [field]: target } } : null;
    }
    const value = typedDefault(get, kind.field, String(raw));
    return value !== undefined ? { metaclass, seed: { [field]: value } } : null;
}

/** What `instantiate` will create for `classifierId`, or why it cannot. Pure. */
export function synthesisPlan(get: DGet, binding: OntoBinding, classifierId: string): SynthesisPlan | { error: string } {
    const view = ontoReadView(get);
    const modelId = modelOf(get, classifierId);
    if (modelId === undefined) return { error: 'the classifier is in no model' };
    const instanceClass = view.ownerOf(binding.typeReference);
    const instanceMetaclass = instanceClass !== undefined ? get(instanceClass)?.name : undefined;
    const typeKey = get(binding.typeReference)?.name;
    if (!isId(instanceMetaclass) || !isId(typeKey)) return { error: 'the type reference does not resolve' };
    if (get(instanceClass!)?.abstract === true) return { error: `${instanceMetaclass} is abstract` };

    const instanceSeed: Record<string, string> = { [typeKey]: classifierId };
    if (hasFeatureNamed(get, instanceClass!, 'name')) instanceSeed.name = instanceName(get, modelId, String(get(classifierId)?.name ?? ''));

    const plan: SynthesisPlan = {
        modelId, classifier: classifierId, instanceMetaclass, instanceSeed,
        slotKey: null, slotMetaclass: null, valueKey: null, slots: [], cycles: [],
    };
    if (binding.slotContainer === undefined || binding.definingFeature === undefined) return plan;
    const slotKey = get(binding.slotContainer)?.name;
    const slotMetaclass = get(get(binding.slotContainer)?.type)?.name;
    const definingKey = get(binding.definingFeature)?.name;
    if (!isId(slotKey) || !isId(slotMetaclass) || !isId(definingKey)) return { error: 'the slot roles do not resolve' };
    const valueKey = binding.valueHolder !== undefined ? get(binding.valueHolder)?.name : undefined;

    const { features, cycles } = featureClosure(view, binding, classifierId);
    plan.slotKey = slotKey;
    plan.slotMetaclass = slotMetaclass;
    plan.valueKey = isId(valueKey) ? valueKey : null;
    plan.cycles = cycles;
    plan.slots = features.map(feature => ({
        feature,
        seed: { [definingKey]: feature },
        value: plan.valueKey !== null ? plannedValue(get, view, binding, modelId, feature) : null,
    }));
    return plan;
}

// ── The write half ──────────────────────────────────────────────────────────────────────────────────────────────

export interface InstantiateResult {
    ok: boolean;
    instance: string | null;
    slots: string[];
    values: string[];
    /** Every step that did not happen, in order; an instance with problems is kept (R-OI-3: never destructive). */
    problems: string[];
}

const WAIT_STEP_MS = 50;
const WAIT_LIMIT_MS = 6000;

/** Polls `test` until it gives a value or the limit passes. */
async function waitFor<T>(test: () => T | undefined | null | false): Promise<T | null> {
    const until = Date.now() + WAIT_LIMIT_MS;
    for (;;) {
        const r = test();
        if (r) return r;
        if (Date.now() > until) return null;
        await new Promise(resolve => setTimeout(resolve, WAIT_STEP_MS));
    }
}

/** Make one instance of `classifierId` with its slots and default values (see the module comment). */
export async function instantiate(classifierId: string, record: OntoBinding): Promise<InstantiateResult> {
    const [{ store }, { createInstance }] = await Promise.all([
        import('../../../joiner'),
        import('./createAdapter'),
    ]);
    const get: DGet = id => (store.getState() as any)?.idlookup?.[id];
    const result: InstantiateResult = { ok: false, instance: null, slots: [], values: [], problems: [] };
    const plan = synthesisPlan(get, record, classifierId);
    if ('error' in plan) {
        result.problems.push(plan.error);
        return result;
    }

    const made = createInstance(plan.modelId, plan.instanceMetaclass, null, null, plan.instanceSeed);
    if (!made.ok || !made.id) {
        result.problems.push(`instance: ${made.reason ?? 'not created'}`);
        return result;
    }
    const instance = made.id;
    result.instance = instance;
    if (plan.slotKey === null || record.slotContainer === undefined) {
        result.ok = true;
        return result;
    }

    const holder = (ownerId: string, featureId: string | undefined) => () =>
        featureId !== undefined ? featureValue(get, ownerId, featureId) : undefined;
    const slotsValue = await waitFor(holder(instance, record.slotContainer));
    if (!slotsValue) {
        result.problems.push(`${plan.slotKey}: the slot of the instance never appeared`);
        return result;
    }

    for (const planned of plan.slots) {
        const slot = createInstance(plan.modelId, plan.slotMetaclass!, instance, plan.slotKey, planned.seed);
        if (!slot.ok || !slot.id) {
            result.problems.push(`slot for ${planned.feature}: ${slot.reason ?? 'not created'}`);
            continue;
        }
        const slotId = slot.id;
        result.slots.push(slotId);
        // In the owner's list before the next one, so the list keeps the closure order.
        const listed = await waitFor(() => (featureValue(get, instance, record.slotContainer!)?.values ?? []).includes(slotId));
        if (!listed) result.problems.push(`slot ${slotId}: not listed in ${plan.slotKey}`);
        if (!planned.value || plan.valueKey === null) continue;
        if (!(await waitFor(holder(slotId, record.valueHolder)))) {
            result.problems.push(`slot ${slotId}: ${plan.valueKey} never appeared`);
            continue;
        }
        const value = createInstance(plan.modelId, planned.value.metaclass, slotId, plan.valueKey, planned.value.seed);
        if (value.ok && value.id) result.values.push(value.id);
        else result.problems.push(`value for ${planned.feature}: ${value.reason ?? 'not created'}`);
    }
    result.ok = result.problems.length === 0;
    return result;
}
