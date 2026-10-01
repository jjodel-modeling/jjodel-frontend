/**
 * boundExploration — the most tokens a place can hold, read from the reachable
 * markings of a net (G12(b), R-SIM-81(1) as amended by Alfonso on 2026-09-27).
 *
 * A breadth-first search from the initial marking of a compiled net, over the
 * firing rule of the step with guards and triggers left out: a transition whose
 * preset is enabled and that no inhibitor blocks may fire, and a terminated
 * marking has no successor (R-SIM-27, `terminated` of netStep.ts). Leaving
 * guards and triggers out only adds behaviour, so when the search closes its
 * maximum bounds every run of the net, and a Bound set to it never halts a run
 * `unsafe` (R-SIM-23). The net's own bound is not read: the caller compiles with
 * it lifted, so that no initial marking is dropped as `initial-over-bound`.
 *
 * The search ends one of three ways:
 * - `closed`: every reachable marking was seen;
 * - `unbounded`: a new marking covers one on its own path with more tokens (the
 *   check of Karp and Miller). Without inhibitors and termination the path
 *   repeats forever and the net is unbounded, which R-SIM-26 excludes; with them
 *   it may not repeat, so the verdict reads «no bound found», not «unbounded»;
 * - `cap`: a new marking would pass `cap` markings seen.
 *
 * The cap is the report's 2000 (docs/discovery/discovery_2026-09-27_sim_post_models_engine.md
 * §4.2): the demo net closes on 9 markings in 0.3 ms, and the slowest shape
 * measured at the cap, a deep path whose total grows, takes about 40 ms, once
 * per change of the models (lane E2, P-2026-09-27-1611).
 *
 * Pure: no React, no store, no JjEL; reads only the compiled net. The firing
 * rule is `fireMarking` of netStep.ts, private there and repeated here without
 * its bound check (declared duplication: lane E2 does not edit the engine).
 */

import { terminated } from './netStep';
import type { CompiledNet, NetTransition, SimState } from './netTypes';

/** The markings the search may see, the initial one included (report §4.2). */
export const BOUND_EXPLORATION_CAP = 2000;

export interface BoundExploration {
    /** The most tokens on one place over the markings seen, the initial one included; 0 when none is marked. */
    readonly max: number;
    readonly end: 'closed' | 'unbounded' | 'cap';
    /** The markings seen, the initial one included. */
    readonly markings: number;
}

type Marking = ReadonlyMap<string, number>;

interface Seen {
    readonly marking: Marking;
    /** The tokens of the marking, summed: a covering marking with more of them is strictly larger. */
    readonly total: number;
    /** The index of the marking it was reached from, -1 for the initial one. */
    readonly parent: number;
}

const NO_ATTRS: SimState['attrs'] = new Map();

/** A marking as a key: its places with their tokens, sorted; zero entries are never stored. */
function keyOf(marking: Marking): string {
    return [...marking].map(([place, n]) => `${place}\u0000${n}`).sort().join('\u0001');
}

function totalOf(marking: Marking): number {
    let total = 0;
    for (const n of marking.values()) total += n;
    return total;
}

/** The step's enabling, guards and triggers aside: the preset holds its weights, no inhibitor reaches its own. */
function enabled(t: NetTransition, marking: Marking): boolean {
    return t.preset.every(a => (marking.get(a.place) ?? 0) >= a.weight)
        && !t.inhibitors.some(a => (marking.get(a.place) ?? 0) >= a.weight);
}

/** M' = M − pre + post, zero entries dropped: `fireMarking` of netStep.ts without the bound. */
function fire(marking: Marking, t: NetTransition): Map<string, number> {
    const next = new Map(marking);
    for (const a of t.preset) next.set(a.place, (next.get(a.place) ?? 0) - a.weight);
    for (const a of t.postset) next.set(a.place, (next.get(a.place) ?? 0) + a.weight);
    for (const [place, n] of [...next]) if (n === 0) next.delete(place);
    return next;
}

/** `marking` holds at least what `other` holds on every place. */
function covers(marking: Marking, other: Marking): boolean {
    for (const [place, n] of other) if ((marking.get(place) ?? 0) < n) return false;
    return true;
}

/**
 * The reachable markings of `net` from its initial one, guards and triggers
 * aside, inhibitors and termination kept, at most `cap` of them.
 */
export function exploreBound(net: CompiledNet, cap: number = BOUND_EXPLORATION_CAP): BoundExploration {
    const start = new Map([...net.initial.marking].filter(([, n]) => n !== 0));
    const seen: Seen[] = [{ marking: start, total: totalOf(start), parent: -1 }];
    const keys = new Set([keyOf(start)]);
    let max = 0;
    for (const n of start.values()) if (n > max) max = n;

    for (let i = 0; i < seen.length; i++) {
        const { marking } = seen[i];
        if (terminated(net, { marking, attrs: NO_ATTRS, presentation: NO_ATTRS })) continue;
        for (const t of net.transitions) {
            if (!enabled(t, marking)) continue;
            const next = fire(marking, t);
            const key = keyOf(next);
            if (keys.has(key)) continue;
            const total = totalOf(next);
            for (let a = i; a !== -1; a = seen[a].parent) {
                if (total > seen[a].total && covers(next, seen[a].marking)) return { max, end: 'unbounded', markings: seen.length };
            }
            if (seen.length >= cap) return { max, end: 'cap', markings: seen.length };
            seen.push({ marking: next, total, parent: i });
            keys.add(key);
            for (const n of next.values()) if (n > max) max = n;
        }
    }
    return { max, end: 'closed', markings: seen.length };
}
