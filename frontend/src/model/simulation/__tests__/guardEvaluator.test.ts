/**
 * guardEvaluator — step 2 of the plan (spec §5.2, R-SIM-15, R-SIM-17),
 * P-2026-09-24-1520.
 *
 * Executes `compileGuard` and `evaluateGuard` (P11) on guard contexts built by
 * `freezeSnapshot` and `buildGuardContext` over a record shaped like
 * `buildEvalContext`'s output (declared in guardContext.test.ts).
 *
 * The parity block runs the same text on the same bindings through
 * `evaluateValidation` and through the guard evaluator, and asks for the same
 * answer: satisfied is true, violated is false, not evaluable for a reason is a
 * defect for the same reason (R-SIM-15). Every row is first checked to pass the
 * subset checker, so that the comparison is on evaluation and not on authoring.
 */

import { describe, it, expect } from 'vitest';
import { EvaluationContext, JjelEvaluator } from '../../../jjel/evaluator';
import { parseExpression } from '../../../jjel/parser';
import { evaluateValidation } from '../../validation/validationEvaluator';
import { buildGuardContext, freezeSnapshot } from '../guardContext';
import type { SimSnapshot } from '../guardContext';
import { compileGuard, evaluateGuard } from '../guardEvaluator';
import type { GuardOutcome } from '../guardEvaluator';

const MODEL = { id: 'm1', name: 'Machine' };

function shell(name: string): any {
    return { __type: 'Class', className: 'DClass', name, superTypes: [], subTypes: [], instances: [], allInstances: [], instanceCount: 0 };
}

/** Two transitions (T1 without `requires`, T2 requiring a locked door), a door, an event; `x` is a null global. */
function makeGlobals(): Record<string, any> {
    const Transition = shell('Transition');
    const Door = shell('Door');
    const Event = shell('Event');
    const door: any = { id: 'o_door', __type: 'Object', name: 'd1', instanceOf: Door, instanceof: Door, locked: true, parent: null };
    const go: any = { id: 'o_go', __type: 'Object', name: 'go', instanceOf: Event, instanceof: Event, parent: null };
    const t1: any = { id: 'o_t1', __type: 'Object', name: 'T1', instanceOf: Transition, instanceof: Transition, count: 2, requires: null, parent: null };
    const t2: any = { id: 'o_t2', __type: 'Object', name: 'T2', instanceOf: Transition, instanceof: Transition, count: 5, requires: door, parent: null };
    Transition.instances = [t1, t2]; Transition.allInstances = [t1, t2]; Transition.instanceCount = 2;
    Door.instances = [door]; Door.allInstances = [door]; Door.instanceCount = 1;
    Event.instances = [go]; Event.allInstances = [go]; Event.instanceCount = 1;
    return {
        classes: [Transition, Door, Event],
        instances: [t1, t2, door, go],
        Transition, Door, Event,
        T1: t1, T2: t2, d1: door, go,
        x: null,
        __ambiguousInstances: new Map([['dup', { count: 2, sampleClass: 'Transition' }]]),
    };
}

function snapshot(extra: Record<string, any> = {}): { snap: SimSnapshot; g: Record<string, any> } {
    const g = { ...makeGlobals(), ...extra };
    return { snap: freezeSnapshot(g, MODEL), g };
}

function run(source: string | null | undefined, transitionId = 'o_t1', event: string | null = null, extra: Record<string, any> = {}): GuardOutcome {
    const { snap } = snapshot(extra);
    return evaluateGuard(compileGuard(source), buildGuardContext(snap, { transitionId }, { event }));
}

describe('absent and malformed guards (R-SIM-17)', () => {
    it('an absent guard is true, with or without a context: undefined, null, empty, blank', () => {
        for (const src of [undefined, null, '', '   \n\t']) {
            expect(run(src)).toEqual({ kind: 'true' });
            expect(evaluateGuard(compileGuard(src), null)).toEqual({ kind: 'true' });
        }
    });

    it('control: a present guard answers false where the absent one answered true', () => {
        expect(run('false')).toEqual({ kind: 'false' });
    });

    it('a malformed guard is a parse-error defect, never true', () => {
        for (const src of ['a = 1', 'self.count ==', 'self.count == )']) {
            const out = run(src);
            expect(out.kind).toBe('defect');
            expect(out.kind === 'defect' && out.reason).toBe('parse-error');
        }
    });
});

describe('subset checker at compile time', () => {
    it('an error makes the guard a defect for the run, and it is never evaluated', () => {
        // Evaluated, `if self.count == 2 then true` would be true on T1.
        const g = compileGuard('if self.count == 2 then true');
        expect(g.defect?.reason).toBe('subset');
        expect(g.defect?.detail).toMatch(/^E-NOELSE: /);
        const { snap } = snapshot();
        expect(evaluateGuard(g, buildGuardContext(snap, { transitionId: 'o_t1' }, { event: null }))).toEqual({
            kind: 'defect', reason: 'subset', detail: g.defect!.detail,
        });
    });

    it('node in a guard is a defect (R-SIM-18)', () => {
        const out = run('self.count == 2 and node == null');
        expect(out).toMatchObject({ kind: 'defect', reason: 'subset' });
        expect(out.kind === 'defect' && out.detail).toMatch(/^E-NODE: /);
    });

    it('warnings and not-verifiable diagnostics do not block: the guard runs', () => {
        const isGuard = compileGuard('self is Transition');
        expect(isGuard.diagnostics.map(d => d.code)).toEqual(['W-IS']);
        expect(run('self is Transition')).toEqual({ kind: 'false' });
        const div = compileGuard('self.count / 2 == 1');
        expect(div.diagnostics.map(d => d.code)).toEqual(['T-DIV']);
        expect(run('self.count / 2 == 1')).toEqual({ kind: 'true' });
    });
});

describe('the context the guard runs on', () => {
    it('path B: a builtin name is not a function in a guard (`now` is absent)', () => {
        const out = run('now == null');
        expect(out).toMatchObject({ kind: 'defect', reason: 'absent-identifier' });
        expect(out.kind === 'defect' && out.detail).toContain("'now'");
    });

    it('path B: a global named like a builtin is reachable', () => {
        expect(run('date == 5', 'o_t1', null, { date: 5 })).toEqual({ kind: 'true' });
    });

    it('control: on path A the same two guards answer otherwise (the builtins shadow)', () => {
        const ctx = new EvaluationContext({ date: 5 });
        const a = new JjelEvaluator(ctx);
        expect(a.evaluate(parseExpression('date == 5').expression!, ctx)).toBe(false);
        expect(a.evaluate(parseExpression('now == null').expression!, ctx)).toBe(false);
    });

    it('features are reached through self only (ruling 4): a bare feature name is absent', () => {
        expect(run('self.count == 2')).toEqual({ kind: 'true' });
        const bare = run('count == 2');
        expect(bare).toMatchObject({ kind: 'defect', reason: 'absent-identifier' });
        expect(bare.kind === 'defect' && bare.detail).toContain("'count'");
    });

    it('event is null on ε and the event instance on an event step', () => {
        expect(run('event == null')).toEqual({ kind: 'true' });
        expect(run('event == null', 'o_t1', 'o_go')).toEqual({ kind: 'false' });
        expect(run('event == go and event.name == "go"', 'o_t1', 'o_go')).toEqual({ kind: 'true' });
    });

    it('model is the placeholder', () => {
        expect(run('model.id == "m1" and model.name == "Machine"')).toEqual({ kind: 'true' });
    });

    it('no handle is a defect, never true', () => {
        expect(run('true', 'o_missing')).toMatchObject({ kind: 'defect', reason: 'no-handle' });
        expect(run('true', 'o_t1', 'o_missing')).toMatchObject({ kind: 'defect', reason: 'no-handle' });
    });

    it('evaluation on the frozen snapshot works, and a local variable does not leak into the base', () => {
        const { snap } = snapshot();
        const ctx = buildGuardContext(snap, { transitionId: 'o_t1' }, { event: null });
        const g = compileGuard('Transition.instances.sortBy(t => t.count).first() == self and (exists t in Transition.instances | t.count > 4)');
        expect(g.diagnostics.map(d => d.code)).toEqual(['T-METHOD']);
        expect(evaluateGuard(g, ctx)).toEqual({ kind: 'true' });
        expect(snap.base.has('t')).toBe(false);
    });
});

describe('the tri-state matches validation on the same text and bindings (R-SIM-15)', () => {
    /** Validation's answer for one rule on T1, mapped to the guard's vocabulary. */
    function validationAnswer(body: string, g: Record<string, any>): string {
        const r = evaluateValidation({
            rules: [{ id: 'r', name: 'r', context: 'C', body, message: 'm', enabled: true }],
            instances: [{ id: 'o_t1', classChain: ['C'], self: g.instances[0], bindings: {} }],
            globals: g,
        });
        if (r.defects.length) return `defect:${r.defects[0].kind}`;
        if (r.violations.length) return 'false';
        if (r.notEvaluable.length) return `defect:${r.notEvaluable[0].reason}`;
        return 'true';
    }
    function guardAnswer(body: string): string {
        const out = run(body);
        return out.kind === 'defect' ? `defect:${out.reason}` : out.kind;
    }

    const rows: Array<[string, string]> = [
        ['self.count == 2', 'true'],
        ['self.count == 3', 'false'],
        ['self.requires.locked', 'defect:exception'],
        ['[1, 2].all(3)', 'defect:exception'],
        ['self.nope == 1', 'defect:absent-identifier'],
        ['unknownX == 1', 'defect:absent-identifier'],
        ['unknownX', 'defect:absent-identifier'],
        ['false and unknownX', 'defect:absent-identifier'],
        ['self.count + 1', 'defect:non-boolean'],
        ['dup == 1', 'false'],
        ['x?.p == true', 'false'],
        // Ticket, not fixed: a property of a string is a silent null, so both answer true.
        ['self.name.foo == null', 'true'],
    ];

    for (const [body, expected] of rows) {
        it(`${body} -> ${expected}, on both`, () => {
            expect(compileGuard(body).defect).toBeNull();
            const { g } = snapshot();
            expect(guardAnswer(body)).toBe(expected);
            expect(validationAnswer(body, g)).toBe(expected);
        });
    }

    it('a thrown TypeError is an exception defect with its class in the detail', () => {
        const out = run('[1, 2].all(3)');
        expect(out.kind === 'defect' && out.detail).toMatch(/^TypeError: /);
    });
});

describe('the rewrites the checker suggests for the eager idiom (ruling 1)', () => {
    function suggestion(src: string): string {
        const d = compileGuard(src).diagnostics.find(x => x.code === 'E-EAGER');
        expect(d).toBeDefined();
        return d!.message.split('Write: ')[1];
    }

    it('and-form: the rewrite is false without a door and true with a locked one, and passes the checker', () => {
        const idiom = 'self.requires != null and self.requires.locked';
        const rewrite = suggestion(idiom);
        expect(rewrite).toBe('if self.requires != null then self.requires.locked else false');
        expect(compileGuard(rewrite).diagnostics).toEqual([]);
        expect(run(rewrite, 'o_t1')).toEqual({ kind: 'false' });
        expect(run(rewrite, 'o_t2')).toEqual({ kind: 'true' });
    });

    it('control: the implies form is not the rewrite of the and-form (true without a door)', () => {
        expect(run('self.requires != null implies self.requires.locked', 'o_t1')).toEqual({ kind: 'true' });
    });

    it('or-form: the rewrite is true without a door, and passes the checker', () => {
        const rewrite = suggestion('self.requires == null or self.requires.locked');
        expect(rewrite).toBe('self.requires != null implies self.requires.locked');
        expect(compileGuard(rewrite).diagnostics).toEqual([]);
        expect(run(rewrite, 'o_t1')).toEqual({ kind: 'true' });
        expect(run(rewrite, 'o_t2')).toEqual({ kind: 'true' });
    });
});
