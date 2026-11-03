/**
 * Recursive materialization of JjTL nested creations (P-2026-10-30-1335 Phase 2).
 *
 * Neutral fixture: Root(name).nodes Node*; Node(name, label).kids Node*, .leaves Leaf*;
 * Leaf(value, no name).subs Node*. Depth counted from the root (0): a nameless Leaf at depth 2, two
 * Nodes named "dup" in one slot at depth 3, objects at depth 4 on both branches.
 *
 * The fake store reproduces what docs/discovery/discovery_2026-10-30_jjtl_nested_materialization.md §4
 * measured in the browser: an object's slots answer only some time after `addObject` created it.
 */
import { describe, it, expect } from 'vitest';
import {
    materializeNested,
    makeRootTargetIndex,
    writeNestedAttributeSets,
    awaitNestedSlots,
    formatNestedUnwritten,
    ATTRIBUTE_WAIT_CAP_MS,
    NESTED_WALK_WAIT_CAP_MS,
    SLOT_POLL_MS,
    SLOT_WAIT_CAP_MS,
    type NestedAttributeDeps,
    type NestedAttributeSet,
    type NestedDeps,
    type NestedJob,
} from '../nestedMaterialization';

const CLASSES: Record<string, { attrs: string[]; refs: string[] }> = {
    Root: { attrs: ['name'], refs: ['nodes'] },
    Node: { attrs: ['name', 'label'], refs: ['kids', 'leaves'] },
    Leaf: { attrs: ['value'], refs: ['subs'] },
};

/** An executor object created inside a feature, as the executor returns it. */
const N = (type: string, fields: Record<string, any>) => ({ __nested: true, __type: type, ...fields });

const fixture = () => [
    N('Node', {
        name: 'n1', label: 'L1',
        leaves: [N('Leaf', {
            value: 2,
            subs: [
                N('Node', { name: 'dup', label: 'D1', kids: [N('Node', { name: 'deep', label: 'L4' })] }),
                N('Node', { name: 'dup', label: 'D2' }),
            ],
        })],
        kids: [N('Node', {
            name: 'g1', label: 'G1',
            kids: [N('Node', { name: 'gg1', label: 'GG1', kids: [N('Node', { name: 'ggg1', label: 'GGG1' })] })],
        })],
    }),
];

const expectedTree = {
    cls: 'Root',
    nodes: [{
        cls: 'Node', name: 'n1', label: 'L1',
        leaves: [{
            cls: 'Leaf', value: 2,
            subs: [
                { cls: 'Node', name: 'dup', label: 'D1', kids: [{ cls: 'Node', name: 'deep', label: 'L4' }] },
                { cls: 'Node', name: 'dup', label: 'D2' },
            ],
        }],
        kids: [{
            cls: 'Node', name: 'g1', label: 'G1',
            kids: [{ cls: 'Node', name: 'gg1', label: 'GG1', kids: [{ cls: 'Node', name: 'ggg1', label: 'GGG1' }] }],
        }],
    }],
};

interface FakeObject { id: string; className: string; createdAt: number; features: Record<string, string[]> }

/** A store whose slots answer `slotDelayMs` after creation, on a clock only `sleep` advances. */
function fakeStore(slotDelayMs: number, neverReady: (o: FakeObject, feature: string) => boolean = () => false) {
    let clock = 0;
    let seq = 0;
    const objects = new Map<string, FakeObject>();
    const addCalls: Array<{ json: Record<string, any>; className: string }> = [];
    const warnings: string[] = [];
    const make = (className: string, createdAt: number): FakeObject => {
        const o = { id: 'o' + (++seq), className, createdAt, features: {} };
        objects.set(o.id, o);
        return o;
    };
    const root = make('Root', -10 * slotDelayMs - 1);
    const deps: NestedDeps = {
        slotOf(objectId, featureName) {
            const o = objects.get(objectId);
            if (!o || clock - o.createdAt < slotDelayMs || neverReady(o, featureName)) return undefined;
            if (!CLASSES[o.className].refs.includes(featureName)) return undefined;
            return {
                addObject(json, className) {
                    addCalls.push({ json, className });
                    const c = make(className, clock);
                    (o.features[featureName] ||= []).push(c.id);
                    return { id: c.id };
                },
            };
        },
        classInfo(className) {
            const c = CLASSES[className];
            return c && { attributeNames: new Set(c.attrs), referenceNames: new Set(c.refs) };
        },
        sleep: async (ms) => { clock += ms; },
        now: () => clock,
        warn: (m) => { warnings.push(m); },
    };
    /** The tree under an object, with the attributes the walk queued for each id. */
    const treeOf = (id: string, attrs: Map<string, Record<string, any>>): any => {
        const o = objects.get(id)!;
        const out: any = { cls: o.className, ...(attrs.get(id) || {}) };
        for (const [f, ids] of Object.entries(o.features)) out[f] = ids.map(x => treeOf(x, attrs));
        return out;
    };
    return { deps, root, addCalls, warnings, treeOf, clock: () => clock };
}

const run = async (store: ReturnType<typeof fakeStore>, children = fixture()) => {
    const jobs: NestedJob[] = [{ parentId: store.root.id, path: 'r1', featureName: 'nodes', children }];
    const result = await materializeNested(jobs, store.deps);
    const attrs = new Map(result.attributeSets.map(s => [s.objectId, s.attributes]));
    return { result, tree: store.treeOf(store.root.id, attrs) };
};

describe('materializeNested', () => {
    it('builds the whole tree to depth 4 against the returned ids, with the attributes of every depth', async () => {
        const store = fakeStore(120);
        const { result, tree } = await run(store);
        expect(tree).toEqual(expectedTree);
        expect(result.created).toBe(8);
        expect(result.levels).toBe(4);
        expect(result.unplaced).toEqual([]);
        expect(store.warnings).toEqual([]);
    });

    it('creates every nested object with an empty json, name included in the attributes (R-S1-6)', async () => {
        const store = fakeStore(120);
        const { result } = await run(store);
        expect(store.addCalls).toHaveLength(8);
        expect(store.addCalls.every(c => Object.keys(c.json).length === 0)).toBe(true);
        // The nameless class never receives a name, the named one always does.
        const leaf = result.attributeSets.find(s => s.className === 'Leaf')!;
        expect(leaf.attributes).toEqual({ value: 2 });
        expect(result.attributeSets.filter(s => s.className === 'Node').every(s => typeof s.attributes.name === 'string')).toBe(true);
    });

    it('waits for the slots of each level before creating in them', async () => {
        const store = fakeStore(300);
        const { tree } = await run(store);
        expect(tree).toEqual(expectedTree);
        expect(store.clock()).toBeGreaterThanOrEqual(3 * 300);
    });

    it('a slot that never answers loses its subtree, counted and named, and the rest is still built', async () => {
        const store = fakeStore(120, (o, f) => o.className === 'Leaf' && f === 'subs');
        const { result, tree } = await run(store);
        expect(result.unplaced).toEqual([{
            path: 'r1.nodes[0].leaves[0].subs', count: 3,
            reason: `feature "subs" not available after ${SLOT_WAIT_CAP_MS} ms without a slot answering`,
        }]);
        expect(store.warnings).toHaveLength(1);
        expect(tree.nodes[0].leaves[0].subs).toBeUndefined();
        expect(tree.nodes[0].kids).toEqual(expectedTree.nodes[0].kids);
        expect(result.created).toBe(5);
    });

    it('an unknown class and a feature that is not a reference are counted as not placed', async () => {
        const store = fakeStore(120);
        const children = [
            N('Ghost', { name: 'x', kids: [N('Node', { name: 'y' })] }),
            N('Node', { name: 'z', label: 'Z', notARef: [N('Node', { name: 'w' })] }),
        ];
        const { result, tree } = await run(store, children);
        expect(result.unplaced).toEqual([
            { path: 'r1.nodes[0]', className: 'Ghost', count: 2, reason: 'class "Ghost" not found in the target metamodel' },
            { path: 'r1.nodes[1].notARef', count: 1, reason: `'notARef' is not a reference of 'Node'` },
        ]);
        expect(tree.nodes).toEqual([{ cls: 'Node', name: 'z', label: 'Z' }]);
    });
});

/**
 * One level of `parents` roots, one Node to create in each. Each root's slot answers on the poll
 * `answersAt` gives it (Infinity: never); `sleepCost` is how far a sleep moves the clock, a long
 * task when it is more than the sleep asked for. A flush, when given, answers every slot at once.
 */
function pacedStore(
    parents: number,
    answersAt: (i: number) => number,
    sleepCost: (ms: number, call: number) => number = (ms) => ms,
    withFlush = false,
) {
    let clock = 0;
    let polls = 0;
    let sleeps = 0;
    let flushed = false;
    let flushes = 0;
    const created: string[] = [];
    const deps: NestedDeps = {
        slotOf(objectId, featureName) {
            const i = Number(objectId.slice(1));
            if (featureName !== 'nodes' || (!flushed && polls < answersAt(i))) return undefined;
            return { addObject: () => { const id = 'c' + created.length; created.push(id); return { id }; } };
        },
        classInfo: (className) => {
            const c = CLASSES[className];
            return c && { attributeNames: new Set(c.attrs), referenceNames: new Set(c.refs) };
        },
        sleep: async (ms) => { clock += sleepCost(ms, sleeps++); polls++; },
        now: () => clock,
        warn: () => {},
        ...(withFlush ? { flush: async () => { flushes++; flushed = true; } } : {}),
    };
    const jobs: NestedJob[] = Array.from({ length: parents }, (_, i) => ({
        parentId: 'p' + i, path: 'p' + i, featureName: 'nodes', children: [N('Node', { name: 'n' + i })],
    }));
    return { deps, jobs, created, clock: () => clock, flushes: () => flushes };
}

describe('materializeNested, the wait counts time without progress (#486)', () => {
    const stallPolls = SLOT_WAIT_CAP_MS / SLOT_POLL_MS;

    it('a level whose slots answer slowly but steadily is not dropped, past the per-level cap', async () => {
        // One slot every 40 polls, 2 s each: ten slots take 20 s, nearly seven caps.
        const store = pacedStore(10, i => 40 * (i + 1));
        const r = await materializeNested(store.jobs, store.deps);
        expect(r.unplaced).toEqual([]);
        expect(r.created).toBe(10);
        expect(store.clock()).toBeGreaterThan(SLOT_WAIT_CAP_MS);
    });

    it('slots that stop answering are dropped once no slot has answered for the cap, and named', async () => {
        const store = pacedStore(5, i => (i < 3 ? 40 * (i + 1) : Infinity));
        const r = await materializeNested(store.jobs, store.deps);
        expect(r.created).toBe(3);
        expect(r.unplaced).toEqual([3, 4].map(i => ({
            path: `p${i}.nodes`, count: 1,
            reason: `feature "nodes" not available after ${SLOT_WAIT_CAP_MS} ms without a slot answering`,
        })));
        // The last answer came at poll 120: the walk gave up one stall window after it, not before.
        expect(store.clock()).toBe((120 + stallPolls) * SLOT_POLL_MS);
    });

    it('a long task does not count as time without progress: the slot that answers after it is used', async () => {
        // The slots answer on the third poll; the first sleep is a 7 s task, past the whole cap.
        const store = pacedStore(2, () => 3, (ms, call) => (call === 0 ? 7000 : ms));
        const r = await materializeNested(store.jobs, store.deps);
        expect(r.unplaced).toEqual([]);
        expect(r.created).toBe(2);
    });

    it('the wait is still bounded in total: a store that answers nothing under load is given up at the bound', async () => {
        // Every sleep is a 5 s task: the stall window alone would wait 300 s.
        const store = pacedStore(2, () => Infinity, () => 5000);
        const r = await materializeNested(store.jobs, store.deps);
        expect(r.created).toBe(0);
        expect(r.unplaced.map(u => u.reason)).toEqual([0, 1].map(() =>
            `feature "nodes" not available: the walk waited ${NESTED_WALK_WAIT_CAP_MS} ms for slots in total`));
        expect(store.clock()).toBeGreaterThanOrEqual(NESTED_WALK_WAIT_CAP_MS);
        expect(store.clock()).toBeLessThan(NESTED_WALK_WAIT_CAP_MS + 5000);
    });

    it('flushes once per level and does not wait for the interval commit when the flush answers the slots', async () => {
        const store = pacedStore(3, () => Infinity, undefined, true);
        const r = await materializeNested(store.jobs, store.deps);
        expect(r.created).toBe(3);
        expect(r.levels).toBe(1);
        expect(store.flushes()).toBe(1);
        expect(store.clock()).toBe(0);
    });

    it('a deep tree flushes once per level and never sleeps when every flush commits', async () => {
        const store = fakeStore(300);
        let flushes = 0;
        // The fake's slots answer 300 ms after creation; a flush stands for that commit.
        const deps: NestedDeps = {
            ...store.deps,
            flush: async () => { flushes++; await store.deps.sleep(300); },
        };
        let sleeps = 0;
        const counted: NestedDeps = { ...deps, sleep: async (ms) => { sleeps++; await store.deps.sleep(ms); } };
        const jobs: NestedJob[] = [{ parentId: store.root.id, path: 'r1', featureName: 'nodes', children: fixture() }];
        const r = await materializeNested(jobs, counted);
        expect(r.unplaced).toEqual([]);
        expect(r.levels).toBe(4);
        expect(flushes).toBe(4);
        expect(sleeps).toBe(0);
    });
});

/** A rule target as the executor returns it before pass 2 marks a placement: unmarked. */
const T = (type: string, fields: Record<string, any>) => ({ __createdBy: 'JjTL', __type: type, ...fields });

describe('materializeNested, rule targets placed in a containment (slice A)', () => {
    it('an unmarked rule target in a feature is not created: only __nested objects are walked', async () => {
        const store = fakeStore(120);
        const n2 = T('Node', { name: 'n2', label: 'B', leaves: [T('Leaf', { value: 7 })] });
        const { result } = await run(store, [N('Node', { name: 'x', label: 'X', kids: [n2] })]);
        expect(result.created).toBe(1);
        expect(result.createdIds!.has(n2)).toBe(false);
    });

    it('a pointer held by a created or placed object is queued by its created id, not dropped', async () => {
        const store = fakeStore(120);
        const outside = T('Node', { name: 'out' });
        const pointer = { __ref_result: true, targets: [outside] };
        const child = N('Leaf', { value: 1, subs: pointer });
        const { result } = await run(store, [N('Node', { name: 'p', label: 'P', leaves: [child] })]);
        expect(result.referenceSets).toEqual([{
            objectId: result.createdIds!.get(child), className: 'Leaf', path: 'r1.nodes[0].leaves[0]',
            references: { subs: pointer },
        }]);
        expect(store.warnings).toEqual([]);
    });

    it('a pointer on a key that is not a reference of the class is warned and not queued', async () => {
        const store = fakeStore(120);
        const pointer = { __ref_result: true, targets: [T('Node', { name: 'out' })] };
        const { result } = await run(store, [N('Leaf', { value: 1, owner: pointer })]);
        expect(result.referenceSets).toEqual([]);
        expect(store.warnings).toEqual([`Nested: r1.nodes[0] (Leaf): 'owner' is not a reference of 'Leaf'. Pointer dropped.`]);
    });
});

// The executor marks a placed target `__nested` and `__placed` (P-2026-11-02-2108), so the walk
// finds it with the one test it applies to created objects.
describe('materializeNested, placed targets marked __nested (P-2026-11-02-2108)', () => {
    const P = (type: string, fields: Record<string, any>) => ({ ...T(type, fields), __nested: true, __placed: true });

    it('creates a marked placed tree of depth 3, in the feature order', async () => {
        const store = fakeStore(120);
        const leaf = P('Leaf', { value: 7 });
        const n2 = P('Node', { name: 'n2', label: 'B', leaves: [leaf] });
        const created = N('Node', { name: 'c1', label: 'C' });
        const n1 = P('Node', { name: 'n1', label: 'A', kids: [created, n2] });
        const { result, tree } = await run(store, [n1]);
        expect(tree).toEqual({
            cls: 'Root',
            nodes: [{
                cls: 'Node', name: 'n1', label: 'A',
                kids: [
                    { cls: 'Node', name: 'c1', label: 'C' },
                    { cls: 'Node', name: 'n2', label: 'B', leaves: [{ cls: 'Leaf', value: 7 }] },
                ],
            }],
        });
        expect(result.created).toBe(4);
        expect(result.unplaced).toEqual([]);
        expect(store.warnings).toEqual([]);
        expect(new Set(result.createdIds!.values()).size).toBe(4);
    });

    it('queues a pointer to a marked target as a pointer, and creates that target once, where placed', async () => {
        const store = fakeStore(120);
        const target = P('Node', { name: 'n2', label: 'B' });
        const pointer = { __ref_result: true, targets: [target] };
        const holder = N('Leaf', { value: 1, subs: pointer });
        const n1 = P('Node', { name: 'n1', label: 'A', kids: [target], leaves: [holder] });
        const { result } = await run(store, [n1]);
        expect(result.created).toBe(3);
        expect(result.createdIds!.has(target)).toBe(true);
        expect(result.referenceSets).toEqual([{
            objectId: result.createdIds!.get(holder), className: 'Leaf', path: 'r1.nodes[0].leaves[0]',
            references: { subs: pointer },
        }]);
        expect(store.warnings).toEqual([]);
    });
});

// Slice B2: called, lazy and fresh rules may give one source element several root targets.
describe('makeRootTargetIndex', () => {
    it('resolves each root target by identity, two targets of one source to two objects', () => {
        const index = makeRootTargetIndex();
        const a = T('Add', { __sourceId: 's1' });
        const b = T('Add', { __sourceId: 's1' });
        index.add(a, 'Add_0');
        index.add(b, 'Add_1');
        expect(index.nameOf(a)).toEqual({ name: 'Add_0' });
        expect(index.nameOf(b)).toEqual({ name: 'Add_1' });
    });

    it('falls back on the source id only when it names one root, and reports two', () => {
        const index = makeRootTargetIndex();
        index.add(T('Node', { __sourceId: 's1' }), 'n1');
        expect(index.nameOf({ __sourceId: 's1' })).toEqual({ name: 'n1' });
        index.add(T('Node', { __sourceId: 's2' }), 'n2');
        index.add(T('Node', { __sourceId: 's2' }), 'n2_2');
        const twice = index.nameOf({ __sourceId: 's2' });
        expect(twice.name).toBeUndefined();
        expect(twice.reason).toMatch(/s2 names 2 root targets \(n2, n2_2\); none chosen/);
        expect(index.nameOf({ __sourceId: 's9' })).toEqual({ reason: 'sourceId not found in map: s9' });
    });

    it('resolves a root with no source id, a called rule over a plain value, by identity or by name', () => {
        const index = makeRootTargetIndex();
        const t = T('Const', {});
        index.add(t, 'Const_3');
        expect(index.nameOf(t)).toEqual({ name: 'Const_3' });
        expect(index.nameOf({ name: 'k' })).toEqual({ name: 'k' });
        expect(index.nameOf({})).toEqual({ reason: 'target has no __sourceId or name' });
    });
});

/**
 * The app's transaction block (#482), on a clock only `sleep` advances. An object `addObject` creates is
 * queued in the open block; its slots answer only once a commit has dispatched it, either the interval's
 * every `U.UpdatingTimer` (300 ms) or an explicit flush. This is the state the writer met at 5,119
 * objects: its fixed timer fired while the last level was still queued, and 2,048 `num` were lost.
 */
function blockStore(opts: {
    flushCommits?: boolean;
    neverReady?: (id: string) => boolean;
    refuseWrite?: (id: string, attr: string) => boolean | 'throw';
} = {}) {
    let clock = 0;
    const queued = new Set<string>();
    const committed = new Set<string>();
    const written = new Map<string, Record<string, any>>();
    const warnings: string[] = [];
    const sets: NestedAttributeSet[] = [];
    let flushes = 0;
    const commit = () => { for (const id of queued) committed.add(id); queued.clear(); };
    const answers = (id: string) => committed.has(id) && !(opts.neverReady?.(id));
    const create = (n: number, attributes: Record<string, any> = { num: '0' }) => {
        for (let i = 0; i < n; i++) {
            const id = 'c' + (sets.length + 1);
            queued.add(id);
            sets.push({ objectId: id, className: 'Const', attributes: { ...attributes } });
        }
    };
    const deps: NestedAttributeDeps = {
        flush: async () => { flushes++; if (opts.flushCommits !== false) commit(); },
        missing: (objectId, slots) => (answers(objectId) ? [] : slots),
        write: (set, attr, value) => {
            if (!answers(set.objectId)) return false;
            const refused = opts.refuseWrite?.(set.objectId, attr);
            if (refused === 'throw') throw new Error('write failed');
            if (refused) return false;
            (written.get(set.objectId) ?? written.set(set.objectId, {}).get(set.objectId)!)[attr] = value;
            return true;
        },
        sleep: async (ms) => {
            const before = clock;
            clock += ms;
            if (Math.floor(clock / 300) > Math.floor(before / 300)) commit();
        },
        now: () => clock,
        warn: (m) => { warnings.push(m); },
    };
    return { deps, sets, create, written, warnings, clock: () => clock, flushes: () => flushes };
}

describe('writeNestedAttributeSets (#482)', () => {
    it('writes every attribute of a level still queued in the block, at once: it flushes, it does not wait for the interval', async () => {
        const store = blockStore();
        store.create(2560);
        const r = await writeNestedAttributeSets(store.sets, store.deps);
        expect(r.unwritten).toBeUndefined();
        expect(r.written).toBe(2560);
        expect(store.written.size).toBe(2560);
        // No fixed delay and no 300 ms interval: the flush is what made the slots answer.
        expect(store.clock()).toBe(0);
        expect(store.flushes()).toBeGreaterThanOrEqual(1);
    });

    it('when the flush cannot commit (a TRANSACTION mid-flight), waits for the interval instead of writing into nothing', async () => {
        const store = blockStore({ flushCommits: false });
        store.create(3);
        const r = await writeNestedAttributeSets(store.sets, store.deps);
        expect(r.unwritten).toBeUndefined();
        expect(store.written.size).toBe(3);
        expect(store.clock()).toBeGreaterThanOrEqual(300);
        expect(store.clock()).toBeLessThan(300 + SLOT_POLL_MS + 1);
    });

    it('a slot that never answers is bounded: after the cap the rest is written and the loss is counted, objects and attributes', async () => {
        const store = blockStore({ neverReady: (id) => id === 'c2' || id === 'c5' });
        store.create(6, { num: '0', label: 'x' });
        const r = await writeNestedAttributeSets(store.sets, store.deps);
        expect(store.clock()).toBeGreaterThanOrEqual(ATTRIBUTE_WAIT_CAP_MS);
        expect(store.clock()).toBeLessThan(ATTRIBUTE_WAIT_CAP_MS + SLOT_POLL_MS + 1);
        expect(r.written).toBe(8);
        expect(r.unwritten).toEqual({
            objects: 2, attributes: 4,
            reason: `attribute slots not available after ${ATTRIBUTE_WAIT_CAP_MS} ms`,
        });
        expect([...store.written.keys()]).toEqual(['c1', 'c3', 'c4', 'c6']);
        expect(store.warnings).toHaveLength(1);
    });

    it('a slot that answers the wait but refuses the write, or throws, is counted too, never only warned', async () => {
        const store = blockStore({
            refuseWrite: (id, attr) => (id === 'c1' && attr === 'num') || (id === 'c3' ? 'throw' : false),
        });
        store.create(3, { num: '0', label: 'x' });
        const r = await writeNestedAttributeSets(store.sets, store.deps);
        expect(r.written).toBe(3);
        expect(r.unwritten).toEqual({ objects: 2, attributes: 3, reason: 'attribute slot missing when written' });
        expect(store.clock()).toBe(0);
    });

    it('nothing to write: no wait, nothing reported', async () => {
        const store = blockStore();
        const r = await writeNestedAttributeSets([], store.deps);
        expect(r).toEqual({ written: 0, waitedMs: 0 });
        expect(store.flushes()).toBe(0);
    });

    it('waits, bounded, for the reference slots of pointer holders that carry no attribute', async () => {
        const store = blockStore({ flushCommits: false, neverReady: (id) => id === 'c3' });
        store.create(3, {});
        const waits = store.sets.map(s => ({ objectId: s.objectId, slots: ['subs'] }));
        const r = await awaitNestedSlots(waits, store.deps);
        expect(r.answered).toBe(2);
        expect(store.clock()).toBeGreaterThanOrEqual(ATTRIBUTE_WAIT_CAP_MS);
        expect(store.clock()).toBeLessThan(ATTRIBUTE_WAIT_CAP_MS + SLOT_POLL_MS + 1);
        expect(await awaitNestedSlots([], store.deps)).toEqual({ answered: 0, waitedMs: 0 });
    });
});

describe('formatNestedUnwritten (#482)', () => {
    it('one panel line with values, objects and reason; none when everything was written', () => {
        const base = { modelName: 'T', created: 5, unplaced: [] };
        expect(formatNestedUnwritten(base)).toBeNull();
        expect(formatNestedUnwritten({ ...base, unwritten: { objects: 0, attributes: 0, reason: 'x' } })).toBeNull();
        expect(formatNestedUnwritten({ ...base, unwritten: { objects: 2, attributes: 3, reason: 'attribute slot missing when written' } }))
            .toBe('Attributes not written in "T": 3 value(s) of 2 object(s): attribute slot missing when written');
    });
});
