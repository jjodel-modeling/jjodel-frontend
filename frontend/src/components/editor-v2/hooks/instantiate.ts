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
 *    `import()`, so the bench never loads them. It writes through `createInstance`, and the node layout below. The instance's vertex is the
 *    one `useJjomSync` Step 2bis gives a new root: a `createVertexForObject` at the click point, right after the
 *    create, left the instantiation out of the undo history (measured, P-2026-10-21-0100: Cmd+Z never removed it and
 *    walked back the entries before it instead; without it one Cmd+Z removes the instance and its slots). The click
 *    reaches the node through the layout write instead (ticket (a), P-2026-10-21-1016). `syncSlots` (S3a) is the same
 *    path on an existing instance: only its missing slots, through the slot loop `synthesize` uses.
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
 * No outer TRANSACTION (rule 12): `addObject` opens its own. One instantiation is one undo entry by an undo group of
 * the history reducer instead (`beginUndoGroup` / `endUndoGroup`, `reducer.ts`, P-2026-10-21-1016): every write lands
 * in the store as it is made, so the waits below see it, and the group keeps them as one entry whose undo removes every
 * record created, `idlookup` included. The group closes after the deferred seeding of every created object has landed
 * (`seedLanded`) and after the node layout has landed (`layoutLanded`), so neither pushes an entry of its own.
 *
 * ── The node layout ───────────────────────────────────────────────────────────────────────────────────────────────
 *
 * A view that authors a `defaultSize` draws a vertex with no manual size at exactly that box (`nodeSizing.ts`,
 * manual > default > derived), so an object box 60 high clipped the header and all rows but two (ticket of
 * 2026-10-21, P-2026-10-21-0655). After the slots, the instance's vertex is given the box of `instanceBoxSize` under the
 * layout in force, through the layout resolver, as a manual size: the rule the UML fixture sizes every drawn box with.
 * Every other exclusive viewpoint that draws the instance gets its box under its own layout too, so an instance made
 * from the class diagram is not left at the default box in the object diagram (ticket (c), P-2026-10-21-1016). The same
 * write gives the node the position the caller's `InstancePlacement` asks for under each of those layouts: the right
 * click of the pane menu, the centre of the view where there is no click (ticket (a)).
 */

import { decodeOntoBindings, ONTO_BINDINGS_KEY, type OntoBinding, type OntoValueKind } from '../../../model/ontological/bindingCodec';
import { featureClosure, instantiableClassifiers, recordFor, slotDiff, type OntoReadView } from '../../../model/ontological/bindingReader';
import { authoredDefaultSize } from '../nodes/nodeSizing';
import type { VertexLayoutWrite } from '../viewpoint/layout/vertexLayout';

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

/** The `object` record when it is the most specific record of `instanceId` (S3a, decision D4), `null` otherwise. */
export function instanceObjectRecord(get: DGet, modelId: string, instanceId: string): OntoBinding | null {
    const record = recordFor(ontoReadView(get), readOntoBindings(get, modelId), instanceId);
    return record?.name === OBJECT_RECORD ? record : null;
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
    return valueOfText(get, view, binding, modelId, feature, String(raw));
}

/** The value object that holds the text `raw` for `feature`, typed by the feature's type: its default, or the text a
 *  ghost row is given (S3b). `null` when the type gives no value kind or the text does not parse for it. */
function valueOfText(get: DGet, view: OntoReadView, binding: OntoBinding, modelId: string, feature: string, raw: string): PlannedValue | null {
    if (binding.featureType === undefined) return null;
    const type = view.referenceTargets(feature, binding.featureType)[0];
    if (type === undefined) return null;
    const kind = valueKindFor(get, view, binding, type);
    if (!kind) return null;
    const metaclass = get(kind.create)?.name;
    const field = get(kind.field)?.name;
    if (!isId(metaclass) || !isId(field)) return null;
    if (kind.when === 'instance') {
        const target = modelObjectIds(get, modelId).find(id =>
            view.referenceTargets(id, binding.typeReference)[0] === type && get(id)?.name === raw);
        return target !== undefined ? { metaclass, seed: { [field]: target } } : null;
    }
    const value = typedDefault(get, kind.field, raw);
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
    const roles = slotRoles(get, binding);
    if (!roles) return { error: 'the slot roles do not resolve' };

    const { features, cycles } = featureClosure(view, binding, classifierId);
    plan.slotKey = roles.slotKey;
    plan.slotMetaclass = roles.slotMetaclass;
    plan.valueKey = roles.valueKey;
    plan.cycles = cycles;
    plan.slots = features.map(feature => plannedSlot(get, view, binding, modelId, roles, feature));
    return plan;
}

/** The names the slot roles of `binding` resolve to: the container on the instance, its type, the defining feature and
 *  the value holder on the slot. `null` when one of the first three does not resolve. */
interface SlotRoles {
    slotKey: string;
    slotMetaclass: string;
    definingKey: string;
    valueKey: string | null;
}

function slotRoles(get: DGet, binding: OntoBinding): SlotRoles | null {
    if (binding.slotContainer === undefined || binding.definingFeature === undefined) return null;
    const slotKey = get(binding.slotContainer)?.name;
    const slotMetaclass = get(get(binding.slotContainer)?.type)?.name;
    const definingKey = get(binding.definingFeature)?.name;
    if (!isId(slotKey) || !isId(slotMetaclass) || !isId(definingKey)) return null;
    const valueKey = binding.valueHolder !== undefined ? get(binding.valueHolder)?.name : undefined;
    return { slotKey, slotMetaclass, definingKey, valueKey: isId(valueKey) ? valueKey : null };
}

/** The slot of `feature`: its seed and the value its default asks for. */
function plannedSlot(get: DGet, view: OntoReadView, binding: OntoBinding, modelId: string, roles: SlotRoles, feature: string): PlannedSlot {
    return {
        feature,
        seed: { [roles.definingKey]: feature },
        value: roles.valueKey !== null ? plannedValue(get, view, binding, modelId, feature) : null,
    };
}

/** What «Sync slots» will create on an existing instance: only the missing slots (R-OI-9). */
export interface SlotSyncPlan {
    modelId: string;
    instance: string;
    slotKey: string;
    slotMetaclass: string;
    valueKey: string | null;
    /** One per feature of the closure with no slot (`slotDiff`), in closure order; orphans and duplicates left alone. */
    slots: PlannedSlot[];
}

/** What `syncSlots` will create on `instanceId`, or why it cannot. Pure. */
export function syncSlotsPlan(get: DGet, binding: OntoBinding, instanceId: string): SlotSyncPlan | { error: string } {
    const view = ontoReadView(get);
    const modelId = modelOf(get, instanceId);
    if (modelId === undefined) return { error: 'the instance is in no model' };
    const roles = slotRoles(get, binding);
    if (!roles) return { error: 'the slot roles do not resolve' };
    const { missing } = slotDiff(view, binding, instanceId);
    return {
        modelId, instance: instanceId, slotKey: roles.slotKey, slotMetaclass: roles.slotMetaclass, valueKey: roles.valueKey,
        slots: missing.map(feature => plannedSlot(get, view, binding, modelId, roles, feature)),
    };
}

// ── Ghost rows and orphan rows (S3b, R-OI-3) ────────────────────────────────────────────────────────────────────────

/** A ghost row: a feature of the closure with no slot, drawn by name; no store object stands behind it. */
export interface GhostRow {
    feature: string;
    name: string;
    /** The text a materialization in flight is writing into it, `null` otherwise. */
    text: string | null;
}

/** What the binding adds to, and marks on, the rows of an instance's node. */
export interface InstanceRows {
    /** The missing features, in closure order. */
    ghosts: GhostRow[];
    /** Every orphan slot by id, with why it is one: the S3a problem's own description. */
    orphans: Record<string, string>;
    /** The slots of a run in flight not to draw yet (see `InstanceFlight`). */
    hidden: string[];
}

/** A single-entry memo of the last bag decoded: the read runs on every node at every dispatch (S3b report, Q2 «Cost»). */
let bindingsMemo: { bag: unknown; bindings: OntoBinding[] } | null = null;

function memoBindings(get: DGet, modelId: string): OntoBinding[] {
    const metamodel = get(modelId)?.instanceof;
    const bag = isId(metamodel) ? get(metamodel)?._state?.[ONTO_BINDINGS_KEY] : undefined;
    if (bag === undefined || bag === null) return [];
    if (bindingsMemo !== null && bindingsMemo.bag === bag) return bindingsMemo.bindings;
    const decoded = decodeOntoBindings(bag);
    bindingsMemo = { bag, bindings: decoded.ok ? decoded.value.bindings : [] };
    return bindingsMemo.bindings;
}

/**
 * The ghost rows and the orphan marks of `instanceId` under its `object` record (S3a D4), `null` when the model has no
 * bindings or the instance is not under that record (a link, S4). While a run is in flight on the instance (`flight`),
 * the features it makes are no ghosts, its slots are no orphans and stay hidden until their defining feature has landed,
 * and the ghost a materialization writes keeps the typed text until the run ends. Pure over `get` and `flight`.
 */
export function instanceRows(get: DGet, instanceId: string, flight: InstanceFlight | null = instanceFlight(instanceId)): InstanceRows | null {
    const modelId = modelOf(get, instanceId);
    if (modelId === undefined) return null;
    const bindings = memoBindings(get, modelId);
    if (bindings.length === 0) return null;
    const view = ontoReadView(get);
    const record = recordFor(view, bindings, instanceId);
    if (record?.name !== OBJECT_RECORD || record.slotContainer === undefined || record.definingFeature === undefined) return null;
    const classifier = view.referenceTargets(instanceId, record.typeReference)[0];
    if (classifier === undefined) return null;
    const diff = slotDiff(view, record, instanceId);
    const name = (id: string) => String(get(id)?.name ?? id);
    const running = flight?.features ?? [];
    const runSlots = flight?.slots ?? {};
    const writing = flight?.materializing ?? null;

    // The ghost being written stays where it was once its slot has landed: the closure gives its place.
    const missing = writing && !diff.missing.includes(writing.feature)
        ? featureClosure(view, record, classifier).features.filter(f => f === writing.feature || diff.missing.includes(f))
        : diff.missing;
    const ghosts = missing
        .filter(f => f === writing?.feature || !running.includes(f))
        .map(f => ({ feature: f, name: name(f), text: f === writing?.feature ? writing.text : null }));
    const orphans: Record<string, string> = {};
    for (const { slot, feature } of diff.orphans) {
        if (slot in runSlots) continue;
        orphans[slot] = feature === null ? 'Its feature is gone' : `${name(feature)} is not a feature of ${name(classifier)}`;
    }
    const hidden = Object.keys(runSlots).filter(slot => runSlots[slot] === writing?.feature
        || view.referenceTargets(slot, record.definingFeature!)[0] !== runSlots[slot]);
    return { ghosts, orphans, hidden };
}

/**
 * The value object for the text typed into a ghost row: typed by the feature's type, else a String value (S3b, decision
 * 3), so the write is not refused (R-VAL-4) and S3a's value-type problem reports it. `null` when the record has no
 * String kind either.
 */
function valueOfTypedText(get: DGet, view: OntoReadView, binding: OntoBinding, modelId: string, feature: string, text: string): PlannedValue | null {
    const typed = valueOfText(get, view, binding, modelId, feature, text);
    // `typedDefault` reads any text as a Boolean: a typed text is one only when it says true or false.
    const parses = typed !== null
        && Object.values(typed.seed).every(v => typeof v !== 'boolean' || /^(true|false)$/i.test(text));
    if (parses) return typed;
    const kind = (binding.valueKinds ?? []).find(k => k.when === 'primitive:String');
    const metaclass = kind ? get(kind.create)?.name : undefined;
    const field = kind ? get(kind.field)?.name : undefined;
    return isId(metaclass) && isId(field) ? { metaclass, seed: { [field]: text } } : null;
}

/**
 * What `materializeSlot` will create: one slot of `featureId` on `instanceId`, holding the value `text` asks for. `null`
 * when the text is empty: nothing to write, as an edit that changed nothing. An error when the feature is no longer
 * missing (someone made its slot meanwhile: the row redraws real) or no value kind holds the text. Pure.
 */
export function materializePlan(
    get: DGet, binding: OntoBinding, instanceId: string, featureId: string, text: string,
): SlotSyncPlan | { error: string } | null {
    const raw = text.trim();
    if (raw === '') return null;
    const view = ontoReadView(get);
    const modelId = modelOf(get, instanceId);
    if (modelId === undefined) return { error: 'the instance is in no model' };
    const roles = slotRoles(get, binding);
    if (!roles) return { error: 'the slot roles do not resolve' };
    const featureName = String(get(featureId)?.name ?? featureId);
    if (!slotDiff(view, binding, instanceId).missing.includes(featureId)) return { error: `${featureName} has a slot already` };
    const value = roles.valueKey !== null ? valueOfTypedText(get, view, binding, modelId, featureId, raw) : null;
    if (!value) return { error: `no value of ${featureName} holds «${raw}»` };
    return {
        modelId, instance: instanceId, slotKey: roles.slotKey, slotMetaclass: roles.slotMetaclass, valueKey: roles.valueKey,
        slots: [{ feature: featureId, seed: { [roles.definingKey]: featureId }, value }],
    };
}

/** Box metrics of the UML fixture (`box`, `scripts/probe/uml-class-object-fixture.ts:222`): chrome, one top label, one row. */
export const BOX_METRICS = { chrome: 26, label: 20, row: 18 } as const;

/** Width when the view authors a height only: the seed width Step 2bis gives a new root. */
const SEED_WIDTH = 200;

/** The parts of a vertex view `instanceBoxSize` reads. */
export interface SizedViewIR {
    defaultSize?: unknown;
    visible?: unknown;
    shape?: { labels?: Array<{ position?: string }> };
    fieldCompartments?: unknown[];
}

/**
 * The box of a new instance's node under `view`: the view's width, and a height that holds the top labels and one row
 * per slot (no rows when the view has no field compartment), never below the authored height. `null` when the view
 * authors no `defaultSize` (its box hugs the content already) or is not drawn. Pure.
 */
export function instanceBoxSize(view: SizedViewIR | null | undefined, slots: number): { w: number; h: number } | null {
    if (!view || view.visible === false) return null;
    const defaults = authoredDefaultSize(view.defaultSize);
    if (!defaults) return null;
    const labels = (view.shape?.labels ?? []).filter(l => l?.position === 'top').length;
    const rows = (view.fieldCompartments?.length ?? 0) > 0 ? Math.max(0, slots) : 0;
    const h = BOX_METRICS.chrome + BOX_METRICS.label * labels + BOX_METRICS.row * rows;
    return { w: defaults.width ?? SEED_WIDTH, h: Math.max(defaults.height ?? 0, h) };
}

/** A point in flow coordinates. */
export interface FlowPoint {
    x: number;
    y: number;
}

/**
 * Where the new instance's node goes under a layout key, `null` to keep the position Step 2bis gives it. The caller
 * knows the click and the viewports; `instantiate` knows which layouts draw the instance.
 */
export type InstancePlacement = (layoutKey: string) => FlowPoint | null;

/** The flow point at the centre of a pane `pane` big under the viewport `vp` (screen = flow * zoom + offset). Pure. */
export function viewCentre(vp: { x: number; y: number; zoom: number }, pane: { width: number; height: number }): FlowPoint {
    return { x: (pane.width / 2 - vp.x) / vp.zoom, y: (pane.height / 2 - vp.y) / vp.zoom };
}

/** A layout a new node is laid out in. */
export interface LayoutTarget {
    /** The viewpoint whose views draw the node under that layout; `undefined` when none is active. */
    vp: string | undefined;
    layoutKey: string;
    active: boolean;
}

/**
 * The layouts a new node is laid out in: the one in force (`activeLayoutKey`, under the active viewpoint), then every
 * other exclusive viewpoint under its own key (an instance made from the class diagram is drawn by the object diagram
 * too). A decorative viewpoint that is not active is left out: it shares the abstract-syntax layout. Pure.
 */
export function layoutTargets(lookup: Record<string, any>, activeVp: unknown, activeLayoutKey: string): LayoutTarget[] {
    const active = isId(activeVp) ? activeVp : undefined;
    const out: LayoutTarget[] = [{ vp: active, layoutKey: activeLayoutKey, active: true }];
    for (const id of Object.keys(lookup ?? {})) {
        const d = lookup[id];
        if (id === active || d?.className !== 'DViewPoint' || !d.isExclusiveView) continue;
        if (!out.some(t => t.layoutKey === id)) out.push({ vp: id, layoutKey: id, active: false });
    }
    return out;
}

/**
 * Whether the deferred seeding of `objectId` has landed: every key of `seed` names a slot of the object (by its
 * feature's name) whose first value reads as the seed's. `addObject` writes the seed 600 ms after the create
 * (`createAdapter.ts` header), so the undo group waits for it instead of closing before it. Pure.
 */
export function seedLanded(get: DGet, objectId: string, seed: Readonly<Record<string, string | number | boolean>>): boolean {
    const slots: any[] = ((get(objectId)?.features ?? []) as unknown[]).map(id => (isId(id) ? get(id) : undefined));
    return Object.entries(seed).every(([key, value]) => {
        const slot = slots.find(v => isId(v?.instanceof) && get(v.instanceof)?.name === key);
        const first = slot?.values?.[0];
        return first !== undefined && first !== null && String(first) === String(value);
    });
}

/** One node layout write of `layoutInstanceNode`: the vertex, and the write `resolveVertexLayoutWrite` gave for it. */
export interface NodeLayoutWrite {
    vertex: string;
    write: VertexLayoutWrite;
}

/**
 * Whether every write of `writes` is in the store, by value: the record of the layout (`layoutByViewpoint[vpId]`) or
 * the vertex itself holds each key written. The store sends its actions on its update timer (`COMMIT` every
 * `U.UpdatingTimer` ms, `reducer.ts`), up to 300 ms after the TRANSACTION returns, so the undo group waits for this
 * instead of closing before the write and letting it push an entry of its own (S2-4u, P-2026-10-21-1121). Pure.
 */
export function layoutLanded(get: DGet, writes: readonly NodeLayoutWrite[]): boolean {
    return writes.every(({ vertex, write }) => {
        const held = write.target === 'dictionary' ? get(vertex)?.layoutByViewpoint?.[write.vpId] : get(vertex);
        const wanted: Record<string, unknown> = write.target === 'dictionary' ? write.record : write.patch;
        return !!held && Object.entries(wanted).every(([key, value]) => value === undefined || held[key] === value);
    });
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

/** The modules the write half reaches, loaded once before the first create. */
interface WriteModules {
    joiner: typeof import('../../../joiner');
    ir: typeof import('../viewpoint/ir/irResolveCore');
    readCtx: typeof import('../viewpoint/ir/irReadCtxLproxy');
    layoutKey: typeof import('../viewpoint/layout/vertexLayoutAdapter');
    layout: typeof import('../viewpoint/layout/vertexLayout');
}

/** The vertices that draw `objectId`. */
function verticesOf(lookup: Record<string, any>, objectId: string): string[] {
    const out: string[] = [];
    for (const id of Object.keys(lookup ?? {})) {
        const r = lookup[id];
        if (r?.model === objectId && /Vertex/.test(String(r.className ?? ''))) out.push(id);
    }
    return out;
}

/**
 * Give the instance's node, in every layout of `layoutTargets` whose view draws it, the box of `instanceBoxSize` and
 * the position `placeAt` asks for (see the module comment): one TRANSACTION of SetFieldAction only (rule 12), each write
 * resolved by `resolveVertexLayoutWrite` (R-LAY-16). The layout in force takes the position even when no IR view
 * draws the node there (the click is in its coordinates); another layout only when its IR draws the instance. Not
 * `syncSizeToJjom`: its `markCanvasUpdated` makes the sync skip the vertex for the next 300 ms, which a resize drag
 * wants (the canvas already holds the size) and a new node does not. Inside the instantiation's undo group, so it adds
 * no undo entry: it returns once the write has landed (`layoutLanded`). A problem when the node never appears or the
 * write never lands; nothing when no layout has a size or a position to take.
 */
async function layoutInstanceNode(
    m: WriteModules, get: DGet, instance: string, slots: number, placeAt?: InstancePlacement, growOnly = false,
): Promise<string | null> {
    const state: any = m.joiner.store.getState();
    const metaclass = get(instance)?.instanceof;
    if (!isId(metaclass)) return null;
    const lookup = state.idlookup;
    const readCtx = m.readCtx.makeReadCtx(lookup);
    const patches: Array<{ layoutKey: string; patch: { x?: number; y?: number; w?: number; h?: number; isResized?: boolean } }> = [];
    for (const target of layoutTargets(lookup, state.viewpoint, m.layoutKey.getLayoutKeyOf(state))) {
        const signature = m.ir.computeIRSignature(state, target.vp);
        const index = signature ? m.ir.getIRIndex(state, signature, target.vp) : null;
        const compiled = index ? m.ir.resolveIRView(instance, metaclass, index, readCtx, lookup) : null;
        const view = compiled?.kind === 'vertex' && (compiled.ir as SizedViewIR).visible !== false ? compiled.ir as SizedViewIR : null;
        if (!target.active && !view) continue;
        const size = instanceBoxSize(view, slots);
        const point = placeAt?.(target.layoutKey) ?? null;
        if (!size && !point) continue;
        patches.push({
            layoutKey: target.layoutKey,
            patch: { ...(size ? { w: size.w, h: size.h, isResized: true } : {}), ...(point ? { x: point.x, y: point.y } : {}) },
        });
    }
    if (patches.length === 0) return null;
    const vertices = await waitFor(() => {
        const vs = verticesOf((m.joiner.store.getState() as any)?.idlookup, instance);
        return vs.length > 0 ? vs : null;
    });
    if (!vertices) return 'the node of the instance never appeared';
    // «Sync slots» (S3a, decision D6): the box grows to hold the new rows and never shrinks; a box already as large as
    // the rows ask, under a layout, is left as it is there.
    const grown = (vid: string, layoutKey: string, patch: typeof patches[number]['patch']) => {
        if (!growOnly || patch.w === undefined || patch.h === undefined) return patch;
        const now = m.layout.readVertexLayout(get(vid), layoutKey);
        const w = now.isResized ? Math.max(now.w, patch.w) : patch.w;
        const h = now.isResized ? Math.max(now.h, patch.h) : patch.h;
        return now.isResized && w === now.w && h === now.h ? null : { ...patch, w, h };
    };
    const planned = vertices.flatMap(vid => patches.map(({ layoutKey, patch }) => ({ vid, layoutKey, patch: grown(vid, layoutKey, patch) })))
        .filter((p): p is { vid: string; layoutKey: string; patch: typeof patches[number]['patch'] } => p.patch !== null);
    if (planned.length === 0) return null;
    const writes: NodeLayoutWrite[] = [];
    m.joiner.TRANSACTION('Instantiate: node layout', () => {
        for (const { vid, layoutKey, patch } of planned) {
            const write = m.layout.resolveVertexLayoutWrite(get(vid), patch, layoutKey);
            writes.push({ vertex: vid, write });
            if (write.target === 'dictionary') {
                m.joiner.SetFieldAction.new(vid as any, 'layoutByViewpoint' as any, { [write.vpId]: write.record }, '+=', false);
                continue;
            }
            for (const [key, value] of Object.entries(write.patch)) m.joiner.SetFieldAction.new(vid as any, key as any, value, undefined, false);
        }
    });
    if (!(await waitFor(() => layoutLanded(get, writes)))) return 'the node layout never landed';
    return null;
}

/**
 * The instantiations and syncs running now. A run creates its slots one at a time over seconds, so a problem producer
 * reading the store in the middle would report missing slots that are on their way (S3a, decision D5): it asks this
 * instead, since the end of a run is not a store change of its own.
 */
let inFlight = 0;

/** True while an `instantiate`, a `syncSlots` or a `materializeSlot` is running. */
export function instantiationInFlight(): boolean {
    return inFlight > 0;
}

/**
 * A run in flight on one instance, for its node (S3b, decision D5): a run lists each slot before its defining feature
 * lands (the seed, 600 ms after the create), so a read in between would draw the slot as an orphan and its feature as a
 * ghost. `instanceRows` reads this instead.
 */
export interface InstanceFlight {
    /** The features the run makes a slot for. */
    features: string[];
    /** The slots the run has made so far, each with the feature it is for. */
    slots: Record<string, string>;
    /** The ghost a materialization is writing, with the typed text. */
    materializing: { feature: string; text: string } | null;
}

const flights = new Map<string, InstanceFlight>();
const flightListeners = new Set<() => void>();

/** The run in flight on `instanceId`, `null` when none is; a new object at every change, for `useSyncExternalStore`. */
export function instanceFlight(instanceId: string): InstanceFlight | null {
    return flights.get(instanceId) ?? null;
}

/** Called at every change of a flight: the end of a run is not a store change, so a node subscribes here too. */
export function subscribeInstanceFlights(listener: () => void): () => void {
    flightListeners.add(listener);
    return () => { flightListeners.delete(listener); };
}

function setFlight(instance: string, flight: InstanceFlight | null): void {
    if (flight) flights.set(instance, flight);
    else if (!flights.delete(instance)) return;
    for (const listener of Array.from(flightListeners)) listener();
}

/** The created-slot callback of `createSlots` for a run on `instance`. */
const flightSlot = (instance: string) => (slot: string, feature: string): void => {
    const flight = flights.get(instance);
    if (flight) setFlight(instance, { ...flight, slots: { ...flight.slots, [slot]: feature } });
};

/** The modules of the write half, loaded on first use. */
async function writeModules() {
    const [joiner, adapter, ir, readCtx, layoutKey, layout, history] = await Promise.all([
        import('../../../joiner'),
        import('./createAdapter'),
        import('../viewpoint/ir/irResolveCore'),
        import('../viewpoint/ir/irReadCtxLproxy'),
        import('../viewpoint/layout/vertexLayoutAdapter'),
        import('../viewpoint/layout/vertexLayout'),
        import('../../../redux/reducer/reducer'),
    ]);
    const modules: WriteModules = { joiner, ir, readCtx, layoutKey, layout };
    const get: DGet = id => (joiner.store.getState() as any)?.idlookup?.[id];
    return { modules, createInstance: adapter.createInstance, history, get };
}

/** Make one instance of `classifierId` with its slots and default values, laid out by `placeAt` (see the module comment). */
export async function instantiate(classifierId: string, record: OntoBinding, placeAt?: InstancePlacement): Promise<InstantiateResult> {
    const { modules, createInstance, history, get } = await writeModules();
    const result: InstantiateResult = { ok: false, instance: null, slots: [], values: [], problems: [] };
    const plan = synthesisPlan(get, record, classifierId);
    if ('error' in plan) {
        result.problems.push(plan.error);
        return result;
    }
    inFlight++;
    const group = history.beginUndoGroup();
    try {
        await synthesize(modules, createInstance, get, plan, record, result, placeAt);
    } finally {
        // After the last write has landed (`seedLanded`, `layoutLanded`): the store sends actions on its update timer,
        // so one macrotask (P-2026-10-21-1041) was not enough and the node layout pushed an entry of its own.
        history.endUndoGroup(group);
        if (result.instance) setFlight(result.instance, null);
        inFlight--;
    }
    result.ok = result.problems.length === 0;
    return result;
}

/**
 * «Sync slots» (R-OI-3, R-OI-9; S3a): create the missing slots of `instanceId`, each with its default value, appended to
 * its slot list in closure order (decision D7), and grow its node to hold them (D6). Orphans and duplicates are left
 * alone: nothing is deleted. One undo entry, by the same group and the same waits as `instantiate`. Nothing to create
 * is a success that writes nothing.
 */
export async function syncSlots(instanceId: string, record: OntoBinding): Promise<InstantiateResult> {
    const { modules, createInstance, history, get } = await writeModules();
    const result: InstantiateResult = { ok: false, instance: instanceId, slots: [], values: [], problems: [] };
    const plan = syncSlotsPlan(get, record, instanceId);
    if ('error' in plan) {
        result.problems.push(plan.error);
        return result;
    }
    if (plan.slots.length === 0) {
        result.ok = true;
        return result;
    }
    await addSlots({ modules, createInstance, history, get }, plan, record, result, null);
    return result;
}

/**
 * Materialize a ghost row (S3b, R-OI-3): one slot of `featureId` on `instanceId` holding the value `text` asks for
 * (`materializePlan`), appended to its slot list, the node grown to hold it (D6). One undo entry, by the same group and
 * waits as «Sync slots». Empty text writes nothing and is a success.
 */
export async function materializeSlot(instanceId: string, featureId: string, text: string): Promise<InstantiateResult> {
    const w = await writeModules();
    const result: InstantiateResult = { ok: false, instance: instanceId, slots: [], values: [], problems: [] };
    const modelId = modelOf(w.get, instanceId);
    const record = modelId !== undefined ? instanceObjectRecord(w.get, modelId, instanceId) : null;
    if (!record) {
        result.problems.push('the instance is under no object record');
        return result;
    }
    const plan = materializePlan(w.get, record, instanceId, featureId, text);
    if (plan === null) {
        result.ok = true;
        return result;
    }
    if ('error' in plan) {
        result.problems.push(plan.error);
        return result;
    }
    await addSlots(w, plan, record, result, { feature: featureId, text: text.trim() });
    return result;
}

/**
 * The write of «Sync slots» and of a materialization: the planned slots and values in one undo group, the wait for their
 * seeds, then the node grown to hold every slot (grow-only, S3a D6); the instance in flight throughout.
 */
async function addSlots(
    w: Awaited<ReturnType<typeof writeModules>>, plan: SlotSyncPlan, record: OntoBinding, result: InstantiateResult,
    materializing: InstanceFlight['materializing'],
): Promise<void> {
    const instanceId = plan.instance;
    inFlight++;
    setFlight(instanceId, { features: plan.slots.map(s => s.feature), slots: {}, materializing });
    const group = w.history.beginUndoGroup();
    try {
        const seeded: Seeded = [];
        await createSlots(w.createInstance, w.get, plan, plan.slots, record, result, seeded, flightSlot(instanceId));
        await waitSeeded(w.get, seeded, result);
        const total = (featureValue(w.get, instanceId, record.slotContainer!)?.values ?? []).filter(isId).length;
        const laid = await layoutInstanceNode(w.modules, w.get, instanceId, total, undefined, true);
        if (laid) result.problems.push(laid);
    } finally {
        w.history.endUndoGroup(group);
        setFlight(instanceId, null);
        inFlight--;
    }
    result.ok = result.problems.length === 0;
}

/** Every create with the seed `addObject` writes after it, awaited before the group closes. */
type Seeded = Array<[string, Readonly<Record<string, string | number | boolean>>]>;

async function waitSeeded(get: DGet, seeded: Seeded, result: InstantiateResult): Promise<void> {
    for (const [id, seed] of seeded) {
        if (!(await waitFor(() => seedLanded(get, id, seed)))) result.problems.push(`${id}: its seed never landed`);
    }
}

/** A thunk reading the DValue of `featureId` on `ownerId`, for `waitFor`. */
const holder = (get: DGet, ownerId: string, featureId: string | undefined) => () =>
    featureId !== undefined ? featureValue(get, ownerId, featureId) : undefined;

/**
 * The slot loop of `synthesize` and `syncSlots`: one slot per entry of `planned` on `plan.instance`, each awaited in the
 * instance's list before the next one (the list keeps the order), then its default value in the slot's holder.
 */
async function createSlots(
    createInstance: typeof import('./createAdapter').createInstance, get: DGet,
    plan: { modelId: string; instance: string; slotKey: string; slotMetaclass: string; valueKey: string | null },
    planned: readonly PlannedSlot[], record: OntoBinding, result: InstantiateResult, seeded: Seeded,
    onSlot?: (slot: string, feature: string) => void,
): Promise<void> {
    const instance = plan.instance;
    for (const slotPlan of planned) {
        const slot = createInstance(plan.modelId, plan.slotMetaclass, instance, plan.slotKey, slotPlan.seed);
        if (!slot.ok || !slot.id) {
            result.problems.push(`slot for ${slotPlan.feature}: ${slot.reason ?? 'not created'}`);
            continue;
        }
        const slotId = slot.id;
        // Before it is listed: the node never draws it as an orphan (S3b, the in-flight record).
        onSlot?.(slotId, slotPlan.feature);
        result.slots.push(slotId);
        seeded.push([slotId, slotPlan.seed]);
        // In the owner's list before the next one, so the list keeps the closure order.
        const listed = await waitFor(() => (featureValue(get, instance, record.slotContainer!)?.values ?? []).includes(slotId));
        if (!listed) result.problems.push(`slot ${slotId}: not listed in ${plan.slotKey}`);
        if (!slotPlan.value || plan.valueKey === null) continue;
        if (!(await waitFor(holder(get, slotId, record.valueHolder)))) {
            result.problems.push(`slot ${slotId}: ${plan.valueKey} never appeared`);
            continue;
        }
        const value = createInstance(plan.modelId, slotPlan.value.metaclass, slotId, plan.valueKey, slotPlan.value.seed);
        if (value.ok && value.id) {
            result.values.push(value.id);
            seeded.push([value.id, slotPlan.value.seed]);
        }
        else result.problems.push(`value for ${slotPlan.feature}: ${value.reason ?? 'not created'}`);
    }
}

/** The creates, the wait for their seeding and the node layout of `instantiate`, inside its undo group. */
async function synthesize(
    m: WriteModules, createInstance: typeof import('./createAdapter').createInstance, get: DGet, plan: SynthesisPlan,
    record: OntoBinding, result: InstantiateResult, placeAt?: InstancePlacement,
): Promise<void> {
    const seeded: Seeded = [];
    const settle = async (slots: number) => {
        await waitSeeded(get, seeded, result);
        const laid = await layoutInstanceNode(m, get, result.instance!, slots, placeAt);
        if (laid) result.problems.push(laid);
    };

    const made = createInstance(plan.modelId, plan.instanceMetaclass, null, null, plan.instanceSeed);
    if (!made.ok || !made.id) {
        result.problems.push(`instance: ${made.reason ?? 'not created'}`);
        return;
    }
    const instance = made.id;
    result.instance = instance;
    // In flight before its node can draw: a new instance shows no ghost row at any time.
    setFlight(instance, { features: plan.slots.map(s => s.feature), slots: {}, materializing: null });
    seeded.push([instance, plan.instanceSeed]);
    if (plan.slotKey === null || record.slotContainer === undefined) {
        await settle(0);
        return;
    }

    const slotsValue = await waitFor(holder(get, instance, record.slotContainer));
    if (!slotsValue) {
        result.problems.push(`${plan.slotKey}: the slot of the instance never appeared`);
        return;
    }

    const target = { modelId: plan.modelId, instance, slotKey: plan.slotKey, slotMetaclass: plan.slotMetaclass!, valueKey: plan.valueKey };
    await createSlots(createInstance, get, target, plan.slots, record, result, seeded, flightSlot(instance));
    await settle(result.slots.length);
}
