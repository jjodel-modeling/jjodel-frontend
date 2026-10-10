/**
 * stcChecks — the checker rules R1-R6 of P2b (P-2026-09-27-2235,
 * docs/discovery/discovery_2026-09-27_sim_checker_gap.md §8), and R3's split of
 * the folded target (`judgeActionTarget`).
 *
 * Executes the module (P11) over a synthetic snapshot shaped as the ESM demo
 * preset (report §5.2): `locked` and `unlocked` are places, `tc` and `tp`
 * transitions, `coin` an event; `coins` (0..3) and `paid` (derived, boolean)
 * are global, `color` a presentation attribute of the transitions, `level` an
 * enumeration of the states. The ids are not the names, so a pointer printed in
 * a message shows. Each rule is tested on the §5.2 rows it closes; the bridge's
 * wiring is tested through `startRun` in `sim/__tests__/simBridge.test.ts`.
 * Each test name says which break kills it; the bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { parseExpressionStrict } from '../../../jjel/parser';
import type { JjelExpression } from '../../../jjel/types/ast';
import { freezeSnapshot } from '../guardContext';
import { compileAction, foldActionTarget, judgeActionTarget } from '../actionEvaluator';
import type { CompiledAction } from '../actionEvaluator';
import {
    checkActionSubset, checkActionValue, checkElse, checkEventFeature, checkEventRead, checkGuard, checkInputTarget, checkTargetName, eventReads, inputReads,
} from '../stcChecks';
import type { StcScope } from '../stcChecks';
import type { ActionSite, StateAttributeDecl } from '../netTypes';

const NAMES: Record<string, string> = { Mx: 'demoESM', Lx: 'locked', Ux: 'unlocked', TCx: 'tc', TPx: 'tp', Cx: 'coin' };

const COINS: StateAttributeDecl = { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: 0 };
const PAID: StateAttributeDecl = { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, equation: 'model.[coins] >= 2' };
const COLOR: StateAttributeDecl = { name: 'color', metaclass: 'C_Trans', space: 'presentation', domain: null, initial: 'grey' };
const LEVEL: StateAttributeDecl = { name: 'level', metaclass: 'C_State', space: 'semantic', domain: { kind: 'enum', literals: ['lo', 'hi'] }, initial: 'lo' };

function scope(): StcScope {
    const h: Record<string, any> = {};
    for (const [id, name] of Object.entries(NAMES)) if (id !== 'Mx') h[id] = { id, __type: 'Object', name };
    h.TCx.nextState = h.Lx; h.TCx.trigger = h.Cx;
    h.TPx.nextState = h.Ux;
    const byName = Object.fromEntries(Object.values(h).map(x => [x.name, x]));
    const snapshot = freezeSnapshot({ instances: Object.values(h), classes: [], ...byName }, { id: 'Mx', name: 'demoESM' });
    const on = (...decls: StateAttributeDecl[]) => new Map(decls.map(d => [d.name, d]));
    const declared = new Map([['Mx', on(COINS, PAID)], ['TCx', on(COLOR)], ['TPx', on(COLOR)], ['Lx', on(LEVEL)], ['Ux', on(LEVEL)]]);
    return { snapshot, net: { attributes: [COINS, PAID, COLOR, LEVEL], declared, places: new Set(['Lx', 'Ux']) }, nameOf: id => NAMES[id] ?? id };
}

const TC: ActionSite = { element: 'TCx', role: 'transition' };

function expr(text: string): JjelExpression {
    const parsed = parseExpressionStrict(text);
    if (!parsed.expression) throw new Error(`does not parse: ${text}`);
    return parsed.expression;
}
const guard = (text: string, site = 'TPx') => checkGuard(expr(text), site, scope());
const action = (text: string): CompiledAction => {
    const c = compileAction(text);
    if (c === null || c.action === null) throw new Error(`does not parse: ${text}`);
    return c;
};
/** R1 and R5 on the right side, with the target folded as the bridge folds it. */
const value = (text: string, site: ActionSite = TC) => {
    const c = action(text);
    const s = scope();
    return checkActionValue(c, site, foldActionTarget(c, site, s.snapshot), s);
};

describe('R1: a .[x] whose name no declaration has, marked and tokens aside (G3, P4, A10; mutant R1: names never checked)', () => {
    it('G3 and P4: a guard read of an undeclared name, on self or on a place', () => {
        expect(guard('self.[visits] > 0')).toEqual({ reason: 'undeclared', detail: "no state attribute is declared with the name 'visits'", short: "undeclared 'visits'" });
        expect(guard('locked.[visits] < 1')?.short).toBe("undeclared 'visits'");
    });

    it('A10: a read on the right side of an action; and a target the run resolves (σ-dependent) by its name', () => {
        expect(value('model.[coins] := self.[visits]')).toMatchObject({ reason: 'undeclared', short: "undeclared 'visits'" });
        expect(checkTargetName(action('(if model.[paid] then locked else unlocked).[nope] := 1'), scope())).toMatchObject({ reason: 'undeclared', short: "undeclared 'nope'" });
    });

    it('controls: marked and tokens are never undeclared; a declared name is not; A11 `event.[coins]` is left to the run', () => {
        for (const text of ['locked.[tokens] < 1', 'locked.[marked]', 'model.[coins] > 0', 'event.[coins] > 0']) expect([text, guard(text)]).toEqual([text, null]);
        expect(checkTargetName(action('event.[coins] := 1'), scope())).toBeNull();
        expect(value('event.[coins] := 1', TC)).toBeNull();
    });
});

describe('R2: a guard read whose object folds, judged like a folded target (G4, G10, P5; mutant R2: folded reads never judged)', () => {
    it('G4: a model name is no element', () => {
        expect(guard('demoESM.[paid]')).toEqual({
            reason: 'unresolved', detail: "'.[paid]' needs a model element on its left: 'demoESM' does not exist", short: 'unresolved .[paid]',
        });
        expect(guard('self.name.[coins] > 0')).toMatchObject({ reason: 'unresolved', detail: "'.[coins]' needs a model element on its left, got string" });
    });

    it('G10: a global read on a state is undeclared there, named by the element, never its id', () => {
        const d = guard('self.nextState.[coins] > 0');
        expect(d).toEqual({ reason: 'undeclared', detail: "'coins' is not a state attribute of unlocked", short: "undeclared 'coins' on unlocked" });
        expect(JSON.stringify(d)).not.toMatch(/Ux/);
    });

    it('P5: tokens off a place; a presentation attribute is no guard read (locality)', () => {
        expect(guard('tc.[tokens] < 1')).toEqual({ reason: 'undeclared', detail: "'tokens' is not a state attribute of tc: only a place has it", short: "'tokens' on tc, not a place" });
        expect(guard("tc.[color] == 'red'")).toMatchObject({ reason: 'locality', short: "locality, 'color' is presentation" });
    });

    it('controls: an object that reads σ, the event or a bound variable is the run\'s; a folded declared read is clean (mutant: binders ignored)', () => {
        for (const text of [
            "(if model.[paid] then locked else tc).[level] == 'lo'", 'event.[coins] > 0', "[locked, unlocked].all(s => s.[level] == 'lo')",
            "self.nextState.[level] == 'hi'", 'locked.[tokens] < 1', 'model.[paid]',
        ]) expect([text, guard(text)]).toEqual([text, null]);
    });
});

describe('R3: a folded action target that does not resolve is `unresolved`, a σ-dependent one is the run\'s (A4, A14; mutants R3: unresolved never said; unresolved for σ)', () => {
    const judge = (text: string) => judgeActionTarget(action(text), TC, scope().snapshot);

    it('A4 (C2 probe 4) and A14: the texts of the run-time halt, known at Reset', () => {
        expect(judge('demoESM.[coins] := 1')).toEqual({ kind: 'unresolved', detail: "the target: 'demoESM' does not exist" });
        expect(judge('self.name.[coins] := 1')).toEqual({ kind: 'unresolved', detail: 'the target is string, not a model element' });
    });

    it('A11 and a σ-dependent target stay the run\'s; a folded one folds; foldActionTarget keeps its null for both', () => {
        for (const text of ['event.[coins] := 1', "(if model.[paid] then locked else unlocked).[level] := 'hi'"]) {
            expect([text, judge(text)]).toEqual([text, { kind: 'run' }]);
        }
        expect(judge('model.[coins] := 1')).toEqual({ kind: 'folded', target: { element: 'Mx', attr: 'coins', onNode: false } });
        expect(judge("node.[color] := 'red'")).toEqual({ kind: 'folded', target: { element: 'TCx', attr: 'color', onNode: true } });
        for (const text of ['demoESM.[coins] := 1', 'event.[coins] := 1']) {
            expect([text, foldActionTarget(action(text), TC, scope().snapshot)]).toEqual([text, null]);
        }
    });
});

describe('R4: the subset checker\'s errors on the right side, not only E-NODE (A12; mutant R4: the right side unchecked)', () => {
    it('A12: now() is E-CALL; `data` is E-DATA', () => {
        expect(checkActionSubset(action('model.[coins] := now()'))).toMatchObject({ reason: 'subset', detail: expect.stringMatching(/^E-CALL: /) });
        expect(checkActionSubset(action('model.[coins] := data.x'))?.detail).toMatch(/^E-DATA: /);
    });

    it('controls: a warning or a not-verifiable is no defect (R-SIM-61); node on a presentation assignment is allowed', () => {
        for (const text of ['model.[coins] := 7 / 2', 'model.[coins] := model.[coins] + 1', 'node.[color] := node.[color]']) {
            expect([text, checkActionSubset(action(text))]).toEqual([text, null]);
        }
    });
});

describe('R5: a right side that folds to a non-scalar, or outside a semantic target\'s domain (A13, A9; mutant R5: values never folded)', () => {
    it('A13: an element is no value', () => {
        expect(value('model.[coins] := self')).toEqual({ reason: 'value', detail: 'the value is object, not a boolean, a number or a string', short: 'value is object' });
        expect(value('event.[coins] := self')?.short).toBe('value is object');
    });

    it('A9: a literal, or a folded sum, outside the domain, named by the element', () => {
        expect(value("model.[coins] := 'a'")).toEqual({ reason: 'value', detail: 'coins of demoESM would be a, outside its domain', short: 'coins = a, outside its domain' });
        expect(value('model.[coins] := 2 + 2')?.short).toBe('coins = 4, outside its domain');
        expect(value("locked.[level] := 'mid'")?.detail).toBe('level of locked would be mid, outside its domain');
    });

    it('controls: A0 reads σ and is the run\'s; an in-domain literal and a presentation value are clean', () => {
        for (const text of ['model.[coins] := model.[coins] + 1', 'model.[coins] := 3', "locked.[level] := 'hi'", "node.[color] := 'red'"]) {
            expect([text, value(text)]).toEqual([text, null]);
        }
    });
});

describe('R6: a guard that is a .[x] read of a non-boolean declaration (G5; mutant R6: the top level never typed)', () => {
    it('G5: a number, a count and an enumeration are no verdict', () => {
        expect(guard('model.[coins]')).toEqual({ reason: 'value', detail: 'the guard returns number, not a boolean', short: 'returns number' });
        expect(guard('locked.[tokens]')?.short).toBe('returns number');
        expect(guard('locked.[level]')?.short).toBe('returns string');
    });

    it('controls: G0 a derived boolean, marked, and a comparison are verdicts', () => {
        for (const text of ['model.[paid]', 'locked.[marked]', 'model.[coins] >= 2']) expect([text, guard(text)]).toEqual([text, null]);
    });
});

describe('A0 and G0 stay clean through every rule', () => {
    it('the ESM demo\'s own texts: tc\'s effect, tp\'s guard and effect', () => {
        const s = scope();
        for (const text of ['model.[coins] := model.[coins] + 1', 'model.[coins] := 0']) {
            const c = action(text);
            expect([text, checkActionSubset(c), checkTargetName(c, s), checkActionValue(c, TC, foldActionTarget(c, TC, s.snapshot), s)]).toEqual([text, null, null, null]);
        }
        expect(guard('model.[paid]')).toBeNull();
    });
});

describe('R7: an else with no sibling (R-SIM-87, amends R-SIM-31(1), P-2026-09-28-0100)', () => {
    it('an else whose sibling list is empty is a defect; with a sibling, or not an else, none (mutants: every else; no else)', () => {
        expect(checkElse({ elseOf: [] })).toEqual({
            reason: 'else-alone', detail: 'else with no sibling: no other transition has its preset and its triggers, so it is always true', short: 'else, no sibling',
        });
        expect(checkElse({ elseOf: ['t2'] })).toBeNull();
        expect(checkElse({ elseOf: null })).toBeNull();
    });
});

describe('R-SIM-88: the input reads of a guard or an action, folded as R2 folds (P-2026-09-28-0034)', () => {
    const ASK: StateAttributeDecl = { name: 'ask', metaclass: 'C_State', space: 'semantic', domain: { kind: 'boolean' }, input: true };
    const ANSWER: StateAttributeDecl = { name: 'answer', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, input: true };
    /** The ESM scope with `ask` an input of both states and `answer` a global input. */
    const withInputs = (): StcScope => {
        const s = scope();
        const on = (...decls: StateAttributeDecl[]) => new Map(decls.map(d => [d.name, d]));
        const declared = new Map([['Mx', on(COINS, PAID, ANSWER)], ['TCx', on(COLOR)], ['TPx', on(COLOR)], ['Lx', on(LEVEL, ASK)], ['Ux', on(LEVEL, ASK)]]);
        return { ...s, net: { ...s.net, attributes: [COINS, PAID, COLOR, LEVEL, ASK, ANSWER], declared } };
    };
    const reads = (text: string, site = 'TPx') => inputReads(expr(text), site, withInputs()).map(r => `${r.element}.${r.attr}`);

    it('a read whose object folds names that element, once (mutant: the object never folded, every owner asked)', () => {
        expect(reads('locked.[ask]')).toEqual(['Lx.ask']);
        expect(reads('self.nextState.[ask] and not self.nextState.[ask]')).toEqual(['Ux.ask']);
        expect(reads('model.[answer] > 1')).toEqual(['Mx.answer']);
    });

    it('a read whose object reads σ asks every owner of the name as an input (mutant: such a read skipped)', () => {
        expect(reads('(if model.[coins] > 0 then locked else unlocked).[ask]')).toEqual(['Lx.ask', 'Ux.ask']);
    });

    it('controls: a stored, derived, marked or node read, and an input name folded onto an element that does not declare it, ask nothing', () => {
        for (const text of ['model.[coins] > 0', 'model.[paid]', 'locked.[marked]', 'node.[color] == 1', 'self.[ask]']) expect([text, reads(text)]).toEqual([text, []]);
    });

    it('the read carries the domain; R1, R2 and R6 accept a declared input (H6 of the report)', () => {
        expect(inputReads(expr('model.[answer] > 1'), 'TPx', withInputs())[0]).toEqual({ element: 'Mx', attr: 'answer', domain: { kind: 'range', min: 0, max: 3 } });
        for (const text of ['locked.[ask]', 'model.[answer] > 1']) expect([text, checkGuard(expr(text), 'TPx', withInputs())]).toEqual([text, null]);
    });

    it('a target the run resolves whose name only an input has is read-only (mutant: left to the run)', () => {
        expect(checkInputTarget(action('(if model.[coins] > 0 then locked else unlocked).[ask] := true'), withInputs()))
            .toEqual({ reason: 'read-only', detail: "'ask' is an input and cannot be assigned", short: "assigns input 'ask'" });
        // control: a stored name
        expect(checkInputTarget(action('(if model.[coins] > 0 then locked else unlocked).[level] := lo'), withInputs())).toBeNull();
    });
});

describe('R-SIM-144 P3: a read of event where no event is bound (P-2026-10-10-1630)', () => {
    const named = { nameOf: (id: string) => NAMES[id] ?? id };
    const onArc = (text: string, untriggered: string | null) => checkEventRead(expr(text), { role: 'guard', untriggered }, named);

    it('a guard of a transition without a trigger that reads event is the defect event, named by that transition (mutant: the trigger ignored, never a defect)', () => {
        expect(onArc('event.amount > 0', 'TPx')).toEqual({
            reason: 'event', detail: 'reads event, but tp has no trigger: event is null in its step', short: 'reads event, no trigger',
        });
    });

    it('every form counts: event == null, event.[x], event alone, inside a lambda (mutant: only a member read counted)', () => {
        for (const text of ['event == null', 'event.[coins] > 0', 'event', '[1, 2].all(x => event == null)']) {
            expect([text, onArc(text, 'TPx')?.reason]).toEqual([text, 'event']);
        }
    });

    it('controls: on a triggered transition none; a feature named event on self is not the root (mutant: any name event counted)', () => {
        expect(onArc('event.amount > 0', null)).toBeNull();
        expect(onArc('self.event == "x"', 'TPx')).toBeNull();
        expect(onArc('model.[coins] > 0', 'TPx')).toBeNull();
    });

    it('an entry or an exit action that reads event is the defect, whatever the arc (mutant: entry judged as a transition action)', () => {
        const a = action('model.[coins] := event.amount').action;
        expect(checkEventRead(a, { role: 'entry' }, named)).toEqual({
            reason: 'event', detail: 'an entry action cannot read event: what a node does on entry does not depend on the path that reached it',
            short: 'reads event in entry',
        });
        expect(checkEventRead(a, { role: 'exit' }, named)?.short).toBe('reads event in exit');
        expect(checkEventRead(action('model.[coins] := 1').action, { role: 'exit' }, named)).toBeNull();
        // an action's target counts as a read too
        expect(checkEventRead(action('event.[coins] := 1').action, { role: 'transition', untriggered: 'TCx' }, named)?.short).toBe('reads event, no trigger');
        expect(checkEventRead(action('event.[coins] := 1').action, { role: 'transition', untriggered: null }, named)).toBeNull();
    });
});

describe('R-SIM-144 P4: event.a looked up on the trigger\'s declared type (P-2026-10-10-1630)', () => {
    const typed = { event: { name: 'Coin', features: new Set(['amount', 'home']) } };

    it('a name the type does not have is the defect event-feature, whose short never reads undeclared (mutant: reason undeclared)', () => {
        const d = checkEventFeature(expr('event.bonus > 0'), typed);
        expect(d).toEqual({ reason: 'event-feature', detail: "'bonus' is not a feature of Coin, the type of the trigger", short: 'event.bonus: not on Coin' });
        expect(d?.short.startsWith("undeclared '")).toBe(false);
        expect(checkEventFeature(expr('event?.bonus == null'), typed)?.reason).toBe('event-feature');
    });

    it('controls: a feature of the type and the four handle keys pass; no type, no check (mutant: handle keys refused)', () => {
        for (const text of ['event.amount > 1', 'event.home == locked', 'event.name == "coin"', 'event.id == "c"', 'event.instanceOf == null', 'event.parent == null']) {
            expect([text, checkEventFeature(expr(text), typed)]).toEqual([text, null]);
        }
        expect(checkEventFeature(expr('event.bonus > 0'), {})).toBeNull();
        expect(checkEventFeature(expr('self.bonus > 0'), typed)).toBeNull();
    });

    it('eventReads lists the names read on event, once each, in order; not state reads, not self (mutant: the state read listed)', () => {
        expect(eventReads(expr('event.amount + event.home.x + event?.amount > event.[coins]'))).toEqual(['amount', 'home']);
        expect(eventReads(action('model.[coins] := event.amount').action)).toEqual(['amount']);
        expect(eventReads(expr('self.amount > 0'))).toEqual([]);
    });
});
