/**
 * JjEL in the conversation is bounded (R-JJD-9, P-2026-10-24-0655): the JjEL mode
 * submit runs with the S3a deadline at 2000 ms, and a timeout is a muted
 * `timed out after 2 s`, not an error. The joiner and jjscript barrels do not load
 * in the bench (window), so they are mocked; the evaluator is the real one.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const bindings: { current: Record<string, unknown> } = { current: {} };

vi.mock('../../../joiner', () => ({
    DUser: { current: 'user' },
    L: { fromPointer: () => null },
}));
vi.mock('../../../jjscript', () => ({
    buildEvalContext: () => ({ ...bindings.current }),
}));

import {
    evaluateJjelInJodie,
    jjelTimedOutText,
    JJEL_CONVERSATION_DEADLINE_MS,
    JJEL_LIVE_DEADLINE_MS,
} from '../jodieJjelContext';
import { jjelProvider } from '../console/providers/jjelProvider';

const ITEMS = Array.from({ length: 40 }, (_, i) => ({ name: `n${i}` }));
/** The S3c probe's nested `forall`, over 40 items: 40^4 steps, unbounded it takes seconds. */
const NESTED = '(' + Array.from({ length: 4 }, (_, i) => `forall x${i} in items: `).join('') + 'x0.name).size';

afterEach(() => {
    vi.restoreAllMocks();
    bindings.current = {};
});

describe('conversation JjEL deadline (R-JJD-9)', () => {
    it('is 2000 ms, apart from the 500 ms of the live result', () => {
        expect(JJEL_CONVERSATION_DEADLINE_MS).toBe(2000);
        expect(JJEL_LIVE_DEADLINE_MS).toBe(500);
        expect(jjelTimedOutText(JJEL_CONVERSATION_DEADLINE_MS)).toBe('timed out after 2 s');
    });

    it('stops a nested forall at the budget with a timedOut outcome', () => {
        bindings.current = { items: ITEMS };
        const t0 = Date.now();
        const out = evaluateJjelInJodie(NESTED, 20);
        expect(Date.now() - t0).toBeLessThan(1000);
        expect(out).toEqual({ ok: false, text: 'timed out after 0.02 s', warnings: [], timedOut: true });
    });

    it('applies the 2000 ms default: past it the outcome is timed out', () => {
        bindings.current = { items: ITEMS };
        let calls = 0;
        // First read sets the deadline at 0 + 2000; every later read is 2001.
        vi.spyOn(Date, 'now').mockImplementation(() => (calls++ === 0 ? 0 : 2001));
        const out = evaluateJjelInJodie('items.size');
        expect(out.timedOut).toBe(true);
        expect(out.text).toBe('timed out after 2 s');
    });

    it('applies the 2000 ms default: before it the value comes back', () => {
        bindings.current = { items: ITEMS };
        let calls = 0;
        vi.spyOn(Date, 'now').mockImplementation(() => (calls++ === 0 ? 0 : 2000));
        const out = evaluateJjelInJodie('items.size');
        expect(out).toMatchObject({ ok: true, text: '40' });
        expect(out.timedOut).toBeUndefined();
    });

    it('keeps parse and runtime errors as errors, without timedOut', () => {
        const parse = evaluateJjelInJodie('1 +');
        expect(parse.ok).toBe(false);
        expect(parse.timedOut).toBeUndefined();
        expect(parse.text).not.toMatch(/^JjEL/);
        const value = evaluateJjelInJodie('1 + 2');
        expect(value).toMatchObject({ ok: true, text: '3', warnings: [] });
    });

    it('marks the CodeEntry of a timed-out submit, and only that one', async () => {
        bindings.current = { items: ITEMS };
        const ctx = { makeId: () => 'id1', codeFlavor: 'jjel' } as any;
        let calls = 0;
        const spy = vi.spyOn(Date, 'now').mockImplementation(() => (calls++ === 0 ? 0 : 5000));
        const timed = (await jjelProvider.run('items.size', ctx)).entries[0] as any;
        spy.mockRestore();
        expect(timed.output).toEqual({ ok: false, error: 'timed out after 2 s' });
        expect(timed.timedOut).toBe(true);
        const failed = (await jjelProvider.run('1 +', ctx)).entries[0] as any;
        expect(failed.output.ok).toBe(false);
        expect(failed.timedOut).toBeUndefined();
    });
});
