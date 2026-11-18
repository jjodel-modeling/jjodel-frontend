/**
 * Slot writes in the DCN action mode (P-2026-11-07-1215, R-DCN-12, R-SIM-17,
 * R-SIM-40): `self.battery := e` parses only when the caller selects the DCN
 * mode, as a `SlotTarget`; the oracle returns it as an assignment marked
 * `slot: true`, so the core can tell it from a state attribute. The core does
 * not apply slot writes yet: one reaching `step()` halts `undeclared` (lane L4.4).
 *
 * Executes `parseAction`, `parseExpression`, `compileAction(s)`,
 * `judgeActionTarget` and `makeActionOracle` (P11) on the synthetic snapshot of
 * `actionEvaluator.test.ts`, rebuilt here. Each test name says which break
 * kills it; the bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { parseAction, parseExpression } from '../../../jjel/parser';
import { freezeSnapshot } from '../guardContext';
import type { SimSnapshot } from '../guardContext';
import { actionSiteKey, compileAction, compileActions, judgeActionTarget, makeActionOracle } from '../actionEvaluator';
import type { CompiledAction } from '../actionEvaluator';
import { stateAccess, step } from '../netStep';
import type { ActionSite, CompiledNet, GuardOracle, NetTransition, SimValue, StateAttributeDecl } from '../netTypes';

const DCN = { dcn: true } as const;
const TODAY = "The target of an action must end in '.[attribute]'";

// ── the hand net of actionEvaluator.test.ts ─────────────────────────────────

function snapshot(): SimSnapshot {
    const P: any = { id: 'P', __type: 'Object', name: 'P' };
    const Q: any = { id: 'Q', __type: 'Object', name: 'Q', weight: 7 };
    const e: any = { id: 'e', __type: 'Object', name: 'e', weight: 4, requires: null, items: [P, Q], next: Q };
    const f: any = { id: 'f', __type: 'Object', name: 'f' };
    return freezeSnapshot({ instances: [P, Q, e, f], classes: [], P, Q, e, f }, { id: 'M', name: 'machine' });
}

function tr(id: string, pre: string, post: string): NetTransition {
    return {
        id, origin: [id], preset: [{ place: pre, weight: 1 }], postset: [{ place: post, weight: 1 }], inhibitors: [],
        triggers: [], guardSites: [], elseOf: null,
        actionSites: [{ element: pre, role: 'exit' }, { element: id, role: 'transition' }, { element: post, role: 'entry' }],
    };
}

const semantic = (name: string, max: number, initial: SimValue = 0): StateAttributeDecl =>
    ({ name, metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max }, initial });
const presentation = (name: string, initial: SimValue): StateAttributeDecl =>
    ({ name, metaclass: null, space: 'presentation', domain: null, initial });

function handNet(): CompiledNet {
    const decls: Record<string, StateAttributeDecl[]> = { e: [semantic('n', 9), presentation('color', 'red')] };
    const declared = new Map<string, Map<string, StateAttributeDecl>>();
    const attrs = new Map<string, Map<string, SimValue>>();
    const pres = new Map<string, Map<string, SimValue>>();
    for (const [el, ds] of Object.entries(decls)) {
        declared.set(el, new Map(ds.map(d => [d.name, d])));
        for (const d of ds) {
            const space = d.space === 'semantic' ? attrs : pres;
            if (!space.has(el)) space.set(el, new Map());
            space.get(el)!.set(d.name, d.initial!);
        }
    }
    return {
        modelId: 'M', places: new Set(['P', 'Q']), transitions: [tr('e', 'P', 'Q'), tr('f', 'Q', 'P')], bound: 1, final: null,
        hasEventRole: false, attributes: [], declared,
        initial: { marking: new Map([['P', 1]]), attrs, presentation: pres }, defects: [],
    };
}

const SITE: ActionSite = { element: 'e', role: 'transition' };
const NO_GUARDS: GuardOracle = () => ({ kind: 'true' });

function oracle(texts: string[], dcn: boolean, net = handNet()) {
    const table = new Map<string, readonly CompiledAction[]>([[actionSiteKey(SITE), compileActions(texts, dcn ? DCN : undefined)]]);
    return makeActionOracle(snapshot(), net, table);
}

function ask(texts: string[], dcn = true) {
    const net = handNet();
    return oracle(texts, dcn, net)(SITE, null, stateAccess(net.initial, SITE.element));
}

// ── parsing ─────────────────────────────────────────────────────────────────

describe('parse: a member target only in the DCN mode (R-DCN-12, R-SIM-40)', () => {
    it('in the DCN mode `self.battery := e` is a SlotTarget on self, attribute battery (drop the mode branch)', () => {
        const { action, errors } = parseAction('self.battery := self.battery - 1', DCN);
        expect(errors).toEqual([]);
        expect(action?.target).toMatchObject({ type: 'SlotTarget', attribute: 'battery', object: { type: 'Identifier', name: 'self' } });
        expect(action?.value).toMatchObject({ type: 'Binary', operator: '-' });
    });

    it('a chained receiver keeps the path and writes the last feature (unwrap the wrong member)', () => {
        const { action, errors } = parseAction('self.wau.speed := 3', DCN);
        expect(errors).toEqual([]);
        expect(action?.target).toMatchObject({
            type: 'SlotTarget', attribute: 'speed',
            object: { type: 'MemberAccess', property: 'wau', object: { type: 'Identifier', name: 'self' } },
        });
    });

    it('outside the DCN mode `self.x := e` stays refused with today\'s message (default the mode on)', () => {
        for (const opts of [undefined, {}, { dcn: false }]) {
            const r = parseAction('self.battery := 1', opts);
            expect([opts, r.action]).toEqual([opts, null]);
            expect(r.errors[0]?.message).toBe(TODAY);
        }
        // control: the same text parses in the DCN mode
        expect(parseAction('self.battery := 1', DCN).action).not.toBeNull();
    });

    it('a guard or an invariant never accepts `:=`, whatever the action mode (lex `:=` in expressions)', () => {
        const r = parseExpression('self.battery := 1');
        expect(r.expression).toBeNull();
        expect(r.errors[0]?.message).toContain('only an action can assign');
    });

    it('the state target is unchanged in the DCN mode, read-only attributes included (widen the read-only check away)', () => {
        const { action } = parseAction('self.[visits] := self.[visits] + 1', DCN);
        expect(action?.target).toMatchObject({ type: 'StateAccess', attribute: 'visits' });
        for (const src of ['p.[marked] := true', 'p.[tokens] := 1']) {
            expect([src, parseAction(src, DCN).action]).toEqual([src, null]);
        }
    });

    it('in the DCN mode a target is still a state access or a plain member, nothing else (accept any postfix)', () => {
        for (const src of ['x := 1', 'self?.battery := 1', 'self.in(Mode::Charging) := 1', 'self.f() := 1', 'self.items[0] := 1']) {
            const r = parseAction(src, DCN);
            expect([src, r.action]).toEqual([src, null]);
            expect(r.errors.length).toBeGreaterThan(0);
        }
        for (const src of ['self.battery := 1 2', 'self.battery = 1', 'self.battery :=', 'self.battery']) {
            expect([src, parseAction(src, DCN).action]).toEqual([src, null]);
        }
    });
});

// ── compile and evaluate ────────────────────────────────────────────────────

describe('compile: the mode reaches the parser through compileAction(s)', () => {
    it('compileAction parses a slot write only with the DCN option (forward the option)', () => {
        expect(compileAction('self.weight := 1', DCN)).toMatchObject({ defect: null, action: { target: { type: 'SlotTarget' } } });
        expect(compileAction('self.weight := 1')).toMatchObject({ action: null, defect: expect.stringContaining(TODAY) });
    });

    it('a slot write cannot read presentation: E-NODE stays (exempt slot targets from the subset check)', () => {
        expect(compileAction('self.weight := node.[color]', DCN)?.defect).toContain('E-NODE');
    });

    it('a slot target is left to the run, never folded as a state attribute (fold it)', () => {
        const c = compileAction('self.weight := 1', DCN)!;
        expect(judgeActionTarget(c, SITE, snapshot())).toEqual({ kind: 'run' });
        // control: a state target on the same path folds
        expect(judgeActionTarget(compileAction('self.[n] := 1')!, SITE, snapshot()).kind).toBe('folded');
    });
});

describe('the oracle: a slot write is an assignment marked slot (R-DCN-12)', () => {
    it('`self.weight := self.weight + 1` assigns weight of e, marked slot (drop the marker)', () => {
        expect(ask(['self.weight := self.weight + 1'])).toEqual({
            kind: 'ok', assignments: [{ element: 'e', attr: 'weight', value: 5, slot: true }],
        });
    });

    it('a state assignment carries no slot marker, in either mode (mark every assignment)', () => {
        for (const dcn of [true, false]) {
            const out = ask(['self.[n] := 1'], dcn);
            expect(out).toEqual({ kind: 'ok', assignments: [{ element: 'e', attr: 'n', value: 1 }] });
            expect(out.kind === 'ok' && 'slot' in out.assignments[0]).toBe(false);
        }
    });

    it('a chained receiver lands on the element it reaches (write at the site instead)', () => {
        expect(ask(['self.next.weight := 1'])).toEqual({ kind: 'ok', assignments: [{ element: 'Q', attr: 'weight', value: 1, slot: true }] });
        for (const text of ['self.items.weight := 1', 'self.requires.weight := 1', 'self.weight.weight := 1']) {
            const out = ask([text]);
            expect([text, out.kind]).toEqual([text, 'defect']);
        }
    });

    it('both target forms in one body, one parallel assignment read on the state before (R-SIM-17; mark every assignment, write at the site)', () => {
        const texts = ['self.weight := self.weight + 1', 'self.[n] := self.weight', 'self.next.weight := self.weight'];
        expect(ask(texts)).toEqual({
            kind: 'ok', assignments: [
                { element: 'e', attr: 'weight', value: 5, slot: true },
                { element: 'e', attr: 'n', value: 4 },
                { element: 'Q', attr: 'weight', value: 4, slot: true },
            ],
        });
    });

    it('a slot named like a declared presentation attribute is not judged by locality (apply locality to slots)', () => {
        expect(ask(['self.color := "blue"'])).toEqual({ kind: 'ok', assignments: [{ element: 'e', attr: 'color', value: 'blue', slot: true }] });
        // control: the state target with that name is a locality defect
        expect(ask(['self.[color] := "blue"']).kind).toBe('defect');
    });

    it('`node.color :=` is a slot write, not presentation: its value cannot read node (recognize node on a slot target)', () => {
        expect(compileAction('node.color := node.[color]', DCN)?.defect).toContain('E-NODE');
        // control: the presentation target may read node
        expect(compileAction('node.[color] := node.[color]', DCN)?.defect).toBeNull();
        const out = ask(['node.color := "blue"']);
        expect(out.kind === 'ok' && out.assignments.some(a => !('slot' in a))).toBe(false);
    });

    it('the value is still a scalar: an object on the right is a defect naming the action', () => {
        const out = ask(['self.weight := self']);
        expect(out.kind).toBe('defect');
        expect(out.kind === 'defect' && out.detail).toContain('self.weight := self');
    });
});

describe('the core does not apply slot writes yet (lane L4.4)', () => {
    it('a slot assignment reaching step() halts undeclared', () => {
        const net = handNet();
        const out = step(net, { state: net.initial, event: null }, 'e', NO_GUARDS, oracle(['self.weight := 1'], true, net));
        expect(out).toMatchObject({ kind: 'halted', reason: { kind: 'undeclared', element: 'e', attr: 'weight' } });
    });
});
