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
