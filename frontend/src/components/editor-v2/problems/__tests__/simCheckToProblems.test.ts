/**
 * The simulator's guard and action checks in the problems registry (P2a of the checker gap,
 * P-2026-09-27-1805; discovery_2026-09-27_sim_checker_gap.md §7 option A, §9).
 *
 * The subject is `reconcileSimCheckProblems`, the body of the producer's effect: it runs the
 * bridge's own `startRun` on the lookup it is given, so every entry here comes from the rules
 * the panel's Reset runs (P11), on raw lookups shaped as the store keeps them, with the JjEL
 * context builder injected as in `sim/__tests__/simBridge.test.ts`. The registry is module
 * state: `vi.resetModules()` before every test, fake timers for the 5 s resolved TTL.
 * Each test name says which break of the rule kills it; the mutation bench is in the commit.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ContextBuilder } from '../../sim/simBridge';

type Lookup = Record<string, any>;
type Any = any;

let SUT: typeof import('../simCheckToProblems');
let REG: typeof import('../registry');

beforeEach(async () => {
    vi.resetModules();
    REG = await import('../registry');
    SUT = await import('../simCheckToProblems');
    vi.useFakeTimers();
});
afterEach(() => { vi.useRealTimers(); });

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface Obj {
    cls: string;
    slots?: Record<string, unknown[]>;
    name?: string;
}

/** The metamodel MM with the role bag, the model M of it, the objects (father M), the features given. */
function buildLookup(bag: Record<string, unknown>, objects: Record<string, Obj>, features: Lookup = {}): Lookup {
    const lookup: Lookup = {};
    for (const [id, d] of Object.entries(features)) lookup[id] = { ...d, id };
    lookup.MM = { className: 'DModel', id: 'MM', name: 'Nets', _state: { ...bag } };
    lookup.M = { className: 'DModel', id: 'M', name: 'cnet', instanceof: 'MM' };
    for (const [id, o] of Object.entries(objects)) {
        const feats: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            const vid = `v_${id}_${f}`;
            feats.push(vid);
            lookup[vid] = { className: 'DValue', id: vid, instanceof: f, values: [...values], father: id };
        }
        lookup[id] = { className: 'DObject', id, instanceof: o.cls, father: 'M', name: o.name ?? id, features: feats };
    }
    return lookup;
}

/** Petri roles with a guard and the three action roles. */
const P_ROLES = {
    simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
    simInitialMarking: 'A_tokens', simBound: '3', simGuard: 'A_guard', simAction: 'A_actions', simEntry: 'A_entry', simExit: 'A_exit',
};
const P_FEATURES: Lookup = {
    C_Place: { className: 'DClass', name: 'Place', extends: [] },
    C_PTr: { className: 'DClass', name: 'PTr', extends: [] },
    C_Arc: { className: 'DClass', name: 'Arc', extends: [] },
    R_src: { className: 'DReference', name: 'src' },
    R_tgt: { className: 'DReference', name: 'tgt' },
    A_tokens: { className: 'DAttribute', name: 'tokens' },
    A_guard: { className: 'DAttribute', name: 'guard', type: 'Pointer_EXPRESSION' },
    A_actions: { className: 'DAttribute', name: 'actions', type: 'Pointer_ACTION' },
    A_entry: { className: 'DAttribute', name: 'entry', type: 'Pointer_ACTION' },
    A_exit: { className: 'DAttribute', name: 'exit', type: 'Pointer_ACTION' },
};
const VISITS = { name: 'visits', metaclass: 'C_Place', space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' };

interface Cnet {
    guard?: string;
    t1?: unknown[];
    p2Entry?: unknown[];
    decls?: unknown[];
    roles?: Record<string, unknown>;
}

/** cnet: p1 (3 tokens) -a1-> t1 -a2-> p2; ids unlike names (`P1x`, `T1x`, `P2x`). */
function cnet(c: Cnet = {}): Lookup {
    const bag: Record<string, unknown> = { ...P_ROLES, ...(c.roles ?? {}) };
    if (c.decls !== undefined) bag.simStateAttributes = JSON.stringify({ v: 1, attrs: c.decls });
    return buildLookup(bag, {
        P1x: { cls: 'C_Place', name: 'p1', slots: { A_tokens: [3] } },
        P2x: { cls: 'C_Place', name: 'p2', slots: c.p2Entry ? { A_entry: c.p2Entry } : {} },
        T1x: { cls: 'C_PTr', name: 't1', slots: { ...(c.guard !== undefined ? { A_guard: [c.guard] } : {}), ...(c.t1 ? { A_actions: c.t1 } : {}) } },
        a1: { cls: 'C_Arc', slots: { R_src: ['P1x'], R_tgt: ['T1x'] } },
        a2: { cls: 'C_Arc', slots: { R_src: ['T1x'], R_tgt: ['P2x'] } },
    }, P_FEATURES);
}

/** The record of `buildEvalContext`: one handle per object, instance names bound at the top. */
function builder(lookup: Lookup): ContextBuilder {
    return () => {
        const h: Record<string, any> = {};
        for (const id in lookup) {
            if (lookup[id].className === 'DObject') h[id] = { id, __type: 'Object', name: lookup[id].name };
        }
        const byName = Object.fromEntries(Object.values(h).map(x => [x.name, x]));
        return { instances: Object.values(h), classes: [], ...byName };
    };
}

/** The open graph: t1, p1 and p2 are drawn; the arcs are not. */
const resolver = (objectId: string): string | null =>
    ({ T1x: 'V_T1x', P1x: 'V_P1x', P2x: 'V_P2x' } as Record<string, string>)[objectId] ?? null;

const reconcile = (lookup: Lookup, resolve: ((id: string) => string | null) | undefined = resolver) =>
    SUT.reconcileSimCheckProblems(lookup, 'M', 'P', builder(lookup), resolve);

/** The 'simulation' entries on a node, in registration order. */
const on = (nodeId: string): Any[] => REG.getNodeProblemsSnapshot(nodeId).filter(p => p.kind === 'simulation') as Any[];
const active = (nodeId: string): Any[] => on(nodeId).filter(p => p.resolvedAt === undefined);

// ---------------------------------------------------------------------------

describe('reconcileSimCheckProblems: what Reset says, in the registry', () => {
    it('a guard defect registers under the DObject and the vertex, as an error owned by the model (mutant: the vertex anchor dropped)', () => {
        const n = reconcile(cnet({ guard: 'node.[x] > 0' }));
        expect(n).toBe(2);
        for (const id of ['T1x', 'V_T1x']) {
            expect(active(id)).toHaveLength(1);
            expect(active(id)[0]).toMatchObject({
                nodeId: id, kind: 'simulation', severity: 'error', title: 'Guard: E-NODE', ownerModelId: 'M',
            });
            expect(active(id)[0].description).toMatch(/^E-NODE: `node` is presentation state.* \[node\.\[x\] > 0\]$/);
        }
        // control: a clean guard registers nothing
        expect(reconcile(cnet({ guard: 'p1.[tokens] > 0' }))).toBe(0);
    });

    it('the second anchor is skipped when the resolver says null or the same id (mutant: always two entries)', () => {
        reconcile(cnet({ guard: 'node.[x] > 0' }), () => null);
        expect(REG.getProblemIdsOwnedBy('simulation', 'M')).toEqual(['simulation:T1x:guard:0']);
        reconcile(cnet({ guard: 'node.[x] > 0' }), id => id);
        expect(REG.getProblemIdsOwnedBy('simulation', 'M')).toEqual(['simulation:T1x:guard:0']);
        const lookup = cnet({ guard: 'node.[x] > 0' });
        SUT.reconcileSimCheckProblems(lookup, 'M', 'P', builder(lookup));
        expect(REG.getProblemIdsOwnedBy('simulation', 'M')).toEqual(['simulation:T1x:guard:0']);
    });

    it('an action defect is named by its site role: Action on the transition, Entry on a place (mutant: every action titled Action)', () => {
        reconcile(cnet({ decls: [VISITS], t1: ['p1.[count] := 1'], p2Entry: ['p2.[count] := 1'] }));
        expect(active('T1x').map(p => p.title)).toEqual(["Action: undeclared 'count' on p1"]);
        expect(active('T1x')[0].description).toBe("'count' is not declared on p1 [p1.[count] := 1]");
        expect(active('P2x').map(p => p.title)).toEqual(["Entry: undeclared 'count' on p2"]);
        expect(active('V_P2x')).toHaveLength(1);
        expect(REG.getProblemIdsOwnedBy('simulation', 'M').sort()).toEqual([
            'simulation:P2x:entry:0', 'simulation:T1x:action:0', 'simulation:V_P2x:entry:0', 'simulation:V_T1x:action:0',
        ]);
    });

    it('two defects of one role on one element are two entries, numbered (mutant: one id per element and role)', () => {
        reconcile(cnet({ decls: [VISITS], t1: ['p1.[count] := 1', 'p1.[nope] := 2'] }), () => null);
        expect(active('T1x').map(p => p.id)).toEqual(['simulation:T1x:action:0', 'simulation:T1x:action:1']);
        expect(active('T1x').map(p => p.title)).toEqual(["Action: undeclared 'count' on p1", "Action: undeclared 'nope' on p1"]);
    });

    it('a double assignment names the transition, with no site (mutant: a defect without a site dropped)', () => {
        reconcile(cnet({ decls: [VISITS], t1: ['p2.[visits] := 1', 'p2.[visits] := 2'] }), () => null);
        expect(active('T1x').map(p => p.title)).toEqual(['Action: visits of p2 assigned twice']);
    });

    it('a declaration defect is never published (mutant: declarations kept)', () => {
        const n = reconcile(cnet({ decls: [{ ...VISITS, initial: '7' }] }));
        expect(n).toBe(0);
        expect(REG.getProblemIdsOwnedBy('simulation', 'M')).toEqual([]);
    });
});

describe('dedup with conformance: a parse error stays conformance\'s where conformance runs the same parser', () => {
    it('a guard parse error on a Pointer_EXPRESSION feature is skipped, on an EString one kept (mutant: dedup dropped; mutant: dedup on every type)', () => {
        expect(reconcile(cnet({ guard: 'p1.[tokens] <' }))).toBe(0);
        const estring = cnet({ guard: 'p1.[tokens] <' });
        estring.A_guard.type = 'Pointer_ESTRING';
        expect(reconcile(estring)).toBe(2);
        expect(active('T1x')[0].title).toMatch(/^Guard: parse error 1:\d+ /);
    });

    it('only the parse error is deduplicated: E-NODE on a Pointer_EXPRESSION feature is kept (mutant: dedup by type alone)', () => {
        expect(reconcile(cnet({ guard: 'node.[x] > 0' }))).toBe(2);
    });

    it('an action parse error on a Pointer_ACTION feature is skipped, on an EString one kept', () => {
        expect(reconcile(cnet({ decls: [VISITS], t1: ['p2.[visits] :='] }))).toBe(0);
        const estring = cnet({ decls: [VISITS], t1: ['p2.[visits] :='] });
        estring.A_actions.type = 'Pointer_ESTRING';
        expect(reconcile(estring, () => null)).toBe(1);
        expect(active('T1x')[0].title).toMatch(/^Action: parse error /);
    });
});

describe('revoke and clear: by owner and kind, never another model\'s or another kind\'s', () => {
    const foreign = (id: string, nodeId: string, kind: 'simulation' | 'conformance', owner: string) => REG.registerProblem({
        id, nodeId, kind, severity: 'error', title: 't', description: 'd', relatedNodeIds: [], ownerModelId: owner, createdAt: 0,
    });

    it('a fixed guard marks its entries resolved, then the TTL removes them (mutant: the revoke pass dropped)', () => {
        reconcile(cnet({ guard: 'node.[x] > 0' }));
        expect(active('V_T1x')).toHaveLength(1);
        reconcile(cnet({ guard: 'p1.[tokens] > 0' }));
        expect(on('V_T1x')).toHaveLength(1);
        expect(on('V_T1x')[0].resolvedAt).toBeDefined();
        vi.advanceTimersByTime(5000);
        expect(on('V_T1x')).toHaveLength(0);
        expect(on('T1x')).toHaveLength(0);
    });

    it('another model\'s simulation entry and this model\'s conformance entry are untouched (mutant: revoke by kind only; mutant: by owner only)', () => {
        foreign('simulation:X:guard:0', 'X', 'simulation', 'OTHER');
        foreign('conformance:T1x', 'T1x', 'conformance', 'M');
        reconcile(cnet({ guard: 'node.[x] > 0' }));
        reconcile(cnet({ guard: 'p1.[tokens] > 0' }));
        expect(REG.getNodeProblemsSnapshot('X')[0].resolvedAt).toBeUndefined();
        expect(REG.getNodeProblemsSnapshot('T1x').filter(p => p.kind === 'conformance')[0].resolvedAt).toBeUndefined();
        SUT.clearSimCheckProblems('M');
        expect(REG.getNodeProblemsSnapshot('X')).toHaveLength(1);
        expect(REG.getNodeProblemsSnapshot('T1x').map(p => p.kind)).toEqual(['conformance']);
    });

    it('resolve marks the model\'s entries resolved and leaves another model\'s (mutant: resolve by kind only)', () => {
        foreign('simulation:X:guard:0', 'X', 'simulation', 'OTHER');
        reconcile(cnet({ guard: 'node.[x] > 0' }));
        SUT.resolveSimCheckProblems('M');
        expect(active('T1x')).toHaveLength(0);
        expect(on('T1x')).toHaveLength(1);
        expect(REG.getNodeProblemsSnapshot('X')[0].resolvedAt).toBeUndefined();
    });

    it('clear removes the model\'s entries outright, with no resolved transient (mutant: clear marks resolved)', () => {
        reconcile(cnet({ guard: 'node.[x] > 0' }));
        SUT.clearSimCheckProblems('M');
        expect(on('T1x')).toHaveLength(0);
        expect(on('V_T1x')).toHaveLength(0);
    });

    it('a refused run publishes nothing and revokes what the model owns (mutant: a refused run keeps the old entries)', () => {
        reconcile(cnet({ guard: 'node.[x] > 0' }));
        const broken = cnet({ guard: 'node.[x] > 0' });
        delete broken.MM._state.simArcTarget;
        expect(reconcile(broken)).toBe(0);
        expect(active('T1x')).toHaveLength(0);
        expect(on('T1x')[0].resolvedAt).toBeDefined();
    });

    it('a builder that throws is a refused run, not an exception out of the producer', () => {
        reconcile(cnet({ guard: 'node.[x] > 0' }));
        const lookup = cnet({ guard: 'node.[x] > 0' });
        const n = SUT.reconcileSimCheckProblems(lookup, 'M', 'P', () => { throw new Error('boom'); }, resolver);
        expect(n).toBe(0);
        expect(active('T1x')).toHaveLength(0);
    });
});

describe('the control-flow shape: else defects and `node#edge`', () => {
    const CF_ROLES = {
        simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next',
        simTrigger: 'R_trigger', simEventIdentifier: 'A_label', simGuard: 'A_guard',
    };
    const CF_FEATURES: Lookup = {
        C_State: { className: 'DClass', name: 'State', extends: [] },
        C_Init: { className: 'DClass', name: 'Init', extends: ['C_State'] },
        C_Event: { className: 'DClass', name: 'Event', extends: [] },
        C_Trans: { className: 'DClass', name: 'Trans', extends: [] },
        R_out: { className: 'DReference', name: 'out' },
        R_next: { className: 'DReference', name: 'next' },
        R_trigger: { className: 'DReference', name: 'trigger', type: 'C_Event' },
        A_label: { className: 'DAttribute', name: 'label' },
        A_guard: { className: 'DAttribute', name: 'guard', type: 'Pointer_EXPRESSION' },
    };

    it('two else among siblings: a Guard entry on each edge, with the net\'s message (mutant: net defects ignored)', () => {
        const lookup = buildLookup(CF_ROLES, {
            A: { cls: 'C_Init', slots: { R_out: ['eA', 'eB'] } },
            B: { cls: 'C_State' },
            coin: { cls: 'C_Event', slots: { A_label: ['Coin'] } },
            eA: { cls: 'C_Trans', slots: { R_next: ['B'], R_trigger: ['coin'], A_guard: ['else'] } },
            eB: { cls: 'C_Trans', slots: { R_next: ['B'], R_trigger: ['coin'], A_guard: ['else'] } },
        }, CF_FEATURES);
        reconcile(lookup, () => null);
        expect(active('eA').map(p => p.title)).toEqual(['Guard: two else edges share a source: eA, eB']);
        expect(active('eB')).toHaveLength(1);
    });

    it('the mapper sends `node#edge` to the node, as the defects line names it, and drops the other net defects', () => {
        const entries = SUT.simCheckEntries(
            [{ element: 'F#e1', role: 'action', reason: 'double-assignment', detail: 'x of m is assigned twice in one step', source: 'm.[x] := 2', short: 'x of m assigned twice' }],
            [{ element: 'J#e2', code: 'else-twice', message: 'two else join: J#e2, J#e3' }, { element: 'e9', code: 'no-target', message: 'the edge has no target' }],
            {}, null,
        );
        expect(entries.map(e => [e.element, e.role, e.title])).toEqual([
            ['F', 'action', 'Action: x of m assigned twice'],
            ['J', 'guard', 'Guard: two else join: J#e2, J#e3'],
        ]);
    });
});

describe('simCheckSignature: inert unless a guard or action role is bound', () => {
    it('\'\' for a model whose bag binds no guard or action, for a metamodel, for an unknown id; the run signature otherwise', () => {
        const bare = cnet();
        for (const k of ['simGuard', 'simAction', 'simEntry', 'simExit']) delete bare.MM._state[k];
        expect(SUT.simCheckSignature(bare, 'M')).toBe('');
        expect(SUT.simCheckSignature(cnet(), 'MM')).toBe('');
        expect(SUT.simCheckSignature(cnet(), 'nope')).toBe('');
        const withExit = cnet();
        for (const k of ['simGuard', 'simAction', 'simEntry']) delete withExit.MM._state[k];
        expect(SUT.simCheckSignature(withExit, 'M')).not.toBe('');
    });

    it('a guard text edited changes it; a vertex moved does not (mutant: a constant signature)', () => {
        const a = cnet({ guard: 'p1.[tokens] > 0' });
        const b = cnet({ guard: 'p1.[tokens] > 1' });
        expect(SUT.simCheckSignature(a, 'M')).not.toBe(SUT.simCheckSignature(b, 'M'));
        const moved = cnet({ guard: 'p1.[tokens] > 0' });
        moved.V1 = { className: 'DVertex', id: 'V1', model: 'T1x', x: 10, y: 20 };
        const moved2 = { ...moved, V1: { ...moved.V1, x: 99 } };
        expect(SUT.simCheckSignature(moved, 'M')).toBe(SUT.simCheckSignature(moved2, 'M'));
    });
});
