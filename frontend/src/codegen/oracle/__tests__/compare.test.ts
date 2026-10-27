/**
 * compareTraces — the per-step comparison of the oracle (slice S6, P-2026-10-10-2029; R-GEN-11).
 *
 * Hand-built traces: identical ones pass; a trace that differs in `kind` at step k, or in one attribute at step k,
 * reports exactly step k, the transition fired there, and, when a map is given, the fragment whose origin is that
 * transition. Each test name says which break kills it; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { fragment } from '../../engine/text';
import type { Origin, TextMapEntry } from '../../engine/text';
import { compareTraces } from '../oracle';
import type { TraceStep } from '../oracle';

const obs = (marking: Record<string, number>, coins: number) => ({ marking, attrs: { M: { coins } }, derived: {} });

/** initial, then four steps: t1 fired, a discard, t2 fired, t3 fired. */
function trace(): TraceStep[] {
    return [
        { kind: 'initial', observed: obs({ a: 1 }, 0) },
        { kind: 'fired', observed: obs({ b: 1 }, 1), transition: 't1' },
        { kind: 'discard', observed: obs({ b: 1 }, 1), transition: null },
        { kind: 'fired', observed: obs({ a: 1 }, 2), transition: 't2' },
        { kind: 'fired', observed: obs({ c: 1 }, 2), transition: 't3' },
    ];
}

/** A copy whose steps a test may change. */
const clone = (t: TraceStep[]): Array<{ -readonly [K in keyof TraceStep]: TraceStep[K] }> => JSON.parse(JSON.stringify(t));

function entry(line: number, start: number, end: number, origin: Origin): TextMapEntry {
    return { line, start, end, fragment: fragment('x', origin), origin };
}

const MAP: TextMapEntry[] = [
    entry(1, 0, 4, { kind: 'literal', template: 'main', offset: 0, line: 1, column: 1 }),
    entry(3, 2, 4, { kind: 'model', elementId: 't1', feature: null, featureName: 'id', transformation: { name: 'identity' } }),
    entry(7, 2, 4, { kind: 'model', elementId: 't3', feature: null, featureName: 'id', transformation: { name: 'identity' } }),
    entry(7, 8, 10, { kind: 'model', elementId: 't3', feature: null, featureName: 'name', transformation: { name: 'identity' } }),
];

describe('compareTraces', () => {
    it('passes identical traces', () => {
        expect(compareTraces(trace(), clone(trace()))).toEqual({ ok: true });
    });

    it('ignores the key order of an observation, not its values', () => {
        const gen = clone(trace());
        gen[2].observed = { derived: {}, attrs: { M: { coins: 1 } }, marking: { b: 1 } };
        expect(compareTraces(trace(), gen)).toEqual({ ok: true });
    });

    it('a kind that differs at step 2 reports step 2, the kinds, and no transition for a discard (mutant: comparison ignores kind)', () => {
        const gen = clone(trace());
        gen[2].kind = 'fired';
        expect(compareTraces(trace(), gen)).toEqual({ ok: false, step: 2, kind: 'kind', expected: 'discard', actual: 'fired' });
    });

    it('one attribute that differs at step 3 reports exactly step 3, its path and transition (mutant: first divergence one step late)', () => {
        const gen = clone(trace());
        gen[3].observed = obs({ a: 1 }, 7);
        gen[4].observed = obs({ c: 1 }, 7);
        expect(compareTraces(trace(), gen)).toEqual({
            ok: false, step: 3, kind: 'observe', path: 'attrs.M.coins', expected: 2, actual: 7, transitionId: 't2',
        });
    });

    it('a marking that differs at step 4 names the transition and, with the map, the first fragment whose origin is it', () => {
        const gen = clone(trace());
        gen[4].observed = obs({ a: 1 }, 2);
        expect(compareTraces(trace(), gen, MAP)).toEqual({
            ok: false, step: 4, kind: 'observe', path: 'marking.a', expected: null, actual: 1, transitionId: 't3',
            origin: { line: 7, start: 2, end: 4, origin: MAP[2].origin },
        });
    });

    it('a divergence at the initial state is step 0', () => {
        const gen = clone(trace());
        gen[0].observed = obs({ a: 2 }, 0);
        expect(compareTraces(trace(), gen)).toMatchObject({ ok: false, step: 0, kind: 'observe', path: 'marking.a', expected: 1, actual: 2 });
    });

    it('a program that threw at step 2 reports an error at step 2', () => {
        const gen = clone(trace()).slice(0, 2);
        gen.push({ kind: 'error', message: 'boom' });
        expect(compareTraces(trace(), gen)).toEqual({ ok: false, step: 2, kind: 'error', expected: 'discard', actual: 'boom' });
    });

    it('a trace that stops early reports the first missing step', () => {
        const gen = clone(trace()).slice(0, 3);
        expect(compareTraces(trace(), gen)).toEqual({ ok: false, step: 3, kind: 'length', expected: 'fired', actual: null, transitionId: 't2' });
    });
});
