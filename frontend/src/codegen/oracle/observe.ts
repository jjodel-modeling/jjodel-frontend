/**
 * observe — the canonical projection of a configuration, the one the oracle compares (slice S6, P-2026-10-10-2029;
 * R-GEN-11, spec §8, discovery §G.2).
 *
 * `observeSim(σ)` is the simulator's side of what a generated program's `observe(state)` returns: the marking
 * without its zero entries, the semantic attributes and the derived semantic values, every record with its keys in
 * sorted order (`Array.prototype.sort`, code units, as the generated program sorts them). Presentation, stored or
 * derived, is left out: it is the viewpoint's, not the semantics' (`node.[x]`, R-SIM-18), and the generated state
 * does not hold it.
 *
 * Pure: types only.
 */

import type { SimState, SimValue } from '../../model/simulation/netTypes';

export type ObservedRecord = Record<string, Record<string, SimValue>>;

export interface Observation {
    readonly marking: Record<string, number>;
    readonly attrs: ObservedRecord;
    readonly derived: ObservedRecord;
}

/** A record with its keys in sorted order; `define` so that no key reaches a prototype. */
function sortedRecord<V>(entries: Iterable<readonly [string, V]>, keep: (v: V) => boolean = () => true): Record<string, V> {
    const out: Record<string, V> = {};
    for (const [k, v] of [...entries].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
        if (keep(v)) Object.defineProperty(out, k, { value: v, writable: true, enumerable: true, configurable: true });
    }
    return out;
}

function nested(space: ReadonlyMap<string, ReadonlyMap<string, SimValue>> | undefined): ObservedRecord {
    if (!space) return {};
    return sortedRecord([...space].map(([id, values]) => [id, sortedRecord(values)] as const));
}

/** The projection of σ the oracle compares with a generated program's `observe(state)`. */
export function observeSim(state: SimState): Observation {
    return {
        marking: sortedRecord(state.marking, n => n !== 0),
        attrs: nested(state.attrs),
        derived: nested(state.derived?.attrs),
    };
}
