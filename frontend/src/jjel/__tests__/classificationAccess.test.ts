import { describe, test, expect } from 'vitest';
/**
 * The classification accessor (L3.3, R-DCN-7): `<expr>.in(V::D)` evaluates its
 * receiver and asks `ctx.classification.isIn`. No binder here: the accessor is
 * a stub, σ-backed binding is L4.3.
 */
import { parseExpression } from '../parser';
import { JjelExpression } from '../types';
import { JjelEvaluator, EvaluationContext, JjelEvaluationError } from '../evaluator';
import type { JjelClassificationAccess } from '../evaluator/context';
import { evaluateTriState } from '../../model/jjelTriState';
import { buildGuardContext, freezeSnapshot } from '../../model/simulation/guardContext';

function parse(src: string): JjelExpression {
    const result = parseExpression(src);
    if (result.errors.length > 0) throw new Error(result.errors[0].message);
    if (!result.expression) throw new Error('No expression produced');
    return result.expression;
}

type Call = [unknown, string, string];

/** Active classes as `objectId -> 'V::D'`; records every call. */
function stub(active: Record<string, string[]>): { access: JjelClassificationAccess; calls: Call[] } {
    const calls: Call[] = [];
    return {
        calls,
        access: {
            isIn(object, viewpoint, dynamicClass) {
                calls.push([object, viewpoint, dynamicClass]);
                const id = (object as any)?.id;
                return (active[id] ?? []).includes(`${viewpoint}::${dynamicClass}`);
            },
        },
    };
}

const wau: any = { id: 'w1', __type: 'Object', name: 'wau' };
const drone: any = { id: 'd1', __type: 'Object', name: 'drone', battery: 80, wau };
const idle: any = { id: 'd2', __type: 'Object', name: 'idle', battery: 10, wau };

function ctxWith(access: JjelClassificationAccess | undefined, bindings: Record<string, any> = {}): EvaluationContext {
    const ctx = new EvaluationContext({ self: drone, drones: [drone, idle], ...bindings });
    if (access) ctx.classification = access;
    return ctx;
}

function run(src: string, ctx: EvaluationContext): unknown {
    return new JjelEvaluator().evaluate(parse(src), ctx);
}

describe('bound accessor', () => {
    test('true when the dynamic class is active for self', () => {
        const { access, calls } = stub({ d1: ['Mode::Charging'] });
        expect(run('self.in(Mode::Charging)', ctxWith(access))).toBe(true);
        expect(calls).toEqual([[drone, 'Mode', 'Charging']]);
    });
    test('false when it is not', () => {
        const { access, calls } = stub({ d1: ['Mode::Charging'] });
        expect(run('self.in(Mode::Flying)', ctxWith(access))).toBe(false);
        expect(calls).toEqual([[drone, 'Mode', 'Flying']]);
    });
    test('the tri-state reports a verdict', () => {
        const { access } = stub({ d1: ['Mode::Charging'] });
        const out = evaluateTriState(new JjelEvaluator(), parse('self.in(Mode::Charging)'), ctxWith(access));
        expect(out).toEqual({ kind: 'verdict', value: true });
    });
});

describe('receiver navigation', () => {
    test('self.wau.in(Alert::Safe) asks about the wau, not self', () => {
        const { access, calls } = stub({ w1: ['Alert::Safe'] });
        expect(run('self.wau.in(Alert::Safe)', ctxWith(access))).toBe(true);
        expect(calls).toEqual([[wau, 'Alert', 'Safe']]);
    });
});

describe('child scopes inherit the accessor', () => {
    test('inside forall', () => {
        const { access } = stub({ d1: ['Mode::Charging'] });
        expect(run('forall d in drones | d.in(Mode::Charging)', ctxWith(access))).toEqual([drone]);
    });
    test('inside a lambda', () => {
        const { access, calls } = stub({ d1: ['Mode::Charging'], d2: ['Mode::Charging'] });
        expect(run('drones.all(d => d.in(Mode::Charging))', ctxWith(access))).toBe(true);
        expect(calls.map(c => c[0])).toEqual([drone, idle]);
    });
    test('child() copies it', () => {
        const { access } = stub({});
        expect(ctxWith(access).child({ x: 1 }).classification).toBe(access);
    });
});

describe('absent accessor', () => {
    test('throws the existing message', () => {
        expect(() => run('self.in(Mode::Charging)', ctxWith(undefined))).toThrow(/Mode::Charging: classification is not bound here/);
    });
    test('the tri-state reports exception', () => {
        const out = evaluateTriState(new JjelEvaluator(), parse('self.in(Mode::Charging)'), ctxWith(undefined));
        expect(out.kind).toBe('exception');
    });
});

describe('a non-boolean answer is an error, never coerced', () => {
    for (const [label, answer] of [['1', 1], ['"yes"', 'yes'], ['null', null], ['undefined', undefined]] as const) {
        test(`answer ${label}`, () => {
            const access: JjelClassificationAccess = { isIn: () => answer as any };
            expect(() => run('self.in(Mode::Charging)', ctxWith(access))).toThrow(JjelEvaluationError);
            expect(() => run('self.in(Mode::Charging)', ctxWith(access))).toThrow(/Mode::Charging/);
            const out = evaluateTriState(new JjelEvaluator(), parse('self.in(Mode::Charging)'), ctxWith(access));
            expect(out.kind).toBe('exception');
        });
    }
});

describe('buildGuardContext', () => {
    const MODEL = { id: 'm1', name: 'Drones' };
    function snapshot() {
        const t1: any = { id: 'o_t1', __type: 'Object', name: 'T1', parent: null };
        return freezeSnapshot({ instances: [t1], T1: t1 }, MODEL);
    }

    test('without the accessor: none on the context, and .in throws', () => {
        const ctx = buildGuardContext(snapshot(), { transitionId: 'o_t1' }, { event: null })!;
        expect(ctx.classification).toBeUndefined();
        expect(() => run('self.in(Mode::Charging)', ctx)).toThrow(/classification is not bound here/);
    });
    test('with the accessor: on the guard scope, read by .in, never on the base', () => {
        const { access, calls } = stub({ o_t1: ['Mode::Charging'] });
        const snap = snapshot();
        const ctx = buildGuardContext(snap, { transitionId: 'o_t1' }, { event: null }, undefined, access)!;
        expect(ctx.classification).toBe(access);
        expect(ctx.stateAccess).toBeUndefined();
        expect(run('self.in(Mode::Charging)', ctx)).toBe(true);
        expect((calls[0][0] as any).id).toBe('o_t1');
        expect(snap.base.classification).toBeUndefined();
    });
    test('state and accessor together', () => {
        const { access } = stub({});
        const state = { read: () => undefined, readPresentation: () => undefined };
        const ctx = buildGuardContext(snapshot(), { transitionId: 'o_t1' }, { event: null }, state, access)!;
        expect(ctx.stateAccess).toBe(state);
        expect(ctx.classification).toBe(access);
    });
});
