/**
 * JjScript M1 reference writes — what a `set` on a reference slot writes (#168 C1)
 *
 *   set s.lead = p        single-valued (upper bound 1): p REPLACES what the slot held
 *   set s.people = p      multi-valued: p is appended, one `set` per target (duplicates kept)
 *   set s.people = null   the slot is emptied
 *   set s.people += p     p is appended while the slot has room, never replacing (#175)
 *   set s.people -= p     p is taken out by value; refused when the slot does not hold it (#175)
 *
 * A plan has two parts because the proxy write cannot shrink a slot. `refProxy.values = [...]`
 * shortens it with a `'-='` that carries no value, and the reducer drops that change, so a slot
 * keeps what it held (`model/CLAUDE.md` §9.3). Anything that has to leave the slot is therefore
 * listed in `remove`, and the caller takes it out by value. `write`, when present, goes through
 * the proxy, so a containment target is still moved into the slot by the core.
 *
 * A single-valued slot that holds its target more than once keeps the copies: removing the
 * target by value would take index 0 too, and the core then skips rewriting it as an identical
 * assignment.
 *
 * Pure on purpose: `commands/instance.ts` reads the slot and applies the plan, but it reaches
 * monaco through `joiner` and does not load under the bench's `environment: 'node'`. Measures
 * behind the design: `docs/discovery/discovery_2026-10-02_168_c1_executor_prompt.md` §3.5, §6.
 */

/** What a `set` on a reference takes out of the slot, and what it writes back. */
export interface ReferenceWritePlan {
    /** Ids to remove from the slot by value, each listed once. */
    remove: string[];
    /** The values to write through the proxy (`refProxy.values = write`), when there are any. */
    write?: string[];
}

/**
 * Whether a reference collects several targets. Same rule as the reading side
 * (`commands/eval.ts:661`), so the value JjEL shows as single is the one a `set` replaces.
 */
export function isManyValued(upperBound: unknown): boolean {
    return upperBound === -1 || upperBound === '*' || (typeof upperBound === 'number' && upperBound > 1);
}

/** The ids a slot holds, in order: holes (`null`, `undefined`, `''`) dropped, duplicates kept. */
export function linkedIds(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw.filter((v) => v != null && v !== '') as string[];
}

function distinct(ids: readonly string[]): string[] {
    return [...new Set(ids)];
}

/**
 * Link `targetId` into a slot that holds `current`.
 *
 * Multi-valued: append, as before. Single-valued: everything else leaves the slot, including
 * the extra values a slot overfilled by older appends still holds; the target is written only
 * when the slot does not already hold it.
 */
export function planLink(current: readonly string[], targetId: string, many: boolean): ReferenceWritePlan {
    if (many) return { remove: [], write: [...current, targetId] };
    const others = distinct(current).filter((id) => id !== targetId);
    if (current.includes(targetId)) return { remove: others };
    return { remove: others, write: [targetId] };
}

/** Empty a slot that holds `current` (`set x.ref = null`). */
export function planUnlink(current: readonly string[]): ReferenceWritePlan {
    return { remove: distinct(current) };
}

/**
 * What a `+=` does to a slot (#175): the target appended while the slot has room, as `=` appends
 * on a multi-valued reference. A single-valued slot that already holds the target is left as it
 * is (`held`); one that holds another element is `full`, and so is a bounded multi-valued slot
 * at its bound. `+=` never replaces: that is `=`.
 */
export type AddPlan = { write: string[] } | { held: true } | { full: number };

/** How many values a slot may hold: unbounded, its bound, or 1 for a single-valued reference. */
function capacityOf(upperBound: unknown): number {
    if (upperBound === -1 || upperBound === '*') return Infinity;
    return isManyValued(upperBound) ? (upperBound as number) : 1;
}

export function planAdd(current: readonly string[], targetId: string, upperBound: unknown): AddPlan {
    const capacity = capacityOf(upperBound);
    if (capacity === 1 && current.includes(targetId)) return { held: true };
    if (current.length >= capacity) return { full: capacity };
    return { write: [...current, targetId] };
}

/**
 * What a `-=` takes out of a slot (#175): the target, by value, or nothing when the slot does
 * not hold it (`absent`). The by-value removal takes every copy a slot overfilled by older
 * appends still holds, which is what «remove y» means.
 */
export type RemovePlan = { remove: string[] } | { absent: true };

export function planRemove(current: readonly string[], targetId: string): RemovePlan {
    return current.includes(targetId) ? { remove: [targetId] } : { absent: true };
}
