/**
 * Pure name lookups, in a module the test bench can import.
 *
 * Both functions here used to live inside files that `vitest` cannot load under
 * `environment: 'node'`: `LModelElement.tsx` and `joiner/classes.ts` both reach monaco
 * through the `joiner` barrel and die with `window is not defined` (measured 2026-09-12
 * and again 2026-09-13, with `jjscript/executor/resolvers` importing cleanly as the
 * positive control). Their tests could therefore only assert on the SOURCE TEXT, which
 * pins the shape of the code and not what it does — and a mutation bench showed exactly
 * what that misses: a tie-break silently inverted, a guard silently dropped, a lookup that
 * mutates its input, all invisible to a regex over the body.
 *
 * So the logic moved here and the two callers delegate. Signatures, behaviour and
 * tie-breaks are unchanged; the only difference is that the bench can now execute them.
 *
 * The module imports nothing on purpose. Adding an import from `joiner` — even a type —
 * would be enough to pull the barrel back in and undo this.
 */

/**
 * A named array as the L-getters build it: the elements, plus a `"$" + name` key per
 * element. `U.toNamedArray` (`common/U.tsx`), `LPackage.get_classes` and
 * `LPackage.get_enumerators` are the three producers, and all three write that key.
 */
export type NamedArray<T> = T[] & { [key: string]: T };

/**
 * The entry `name` refers to: the exact-case key first, then a case-insensitive pass.
 *
 * READ-ONLY. The previous implementation built a lowercase alias for every key back INTO
 * the collection and then read one of them, so a single lookup of `PERSON` rebound
 * `$person` to `Person` for every later lookup on that array. Closed in A2; the behaviour
 * tests next to this module are what keep it closed.
 *
 * Tie-break on a case-insensitive collision: the LAST matching key wins. That is not a
 * choice made here — the alias pass it replaced overwrote earlier keys with later ones, so
 * last-wins is what the codebase has always done, and A2 deliberately did not change it.
 * Which of two case-variant homonyms should answer is a separate question, tracked with the
 * other "report ambiguity" sites.
 *
 * A falsy entry is treated as absent, as the previous `|| null` did.
 */
export function lookupNamedEntry<T>(
    collection: NamedArray<T> | { [key: string]: T },
    name: string,
    caseSensitive: boolean = false
): T | null {
    if (!collection || typeof name !== 'string') return null;
    const key: string = '$' + name.trim();
    const exact = (collection as { [k: string]: T })[key];
    if (exact) return exact;
    if (caseSensitive) return null;

    const lowered: string = key.toLowerCase();
    let found: T | null = null;
    for (const k of Object.keys(collection)) {
        if ((k + '').toLowerCase() !== lowered) continue;
        const hit = (collection as { [k: string]: T })[k];
        if (hit) found = hit;
    }
    return found;
}

/**
 * `requested` if no other model holds it, otherwise the first free `requested (n)`.
 *
 * The scheme is the one `generateUniqueModelName` already applies to the target model of a
 * transformation (`components/project/ProjectEditor.tsx`). `defaultname` keeps the other
 * house style, a bare trailing counter (`model_0`), because it names an element nobody
 * asked to name while this one preserves a name the caller chose.
 *
 * Exact-case, like `checkM2NameUniqueness` (`model/logicWrapper/nameUniqueness.ts`):
 * `A` and `a` are different names and both are legal.
 *
 * The suffix continues from the HIGHEST existing `(n)`, not from the count, so removing
 * `A (1)` does not make the next create collide with `A (2)`.
 */
export function uniqueModelName(requested: string, taken: string[]): string {
    if (!requested) return requested;
    if (!Array.isArray(taken) || !taken.includes(requested)) return requested;
    const escaped: string = requested.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern: RegExp = new RegExp('^' + escaped + ' \\((\\d+)\\)$');
    let max: number = 0;
    for (const name of taken) {
        const m = typeof name === 'string' ? name.match(pattern) : null;
        if (!m) continue;
        const n: number = parseInt(m[1], 10);
        if (n > max) max = n;
    }
    return requested + ' (' + (max + 1) + ')';
}
