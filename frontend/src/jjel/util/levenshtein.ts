/**
 * Levenshtein distance utility for JjEL diagnostics.
 *
 * Used by the evaluator to suggest the closest identifier name when the user
 * references an undefined symbol. Strict case-sensitive: JjEL distinguishes
 * `Class` (PascalCase metamodel class) from `classes` (lowercase Level 1
 * collection), and a case-insensitive match would conflate them.
 *
 * Note (2026-04-26): five other Levenshtein implementations exist in the
 * codebase (common/U.tsx, jjel/evaluator/evaluator.ts private, three under
 * jjscript/). Future cleanup: consolidate into common/util/levenshtein.ts
 * and migrate consumers. Out of scope here.
 */

/** Classic two-row dynamic-programming Levenshtein distance. */
export function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    let prev = new Array(b.length + 1).fill(0).map((_, i) => i);
    let curr = new Array(b.length + 1).fill(0);

    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + cost,
            );
        }
        [prev, curr] = [curr, prev];
    }
    return prev[b.length];
}

/**
 * Return the candidate with smallest Levenshtein distance to `target`,
 * subject to an adaptive threshold proportional to `target.length`:
 * 3-5 chars → max 1 edit, 6-8 → max 2, 9+ → up to `maxDistance` (default 3).
 * Returns `null` when `target.length < 3` (too short to discriminate without
 * spurious matches) or when no candidate is within range.
 *
 * Iteration order is preserved for ties (first match wins) — callers should
 * pass candidates in priority order if it matters.
 */
export function closestName(
    target: string,
    candidates: string[],
    maxDistance?: number,
): string | null {
    if (target.length < 3) return null;

    const adaptiveMax = Math.min(
        maxDistance ?? 3,
        Math.max(1, Math.floor(target.length / 3)),
    );

    let best: string | null = null;
    let bestDist = adaptiveMax + 1;
    for (const c of candidates) {
        const d = levenshtein(target, c);
        if (d < bestDist) {
            best = c;
            bestDist = d;
            if (bestDist === 0) break;
        }
    }
    return bestDist <= adaptiveMax ? best : null;
}
