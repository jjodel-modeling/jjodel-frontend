/**
 * stcAccess — the read-only accessor to the STC roles for templates (slice S3,
 * P-2026-10-10-0901, R-GEN-7; design: docs/discovery/discovery_2026-10-10_code_generation_pilot.md §D.4).
 *
 * Executes the accessor (P11) on three raw idlookups copied from the
 * simulator's tests and reduced: the turnstile state machine
 * (`TURNSTILE` of sim/__tests__/simBridge.test.ts), flow B of the demo (the R7
 * fixture of the same file) and the Petri net `pnLookup` (same file). The
 * expected values are computed independently, by the core (`isKindOf`,
 * `objectReferences`, `compileNet`) over the bag the panel's own helpers read
 * (`runBag`, `collectModelObjectIds`, `makeNetModelView`, `storedProfile`):
 * the accessor rebuilds those helpers instead of importing them, and these
 * tests are what keeps the copies from drifting.
 *
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stcAccess } from '../stcAccess';
import type { StcView } from '../stcAccess';
import { compileNet, netStcFromRoles } from '../../model/simulation/netCompile';
import { isKindOf } from '../../model/simulation/isKindOf';
import { objectReferences } from '../../model/simulation/objectSlots';
import { collectModelObjectIds, makeNetModelView, runBag } from '../../components/editor-v2/sim/simBridge';
import { storedProfile } from '../../components/editor-v2/sim/simRoleStatus';

type Lookup = Record<string, any>;
type Handle = { readonly id: string };

interface Obj { cls: string; slots?: Record<string, unknown[]> }

/** The metamodel MM with the role bag, the model M of it, the objects (father M), the slots as DValues by feature pointer. */
function buildLookup(bag: Record<string, unknown> | undefined, objects: Record<string, Obj>): Lookup {
    const lookup: Lookup = {
        MM: { className: 'DModel', id: 'MM', name: 'mm', ...(bag ? { _state: { ...bag } } : {}) },
        M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM' },
    };
    for (const [id, o] of Object.entries(objects)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            const vid = `v_${id}_${f}`;
            features.push(vid);
            lookup[vid] = { className: 'DValue', id: vid, instanceof: f, values: [...values], father: id };
        }
        lookup[id] = { className: 'DObject', id, instanceof: o.cls, father: 'M', name: id, features };
    }
    return lookup;
}

function classes(lookup: Lookup, table: Record<string, string[]>): void {
    for (const [id, ext] of Object.entries(table)) lookup[id] = { className: 'DClass', id, name: id.slice(2), extends: ext };
}

// ── the state machine: the turnstile of simBridge.test.ts ─────────────────────

/**
 * Locked (Initial, a kind of State) -coin-> Unlocked -push-> Locked, Locked -push-> Locked. No Source role: every
 * transition's source is its owner through Owned transitions. tPushL also carries a stale slot of `R_oldTrigger`, a
 * second reference named `trigger` that the role does not point to, placed first.
 */
const SM_BAG = {
    simProfile: 'stateMachine', simNode: 'C_State', simTransition: 'C_Trans', simInitial: 'C_Init',
    simOwnedTransitions: 'R_out', simNextState: 'R_next', simTrigger: 'R_trigger', simEventIdentifier: 'A_label',
    simGuard: 'A_guard', simAction: 'A_act',
};

function smLookup(bag: Record<string, unknown> = SM_BAG): Lookup {
    const lookup = buildLookup(bag, {
        Locked: { cls: 'C_Init', slots: { R_out: ['tCoin', 'tPushL'] } },
        Unlocked: { cls: 'C_State', slots: { R_out: ['tPushU'] } },
        coin: { cls: 'C_Event', slots: { A_label: ['Coin'] } },
        push: { cls: 'C_Event', slots: { A_label: ['Push'] } },
        tCoin: { cls: 'C_Trans', slots: { R_next: ['Unlocked'], R_trigger: ['coin'], A_guard: ['self.trigger == event'], A_act: ['x := 1'] } },
        tPushU: { cls: 'C_Trans', slots: { R_next: ['Locked'], R_trigger: ['push'], A_guard: ['   '] } },
        tPushL: { cls: 'C_Trans', slots: { R_oldTrigger: ['coin'], R_next: ['Locked'], R_trigger: ['push'], A_guard: ['false'] } },
    });
    classes(lookup, { C_State: [], C_Init: ['C_State'], C_Trans: [], C_Event: [] });
    lookup.R_out = { className: 'DReference', id: 'R_out', name: 'out', composition: true };
    lookup.R_next = { className: 'DReference', id: 'R_next', name: 'next' };
    lookup.R_src = { className: 'DReference', id: 'R_src', name: 'src' };
    // Typed to the event class: the event role is derived from it (R-SIM-38).
    lookup.R_trigger = { className: 'DReference', id: 'R_trigger', name: 'trigger', type: 'C_Event' };
    lookup.R_oldTrigger = { className: 'DReference', id: 'R_oldTrigger', name: 'trigger', type: 'C_Event' };
    for (const id of ['A_label', 'A_guard', 'A_act']) lookup[id] = { className: 'DAttribute', id, name: id.slice(2) };
    return lookup;
}

// ── the flowchart: flow B of the demo, the R7 fixture of simBridge.test.ts ───

const COUNT = JSON.stringify({ v: 1, attrs: [{ name: 'count', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' }] });
const FLOW_BAG = {
    simProfile: 'flowchart', simNode: 'C_AN', simTransition: 'C_CF', simSource: 'R_source', simNextState: 'R_target', simInitial: 'C_IN',
    simFork: 'C_Fork', simJoin: 'C_Join', simTerminal: 'C_Fin', simGuard: 'A_guard', simAction: 'A_effect', simStateAttributes: COUNT,
};

/** i0 -f1-> work -f2-> d1, d1 -f3-> work `count < 2`, d1 -f4-> fk `else`, the fork to left and right, the join jn to fin. */
function flowLookup(): Lookup {
    const wires: Array<[string, string, string]> = [['f1', 'i0', 'work'], ['f2', 'work', 'd1'], ['f3', 'd1', 'work'], ['f4', 'd1', 'fk'],
        ['f5', 'fk', 'left'], ['f6', 'fk', 'right'], ['f7', 'left', 'jn'], ['f8', 'right', 'jn'], ['f9', 'jn', 'fin']];
    const guards: Record<string, string> = { f3: 'model.[count] < 2', f4: 'else' };
    const objects: Record<string, Obj> = {
        i0: { cls: 'C_IN' }, work: { cls: 'C_Act' }, d1: { cls: 'C_Dec' }, fk: { cls: 'C_Fork' }, left: { cls: 'C_Act' },
        right: { cls: 'C_Act' }, jn: { cls: 'C_Join' }, fin: { cls: 'C_Fin' },
    };
    for (const [e, s, t] of wires) {
        objects[e] = { cls: 'C_CF', slots: {
            R_source: [s], R_target: [t], ...(guards[e] ? { A_guard: [guards[e]] } : {}),
            ...(e === 'f2' ? { A_effect: ['model.[count] := model.[count] + 1', '', 'model.[count] := 0'] } : {}),
        } };
    }
    const lookup = buildLookup(FLOW_BAG, objects);
    // ActivityNode is abstract: no object is of it exactly, every node is a kind of it.
    lookup.C_AN = { className: 'DClass', id: 'C_AN', name: 'ActivityNode', extends: [], abstract: true };
    classes(lookup, { C_IN: ['C_AN'], C_Act: ['C_AN'], C_Dec: ['C_AN'], C_Fork: ['C_AN'], C_Join: ['C_AN'], C_Fin: ['C_AN'], C_CF: [] });
    for (const id of ['R_source', 'R_target']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
    for (const id of ['A_guard', 'A_effect']) lookup[id] = { className: 'DAttribute', id, name: id.slice(2) };
    return lookup;
}

// ── the Petri net: pnLookup of simBridge.test.ts ─────────────────────────────

/** Initial and Next state are bound but the Petri profile turns them off; the arcs point at places and t1 by `R_src`, `R_tgt`. */
const PN_BAG = {
    simProfile: 'petri', simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
    simInitialMarking: 'A_tokens', simArcWeight: 'A_w', simInhibitorArc: 'C_Inh', simBound: '2', simTerminal: 'C_PFinal',
    simGuard: 'A_guard', simInitial: 'C_Place', simNextState: 'R_tgt',
};

/** p1 (2 tokens) -a1 ×2-> t1 -a2-> p2 (terminal, a kind of Place), p3 -i1-o t1. */
function pnLookup(): Lookup {
    const lookup = buildLookup(PN_BAG, {
        p1: { cls: 'C_Place', slots: { A_tokens: [2] } },
        p2: { cls: 'C_PFinal' },
        p3: { cls: 'C_Place', slots: { A_tokens: [0] } },
        t1: { cls: 'C_PTr', slots: { A_guard: ['true'] } },
        a1: { cls: 'C_Arc', slots: { R_src: ['p1'], R_tgt: ['t1'], A_w: [2] } },
        a2: { cls: 'C_Arc', slots: { R_src: ['t1'], R_tgt: ['p2'] } },
        i1: { cls: 'C_Inh', slots: { R_src: ['p3'], R_tgt: ['t1'] } },
    });
    classes(lookup, { C_Place: [], C_PTr: [], C_Arc: [], C_Inh: [], C_PFinal: ['C_Place'] });
    for (const id of ['R_src', 'R_tgt']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
    for (const id of ['A_tokens', 'A_w', 'A_guard']) lookup[id] = { className: 'DAttribute', id, name: id.slice(2) };
    return lookup;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const stub = (id: string): Handle => ({ id });
const ids = (hs: readonly Handle[]) => hs.map(h => h.id);

function access(lookup: Lookup): StcView<Handle> {
    const stc = stcAccess(lookup, 'M', stub);
    if (!stc) throw new Error('no STC');
    return stc;
}

/** The objects of M that are a kind of `cls`, in the order the panel reads them (the expected value, computed by the core). */
const kindOf = (lookup: Lookup, cls: string) => collectModelObjectIds(lookup, 'M').filter(id => isKindOf(lookup, id, cls));

/** The net the panel compiles for M: its run bag, its object ids, its view (simBridge.ts `startRun`). */
function panelNet(lookup: Lookup) {
    const stc = netStcFromRoles(runBag(lookup.MM._state, lookup));
    if (!stc) throw new Error('no STC');
    return compileNet(stc, makeNetModelView(lookup, stc.eventIdentifier), 'M', collectModelObjectIds(lookup, 'M'));
}

/** Every plain object and array reachable from `value`, the handles left out (they are the caller's). */
function reachable(value: unknown, handles: ReadonlySet<unknown>, out: unknown[] = []): unknown[] {
    if (value === null || typeof value !== 'object' || handles.has(value) || out.includes(value)) return out;
    out.push(value);
    for (const v of Object.values(value)) reachable(v, handles, out);
    return out;
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('stcAccess: the instances of the roles (R-GEN-7)', () => {
    it('state machine: nodes, transitions, initial and events are the isKindOf selections, in model order (mutant: exact-class match)', () => {
        const lookup = smLookup();
        const stc = access(lookup);
        expect(ids(stc.nodes)).toEqual(kindOf(lookup, 'C_State'));
        expect(ids(stc.transitions)).toEqual(kindOf(lookup, 'C_Trans'));
        expect(ids(stc.initial)).toEqual(kindOf(lookup, 'C_Init'));
        expect(ids(stc.events)).toEqual(kindOf(lookup, 'C_Event'));
        // The same values as literals: Locked is a State through its Initial class.
        expect([ids(stc.nodes), ids(stc.transitions), ids(stc.initial), ids(stc.events)]).toEqual([
            ['Locked', 'Unlocked'], ['tCoin', 'tPushU', 'tPushL'], ['Locked'], ['coin', 'push'],
        ]);
    });

    it('flowchart: every node is a kind of the abstract ActivityNode; fork and join are nodes but not places (mutant: exact-class match)', () => {
        const lookup = flowLookup();
        const stc = access(lookup);
        expect(ids(stc.nodes)).toEqual(kindOf(lookup, 'C_AN'));
        expect(ids(stc.nodes)).toEqual(['i0', 'work', 'd1', 'fk', 'left', 'right', 'jn', 'fin']);
        expect(ids(stc.transitions)).toEqual(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9']);
        expect(ids(stc.initial)).toEqual(['i0']);
        // No Trigger bound: no event role.
        expect(stc.events).toEqual([]);
        expect(stc.net.places).toEqual(['i0', 'work', 'd1', 'left', 'right', 'fin']);
    });

    it('Petri: the terminal place is a node through inheritance; Initial, bound but off in the profile, selects nothing (mutants: exact-class match; the raw bag read)', () => {
        const lookup = pnLookup();
        const stc = access(lookup);
        expect(ids(stc.nodes)).toEqual(kindOf(lookup, 'C_Place'));
        expect(ids(stc.nodes)).toEqual(['p1', 'p2', 'p3']);
        expect(ids(stc.transitions)).toEqual(['t1']);
        // control: the raw bag binds Initial to Place, which would select every place.
        expect(kindOf(lookup, PN_BAG.simInitial)).toEqual(['p1', 'p2', 'p3']);
        expect(stc.initial).toEqual([]);
        expect(stc.events).toEqual([]);
    });

    it('the order is the model\'s object order, not the alphabet: a lookup filled in reverse reverses the lists (mutant: sorted by id)', () => {
        const forward = smLookup();
        const backward: Lookup = {};
        for (const key of Object.keys(forward).reverse()) backward[key] = forward[key];
        expect(ids(access(backward).transitions)).toEqual(['tPushL', 'tPushU', 'tCoin']);
        expect(ids(access(backward).transitions)).toEqual(kindOf(backward, 'C_Trans'));
    });

    it('element results are what handleOf returns for their id, as it gave them', () => {
        const lookup = smLookup();
        const made = new Map<string, Handle>();
        const stc = stcAccess(lookup, 'M', (id: string) => {
            if (!made.has(id)) made.set(id, { id });
            return made.get(id) as Handle;
        });
        expect(stc?.nodes[0]).toBe(made.get('Locked'));
        expect(stc?.initial[0]).toBe(made.get('Locked'));
        expect(stc?.trigger('tCoin')[0]).toBe(made.get('coin'));
        expect(Object.isFrozen(made.get('Locked'))).toBe(false);
    });
});

describe('stcAccess: trigger, source and target by feature pointer', () => {
    it('state machine: trigger and target agree with objectReferences over the role\'s pointer (mutant: trigger matched by name)', () => {
        const lookup = smLookup();
        const stc = access(lookup);
        for (const t of ['tCoin', 'tPushU', 'tPushL']) {
            expect(ids(stc.trigger(t))).toEqual(objectReferences(lookup, t, 'R_trigger'));
            expect(ids(stc.target(t))).toEqual(objectReferences(lookup, t, 'R_next'));
        }
        // tPushL's first slot is the stale `trigger` reference to coin; the role points to R_trigger, which holds push.
        expect(ids(stc.trigger('tPushL'))).toEqual(['push']);
        expect(ids(stc.target('tCoin'))).toEqual(['Unlocked']);
    });

    it('state machine: with no Source role the source is the owner through Owned transitions (mutant: the ownedTransitions fallback removed)', () => {
        const stc = access(smLookup());
        expect([ids(stc.source('tCoin')), ids(stc.source('tPushU')), ids(stc.source('tPushL'))]).toEqual([['Locked'], ['Unlocked'], ['Locked']]);
    });

    it('a declared Source overrides the owner; an edge without one falls back to it, as netCompile.ts:285-287', () => {
        const lookup = smLookup({ ...SM_BAG, simSource: 'R_src' });
        lookup.v_tPushU_R_src = { className: 'DValue', id: 'v_tPushU_R_src', instanceof: 'R_src', values: ['Locked'], father: 'tPushU' };
        lookup.tPushU.features.push('v_tPushU_R_src');
        const stc = access(lookup);
        expect(ids(stc.source('tPushU'))).toEqual(objectReferences(lookup, 'tPushU', 'R_src'));
        expect(ids(stc.source('tPushU'))).toEqual(['Locked']);
        expect(ids(stc.source('tCoin'))).toEqual(['Locked']);
    });

    it('flowchart: source and target are the Source and Next state references; an element can be passed as a handle', () => {
        const lookup = flowLookup();
        const stc = access(lookup);
        for (const t of stc.transitions) {
            expect(ids(stc.source(t))).toEqual(objectReferences(lookup, t.id, 'R_source'));
            expect(ids(stc.target(t))).toEqual(objectReferences(lookup, t.id, 'R_target'));
        }
        expect([ids(stc.source('f4')), ids(stc.target('f4'))]).toEqual([['d1'], ['fk']]);
        expect(stc.trigger('f4')).toEqual([]);
    });

    it('Petri: Next state, bound but off in the profile, reads as unbound; an unknown element reads as empty', () => {
        const stc = access(pnLookup());
        // control: the raw slot of a2 holds p2 under the pointer the raw bag gives Next state.
        expect(objectReferences(pnLookup(), 'a2', PN_BAG.simNextState)).toEqual(['p2']);
        expect(stc.target('a2')).toEqual([]);
        expect([stc.source('nope'), stc.target('nope'), stc.trigger('nope'), stc.guard('nope'), stc.actions('nope')]).toEqual([[], [], [], null, []]);
    });
});

describe('stcAccess: guard and actions, the JjEL source text', () => {
    it('the guard is the text of the Guard attribute; absent or blank is null; else is returned as written', () => {
        const sm = access(smLookup());
        expect([sm.guard('tCoin'), sm.guard('tPushU'), sm.guard('tPushL')]).toEqual(['self.trigger == event', null, 'false']);
        const flow = access(flowLookup());
        expect([flow.guard('f1'), flow.guard('f3'), flow.guard('f4')]).toEqual([null, 'model.[count] < 2', 'else']);
        expect(access(pnLookup()).guard('t1')).toBe('true');
    });

    it('two Guard attributes (R-SIM-90) are conjoined in bag order', () => {
        const lookup = smLookup({ ...SM_BAG, simGuard: JSON.stringify(['A_guard', 'A_g2']) });
        lookup.v_tCoin_A_g2 = { className: 'DValue', id: 'v_tCoin_A_g2', instanceof: 'A_g2', values: ['x > 0'], father: 'tCoin' };
        lookup.tCoin.features.push('v_tCoin_A_g2');
        const stc = access(lookup);
        expect(stc.guard('tCoin')).toBe('(self.trigger == event) and (x > 0)');
        expect(stc.guard('tPushL')).toBe('false');
    });

    it('actions are every value of the Action attribute in order, blanks dropped; absent is []', () => {
        const flow = access(flowLookup());
        expect(flow.actions('f2')).toEqual(['model.[count] := model.[count] + 1', 'model.[count] := 0']);
        expect(flow.actions('f1')).toEqual([]);
    });

    it('Action off in the State machine profile reads as unbound; control: Extended state machine reads it', () => {
        expect(access(smLookup()).actions('tCoin')).toEqual([]);
        expect(access(smLookup({ ...SM_BAG, simProfile: 'extendedStateMachine', simStateAttributes: COUNT })).actions('tCoin')).toEqual(['x := 1']);
    });
});

describe('stcAccess: the compiled net and the profile', () => {
    it('net is compileNet on the bag, ids and view the panel reads: places and transitions with ids, for all three shapes', () => {
        for (const lookup of [smLookup(), flowLookup(), pnLookup()]) {
            const net = panelNet(lookup);
            expect(access(lookup).net).toEqual({ places: [...net.places], transitions: net.transitions });
        }
        // The fused fork and join of flow B are one transition each, named by their node.
        expect(access(flowLookup()).net.transitions.map(t => t.id)).toEqual(['f1', 'f2', 'f3', 'fk', 'jn']);
    });

    it('profile is the one the panel names (storedProfile): system, user-less Custom, and unreadable', () => {
        for (const bag of [SM_BAG, FLOW_BAG, PN_BAG]) {
            const lookup = bag === SM_BAG ? smLookup() : bag === FLOW_BAG ? flowLookup() : pnLookup();
            const { profile, custom } = storedProfile(lookup.MM._state);
            expect(access(lookup).profile).toEqual({ id: profile.id, name: profile.name, shape: profile.shape, custom });
        }
        expect(access(smLookup()).profile).toEqual({ id: 'stateMachine', name: 'State machine', shape: 'controlFlow', custom: false });
        const { simProfile: _p, ...noProfile } = SM_BAG;
        expect(access(smLookup(noProfile)).profile).toMatchObject({ id: 'custom', custom: true });
        expect(access(smLookup({ ...SM_BAG, simProfile: '{not json' })).profile).toMatchObject({ id: 'custom', custom: true });
    });
});

describe('stcAccess: read-only', () => {
    it('every object and array it returns is frozen, the handles aside, and a write throws in strict mode', () => {
        const stc = access(flowLookup());
        const handles = new Set<unknown>([...stc.nodes, ...stc.transitions, ...stc.initial, ...stc.events]);
        const called = [stc.trigger('f2'), stc.source('f2'), stc.target('f2'), stc.actions('f2')];
        for (const h of called.flat()) if (typeof h === 'object') handles.add(h);
        const objects = reachable([stc, ...called], handles).slice(1);
        expect(objects.length).toBeGreaterThan(20);
        for (const o of objects) expect(Object.isFrozen(o)).toBe(true);
        expect(() => { (stc as any).nodes = []; }).toThrow(TypeError);
        expect(() => { (stc.nodes as Handle[]).push(stub('x')); }).toThrow(TypeError);
        expect(() => { (stc.profile as any).name = 'x'; }).toThrow(TypeError);
        expect(() => { (stc.net.places as string[]).length = 0; }).toThrow(TypeError);
        expect(() => { (stc.net.transitions[0] as any).id = 'x'; }).toThrow(TypeError);
        expect(() => { (stc.net.transitions[0].preset as any[])[0].weight = 9; }).toThrow(TypeError);
        expect(() => { (stc.source('f2') as Handle[]).pop(); }).toThrow(TypeError);
        expect(() => { (stc.actions('f2') as string[])[0] = 'x'; }).toThrow(TypeError);
    });

    it('reading does not write the lookup', () => {
        const lookup = flowLookup();
        const before = JSON.stringify(lookup);
        const stc = access(lookup);
        for (const t of stc.transitions) [stc.trigger(t), stc.source(t), stc.target(t), stc.guard(t), stc.actions(t)];
        expect(JSON.stringify(lookup)).toBe(before);
    });
});

describe('stcAccess: no STC', () => {
    it('a metamodel with no simulation roles yields null, not an exception; control: the same lookup with its roles yields a view', () => {
        const roled = smLookup();
        expect(stcAccess(roled, 'M', stub)).not.toBeNull();
        const empty = smLookup();
        empty.MM._state = {};
        expect(stcAccess(empty, 'M', stub)).toBeNull();
        delete empty.MM._state;
        expect(stcAccess(empty, 'M', stub)).toBeNull();
        // Roles that do not make an STC: no Next state.
        const { simNextState: _n, ...partial } = SM_BAG;
        expect(stcAccess(smLookup(partial), 'M', stub)).toBeNull();
    });

    it('a model that is missing, or whose metamodel is, yields null', () => {
        expect(stcAccess(smLookup(), 'nope', stub)).toBeNull();
        const orphan = smLookup();
        delete orphan.MM;
        expect(stcAccess(orphan, 'M', stub)).toBeNull();
    });
});

describe('stcAccess: import boundary', () => {
    it('the module imports nothing from components/, react, redux or joiner (mutant: an import of simBridge)', () => {
        const source = readFileSync(resolve(__dirname, '../stcAccess.ts'), 'utf8');
        const specifiers = [...source.matchAll(/^\s*(?:import|export)\b[^;]*?\bfrom\s+['"]([^'"]+)['"]/gms)].map(m => m[1]);
        // control: the matcher sees the module's real imports.
        expect(specifiers).toContain('../model/simulation/netCompile');
        expect(specifiers.filter(s => /(^|\/)components\/|^react($|\/)|redux|joiner/.test(s))).toEqual([]);
        expect(source).not.toMatch(/\brequire\s*\(|\bimport\s*\(/);
    });
});
