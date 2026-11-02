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
    SLOT_WAIT_CAP_MS,
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
            reason: `feature "subs" not available after ${SLOT_WAIT_CAP_MS} ms`,
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

/** A rule target as the executor returns it: unmarked, held live by the feature that places it. */
const T = (type: string, fields: Record<string, any>) => ({ __createdBy: 'JjTL', __type: type, ...fields });

/** `isPlacedIn` over a containment map built from (target, container, feature) triples. */
const placedBy = (claims: Array<[any, any, string]>) => {
    const map = new Map(claims.map(([t, c, f]) => [t, { container: c, feature: f }]));
    return (child: any, parent: any, feature: string) => {
        const c = map.get(child);
        return !!c && c.container === parent && c.feature === feature;
    };
};

describe('materializeNested, rule targets placed in a containment (slice A)', () => {
    /** Root r1 places n1; n1 places n2 in kids next to a created node; n2 places a leaf. */
    const placedTree = () => {
        const rootObj: any = { __createdBy: 'JjTL', __type: 'Root' };
        const leaf = T('Leaf', { value: 7 });
        const n2 = T('Node', { name: 'n2', label: 'B', leaves: [leaf] });
        const created = N('Node', { name: 'c1', label: 'C' });
        const n1 = T('Node', { name: 'n1', label: 'A', kids: [created, n2] });
        rootObj.nodes = [n1];
        const isPlacedIn = placedBy([[n1, rootObj, 'nodes'], [n2, n1, 'kids'], [leaf, n2, 'leaves']]);
        return { rootObj, n1, n2, leaf, created, isPlacedIn };
    };

    it('creates a placed tree of depth 3 inside its containers, created and placed in the feature order', async () => {
        const store = fakeStore(120);
        const t = placedTree();
        store.deps.isPlacedIn = t.isPlacedIn;
        const { result, tree } = await run(store, t.rootObj.nodes);
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
        // Every placed target and created object has its id, each written once.
        expect([t.n1, t.n2, t.leaf, t.created].map(o => result.createdIds!.has(o))).toEqual([true, true, true, true]);
        expect(new Set(result.createdIds!.values()).size).toBe(4);
    });

    it('without isPlacedIn, or in a feature that did not place it, a rule target is not created', async () => {
        const store = fakeStore(120);
        const t = placedTree();
        const { result } = await run(store, [N('Node', { name: 'x', label: 'X', kids: [t.n2] })]);
        expect(result.created).toBe(1);
        const store2 = fakeStore(120);
        store2.deps.isPlacedIn = t.isPlacedIn;
        const { result: r2 } = await run(store2, [N('Node', { name: 'x', label: 'X', kids: [t.n2] })]);
        expect(r2.created).toBe(1);
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
// finds it with the one test it applies to created objects, and no `isPlacedIn`.
describe('materializeNested, placed targets marked __nested (P-2026-11-02-2108)', () => {
    const P = (type: string, fields: Record<string, any>) => ({ ...T(type, fields), __nested: true, __placed: true });

    it('creates a marked placed tree of depth 3 without isPlacedIn, in the feature order', async () => {
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
