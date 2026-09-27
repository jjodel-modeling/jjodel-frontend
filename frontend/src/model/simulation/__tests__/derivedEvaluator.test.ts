/**
 * derivedEvaluator — lane C2 (P-2026-09-27-0200, R-SIM-73..75): the equations
 * of the derived state attributes, compiled once, ordered by their
 * dependencies, and evaluated on a σ into a fresh `derived` part.
 *
 * Executes `compileDerived` and `makeDerivedOracle` (P11) on b2net, the
 * topology of report §4 (`p1 (3 tokens) -a1-> t1 -a2-> p2`, the ids unlike the
 * names), compiled by `compileNet` from a raw lookup and read over a synthetic
 * snapshot whose instance names are bound, as `buildEvalContext` binds them.
 * Each test name says which break kills it; the mutation bench is in the commit
 * message.
 */

import { describe, it, expect } from 'vitest';
import { compileDerived, makeDerivedOracle } from '../derivedEvaluator';
import { freezeSnapshot } from '../guardContext';
import { compileNet, netStcFromRoles } from '../netCompile';
import { isKindOf } from '../isKindOf';
import { objectReferences, objectSlotValues } from '../objectSlots';
import type { CompiledNet, NetModelView, SimState, SimValue, StateAttributeDecl } from '../netTypes';

const range = (min: number, max: number) => ({ kind: 'range' as const, min, max });
const stored = (name: string, metaclass: string | null, max: number, initial: SimValue = 0): StateAttributeDecl =>
    ({ name, metaclass, space: 'semantic', domain: range(0, max), initial });
const derived = (name: string, metaclass: string | null, equation: string, domain: StateAttributeDecl['domain'] = range(0, 99)): StateAttributeDecl =>
    ({ name, metaclass, space: 'semantic', domain, equation });
const derivedPres = (name: string, metaclass: string | null, equation: string): StateAttributeDecl =>
    ({ name, metaclass, space: 'presentation', domain: null, equation });

const VISITS = stored('visits', 'C_Place', 3);
const TOTAL = derived('total', null, 'p1.[visits] + p2.[visits]', range(0, 6));
const BUSY = derived('busy', 'C_Place', 'self.[visits] > 0', { kind: 'boolean' });

/** b2net: the Petri roles, the three places and arcs, the model `cnet` with id M. */
function b2net(decls: StateAttributeDecl[]): CompiledNet {
    const lookup: Record<string, any> = {};
    for (const c of ['C_Place', 'C_PTr', 'C_Arc']) lookup[c] = { className: 'DClass', extends: [] };
    const objects: Record<string, { cls: string; slots?: Record<string, unknown[]> }> = {
        P1x: { cls: 'C_Place', slots: { A_tokens: [3] } }, P2x: { cls: 'C_Place' }, T1x: { cls: 'C_PTr' },
        a1: { cls: 'C_Arc', slots: { R_src: ['P1x'], R_tgt: ['T1x'] } }, a2: { cls: 'C_Arc', slots: { R_src: ['T1x'], R_tgt: ['P2x'] } },
    };
    for (const [id, o] of Object.entries(objects)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            features.push(`v_${id}_${f}`);
            lookup[`v_${id}_${f}`] = { className: 'DValue', instanceof: f, values };
        }
        lookup[id] = { className: 'DObject', instanceof: o.cls, features };
    }
    const view: NetModelView = {
        exists: id => !!lookup[id], isInstanceOf: (id, c) => isKindOf(lookup, id, c),
        outgoingTransitions: () => [], transitionTarget: () => null,
        references: (o, f) => objectReferences(lookup, o, f), values: (o, f) => objectSlotValues(lookup, o, f),
    };
    const stc = netStcFromRoles({
        simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt', simInitialMarking: 'A_tokens', simBound: 3,
    })!;
    return compileNet(stc, view, 'M', Object.keys(objects), decls);
}

/** The record of `buildEvalContext` for b2net: one handle per object, the instance names bound at the top. */
function snapshot() {
    const h: Record<string, any> = {};
    for (const [id, name] of [['P1x', 'p1'], ['P2x', 'p2'], ['T1x', 't1'], ['a1', 'a1'], ['a2', 'a2']]) h[id] = { id, __type: 'Object', name };
    const byName = Object.fromEntries(Object.values(h).map(x => [x.name, x]));
    return freezeSnapshot({ instances: Object.values(h), classes: [], ...byName }, { id: 'M', name: 'cnet' });
}

function oracleOf(net: CompiledNet) {
    return makeDerivedOracle(snapshot(), net, compileDerived(net.attributes));
}

/** σ with some stored values replaced: element -> attribute -> value. */
function withAttrs(state: SimState, set: Record<string, Record<string, SimValue>>): SimState {
    const attrs = new Map([...state.attrs].map(([e, m]) => [e, new Map(m)]));
    for (const [e, values] of Object.entries(set)) {
        if (!attrs.has(e)) attrs.set(e, new Map());
        for (const [a, v] of Object.entries(values)) attrs.get(e)!.set(a, v);
    }
    return { ...state, attrs };
}

const plain = (m: ReadonlyMap<string, ReadonlyMap<string, SimValue>>) =>
    Object.fromEntries([...m].map(([e, values]) => [e, Object.fromEntries(values)]));
const codes = (decls: StateAttributeDecl[]) => compileDerived(decls).defects.map(d => [d.index, d.name, d.code, d.message]);

describe('evaluation on b2net (R-SIM-73, R-SIM-75): self the owner, the model root for a global', () => {
    it('total over the two places, busy per place; after a visit both follow σ', () => {
        const net = b2net([VISITS, TOTAL, BUSY]);
        const out = oracleOf(net)(net.initial);
        expect(out.failures).toEqual([]);
        expect(plain(out.derived.attrs)).toEqual({ M: { total: 0 }, P1x: { busy: false }, P2x: { busy: false } });
        expect(out.derived.presentation.size).toBe(0);
        const later = oracleOf(net)(withAttrs(net.initial, { P2x: { visits: 1 } }));
        expect(plain(later.derived.attrs)).toEqual({ M: { total: 1 }, P1x: { busy: false }, P2x: { busy: true } });
    });

    it('the self of a global is the model: self.[total] and model.[total] agree', () => {
        const net = b2net([VISITS, TOTAL, derived('same', null, 'self.[total] == model.[total]', { kind: 'boolean' })]);
        const out = oracleOf(net)(withAttrs(net.initial, { P1x: { visits: 2 } }));
        expect(out.failures).toEqual([]);
        expect(plain(out.derived.attrs).M).toEqual({ total: 2, same: true });
    });

    it('the map is built fresh from σ: a derived part already on the input is never read nor kept (mutant 2 at the oracle)', () => {
        const net = b2net([VISITS, TOTAL, derived('twice', null, 'model.[total] * 2 + model.[ghost]')]);
        const stale = { attrs: new Map([['M', new Map<string, SimValue>([['total', 9], ['ghost', 1]])]]), presentation: new Map() };
        const out = oracleOf(net)({ ...net.initial, derived: stale });
        expect(plain(out.derived.attrs)).toEqual({ M: { total: 0 } });
        expect(out.failures).toEqual([{ element: 'M', attr: 'twice', space: 'semantic', detail: "JjelEvaluationError: 'ghost' is not a state attribute of cnet" }]);
    });

    it('a derived attribute on a metaclass is evaluated only on its instances, and only where its declaration holds', () => {
        const net = b2net([VISITS, stored('busy', 'C_Place', 1), BUSY]);
        const out = oracleOf(net)(net.initial);
        // the stored busy came first on the places: the derived one is not evaluated there
        expect(out.derived.attrs.size).toBe(0);
        expect(out.failures).toEqual([]);
    });
});

describe('order (R-SIM-74): topological by attribute name', () => {
    it('an equation read by another comes first, whatever the names say (mutant 3: one StateAccess edge ignored)', () => {
        const decls = [stored('w', null, 9, 2), derived('a', null, 'model.[w] + model.[z]'), derived('z', null, 'model.[w] * 2')];
        expect(compileDerived(decls).order.map(e => e.decl.name)).toEqual(['z', 'a']);
        const net = b2net(decls);
        const out = oracleOf(net)(net.initial);
        expect(out.failures).toEqual([]);
        expect(plain(out.derived.attrs).M).toEqual({ z: 4, a: 6 });
    });

    it('the edges come from every StateAccess of the equation, nested ones included', () => {
        const decls = [
            stored('w', null, 9, 1),
            derived('a', null, '(if model.[w] > 0 then 1 else 0) + [model.[w], model.[y]].sum()'),
            derived('y', null, 'model.[w] + 1'),
        ];
        expect(compileDerived(decls).order.map(e => e.decl.name)).toEqual(['y', 'a']);
    });

    it('independent equations keep the order of their names', () => {
        expect(compileDerived([derived('b', null, '1'), derived('a', null, '2')]).order.map(e => e.decl.name)).toEqual(['a', 'b']);
    });
});

describe('declaration defects of the equations at Reset (R-SIM-74, R-SIM-75)', () => {
    it('a cycle is a defect on every member, the cycle named from each; its members are never evaluated (mutant 6)', () => {
        const decls = [derived('a', null, 'model.[b] + 1'), derived('b', null, 'model.[a]'), derived('c', null, 'self.[c] + 1'), derived('d', null, '1')];
        expect(codes(decls)).toEqual([
            [0, 'a', 'cycle', 'equation cycle: a → b → a'],
            [1, 'b', 'cycle', 'equation cycle: b → a → b'],
            [2, 'c', 'cycle', 'equation cycle: c → c'],
        ]);
        expect(compileDerived(decls).order.map(e => e.decl.name)).toEqual(['d']);
        const net = b2net(decls);
        const out = oracleOf(net)(net.initial);
        expect(out.failures).toEqual([]);
        expect(plain(out.derived.attrs)).toEqual({ M: { d: 1 } });
    });

    it('a text that does not parse, with its position', () => {
        const [defect] = compileDerived([derived('p', null, '1 +')]).defects;
        expect([defect.code, defect.message.startsWith('parse error 1:')]).toEqual(['parse', true]);
    });

    it('event is a defect: a derived attribute is a function of the state only (mutant 9)', () => {
        expect(codes([derived('e', null, 'event == null', { kind: 'boolean' })])).toEqual([[0, 'e', 'event', 'the equation reads event']]);
        // control: a feature named like it is not the root
        expect(codes([derived('e', null, 'model.name == "event"', { kind: 'boolean' })])).toEqual([]);
    });

    it('node: E-NODE in a semantic equation, allowed in a presentation one, where it reads its own element', () => {
        const color: StateAttributeDecl = { name: 'color', metaclass: 'C_PTr', space: 'presentation', domain: null, initial: 'grey' };
        expect(codes([color, derived('s', 'C_PTr', "node.[color] == 'red'", { kind: 'boolean' })]).map(d => d.slice(0, 3))).toEqual([[1, 's', 'subset']]);
        const decls = [color, derivedPres('label', 'C_PTr', 'node.[color]')];
        expect(codes(decls)).toEqual([]);
        const net = b2net(decls);
        const out = oracleOf(net)(net.initial);
        expect(out.failures).toEqual([]);
        expect(plain(out.derived.presentation)).toEqual({ T1x: { label: 'grey' } });
    });

    it('a semantic equation reading a presentation attribute, stored or derived, is E-NODE (mutant 4); presentation reading semantic is fine', () => {
        const color: StateAttributeDecl = { name: 'color', metaclass: 'C_PTr', space: 'presentation', domain: null, initial: 'grey' };
        const hot = derivedPres('hot', 'C_Place', 'self.[visits] > 1');
        const out = codes([VISITS, color, hot, derived('s', 'C_PTr', "if self.[color] == 'red' then 1 else 0"), derived('s2', 'C_Place', 'if self.[hot] then 1 else 0')]);
        expect(out.map(d => d.slice(0, 3))).toEqual([[3, 's', 'subset'], [4, 's2', 'subset']]);
        expect(out.every(d => String(d[3]).startsWith('E-NODE'))).toBe(true);
        // control: hot, presentation, reads the semantic visits with no defect
        expect(codes([VISITS, hot])).toEqual([]);
    });

    it('a defective equation is not evaluated: its value is absent, and it is no failure', () => {
        const net = b2net([VISITS, derived('p', null, '1 +'), TOTAL]);
        const out = oracleOf(net)(net.initial);
        expect(out.failures).toEqual([]);
        expect(plain(out.derived.attrs)).toEqual({ M: { total: 0 } });
    });
});

describe('failures (R-SIM-73): an exception or a value that is not a SimValue', () => {
    it('division by zero gives null, which is a failure, never a value (mutant 5)', () => {
        const net = b2net([VISITS, derived('q', null, 'p1.[visits] / 0')]);
        const out = oracleOf(net)(net.initial);
        expect(out.failures).toEqual([{ element: 'M', attr: 'q', space: 'semantic', detail: 'the value is null, not a boolean, a number or a string' }]);
        expect(out.derived.attrs.size).toBe(0);
    });

    it('an equation that throws is a failure with the evaluator\'s message; the others still evaluate', () => {
        const net = b2net([VISITS, derived('bad', null, 'p1.[nosuch]'), TOTAL]);
        const out = oracleOf(net)(net.initial);
        expect(out.failures).toEqual([{ element: 'M', attr: 'bad', space: 'semantic', detail: "JjelEvaluationError: 'nosuch' is not a state attribute of p1" }]);
        expect(plain(out.derived.attrs)).toEqual({ M: { total: 0 } });
    });

    it('a presentation failure is reported with its space, so the core can let the semantics go on', () => {
        const net = b2net([VISITS, derivedPres('shade', 'C_PTr', 'node.[nosuch]')]);
        const out = oracleOf(net)(net.initial);
        expect(out.failures.map(f => [f.element, f.attr, f.space])).toEqual([['T1x', 'shade', 'presentation']]);
    });
});

// ---------------------------------------------------------------------------
// R-SIM-74 as amended (S3, P-2026-09-27-1727): the graph per (element, attribute)
// over the frozen M, G3 of docs/discovery/discovery_2026-09-27_sim_derived_recursion.md.
// ---------------------------------------------------------------------------

interface Item { id: string; name: string; cls: string; refs?: Record<string, string[] | string | null> }

/**
 * b2net with the items beside it, and the snapshot of the whole: every reference
 * of an item is a pool handle, a list for many, a handle or null for one, as
 * `buildEvalContext` fills them; `parent` stands for its eContainer.
 */
function frozenWorld(items: Item[], decls: StateAttributeDecl[]) {
    const base: Item[] = [
        { id: 'P1x', name: 'p1', cls: 'C_Place' }, { id: 'T1x', name: 't1', cls: 'C_PTr' },
        { id: 'a1', name: 'a1', cls: 'C_Arc' }, { id: 'a2', name: 'a2', cls: 'C_Arc' },
    ];
    const all = [...base, ...items];
    const lookup: Record<string, any> = {};
    for (const c of ['C_Place', 'C_PTr', 'C_Arc', 'C_Node', 'C_Cell']) lookup[c] = { className: 'DClass', extends: [] };
    const slots: Record<string, Record<string, unknown[]>> = {
        P1x: { A_tokens: [1] }, a1: { R_src: ['P1x'], R_tgt: ['T1x'] }, a2: { R_src: ['T1x'], R_tgt: ['P1x'] },
    };
    for (const o of all) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(slots[o.id] ?? {})) {
            features.push(`v_${o.id}_${f}`);
            lookup[`v_${o.id}_${f}`] = { className: 'DValue', instanceof: f, values };
        }
        lookup[o.id] = { className: 'DObject', instanceof: o.cls, features };
    }
    const view: NetModelView = {
        exists: id => !!lookup[id], isInstanceOf: (id, c) => isKindOf(lookup, id, c),
        outgoingTransitions: () => [], transitionTarget: () => null,
        references: (o, f) => objectReferences(lookup, o, f), values: (o, f) => objectSlotValues(lookup, o, f),
    };
    const stc = netStcFromRoles({
        simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt', simInitialMarking: 'A_tokens', simBound: 3,
    })!;
    const net = compileNet(stc, view, 'M', all.map(o => o.id), decls);
    const h = new Map<string, any>();
    for (const o of all) h.set(o.id, { id: o.id, __type: 'Object', name: o.name });
    for (const o of all) {
        for (const [f, v] of Object.entries(o.refs ?? {})) h.get(o.id)[f] = Array.isArray(v) ? v.map(id => h.get(id)) : v === null ? null : h.get(v);
    }
    const byName = Object.fromEntries([...h.values()].map(x => [x.name, x]));
    const snap = freezeSnapshot({ instances: [...h.values()], classes: [], ...byName }, { id: 'M', name: 'cnet' });
    const compiled = compileDerived(net.attributes, { snapshot: snap, net });
    return { net, snap, compiled, out: makeDerivedOracle(snap, net, compiled)(net.initial) };
}

/** A complete binary tree of `C_Node`, ids in pre-order, the root first: an order by id is the wrong one. */
function tree(depth: number): Item[] {
    const out: Item[] = [];
    let k = 0;
    const build = (d: number, parent: string | null): string => {
        const id = `N${++k}`;
        const item: Item = { id, name: `n${k}`, cls: 'C_Node', refs: { parent, children: [] } };
        out.push(item);
        if (d < depth) item.refs!.children = [build(d + 1, id), build(d + 1, id)];
        return id;
    };
    build(0, null);
    return out;
}

/** `n` cells of `C_Cell`, the head first; `loopTo` closes the list on that cell. */
function cells(prefix: string, n: number, loopTo: number | null = null): Item[] {
    return Array.from({ length: n }, (_, i) => ({
        id: `${prefix.toUpperCase()}${i + 1}`, name: `${prefix}${i + 1}`, cls: 'C_Cell',
        refs: { next: i + 1 < n ? `${prefix.toUpperCase()}${i + 2}` : loopTo === null ? null : `${prefix.toUpperCase()}${loopTo}` },
    }));
}

const OWN = stored('own', 'C_Node', 1, 1);
const SIZE = derived('size', 'C_Node', 'self.[own] + self.children.sum(c => c.[size])', range(0, 20000));
const LEN = derived('len', 'C_Cell', 'if self.next == null then 1 else self.next.[len] + 1');
const valuesOf = (m: ReadonlyMap<string, ReadonlyMap<string, SimValue>>, attr: string, ids: string[]) => ids.map(id => m.get(id)?.get(attr));
const planOf = (c: ReturnType<typeof compileDerived>) => (c.plan ?? []).map(e => `${e.owner}.${e.eq.decl.name}`);

describe('recursion per (element, attribute) over the frozen M (R-SIM-74 as amended)', () => {
    it('a tree size through the lambda over children: every node, the root last (mutant G1: a name self-loop)', () => {
        const { compiled, out } = frozenWorld(tree(2), [OWN, SIZE]);
        expect(compiled.defects).toEqual([]);
        expect(out.failures).toEqual([]);
        expect(valuesOf(out.derived.attrs, 'size', ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7'])).toEqual([7, 3, 1, 1, 3, 1, 1]);
    });

    it('a depth through the parent: a null fold is no edge, the root is 0 (mutant: null read as a fallback)', () => {
        const DEPTH = derived('depth', 'C_Node', 'if self.parent == null then 0 else self.parent.[depth] + 1');
        const { compiled, out } = frozenWorld(tree(2), [OWN, DEPTH]);
        expect(compiled.defects).toEqual([]);
        expect(valuesOf(out.derived.attrs, 'depth', ['N1', 'N2', 'N3', 'N7'])).toEqual([0, 1, 2, 2]);
    });

    it('a list length, the head first in the model: the plan runs the tail first (mutant: owners in id order)', () => {
        const { compiled, out } = frozenWorld(cells('c', 5), [LEN]);
        expect(planOf(compiled)).toEqual(['C5.len', 'C4.len', 'C3.len', 'C2.len', 'C1.len']);
        expect(valuesOf(out.derived.attrs, 'len', ['C1', 'C3', 'C5'])).toEqual([5, 3, 1]);
    });

    it('a forall projection binds its variable to the collection, as a lambda does', () => {
        const FA = derived('fa', 'C_Node', 'self.[own] + (forall c in self.children : c.[fa]).sum()', range(0, 99));
        const { compiled, out } = frozenWorld(tree(2), [OWN, FA]);
        expect(compiled.defects).toEqual([]);
        expect(out.derived.attrs.get('N1')?.get('fa')).toBe(7);
    });

    it('two equations reading each other down the tree interleave per element (mutant: the plan grouped by equation)', () => {
        const decls = [OWN, derived('a', 'C_Node', 'self.children.sum(c => c.[b])'), derived('b', 'C_Node', 'self.[own] + self.[a]')];
        const { compiled, out } = frozenWorld(tree(2), decls);
        expect(compiled.defects).toEqual([]);
        expect(out.failures).toEqual([]);
        expect(out.derived.attrs.get('N1')?.get('b')).toBe(7);
    });
});

describe('cycles per element (R-SIM-74 as amended)', () => {
    it('a circular list is a defect naming its elements; only they lose their value, a list beside it runs (mutants: no SCC, the whole declaration out)', () => {
        const { compiled, out } = frozenWorld([...cells('c', 3, 1), ...cells('d', 4)], [LEN]);
        expect(compiled.defects.map(d => [d.index, d.name, d.code, d.message, d.element])).toEqual([
            [0, 'len', 'cycle', 'equation cycle: c1.len → c2.len → c3.len → c1.len', undefined],
        ]);
        expect(out.failures).toEqual([]);
        expect(valuesOf(out.derived.attrs, 'len', ['D1', 'D4', 'C1', 'C2', 'C3'])).toEqual([4, 1, undefined, undefined, undefined]);
    });

    it('a lasso: the cell before the loop still runs, and fails on the value the cycle does not give (mutant: readers of a cycle dropped)', () => {
        const { compiled, out } = frozenWorld(cells('c', 3, 2), [LEN]);
        expect(compiled.defects.map(d => d.message)).toEqual(['equation cycle: c2.len → c3.len → c2.len']);
        expect(out.failures).toEqual([{ element: 'C1', attr: 'len', space: 'semantic', detail: "JjelEvaluationError: 'len' is not a state attribute of c2" }]);
    });

    it('a receiver that reads σ falls back to the name: a self-loop, today\'s text; the test inside the lambda folds (mutant: a σ-dependent receiver folded)', () => {
        const S2 = derived('size2', 'C_Node', 'self.[own] + self.children.filter(c => c.[own] > 0).sum(c => c.[size2])');
        const bad = frozenWorld(tree(2), [OWN, S2]);
        expect(bad.compiled.defects.map(d => [d.code, d.message])).toEqual([['cycle', 'equation cycle: size2 → size2']]);
        expect(bad.out.derived.attrs.size).toBe(0);
        const S3 = derived('size3', 'C_Node', 'self.[own] + self.children.sum(c => if c.[own] > 0 then c.[size3] else 0)');
        const good = frozenWorld(tree(2), [OWN, S3]);
        expect(good.compiled.defects).toEqual([]);
        expect(good.out.derived.attrs.get('N1')?.get('size3')).toBe(7);
    });

    it('the cycles of the name graph that stay on one element keep today\'s defects and plan (mutant: element names always)', () => {
        const decls = [derived('a', null, 'model.[b] + 1'), derived('b', null, 'model.[a]'), derived('c', null, 'self.[c] + 1'), derived('d', null, '1')];
        const { compiled, out } = frozenWorld([], decls);
        expect(compiled.defects).toEqual(compileDerived(decls).defects);
        expect(planOf(compiled)).toEqual(['M.d']);
        expect(plain(out.derived.attrs)).toEqual({ M: { d: 1 } });
    });

    it('an object with too many bindings to fold falls back to the name (mutant: no cap); under the cap it folds', () => {
        const PAIRS = derived('size', 'C_Node', 'self.[own] + self.children.sum(x => self.children.sum(y => (if x == y then x else y).[size]))', range(0, 20000));
        const flat = (n: number): Item[] => [
            { id: 'R', name: 'r', cls: 'C_Node', refs: { children: Array.from({ length: n }, (_, i) => `L${i}`) } },
            ...Array.from({ length: n }, (_, i) => ({ id: `L${i}`, name: `l${i}`, cls: 'C_Node', refs: { children: [] } })),
        ];
        const over = frozenWorld(flat(101), [OWN, PAIRS]);
        expect(over.compiled.defects.map(d => d.message)).toEqual(['equation cycle: size → size']);
        const under = frozenWorld(flat(99), [OWN, PAIRS]);
        expect(under.compiled.defects).toEqual([]);
        expect(under.out.derived.attrs.get('R')?.get('size')).toBe(1 + 99 * 99);
    });
});

describe('the order per element keeps today\'s plan where the name graph accepts the model', () => {
    it('a name edge the frozen M does not have: the order by name holds (mutant: ties by name alone)', () => {
        const decls = [derived('a', 'C_Place', 'self.[b] + 1'), derived('b', 'C_PTr', '1')];
        const { compiled } = frozenWorld([], decls);
        expect(planOf(compiled)).toEqual(['T1x.b', 'P1x.a']);
    });

    it('b2net total, busy, count and the ESM demo equation: the same plan as the loop by name, the same values', () => {
        const sets: StateAttributeDecl[][] = [
            [VISITS, derived('total', null, 'p1.[visits] * 2', range(0, 6)), BUSY, derived('count', null, 'if p1.[busy] then 1 else 0', range(0, 2))],
            [stored('coins', null, 3, 0), derived('paid', null, 'model.[coins] >= 2', { kind: 'boolean' })],
        ];
        for (const decls of sets) {
            const { net, snap, compiled, out } = frozenWorld([], decls);
            const byName = compileDerived(decls);
            const loop: string[] = [];
            for (const eq of byName.order) for (const [owner, names] of net.declared) if (names.get(eq.decl.name) === eq.decl) loop.push(`${owner}.${eq.decl.name}`);
            expect(planOf(compiled)).toEqual(loop);
            expect(out.failures).toEqual([]);
            expect(plain(out.derived.attrs)).toEqual(plain(makeDerivedOracle(snap, net, byName)(net.initial).derived.attrs));
        }
    });
});
