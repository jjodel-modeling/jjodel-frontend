/**
 * simSnapshotWrite — «Save snapshot as object diagram» written to the store (DCN
 * slice 5, lane 5, P-2026-11-08-2157; R-DCN-27, R-DCN-30). The plan is
 * `planSnapshot` (simSnapshot.ts); this module reads what the plan asks for and
 * executes it. Layer Impact Report: docs/discovery/lir_2026-11-08_dcn_snapshot_write.md.
 *
 * - One undo: the whole write sits in an undo group (`beginUndoGroup`, reducer.ts),
 *   closed in a `finally` once everything has landed, because the store sends its
 *   actions on a timer: the same wait as `instantiate.ts`.
 * - The objects are created as roots of the new model and the containment write
 *   moves them (`setValueAtPosition` sets `father`), as the canvas does:
 *   `syncCreateObject`, then `syncCreateCompositionLink`. Through `DObject.new`, with
 *   no outer TRANSACTION, not `addObject`: its uniqueness gate would refuse the
 *   `Slot_0` of a second instance while every object is still a root.
 * - The snapshot keeps the source's layout (P-2026-11-08-2320): one DVertex per object
 *   with a source vertex, its seed and its records per viewpoint copied, with no outer
 *   TRANSACTION (Rule 12). No DVoidEdge here. On open, Step 2bis of `useJjomSync` gives a
 *   vertex to every object still without one, and no tab is opened (Rule 21 is why
 *   this is not `createM1`).
 * - One write per slot: σ replaces what the model wrote before anything is sent,
 *   so no write depends on the order of two others to the same path.
 *
 * The store is behind `SnapshotWriteHost` and loaded on first use (`liveHost`): the
 * joiner barrel does not import under the node bench.
 */

import { compileDcn } from '../../../model/simulation/dcn/dcnCompile';
import type { DcnSlot } from '../../../model/simulation/dcn/dcnCompile';
import type { OntoBinding } from '../../../model/ontological/bindingCodec';
import type { SimValue } from '../../../model/simulation/netTypes';
import type { VertexLayout } from '../viewpoint/layout/vertexLayout';
import { dcnInputOf } from '../problems/dcnToProblems';
import { collectModelObjectIds } from './simBridge';
import { dcnRunOf } from './simDcnRuns';
import { configAt, getSimRun } from './simRunState';
import { planSnapshot } from './simSnapshot';
import type {
    SnapshotAttributeWrite, SnapshotInput, SnapshotPlan, SnapshotReferenceWrite, SnapshotRoles,
    SnapshotSourceObject, SnapshotSourceSlot, SnapshotUnwritten,
} from './simSnapshot';

type Lookup = Record<string, any>;

type SnapshotWrite = SnapshotReferenceWrite | SnapshotAttributeWrite;

/** What the writer asks of the store; the live one is `liveHost`. */
export interface SnapshotWriteHost {
    lookup(): Lookup;
    /** The new model with its graph, registered in the open project. Returns its id; the store may not have it yet. */
    createModel(name: string, metamodelId: string): string;
    /** A new root of `modelId`. Returns its id; the store may not have it yet. */
    createObject(classId: string, modelId: string, name: string | undefined): string;
    /** A vertex of `objectId` in the graph of the new model. Returns its id. Absent: no vertex is made, Step 2bis lays the snapshot out. */
    createVertex?(objectId: string, layout: SnapshotVertexLayout): string;
    /** Runs writes of slots only, no creator, as one store update. */
    batch(writes: () => void): void;
    writeReference(slotId: string, ids: readonly string[]): void;
    writeAttribute(slotId: string, values: readonly unknown[]): void;
    beginUndoGroup(): void;
    endUndoGroup(): void;
    sleep(ms: number): Promise<void>;
    now(): number;
}

/** What a vertex of the snapshot copies from the source's: the seed and the records per viewpoint (`vertexLayout.ts`). */
export interface SnapshotVertexLayout {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
    readonly isResized: boolean;
    readonly layoutByViewpoint?: Readonly<Record<string, VertexLayout>>;
}

export interface SnapshotVertexCopy {
    /** The key of the object in the plan. */
    readonly key: string;
    readonly layout: SnapshotVertexLayout;
}

export interface SnapshotWriteResult {
    readonly ok: boolean;
    readonly modelId: string | null;
    /** The name the model got, with the suffix of `uniqueModelName` when the plan's was taken. */
    readonly name: string | null;
    /** From the plan, for the caller to show. */
    readonly unwritten: readonly SnapshotUnwritten[];
    /** What did not happen, in order; the model written so far stays, inside the same undo entry. */
    readonly problems: readonly string[];
}

const WAIT_STEP_MS = 50;
/** The wait for the model and its slots shares one, the landing of the values has another. Not measured yet. */
const SNAPSHOT_DEADLINE_MS = 60000;
/** Two store COMMITs (`U.UpdatingTimer`, 300 ms) with no change: the side effects of the creates have landed too. */
const QUIET_MS = 700;

async function settle(h: SnapshotWriteHost, test: () => boolean, until: number): Promise<boolean> {
    for (;;) {
        if (test()) return true;
        if (h.now() > until) return false;
        await h.sleep(WAIT_STEP_MS);
    }
}

/** Waits until the store has stopped changing for `QUIET_MS`, or `until`. */
async function quiet(h: SnapshotWriteHost, until: number): Promise<void> {
    let seen = h.lookup();
    let since = h.now();
    while (h.now() - since < QUIET_MS && h.now() <= until) {
        await h.sleep(WAIT_STEP_MS);
        const current = h.lookup();
        if (current !== seen) {
            seen = current;
            since = h.now();
        }
    }
}

/** The writes of the plan, one per slot, the last asked: σ replaces the model's. */
function finalWrites(plan: SnapshotPlan): SnapshotWrite[] {
    const bySlot = new Map<string, SnapshotWrite>();
    for (const op of plan.operations) if (op.op !== 'create') bySlot.set(`${op.key}|${op.feature}`, op);
    return [...bySlot.values()];
}

/** The slot of `objectId` instantiating `feature` (lane 4's contract). */
function slotOf(lookup: Lookup, objectId: string, feature: string): string | undefined {
    const features: unknown[] = lookup[objectId]?.features ?? [];
    return features.find((id): id is string => typeof id === 'string' && lookup[id]?.instanceof === feature);
}

/** Whether raw slot values read as `expected`, null entries ignored. */
function holds(raw: unknown, expected: readonly unknown[]): boolean {
    const values = (Array.isArray(raw) ? raw : []).filter(v => v !== null && v !== undefined);
    const wanted = expected.filter(v => v !== null && v !== undefined);
    return values.length === wanted.length && values.every((v, i) => String(v) === String(wanted[i]));
}

/**
 * Executes `plan` as a new M1 model of `metamodelId`, one undo entry. Never rejects:
 * what did not happen is in `problems`, and `ok` is false.
 */
export async function writeSnapshot(
    plan: SnapshotPlan, metamodelId: string, host?: SnapshotWriteHost, vertices: readonly SnapshotVertexCopy[] = [],
): Promise<SnapshotWriteResult> {
    const h = host ?? await liveHost();
    const problems: string[] = [];
    let modelId: string | null = null;
    let name: string | null = null;
    h.beginUndoGroup();
    const until = h.now() + SNAPSHOT_DEADLINE_MS;
    try {
        const model = h.createModel(plan.name, metamodelId);
        modelId = model;
        if (await settle(h, () => !!h.lookup()[model], until)) {
            name = String(h.lookup()[model].name ?? plan.name);
            const ids = new Map<string, string>();
            for (const op of plan.operations) if (op.op === 'create') ids.set(op.key, h.createObject(op.classId, model, op.name));

            const writes = finalWrites(plan).map(write => ({
                write,
                object: ids.get(write.key) as string,
                expected: write.op === 'reference' ? write.values.map(k => ids.get(k) as string) : write.values,
            }));
            await settle(h, () => {
                const lookup = h.lookup();
                return [...ids.values()].every(id => !!lookup[id]) && writes.every(w => slotOf(lookup, w.object, w.write.feature) !== undefined);
            }, until);

            const lookup = h.lookup();
            const sent: Array<{ slot: string; expected: readonly unknown[] }> = [];
            h.batch(() => {
                for (const { write, object, expected } of writes) {
                    const slot = slotOf(lookup, object, write.feature);
                    if (slot === undefined) { problems.push(`${write.key}: no slot of ${write.feature}`); continue; }
                    // An equal value is not sent: the setter logs a refused identical assignment as an error.
                    if (holds(lookup[slot]?.values, expected)) continue;
                    if (write.op === 'reference') h.writeReference(slot, expected as string[]);
                    else h.writeAttribute(slot, expected);
                    sent.push({ slot, expected });
                }
            });
            const landed = () => {
                const now = h.lookup();
                return sent.every(s => holds(now[s.slot]?.values, s.expected));
            };
            // Its own deadline: a slot that never came has spent `until`, and what was sent must still land inside the group.
            const landedUntil = h.now() + SNAPSHOT_DEADLINE_MS;
            if (!(await settle(h, landed, landedUntil))) problems.push('some values never landed');
            // One by one, no outer TRANSACTION (Rule 12), as Step 2bis.
            const made: string[] = [];
            for (const { key, layout } of vertices) {
                const object = ids.get(key);
                if (h.createVertex && object !== undefined && lookup[object]) made.push(h.createVertex(object, layout));
            }
            const drawn = () => {
                const now = h.lookup();
                return made.every(id => !!now[id]);
            };
            if (!(await settle(h, drawn, landedUntil))) problems.push('some vertices never landed');
            await quiet(h, landedUntil);
        } else {
            problems.push('the new model never reached the store');
        }
    } catch (e) {
        problems.push(String((e as Error)?.message ?? e));
    } finally {
        h.endUndoGroup();
    }
    return { ok: problems.length === 0, modelId, name, unwritten: plan.unwritten, problems };
}

/** The M2 roles the plan needs, from the DCN binding; `null` when the binding does not name them. */
export function snapshotRolesOf(lookup: Lookup, binding: OntoBinding, literals: string | undefined): SnapshotRoles | null {
    const { slotContainer, definingFeature, valueHolder, featureType, valueKinds } = binding;
    const slotClass = slotContainer !== undefined ? lookup[slotContainer]?.type : undefined;
    if (!slotContainer || !definingFeature || !valueHolder || !featureType || !valueKinds || typeof slotClass !== 'string') return null;
    return { slotClass, slotContainer, definingFeature, valueHolder, featureType, literals, valueKinds };
}

/** One object of the model as `planSnapshot` reads it: a contained object's owner is the object holding its slot. */
function sourceObject(lookup: Lookup, id: string): SnapshotSourceObject {
    const o = lookup[id];
    const attributes: SnapshotSourceSlot[] = [];
    const references: SnapshotSourceSlot[] = [];
    for (const valueId of (Array.isArray(o.features) ? o.features : [])) {
        const v = lookup[valueId];
        if (typeof v?.instanceof !== 'string') continue;
        const slot = { feature: v.instanceof as string, values: Array.isArray(v.values) ? v.values as unknown[] : [] };
        (lookup[v.instanceof]?.className === 'DReference' ? references : attributes).push(slot);
    }
    const father = lookup[o.father];
    return {
        id, classId: o.instanceof, name: o.name,
        owner: father?.className === 'DValue' ? father.father : (o.father ?? null),
        attributes, references,
    };
}

/** What `planSnapshot` needs of the model `modelId` at step `step`. */
export function snapshotInputOf(
    lookup: Lookup, modelId: string, step: number,
    sigma: SnapshotInput['sigma'], roles: SnapshotRoles, slots: ReadonlyMap<string, ReadonlyMap<string, DcnSlot>>,
): SnapshotInput {
    return {
        modelName: String(lookup[modelId]?.name ?? ''),
        step,
        objects: collectModelObjectIds(lookup, modelId).map(id => sourceObject(lookup, id)),
        roles, sigma, slots,
    };
}

/** The layout of every vertex of the `v2-flow` graph of `modelId`, by object id. */
export function sourceVertexLayouts(lookup: Lookup, modelId: string): Map<string, SnapshotVertexLayout> {
    const layouts = new Map<string, SnapshotVertexLayout>();
    for (const v of Object.values(lookup)) {
        if (v?.className !== 'DVertex' || typeof v.model !== 'string') continue;
        const graph = lookup[v.graph];
        if (graph?.model !== modelId || graph.graphStyle !== 'v2-flow') continue;
        const records = v.layoutByViewpoint && Object.keys(v.layoutByViewpoint).length > 0 ? v.layoutByViewpoint : undefined;
        layouts.set(v.model, { x: v.x, y: v.y, w: v.w, h: v.h, isResized: !!v.isResized, ...(records ? { layoutByViewpoint: records } : {}) });
    }
    return layouts;
}

/**
 * The vertices `plan` copies, by plan key. A create names no source id: it takes the
 * source object with its owner, class and name, in the plan's order, owners first.
 * An object the plan added matches nothing and is left to Step 2bis.
 */
export function vertexCopiesOf(
    plan: SnapshotPlan, objects: readonly SnapshotSourceObject[], layouts: ReadonlyMap<string, SnapshotVertexLayout>,
): SnapshotVertexCopy[] {
    const known = new Set(objects.map(o => o.id));
    const identity = (owner: string | null, classId: string, name: unknown) => JSON.stringify([owner, classId, name ?? null]);
    const sources = new Map<string, string[]>();
    for (const o of objects) {
        const id = identity(o.owner !== null && known.has(o.owner) ? o.owner : null, o.classId, o.name);
        sources.set(id, [...(sources.get(id) ?? []), o.id]);
    }
    const sourceOf = new Map<string, string>();
    const copies: SnapshotVertexCopy[] = [];
    for (const op of plan.operations) {
        if (op.op !== 'create') continue;
        if (op.ownerKey !== null && !sourceOf.has(op.ownerKey)) continue;
        const owner = op.ownerKey === null ? null : sourceOf.get(op.ownerKey) as string;
        const source = sources.get(identity(owner, op.classId, op.name))?.shift();
        if (source === undefined) continue;
        sourceOf.set(op.key, source);
        const layout = layouts.get(source);
        if (layout) copies.push({ key: op.key, layout });
    }
    return copies;
}

function refused(reason: string): SnapshotWriteResult {
    return { ok: false, modelId: null, name: null, unwritten: [], problems: [reason] };
}

/**
 * Saves σ at step `step` of the DCN run of `modelId` as a new M1 model. For the panel
 * button: `step` is the step it shows, `getSimView ?? trace.length`. Reads the run,
 * never moves it.
 */
export async function saveRunSnapshot(modelId: string, step: number, host?: SnapshotWriteHost): Promise<SnapshotWriteResult> {
    const run = getSimRun(modelId);
    if (!run || !dcnRunOf(run.net)) return refused('no DCN run of this model');
    const config = configAt(run, step);
    if (!config) return refused(`step ${step} cannot be rebuilt`);
    const h = host ?? await liveHost();
    const lookup = h.lookup();
    const found = dcnInputOf(lookup, modelId);
    if (!found) return refused('the model binds no DCN roles');
    const roles = snapshotRolesOf(lookup, found.binding, found.features?.literals);
    if (!roles) return refused('the binding does not name the slot roles');
    const compiled = compileDcn({ modelId, stc: found.stc, binding: found.binding, view: found.view, features: found.features });
    const sigma: ReadonlyMap<string, ReadonlyMap<string, SimValue>> = config.state.attrs;
    const input = snapshotInputOf(lookup, modelId, step, sigma, roles, compiled.slots);
    const plan = planSnapshot(input);
    return writeSnapshot(plan, String(lookup[modelId]?.instanceof ?? ''), h, vertexCopiesOf(plan, input.objects, sourceVertexLayouts(lookup, modelId)));
}

/** The store, loaded on first use. */
async function liveHost(): Promise<SnapshotWriteHost> {
    const [joiner, history] = await Promise.all([import('../../../joiner'), import('../../../redux/reducer/reducer')]);
    const { Constructors, DGraph, DModel, DObject, DVertex, GraphSize, LPointerTargetable, LProject, SetFieldAction, SetRootFieldAction, TRANSACTION, store } = joiner;
    // Kept from the creation: `DGraph_makeID` counts, a second call names another graph.
    let graphId = '';
    return {
        lookup: () => (store.getState() as any)?.idlookup ?? {},
        // The sequence of `ProjectEditor.tsx` (DModel.new, DGraph.new, the registrations); DModel.new applies `uniqueModelName`.
        createModel: (name, metamodelId) => {
            const project = LProject.getProject();
            let modelId = '';
            TRANSACTION('Save snapshot: create model', () => {
                const dModel = DModel.new(name, metamodelId as any, false, true);
                modelId = dModel.id;
                const dGraph = DGraph.new(0, dModel.id, undefined, undefined, Constructors.DGraph_makeID(dModel.id));
                graphId = dGraph.id;
                SetFieldAction.new(dGraph.id, 'graphStyle' as any, 'v2-flow', '', false);
                SetFieldAction.new(project.id, 'models', dModel.id, '+=', true);
                SetRootFieldAction.new('graphs', dGraph.id, '+=', true);
                SetFieldAction.new(project.id, 'graphs', dGraph.id, '+=', true);
            });
            return modelId;
        },
        createObject: (classId, modelId, name) => DObject.new(classId as any, modelId as any, DModel, name, true).id,
        createVertex: (objectId, layout) => {
            const vertex = DVertex.new(0, objectId as any, graphId as any, graphId as any, undefined, new GraphSize(layout.x, layout.y, layout.w, layout.h));
            if (layout.isResized) SetFieldAction.new(vertex.id, 'isResized' as any, true, '', false);
            if (layout.layoutByViewpoint) SetFieldAction.new(vertex.id, 'layoutByViewpoint' as any, { ...layout.layoutByViewpoint }, '+=', false);
            return vertex.id;
        },
        batch: writes => { TRANSACTION('Save snapshot: write values', writes); },
        writeReference: (slotId, ids) => { (LPointerTargetable.fromPointer(slotId as any) as any).values = [...ids]; },
        writeAttribute: (slotId, values) => {
            const slot = LPointerTargetable.fromPointer(slotId as any) as any;
            if (values.length === 1) slot.value = values[0];
            else slot.values = [...values];
        },
        beginUndoGroup: () => history.beginUndoGroup(),
        endUndoGroup: () => history.endUndoGroup(),
        sleep: ms => new Promise<void>(resolve => setTimeout(resolve, ms)),
        now: () => Date.now(),
    };
}
