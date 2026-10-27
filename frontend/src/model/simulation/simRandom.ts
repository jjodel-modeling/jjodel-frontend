/**
 * simRandom — the random resolution of nondeterminism (R-SIM-100, P-2026-09-29-1840).
 *
 * The core never chooses: `step()` takes the selector (R-SIM-7). A random
 * choice is a selector drawn here, outside the core, and passed to `step()` as
 * a click would pass it, so it goes through the same admissibility gate.
 *
 * The generator is mulberry32 (public domain), 32-bit, in pure form: its state
 * advances by a Weyl increment, so draw `i` of seed `s` is a function of
 * `(s, i)` alone and a run keeps two numbers, its seed and its draw count, not
 * a closure. The seed is drawn by the caller (the bridge, once per run at
 * Reset); nothing here reads a clock or `Math.random`, so a stub or a seed
 * makes every draw reproducible.
 */

import type { Candidate } from './netTypes';

/** A source of uniform draws in [0, 1), injected by the caller. */
export type SimRng = () => number;

/** mulberry32's increment: the state after draw `i` is `seed + (i + 1) · WEYL`, mod 2^32. */
const WEYL = 0x6D2B79F5;

/** Draw `i` (from 0) of `seed`: the `i`-th output of mulberry32 seeded with `seed`. */
export function uniform(seed: number, i: number): number {
    // Math.imul keeps the low 32 bits exactly, where (i + 1) · WEYL would lose them past 2^53.
    let t = (seed + Math.imul(i + 1, WEYL)) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** The stream of `seed` from draw `from` on: a run resumes it at its draw count. */
export function seededRng(seed: number, from = 0): SimRng {
    let i = from;
    return () => uniform(seed, i++);
}

/**
 * One of `candidates`, uniformly: `candidates[floor(u · n)]` for one draw `u`.
 * None is `null` and one is returned as it is, neither consuming a draw: only a
 * choice among two or more is random.
 */
export function drawTransition(candidates: readonly Candidate[], rng: SimRng): Candidate | null {
    const n = candidates.length;
    if (n === 0) return null;
    if (n === 1) return candidates[0];
    return candidates[Math.floor(rng() * n)];
}
