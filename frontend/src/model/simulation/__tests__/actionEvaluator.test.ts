/**
 * actionEvaluator — wave B2 of the state operator (P-2026-09-26-1105, R-SIM-17,
 * R-SIM-18, R-SIM-43): actions compiled once, evaluated on σ, returned to the
 * core as `ActionOutcome`.
 *
 * Executes `compileAction`, `compileActions`, `actionSiteKey` and
 * `makeActionOracle` (P11): directly on a synthetic snapshot, where one rule is
 * isolated, and through `step()` of the pure core, where the parallel
 * assignment, the site roles and the worked examples Ex1 and Ex2 of
 * docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md §5.4 need the
 * whole cycle. The declarations of the examples reach the core through
 * `compileNet`'s `decls`: lane C, which authors them, is not here (R-SIM-39).
 * Each test name says which break kills it; the bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { buildGuardContext, freezeSnapshot, toJjelStateAccess } from '../guardContext';
import type { SimSnapshot } from '../guardContext';
import { compileGuard, evaluateGuard } from '../guardEvaluator';
import type { CompiledGuard } from '../guardEvaluator';
import { actionSiteKey, compileAction, compileActions, makeActionOracle } from '../actionEvaluator';
import type { CompiledAction } from '../actionEvaluator';
import { candidates, netRunStatus, stateAccess, step } from '../netStep';
import { compileNet, netStcFromRoles } from '../netCompile';
import { isKindOf } from '../isKindOf';
import { objectReferences, objectSlotValues } from '../objectSlots';
import type {
    ActionOracle, ActionSite, CompiledNet, GuardOracle, NetConfiguration, NetModelView, NetStc, NetTransition,
    SimState, SimValue, StateAttributeDecl,
} from '../netTypes';

const MODEL = { id: 'M', name: 'machine' };

const semantic = (name: string, metaclass: string | null, max: number, initial: SimValue = 0): StateAttributeDecl =>
    ({ name, metaclass, space: 'semantic', domain: { kind: 'range', min: 0, max }, initial });
const presentation = (name: string, metaclass: string | null, initial: SimValue): StateAttributeDecl =>
    ({ name, metaclass, space: 'presentation', domain: null, initial });

// ── a hand-built net over a synthetic snapshot ──────────────────────────────

/**
 * P -e-> Q and Q -f-> P. `e` carries a weight, a null reference, a collection
 * and a reference to Q; `go` is an event.
 */
function snapshot(): SimSnapshot {
    const P: any = { id: 'P', __type: 'Object', name: 'P' };
    const Q: any = { id: 'Q', __type: 'Object', name: 'Q' };
    const e: any = { id: 'e', __type: 'Object', name: 'e', weight: 4, requires: null, items: [P, Q], next: Q };
    const f: any = { id: 'f', __type: 'Object', name: 'f' };
    const go: any = { id: 'go', __type: 'Object', name: 'go' };
    return freezeSnapshot({ instances: [P, Q, e, f, go], classes: [], P, Q, e, f, go }, MODEL);
}

function tr(id: string, pre: string, post: string): NetTransition {
    return {
        id, origin: [id], preset: [{ place: pre, weight: 1 }], postset: [{ place: post, weight: 1 }], inhibitors: [],
        triggers: [], guardSites: [], elseOf: null,
        actionSites: [{ element: pre, role: 'exit' }, { element: id, role: 'transition' }, { element: post, role: 'entry' }],
    };
}

/** Declarations by element, as `compileNet` indexes them; σ starts at their initial values. */
function handNet(decls: Record<string, StateAttributeDecl[]>): CompiledNet {
    const declared = new Map<string, Map<string, StateAttributeDecl>>();
    const attrs = new Map<string, Map<string, SimValue>>();
    const pres = new Map<string, Map<string, SimValue>>();
    for (const [el, ds] of Object.entries(decls)) {
        declared.set(el, new Map(ds.map(d => [d.name, d])));
        for (const d of ds) {
            const space = d.space === 'semantic' ? attrs : pres;
            if (!space.has(el)) space.set(el, new Map());
            space.get(el)!.set(d.name, d.initial);
        }
    }
    return {
        modelId: 'M', places: new Set(['P', 'Q']), transitions: [tr('e', 'P', 'Q'), tr('f', 'Q', 'P')], bound: 1, final: null,
        hasEventRole: false, attributes: [], declared,
        initial: { marking: new Map([['P', 1]]), attrs, presentation: pres }, defects: [],
    };
}

const DECLS: Record<string, StateAttributeDecl[]> = {
    M: [semantic('x', null, 9), semantic('a', null, 9, 1), semantic('b', null, 9, 2), semantic('f', null, 1), presentation('theme', null, 'light')],
    e: [semantic('n', 'C_Tr', 9), presentation('color', 'C_Tr', 'red'), presentation('size', 'C_Tr', 3)],
    Q: [semantic('n', 'C_Pl', 9)],
};

const TRANSITION_E: ActionSite = { element: 'e', role: 'transition' };

/** The oracle over the hand net, with the texts of each site. */
function oracleFor(texts: Array<[ActionSite, Array<string | null | undefined>]>, net = handNet(DECLS)): ActionOracle {
    const table = new Map<string, readonly CompiledAction[]>(texts.map(([site, t]) => [actionSiteKey(site), compileActions(t)]));
    return makeActionOracle(snapshot(), net, table);
}

/** One site evaluated as the core evaluates it: σ before the step, the site's presentation. */
function ask(texts: string[], site: ActionSite = TRANSITION_E, event: string | null = null, state: SimState = handNet(DECLS).initial) {
    return oracleFor([[site, texts]])(site, event, stateAccess(state, site.element));
}

const NO_GUARDS: GuardOracle = () => ({ kind: 'true' });

describe('compile: one compiled action per text, blank is no action (R-SIM-17)', () => {
    it('blank is no action: undefined, null, empty, whitespace', () => {
        for (const src of [undefined, null, '', '  \n\t']) expect(compileAction(src)).toBeNull();
        // control: a non-blank text compiles
        expect(compileAction('model.[x] := 1')).toMatchObject({ source: 'model.[x] := 1', defect: null });
    });

    it('a text parseAction rejects is a compile defect with its position; a read-only target never parses', () => {
        for (const src of ['model.[x] :=', 'model.[x] := 1 2', 'q.[tokens] := 1', 'x := 1']) {
            const c = compileAction(src)!;
            expect([src, c.action, typeof c.defect]).toEqual([src, null, 'string']);
        }
    });

    it('compileActions keeps the order and drops the blanks', () => {
        const list = compileActions(['model.[a] := 1', '', 'model.[b] := 2', null]);
        expect(list.map(c => c.source)).toEqual(['model.[a] := 1', 'model.[b] := 2']);
    });
});

describe('actionSiteKey: element and role (mutant 12)', () => {
    it('the entry and the exit of one place are different sites; the same site is the same key', () => {
        const entry = actionSiteKey({ element: 'Q', role: 'entry' });
        const exit = actionSiteKey({ element: 'Q', role: 'exit' });
        const own = actionSiteKey({ element: 'Q', role: 'transition' });
        expect(new Set([entry, exit, own]).size).toBe(3);
        expect(actionSiteKey({ element: 'Q', role: 'entry' })).toBe(entry);
        expect(actionSiteKey({ element: 'P', role: 'entry' })).not.toBe(entry);
    });
});

describe('the oracle on one site', () => {
    it('a site with no actions returns ok with no assignment; so does a site with only blanks', () => {
        expect(oracleFor([])(TRANSITION_E, null, stateAccess(handNet(DECLS).initial, 'e'))).toEqual({ kind: 'ok', assignments: [] });
        expect(ask(['', '  '])).toEqual({ kind: 'ok', assignments: [] });
    });

    it('one action: the right-hand side on σ, the target resolved', () => {
        expect(ask(['model.[x] := model.[x] + 1'])).toEqual({ kind: 'ok', assignments: [{ element: 'M', attr: 'x', value: 1 }] });
    });

    it('several actions on a site, in their order', () => {
        expect(ask(['model.[x] := 3', 'self.[n] := self.weight', 'node.[color] := "blue"'])).toEqual({
            kind: 'ok', assignments: [
                { element: 'M', attr: 'x', value: 3 }, { element: 'e', attr: 'n', value: 4 }, { element: 'e', attr: 'color', value: 'blue' },
            ],
        });
    });

    it('self is the site element: the place for entry and exit, the edge for transition; event is the input', () => {
        const entryQ: ActionSite = { element: 'Q', role: 'entry' };
        expect(ask(['self.[n] := 1'], entryQ)).toEqual({ kind: 'ok', assignments: [{ element: 'Q', attr: 'n', value: 1 }] });
        expect(ask(['self.[n] := if event == null then 1 else 2'], TRANSITION_E, 'go'))
            .toEqual({ kind: 'ok', assignments: [{ element: 'e', attr: 'n', value: 2 }] });
    });

    it('`node.[a]` on the right-hand side reads the site\'s presentation', () => {
        expect(ask(['self.[n] := node.[size]'])).toEqual({ kind: 'ok', assignments: [{ element: 'e', attr: 'n', value: 3 }] });
    });

    it('a site element with no handle in the snapshot is a defect', () => {
        const out = ask(['model.[x] := 1'], { element: 'ghost', role: 'transition' });
        expect(out.kind).toBe('defect');
    });

    it('an undeclared target is left to the core: the oracle returns it', () => {
        expect(ask(['self.[zzz] := 1'])).toEqual({ kind: 'ok', assignments: [{ element: 'e', attr: 'zzz', value: 1 }] });
    });
});

describe('the right-hand side: a value, or a defect naming the action (mutants 7, 9)', () => {
    it('an object, a collection or null on the right is a defect whose detail names the action', () => {
        for (const text of ['model.[x] := self', 'model.[x] := self.items', 'model.[x] := [1, 2]', 'model.[x] := null', 'node.[color] := self']) {
            const out = ask([text]);
            expect([text, out.kind]).toEqual([text, 'defect']);
            expect(out.kind === 'defect' && out.detail).toContain(text);
        }
        // control: a boolean, a number and a string are values
        expect(ask(['model.[f] := true', 'model.[x] := 2', 'node.[color] := "x"']).kind).toBe('ok');
    });

    it('an absent identifier is a defect naming it, never a null assignment', () => {
        const out = ask(['model.[x] := nope']);
        expect(out.kind).toBe('defect');
        expect(out.kind === 'defect' && out.detail).toContain("'nope'");
    });

    it('an absent identifier is a defect even when the value it yields is a boolean', () => {
        const out = ask(['model.[f] := nope == null']);
        expect(out.kind).toBe('defect');
        expect(out.kind === 'defect' && out.detail).toContain("'nope'");
    });

    it('an exception is a defect: a throwing call, an undeclared attribute read', () => {
        for (const text of ['model.[x] := [1, 2].all(3)', 'model.[x] := model.[undeclared]']) {
            expect([text, ask([text]).kind]).toEqual([text, 'defect']);
        }
    });
});

describe('the target (R-SIM-18, R-SIM-43; mutants 5, 6, 8)', () => {
    it('a target path to a collection, to null or to a primitive is a defect; to an element it lands there', () => {
        for (const text of ['self.items.[n] := 1', 'self.requires.[n] := 1', 'self.weight.[n] := 1']) {
            const out = ask([text]);
            expect([text, out.kind]).toEqual([text, 'defect']);
            expect(out.kind === 'defect' && out.detail).toContain(text);
        }
        expect(ask(['self.next.[n] := 1'])).toEqual({ kind: 'ok', assignments: [{ element: 'Q', attr: 'n', value: 1 }] });
    });

    it('a target path through an absent name is a defect', () => {
        expect(ask(['nope.[n] := 1']).kind).toBe('defect');
    });

    it('locality: a non-node target on a presentation attribute is a defect; node on it is not', () => {
        for (const text of ['self.[color] := "blue"', 'e.[color] := "blue"', 'model.[theme] := "dark"']) {
            expect([text, ask([text]).kind]).toEqual([text, 'defect']);
        }
        expect(ask(['node.[color] := "blue"'])).toEqual({ kind: 'ok', assignments: [{ element: 'e', attr: 'color', value: 'blue' }] });
    });

    it('locality: a node target on a semantic attribute is a defect; self on it is not', () => {
        expect(ask(['node.[n] := 1']).kind).toBe('defect');
        expect(ask(['self.[n] := 1'])).toEqual({ kind: 'ok', assignments: [{ element: 'e', attr: 'n', value: 1 }] });
    });
});

describe('through the core: one parallel assignment, sites by role', () => {
    const start = (net: CompiledNet): NetConfiguration => ({ state: net.initial, event: null });

    it('the swap `a := b`, `b := a` on one site swaps: both read σ before the step (mutant 4)', () => {
        const net = handNet(DECLS);
        const actions = oracleFor([[TRANSITION_E, ['model.[a] := model.[b]', 'model.[b] := model.[a]']]], net);
        const out = step(net, start(net), 'e', NO_GUARDS, actions);
        expect(out.kind).toBe('fired');
        if (out.kind !== 'fired') return;
        expect([out.next.state.attrs.get('M')?.get('a'), out.next.state.attrs.get('M')?.get('b')]).toEqual([2, 1]);
        expect(out.label.assignments).toEqual([{ element: 'M', attr: 'a', value: 2 }, { element: 'M', attr: 'b', value: 1 }]);
    });

    it('the entry and the exit of the same place keep their own actions (mutant 12)', () => {
        const net = handNet(DECLS);
        const actions = oracleFor([
            [{ element: 'Q', role: 'entry' }, ['model.[a] := 5']],
            [{ element: 'Q', role: 'exit' }, ['model.[b] := 7']],
        ], net);
        const afterE = step(net, start(net), 'e', NO_GUARDS, actions);
        expect(afterE.kind === 'fired' && afterE.label.assignments).toEqual([{ element: 'M', attr: 'a', value: 5 }]);
        if (afterE.kind !== 'fired') return;
        const afterF = step(net, afterE.next, 'f', NO_GUARDS, actions);
        expect(afterF.kind === 'fired' && afterF.label.assignments).toEqual([{ element: 'M', attr: 'b', value: 7 }]);
    });

    it('a parse error halts the step with action-defect at its site; σ is unchanged', () => {
        const net = handNet(DECLS);
        const out = step(net, start(net), 'e', NO_GUARDS, oracleFor([[TRANSITION_E, ['model.[x] := 1', 'model.[x] :=']]], net));
        expect(out.kind).toBe('halted');
        if (out.kind !== 'halted') return;
        expect(out.reason).toMatchObject({ kind: 'action-defect', site: TRANSITION_E });
        expect(out.reason.kind === 'action-defect' && out.reason.detail).toContain('model.[x] :=');
        expect(out.next.state).toBe(net.initial);
    });

    it('a defect on the right-hand side halts the same way', () => {
        const net = handNet(DECLS);
        const out = step(net, start(net), 'e', NO_GUARDS, oracleFor([[TRANSITION_E, ['model.[x] := nope']]], net));
        expect(out.kind === 'halted' && out.reason.kind).toBe('action-defect');
    });
});

// ── the worked examples, now as JjEL text end to end on the pure core ────────

const CLASSES: Record<string, string[]> = { C_Node: [], C_Init: ['C_Node'], C_End: ['C_Node'], C_Tr: [], C_Ev: [] };

interface Spec { [id: string]: { cls: string; slots?: Record<string, unknown[]> } }

/** The net of a raw lookup through `compileNet` with `decls`, and the snapshot of the same objects. */
function compileSpec(stc: NetStc, objects: Spec, decls: StateAttributeDecl[]): { net: CompiledNet; snap: SimSnapshot; texts: (f: string) => Map<string, unknown> } {
    const lookup: Record<string, any> = {};
    for (const [c, ext] of Object.entries(CLASSES)) lookup[c] = { className: 'DClass', extends: ext };
    const handles: Record<string, any> = {};
    for (const [id, o] of Object.entries(objects)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            features.push(`v_${id}_${f}`);
            lookup[`v_${id}_${f}`] = { className: 'DValue', instanceof: f, values };
        }
        lookup[id] = { className: 'DObject', instanceof: o.cls, features };
        handles[id] = { id, __type: 'Object', name: id };
    }
    const view: NetModelView = {
        exists: id => !!lookup[id], isInstanceOf: (id, c) => isKindOf(lookup, id, c),
        outgoingTransitions: () => [], transitionTarget: () => null,
        references: (o, f) => objectReferences(lookup, o, f), values: (o, f) => objectSlotValues(lookup, o, f),
    };
    const net = compileNet(stc, view, 'M', Object.keys(objects), decls);
    const snap = freezeSnapshot({ instances: Object.values(handles), classes: [], ...handles }, MODEL);
    const texts = (f: string) => new Map(Object.keys(objects).map(id => [id, objectSlotValues(lookup, id, f)[0]]));
    return { net, snap, texts };
}

/** The guard oracle of the bridge over this snapshot, σ through the adapter. */
function guardOracle(net: CompiledNet, snap: SimSnapshot, texts: Map<string, unknown>): GuardOracle {
    const compiled = new Map<string, CompiledGuard>();
    for (const [id, t] of texts) compiled.set(id, compileGuard(t === undefined ? undefined : String(t)));
    return (site, event, state) => evaluateGuard(compiled.get(site) ?? compileGuard(undefined),
        buildGuardContext(snap, { transitionId: site }, { event }, toJjelStateAccess(state, net.places)));
}

describe('Ex1: flowchart with a decision block and an explicit else, in JjEL', () => {
    // S -e1-> Inc -e2 / model.[x] := model.[x] + 1 -> D ; D -e3 [model.[x] < 2]-> Inc ; D -e4 [else]-> E
    const stc = netStcFromRoles({ simInitial: 'C_Init', simTerminal: 'C_End', simOwnedTransitions: 'R_out', simNextState: 'R_next', simGuard: 'A_g' })!;
    const { net, snap, texts } = compileSpec(stc, {
        S: { cls: 'C_Init', slots: { R_out: ['e1'] } }, Inc: { cls: 'C_Node', slots: { R_out: ['e2'] } },
        D: { cls: 'C_Node', slots: { R_out: ['e3', 'e4'] } }, E: { cls: 'C_End' },
        e1: { cls: 'C_Tr', slots: { R_next: ['Inc'] } }, e2: { cls: 'C_Tr', slots: { R_next: ['D'] } },
        e3: { cls: 'C_Tr', slots: { R_next: ['Inc'], A_g: ['model.[x] < 2'] } }, e4: { cls: 'C_Tr', slots: { R_next: ['E'], A_g: ['else'] } },
    }, [{ name: 'x', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 2 }, initial: 0 }]);
    const guards = guardOracle(net, snap, texts('A_g'));
    const actions = makeActionOracle(snap, net, new Map([[actionSiteKey({ element: 'e2', role: 'transition' }), compileActions(['model.[x] := model.[x] + 1'])]]));

    it('the whole run: the candidate sets at D, the labels carrying the assignments, Terminated', () => {
        let c: NetConfiguration = { state: net.initial, event: null };
        const fire = (sel: string) => {
            const out = step(net, c, sel, guards, actions);
            expect([sel, out.kind]).toEqual([sel, 'fired']);
            if (out.kind === 'fired') c = out.next;
            return out;
        };
        expect([...c.state.marking]).toEqual([['S', 1]]);
        expect(c.state.attrs.get('M')?.get('x')).toBe(0);
        fire('e1');
        expect(fire('e2').label.assignments).toEqual([{ element: 'M', attr: 'x', value: 1 }]);
        expect([[...c.state.marking], c.state.attrs.get('M')?.get('x')]).toEqual([[['D', 1]], 1]);
        const at1 = candidates(net, c, guards);
        expect(at1.candidates.map(x => x.transition)).toEqual(['e3']);
        expect(at1.evaluated).toEqual([
            { transition: 'e3', outcome: { kind: 'true' } },
            { transition: 'e4', outcome: { kind: 'else', outcome: { kind: 'false' } } },
        ]);
        expect(fire('e3').label.assignments).toEqual([]);
        expect(fire('e2').label.assignments).toEqual([{ element: 'M', attr: 'x', value: 2 }]);
        const at2 = candidates(net, c, guards);
        expect(at2.candidates.map(x => x.transition)).toEqual(['e4']);
        expect(at2.evaluated).toEqual([
            { transition: 'e3', outcome: { kind: 'false' } },
            { transition: 'e4', outcome: { kind: 'else', outcome: { kind: 'true' } } },
        ]);
        fire('e4');
        expect([...c.state.marking]).toEqual([['E', 1]]);
        expect(netRunStatus(net, c, [], guards, null)).toBe('Terminated');
        expect(candidates(net, c, guards).candidates).toEqual([]);
    });
});

describe('Ex2: the turnstile with an entry action, in JjEL', () => {
    // tCoin: Locked -coin-> Unlocked / model.[coins] := model.[coins] + 1 ; entry(Unlocked): model.[last] := model.[coins]
    const stc = netStcFromRoles({
        simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next', simEvent: 'C_Ev', simTrigger: 'R_trig',
    })!;
    const { net, snap } = compileSpec(stc, {
        Locked: { cls: 'C_Init', slots: { R_out: ['tCoin', 'tPushL'] } }, Unlocked: { cls: 'C_Node', slots: { R_out: ['tPushU'] } },
        coin: { cls: 'C_Ev' }, push: { cls: 'C_Ev' },
        tCoin: { cls: 'C_Tr', slots: { R_next: ['Unlocked'], R_trig: ['coin'] } },
        tPushU: { cls: 'C_Tr', slots: { R_next: ['Locked'], R_trig: ['push'] } },
        tPushL: { cls: 'C_Tr', slots: { R_next: ['Locked'], R_trig: ['push'] } },
    }, [semantic('coins', null, 9), semantic('last', null, 9)]);
    const actions = makeActionOracle(snap, net, new Map([
        [actionSiteKey({ element: 'tCoin', role: 'transition' }), compileActions(['model.[coins] := model.[coins] + 1'])],
        [actionSiteKey({ element: 'Unlocked', role: 'entry' }), compileActions(['model.[last] := model.[coins]'])],
    ]));
    const read = (s: SimState) => [s.attrs.get('M')?.get('coins'), s.attrs.get('M')?.get('last')];

    it('the step on tCoin gives coins = 1 and last = 0: the entry reads coins on σ, before the step', () => {
        const out = step(net, { state: net.initial, event: 'coin' }, 'tCoin', NO_GUARDS, actions);
        expect(out.kind).toBe('fired');
        if (out.kind !== 'fired') return;
        expect([...out.next.state.marking]).toEqual([['Unlocked', 1]]);
        expect(read(out.next.state)).toEqual([1, 0]);
        expect(out.label.assignments).toEqual([{ element: 'M', attr: 'coins', value: 1 }, { element: 'M', attr: 'last', value: 0 }]);
    });

    it('a second round: push back to Locked, coin again: coins = 2, last = 1', () => {
        const one = step(net, { state: net.initial, event: 'coin' }, 'tCoin', NO_GUARDS, actions);
        if (one.kind !== 'fired') throw new Error(one.kind);
        const back = step(net, { state: one.next.state, event: 'push' }, 'tPushU', NO_GUARDS, actions);
        if (back.kind !== 'fired') throw new Error(back.kind);
        expect(back.label.assignments).toEqual([]);
        const two = step(net, { state: back.next.state, event: 'coin' }, 'tCoin', NO_GUARDS, actions);
        expect(two.kind === 'fired' && read(two.next.state)).toEqual([2, 1]);
    });
});
