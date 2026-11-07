/**
 * Evaluation deadline (R-JJD-3, slice S3a): an optional `deadline` on
 * `EvaluationContext`, checked in `JjelEvaluator.evaluate`. Past it, the
 * evaluation stops with a `JjelTimeoutError`, which is neither a
 * `JjelEvaluationError` (runtime) nor a parse error, and is not a warning.
 * Without a deadline nothing changes.
 */
import { describe, it, expect } from 'vitest';
import { parseExpression } from '../parser';
import {
    JjelEvaluator,
    JjelEvaluationError,
    JjelTimeoutError,
    EvaluationContext,
    createFunction,
} from '../index';
import type { JjelValue } from '../index';

/** A host function that busy-waits `ms` milliseconds and returns `ms`. */
const spin = createFunction(['ms'], ([ms]) => {
    const until = Date.now() + (ms as number);
    while (Date.now() < until) { /* busy-wait */ }
    return ms;
});

/** Each item spins 20 ms inside a lambda, that is in a child context. */
const SLOW = '[1, 2, 3].map(x => spin(20))';
const FAST = '[1, 2, 3].map(x => x * 2)';

function run(source: string, deadline?: number, bindings: Record<string, JjelValue> = {}) {
    const parsed = parseExpression(source);
    if (parsed.errors.length > 0 || !parsed.expression) throw new Error('test fixture does not parse');
    const ctx = new EvaluationContext({ spin, ...bindings });
    if (deadline !== undefined) ctx.deadline = deadline;
    return new JjelEvaluator(ctx).evaluateWithDiagnostics(parsed.expression, ctx);
}

function thrown(fn: () => unknown): unknown {
    try {
        fn();
    } catch (e) {
        return e;
    }
    return undefined;
}

describe('JjEL evaluation deadline', () => {
    it('an expression that outlives a short deadline stops with JjelTimeoutError', () => {
        const deadline = Date.now() + 5;
        const e = thrown(() => run(SLOW, deadline));
        expect(e).toBeInstanceOf(JjelTimeoutError);
        expect(e).not.toBeInstanceOf(JjelEvaluationError);
        expect((e as JjelTimeoutError).name).toBe('JjelTimeoutError');
        expect((e as JjelTimeoutError).deadline).toBe(deadline);
    });

    it('the same expression without a deadline yields its value', () => {
        expect(run(SLOW).value).toEqual([20, 20, 20]);
    });

    it('a fast expression under a generous deadline yields its value', () => {
        expect(run(FAST, Date.now() + 60_000).value).toEqual([2, 4, 6]);
    });

    it('the property-not-found warning is unchanged under a deadline', () => {
        const { value, warnings } = run('x.nam', Date.now() + 60_000, { x: { name: 'a' } as any });
        expect(value).toBeNull();
        expect(warnings).toEqual([{ kind: 'property-not-found', identifier: 'nam', suggestion: 'name' }]);
    });

    it('a runtime error under a deadline is still a JjelEvaluationError', () => {
        const e = thrown(() => run('Number(bits(4, 1))', Date.now() + 60_000));
        expect(e).toBeInstanceOf(JjelEvaluationError);
        expect(e).not.toBeInstanceOf(JjelTimeoutError);
    });
});
