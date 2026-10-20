/**
 * `detectDuplicateNames` — the M1 full-model scan behind the duplicate-name badge
 * (P-2026-10-21-0030, fix 2 of docs/discovery/discovery_2026-10-20_large_model_slowness_round2.md).
 *
 * Same harness as `m2NameUniqueness.test.ts`: only the `joiner` barrel is mocked (it does not
 * load under vitest), the module under test is the real one. L proxies are duck-typed: the M1
 * functions read `className`, `id`, `name`, `father`, `allSubObjects` and `values`, never a method.
 *
 * The oracle is the per-object rule the scan has always applied, written with the module's own
 * unchanged public piece: `getSiblingNamespace(obj).filter(s => s.name === obj.name)`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../joiner', () => ({
    DModel: { cname: 'DModel' },
    DObject: { cname: 'DObject' },
    DValue: { cname: 'DValue' },
    DPointerTargetable: { pendingCreation: {} as { [k: string]: any } },
}));

const { detectDuplicateNames, getSiblingNamespace } = await import('../logicWrapper/nameUniqueness');

type Any = any;

/** The per-object rule, verbatim from the scan before P-2026-10-21-0030. */
function oracle(model: Any): Map<string, Any[]> {
    const out = new Map<string, Any[]>();
    for (const obj of model.allSubObjects) {
        if (!obj) continue;
        const colliding = getSiblingNamespace(obj, { includePending: false }).filter((s: Any) => s.name === obj.name);
        if (colliding.length > 0) out.set(obj.id, colliding);
    }
    return out;
}

function ids(m: Map<string, Any[]>): { [k: string]: string[] } {
    const o: { [k: string]: string[] } = {};
    for (const [k, v] of m) o[k] = v.map(x => x.id);
    return o;
}

let model: Any;
let v1: Any, v2: Any, v3: Any;

function obj(id: string, name: unknown, father: Any): Any {
    const o = { className: 'DObject', id, name, father };
    model.allSubObjects.push(o);
    if (father.className === 'DValue') father.values.push(o);
    return o;
}

beforeEach(() => {
    model = { className: 'DModel', id: 'm1', name: 'M1', allSubObjects: [] };
    const host = { className: 'DObject', id: 'host', name: 'Host', father: model };
    model.allSubObjects.push(host);
    // three containment slots of `host`: three sibling sets
    v1 = { className: 'DValue', id: 'v1', father: host, values: [] };
    v2 = { className: 'DValue', id: 'v2', father: host, values: [] };
    v3 = { className: 'DValue', id: 'v3', father: host, values: [] };

    // roots: the whole model is their namespace
    obj('rA', 'Alpha', model);
    obj('rB', 'Alpha', model);
    obj('rC', 'alpha', model);     // case-sensitive: not a homonym of Alpha
    obj('rE', '', model);          // the empty name compares like any value
    obj('rF', '', model);
    obj('rD', 'Delta', model);     // collides with the nested n6 (root namespace is recursive)

    // set v1: a duplicate pair
    obj('n1', 'Beta', v1);
    obj('n2', 'Beta', v1);
    // set v2: a triple, and one free name
    obj('n3', 'Gamma', v2);
    obj('n4', 'Gamma', v2);
    obj('n5', 'Gamma', v2);
    obj('n7', 'Epsilon', v2);
    // set v3: no duplicate inside it, but Beta and Gamma also live in v1 / v2
    obj('n8', 'Beta', v3);
    obj('n9', 'Gamma', v3);
    obj('n6', 'Delta', v3);
    v2.values.push({ className: 'DValue', id: 'notAnObject', name: 'Gamma' }); // not a DObject: never a sibling
});

describe('detectDuplicateNames — same collisions as the per-object rule', () => {
    it('matches the oracle entry for entry, lists in the same order', () => {
        expect(ids(detectDuplicateNames(model))).toEqual(ids(oracle(model)));
    });

    it('reports the expected collisions on the fixture', () => {
        expect(ids(detectDuplicateNames(model))).toEqual({
            rA: ['rB'], rB: ['rA'],
            rE: ['rF'], rF: ['rE'],
            rD: ['n6'],
            n1: ['n2'], n2: ['n1'],
            n3: ['n4', 'n5'], n4: ['n3', 'n5'], n5: ['n3', 'n4'],
        });
    });

    it('(m2) the same name in two different sibling sets does not collide', () => {
        const map = detectDuplicateNames(model);
        expect(map.has('n8')).toBe(false);
        expect(map.has('n9')).toBe(false);
        expect(map.get('n1')!.map((o: Any) => o.id)).toEqual(['n2']);
    });

    it('(m3) both members of a pair are reported, and every member of a triple names the other two', () => {
        const map = detectDuplicateNames(model);
        expect(map.get('rA')!.map((o: Any) => o.id)).toEqual(['rB']);
        expect(map.get('rB')!.map((o: Any) => o.id)).toEqual(['rA']);
        expect(map.get('n3')!.map((o: Any) => o.id)).toEqual(['n4', 'n5']);
        expect(map.get('n5')!.map((o: Any) => o.id)).toEqual(['n3', 'n4']);
    });

    it('a root collides with a nested homonym, and not the other way round', () => {
        const map = detectDuplicateNames(model);
        expect(map.get('rD')!.map((o: Any) => o.id)).toEqual(['n6']);
        expect(map.has('n6')).toBe(false);
    });

    it('undefined names collide with each other, as `===` does', () => {
        obj('u1', undefined, v3);
        obj('u2', undefined, v3);
        expect(ids(detectDuplicateNames(model))).toEqual(ids(oracle(model)));
        expect(detectDuplicateNames(model).get('u1')!.map((o: Any) => o.id)).toEqual(['u2']);
    });

    it('an object without a father has no namespace and no entry', () => {
        obj('orphan', 'Alpha', { className: 'DObject', id: 'ghost' }).father = undefined;
        expect(detectDuplicateNames(model).has('orphan')).toBe(false);
        expect(ids(detectDuplicateNames(model))).toEqual(ids(oracle(model)));
    });

    it('an object listed twice in allSubObjects is reported as the old scan reported it', () => {
        model.allSubObjects.push(model.allSubObjects.find((o: Any) => o.id === 'rA'));
        expect(ids(detectDuplicateNames(model))).toEqual(ids(oracle(model)));
    });
});

describe('detectDuplicateNames — reads each name a bounded number of times', () => {
    it('a flat model of 200 roots with one duplicate pair costs O(n) name reads, not O(n²)', () => {
        const flat: Any = { className: 'DModel', id: 'flat', name: 'Flat', allSubObjects: [] };
        let reads = 0;
        for (let i = 0; i < 200; i++) {
            const n = i === 199 ? 'o0' : 'o' + i;
            const o: Any = { className: 'DObject', id: 'f' + i, father: flat };
            Object.defineProperty(o, 'name', { get: () => { reads++; return n; }, enumerable: true });
            flat.allSubObjects.push(o);
        }
        const map = detectDuplicateNames(flat);
        expect(ids(map)).toEqual({ f0: ['f199'], f199: ['f0'] });
        // the per-object scan read 2 x 200 x 199 names; grouping once reads each name twice
        expect(reads).toBeLessThanOrEqual(3 * 200);
    });
});
