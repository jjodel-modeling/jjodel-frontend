/**
 * #211 — `set` on a multi-valued (vector) attribute: `= [...]`, `+= <v>`, `-= <v>`.
 *
 * The handlers run for real on an in-memory model, as in `m1Operators.test.ts`; the joiner is
 * reduced to what they touch, and every write is recorded. The commands are parsed by the real
 * parser, so the AST the handlers read is the one Run hands them.
 *
 * The vector writes are the plain whole-array set (replace/append/clear, grows and shrinks) and
 * the by-value `'-='` removal (every copy) — the two reducer forms, not the proxy setter whose
 * shrink path the reducer drops (model/AGENTS.md §9.3).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
    store: new Map<string, any>(),
    actions: [] as Array<{ id: string; field: string; value: any; op: any }>,
    project: null as any,
}));

vi.mock('../../../joiner', () => {
    class DModel {}
    class DValue {}
    return {
        LPointerTargetable: { fromPointer: (id: string) => h.store.get(id) },
        DObject: { new: () => null },
        DModel,
        DValue,
        SetFieldAction: { new: (id: string, field: string, value: any, op: any) => { h.actions.push({ id, field, value, op }); } },
        TRANSACTION: (_: string, fn: () => void) => fn(),
        LModel: class {},
        LProject: class {},
        LClass: class {},
    };
});

vi.mock('../utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: () => null,
}));

vi.mock('../resolvers', () => ({
    resolveElementInMetamodel: () => null,
    resolveElement: () => null,
}));

vi.mock('../../../model/logicWrapper/nameUniqueness', () => ({
    checkM2NameUniqueness: () => ({ ok: true }),
    m2KindOf: () => 'class',
}));

vi.mock('../../../redux/action/action', () => ({ COMMIT: () => undefined }));

import { parse } from '../../parser/parser';
import { executeSetInstance } from '../commands/instance';
import { clearHandles } from '../handleRegistry';

// ── The metamodel ────────────────────────────────────────────────────────────────────────────────

function cls(name: string): any {
    const c: any = {
        id: `c_${name}`, name, abstract: false, isSingleton: false, references: [] as any[], attributes: [] as any[],
        get allReferences() { return [...c.references]; },
        get allAttributes() { return [...c.attributes]; },
        isExtending(t: any): boolean { return !!t && t.id === c.id; },
    };
    return c;
}
const Scenario = cls('Scenario');
// `tags` [0..*], `trio` [0..3], `title` single-valued (no upper bound, as the M1 store holds it).
const tags = { name: 'tags', type: 'prim', upperBound: -1 };
const trio = { name: 'trio', type: 'prim', upperBound: 3 };
const title = { name: 'title', type: 'prim' };
Scenario.attributes.push(tags, trio, title);
const metamodel = { id: 'mm1', name: 'ScenarioMM', classes: [Scenario] };

/** A committed instance with its attribute slots. */
function inst(id: string, name: string, metaclass: any, slots: Record<string, any> = {}): any {
    const o: any = {
        id, name, className: 'DObject', instanceof: metaclass,
        __raw: { id, instanceof: metaclass?.id, father: 'm1' }, subObjects: [],
    };
    for (const [feature, slot] of Object.entries(slots)) {
        o['$' + feature] = slot;
        h.store.set(slot.id, slot);
    }
    h.store.set(id, o);
    return o;
}

function vectorSlot(id: string, meta: any, values: any[]): any {
    return { id, instanceof: meta, __raw: { values: [...values] } };
}

let model: any;
function setModel(objects: any[]) {
    model = { id: 'm1', name: 'M1', isMetamodel: false, objects, __raw: { objects: objects.map((o) => o.id) } };
    h.project = { id: 'p', models: [model], metamodels: [metamodel] };
}

const context: any = { projectId: 'p', modelId: 'm1', targetMetamodelId: 'mm1', level: 'M1', history: [], variables: new Map() };
const argsOf = (line: string): any => {
    const r = parse(line);
    if (!r.success) throw new Error(`parse failed: ${line}: ${r.errors?.[0]?.message}`);
    return r.ast!.args;
};
const set = (line: string) => executeSetInstance(argsOf(line), context, h.project);
const codeOf = (r: any) => r.errors?.[0]?.code;
/** The whole-array sets recorded on a slot, in order. */
const wholeWrites = (slotId: string) => h.actions.filter((a) => a.id === slotId && a.field === 'values' && a.op === '').map((a) => a.value);
/** The values taken out of a slot by value. */
const removedFrom = (slotId: string) => h.actions.filter((a) => a.id === slotId && a.field === 'values' && a.op === '-=').map((a) => a.value);
const nothingWritten = () => { expect(h.actions).toEqual([]); };

beforeEach(() => {
    h.store.clear();
    h.actions = [];
    clearHandles();
    setModel([
        inst('s0', 'Scenario_0', Scenario, {
            tags: vectorSlot('s0_tags', tags, []),
            trio: vectorSlot('s0_trio', trio, []),
            title: { id: 's0_title', instanceof: title, value: undefined },
        }),
    ]);
});

// ── = [a, b] ─────────────────────────────────────────────────────────────────────────────────────

describe('`=` with a list replaces the whole vector (#211)', () => {
    it('writes the list, order as written', async () => {
        const r = await set('set Scenario_0.tags = ["a", "b"]');
        expect(r.success).toBe(true);
        expect(r.message).toBe('Set Scenario_0.tags = ["a", "b"]');
        expect(wholeWrites('s0_tags')).toEqual([['a', 'b']]);
    });

    it('keeps the order the script writes', async () => {
        h.store.get('s0_tags').__raw.values = [2, 1];
        const r = await set('set Scenario_0.tags = [1, 2]');
        expect(r.success).toBe(true);
        expect(wholeWrites('s0_tags')).toEqual([[1, 2]]);
    });

    it('shrinks: the whole-array set carries the shorter array, not a per-index write (§9.3 trap)', async () => {
        h.store.get('s0_tags').__raw.values = ['a', 'b', 'c'];
        const r = await set('set Scenario_0.tags = ["x"]');
        expect(r.success).toBe(true);
        // A per-index write would be a `values.0` field; the plain set is the `values` field.
        expect(h.actions).toEqual([{ id: 's0_tags', field: 'values', value: ['x'], op: '' }]);
    });

    it('grows: the list appends past the committed values', async () => {
        h.store.get('s0_tags').__raw.values = ['a'];
        const r = await set('set Scenario_0.tags = ["a", "b", "c"]');
        expect(r.success).toBe(true);
        expect(wholeWrites('s0_tags')).toEqual([['a', 'b', 'c']]);
    });

    it('the empty list clears the vector', async () => {
        h.store.get('s0_tags').__raw.values = ['a', 'b'];
        const r = await set('set Scenario_0.tags = []');
        expect(r.success).toBe(true);
        expect(wholeWrites('s0_tags')).toEqual([[]]);
    });

    it('`= null` clears the vector, as on a reference', async () => {
        h.store.get('s0_tags').__raw.values = ['a', 'b'];
        const r = await set('set Scenario_0.tags = null');
        expect(r.success).toBe(true);
        expect(r.message).toBe('Cleared Scenario_0.tags');
        expect(wholeWrites('s0_tags')).toEqual([[]]);
    });

    it('a list on a single-valued attribute: MULTIPLICITY_EXCEEDED, nothing written', async () => {
        const r = await set('set Scenario_0.title = ["x"]');
        expect(codeOf(r)).toBe('MULTIPLICITY_EXCEEDED');
        expect(r.errors![0].suggestion).toBe('Write one value: set Scenario_0.title = <value>');
        nothingWritten();
    });

    it('a name in the list names nothing the slot can hold: TYPE_MISMATCH, nothing written', async () => {
        inst('p1', 'p1', Scenario);
        const r = await set('set Scenario_0.tags = [p1]');
        expect(codeOf(r)).toBe('TYPE_MISMATCH');
        expect(r.message).toBe("'p1' is not a value Scenario_0.tags can hold");
        nothingWritten();
    });

    it('null in the list names nothing: TYPE_MISMATCH, nothing written', async () => {
        const r = await set('set Scenario_0.tags = ["a", null]');
        expect(codeOf(r)).toBe('TYPE_MISMATCH');
        nothingWritten();
    });

    it('a list after += takes a single element: TYPE_MISMATCH, nothing written', async () => {
        const r = await set('set Scenario_0.tags += ["a"]');
        expect(codeOf(r)).toBe('TYPE_MISMATCH');
        expect(r.message).toBe("'+=' takes a single element of Scenario_0.tags, not a list");
        nothingWritten();
    });
});

// ── += ───────────────────────────────────────────────────────────────────────────────────────────

describe('`+=` adds while the vector has room (#211)', () => {
    it('appends on a multi-valued slot', async () => {
        h.store.get('s0_tags').__raw.values = ['a'];
        const r = await set('set Scenario_0.tags += "b"');
        expect(r.success).toBe(true);
        expect(r.message).toBe('Added "b" to Scenario_0.tags');
        expect(wholeWrites('s0_tags')).toEqual([['a', 'b']]);
    });

    it('appends to an empty vector', async () => {
        const r = await set('set Scenario_0.tags += "a"');
        expect(r.success).toBe(true);
        expect(wholeWrites('s0_tags')).toEqual([['a']]);
    });

    it('keeps the duplicate: the vector may hold the element more than once', async () => {
        h.store.get('s0_tags').__raw.values = ['a'];
        const r = await set('set Scenario_0.tags += "a"');
        expect(r.success).toBe(true);
        expect(wholeWrites('s0_tags')).toEqual([['a', 'a']]);
    });

    it('drops the holes the slot holds, not the values', async () => {
        h.store.get('s0_tags').__raw.values = ['a', null, 'b'];
        const r = await set('set Scenario_0.tags += "c"');
        expect(r.success).toBe(true);
        expect(wholeWrites('s0_tags')).toEqual([['a', 'b', 'c']]);
    });

    it('a bounded vector at its bound: MULTIPLICITY_EXCEEDED, nothing written', async () => {
        h.store.get('s0_trio').__raw.values = ['a', 'b', 'c'];
        const r = await set('set Scenario_0.trio += "d"');
        expect(codeOf(r)).toBe('MULTIPLICITY_EXCEEDED');
        expect(r.message).toBe("'Scenario_0.trio' is full (at most 3)");
        nothingWritten();
    });

    it('a bounded vector below its bound appends', async () => {
        h.store.get('s0_trio').__raw.values = ['a'];
        const r = await set('set Scenario_0.trio += "b"');
        expect(r.success).toBe(true);
        expect(wholeWrites('s0_trio')).toEqual([['a', 'b']]);
    });

    it('on a single-valued attribute: OPERATOR_NOT_SUPPORTED (R-JS-13, as amended)', async () => {
        const r = await set('set Scenario_0.title += "x"');
        expect(codeOf(r)).toBe('OPERATOR_NOT_SUPPORTED');
        expect(r.errors![0].message).toBe('Write the new value: set Scenario_0.title = <value>');
        nothingWritten();
        expect(h.store.get('s0').$title.value).toBeUndefined();
    });

    it('`+= null` names nothing to add: TYPE_MISMATCH, nothing written', async () => {
        const r = await set('set Scenario_0.tags += null');
        expect(codeOf(r)).toBe('TYPE_MISMATCH');
        nothingWritten();
    });
});

// ── -= ───────────────────────────────────────────────────────────────────────────────────────────

describe('`-=` takes the element out by value (#211)', () => {
    it('removes it, and the message says Removed', async () => {
        h.store.get('s0_tags').__raw.values = ['a', 'b'];
        const r = await set('set Scenario_0.tags -= "a"');
        expect(r.success).toBe(true);
        expect(r.message).toBe('Removed "a" from Scenario_0.tags');
        expect(removedFrom('s0_tags')).toEqual(['a']);
        expect(wholeWrites('s0_tags')).toEqual([]);
    });

    it('takes out every copy the slot holds', async () => {
        h.store.get('s0_tags').__raw.values = ['a', 'b', 'a'];
        const r = await set('set Scenario_0.tags -= "a"');
        expect(r.success).toBe(true);
        // The by-value removal is one `'-='`; the reducer takes out every copy (R-DEL-4).
        expect(removedFrom('s0_tags')).toEqual(['a']);
    });

    it('a value the slot does not hold: NOT_SET, nothing written', async () => {
        h.store.get('s0_tags').__raw.values = ['b'];
        const r = await set('set Scenario_0.tags -= "a"');
        expect(codeOf(r)).toBe('NOT_SET');
        expect(r.message).toBe('"a" is not in Scenario_0.tags');
        nothingWritten();
    });

    it('on a single-valued attribute: OPERATOR_NOT_SUPPORTED (R-JS-13, as amended)', async () => {
        const r = await set('set Scenario_0.title -= "x"');
        expect(codeOf(r)).toBe('OPERATOR_NOT_SUPPORTED');
        nothingWritten();
        expect(h.store.get('s0').$title.value).toBeUndefined();
    });

    it('`-= null` names nothing to take out: TYPE_MISMATCH, nothing written', async () => {
        h.store.get('s0_tags').__raw.values = ['a'];
        const r = await set('set Scenario_0.tags -= null');
        expect(codeOf(r)).toBe('TYPE_MISMATCH');
        nothingWritten();
    });
});

// ── Regressions ──────────────────────────────────────────────────────────────────────────────────

describe('the committed single-assignment behavior stands', () => {
    it('a single literal on a single-valued attribute writes the slot as before', async () => {
        const r = await set('set Scenario_0.title = "x"');
        expect(r.success).toBe(true);
        expect(r.message).toBe('Set Scenario_0.title = "x"');
        expect(h.store.get('s0').$title.value).toBe('x');
        // The proxy path: no direct SetFieldAction in this harness.
        expect(h.actions).toEqual([]);
    });

    it('a single literal on a vector keeps the first-slot write', async () => {
        const r = await set('set Scenario_0.tags = "x"');
        expect(r.success).toBe(true);
        expect(r.message).toBe('Set Scenario_0.tags = "x"');
        // The committed path writes through the proxy (`featureProxy.value`), as before #211.
        expect(h.store.get('s0').$tags.value).toBe('x');
        expect(h.actions).toEqual([]);
    });
});
