/**
 * simRandom — the seeded draw of a transition among candidates (R-SIM-100, P-2026-09-29-1840).
 *
 * Executes the module (P11): the pick through stub RNGs, the stream of a seed
 * against the closure form of mulberry32 and against fixed vectors, the
 * uniformity of the seeded picks with a χ² bound. Every bound is deterministic:
 * the draws come from fixed seeds, never from `Math.random`. Each test name says
 * which break of the rule kills it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { drawTransition, seededRng, uniform } from '../simRandom';
import type { SimRng } from '../simRandom';
import type { Candidate } from '../netTypes';

const cands = (...ids: string[]): Candidate[] => ids.map(transition => ({ transition, unsafe: null }));

/** The closure form of mulberry32 (public domain), as published: the reference the pure form must equal. */
function mulberry32(a: number): () => number {
    return () => {
        let t = (a += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** A stub that returns its values in order and counts its calls. */
function stub(...values: number[]): SimRng & { calls: number } {
    const f = (() => values[f.calls++]) as SimRng & { calls: number };
    f.calls = 0;
    return f;
}

describe('drawTransition: the pick is floor(u · n) (R-SIM-100)', () => {
    it('stub 0 picks the first, 0.9999999 the last, 0.5 of three the second (mutants: round, n − 1, n + 1)', () => {
        expect(drawTransition(cands('a', 'b', 'c'), stub(0))?.transition).toBe('a');
        expect(drawTransition(cands('a', 'b', 'c'), stub(0.9999999))?.transition).toBe('c');
        expect(drawTransition(cands('a', 'b', 'c'), stub(0.5))?.transition).toBe('b');
        expect(drawTransition(cands('a', 'b'), stub(0.9999999))?.transition).toBe('b');
    });

    it('a stub cycling i/n hits each index exactly once, for n = 2..7 (mutants: a biased or shifted pick)', () => {
        for (let n = 2; n <= 7; n++) {
            const ids = Array.from({ length: n }, (_, i) => `t${i}`);
            const rng = stub(...ids.map((_, i) => i / n));
            const picked = ids.map(() => drawTransition(cands(...ids), rng)?.transition);
            expect(picked).toEqual(ids);
        }
    });

    it('one candidate is returned without a draw, none is null without a draw (mutant: a draw consumed on a forced step)', () => {
        const one = stub(0.7);
        expect(drawTransition(cands('only'), one)?.transition).toBe('only');
        expect(one.calls).toBe(0);
        const none = stub(0.7);
        expect(drawTransition([], none)).toBeNull();
        expect(none.calls).toBe(0);
        // control: two candidates consume exactly one draw
        const two = stub(0.7);
        drawTransition(cands('a', 'b'), two);
        expect(two.calls).toBe(1);
    });

    it('the candidate returned is the list\'s own object, its unsafe mark kept', () => {
        const list: Candidate[] = [{ transition: 'a', unsafe: null }, { transition: 'b', unsafe: { place: 'p', value: 2 } }];
        expect(drawTransition(list, stub(0.9))).toBe(list[1]);
    });
});

describe('uniform and seededRng: mulberry32 in pure form, draw i of seed s', () => {
    it('equals the closure mulberry32 over 10000 draws, for five seeds (mutants: the Weyl step, the index offset)', () => {
        for (const seed of [0, 1, 2026, 3141592653, 0xFFFFFFFF]) {
            const ref = mulberry32(seed);
            for (let i = 0; i < 10000; i++) expect(uniform(seed, i)).toBe(ref());
        }
    });

    it('fixed vectors: the first three draws of seeds 0, 2026 and 3141592653, times 2^32', () => {
        const first3 = (seed: number) => [0, 1, 2].map(i => uniform(seed, i) * 4294967296);
        expect(first3(0)).toEqual([1144304738, 1416247, 958946056]);
        expect(first3(2026)).toEqual([1955961175, 1324980858, 2839649622]);
        expect(first3(3141592653)).toEqual([1137384950, 2998584816, 2130970062]);
    });

    it('draw i is the first draw of the closure seeded at s + i · 0x6D2B79F5 mod 2^32, i up to 2^40 (mutant: the state not wrapped at 32 bits)', () => {
        const at = (seed: number, i: number) => mulberry32(Number((BigInt(seed) + BigInt(i) * 0x6D2B79F5n) % 2n ** 32n))();
        for (const seed of [0, 2026, 0xFFFFFFFF]) {
            for (const i of [0, 1, 4096, 2 ** 24, 2 ** 31 + 3, 2 ** 32 + 5, 2 ** 40]) expect(uniform(seed, i)).toBe(at(seed, i));
        }
    });

    it('every draw is in [0, 1)', () => {
        for (let i = 0; i < 10000; i++) {
            const u = uniform(99, i);
            expect(u).toBeGreaterThanOrEqual(0);
            expect(u).toBeLessThan(1);
        }
    });

    it('same seed, same stream; seed + 1, another stream; `from` resumes the stream at that draw', () => {
        const take = (rng: SimRng, k: number) => Array.from({ length: k }, () => rng());
        expect(take(seededRng(2026), 50)).toEqual(take(seededRng(2026), 50));
        const a = take(seededRng(2026), 50);
        const b = take(seededRng(2027), 50);
        expect(a.filter((u, i) => u === b[i])).toEqual([]);
        expect(take(seededRng(2026, 7), 10)).toEqual(a.slice(7, 17));
    });
});

describe('the seeded picks are uniform: χ² over 120000 draws per n', () => {
    /** χ² at p = 0.001 for df = n − 1 = 1, 2, 4. */
    const BOUND: Record<number, number> = { 2: 10.83, 3: 13.82, 5: 18.47 };
    for (const n of [2, 3, 5]) {
        it(`n = ${n}: χ² below ${BOUND[n]} (mutant: a pick that never reaches the last index)`, () => {
            const ids = Array.from({ length: n }, (_, i) => `t${i}`);
            const list = cands(...ids);
            const counts = new Map<string, number>(ids.map(id => [id, 0]));
            const rng = seededRng(3141592653);
            const N = 120000;
            for (let k = 0; k < N; k++) {
                const t = drawTransition(list, rng)!.transition;
                counts.set(t, counts.get(t)! + 1);
            }
            const expected = N / n;
            let chi2 = 0;
            for (const c of counts.values()) chi2 += (c - expected) ** 2 / expected;
            expect(chi2).toBeLessThan(BOUND[n]);
            // control: every index was drawn
            expect([...counts.values()].every(c => c > 0)).toBe(true);
        });
    }
});
