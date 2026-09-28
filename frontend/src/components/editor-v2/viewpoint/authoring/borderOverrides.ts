/**
 * borderOverrides — the OVERRIDES grouping of the Border section (D1, slice 2).
 *
 * Written inside `VertexAuthoringPanel.tsx`, moved here in slice 4b for one measured
 * reason: that panel imports the `joiner` barrel, which pulls Monaco and dereferences
 * `window` at import time, so nothing defined in it can be reached from the node test
 * bench (`ReferenceError: window is not defined`, measured 2026-09-16). Slice 4b makes
 * this function load-bearing for something on screen — the count badge of the Border
 * entry in the section nav — and a badge that can drift needs a test, which needs a
 * module the bench can import. Same move, and same reason, as
 * `frontend/src/model/nameLookup.ts` (CLAUDE.md §5).
 *
 * The badge and the table read the SAME rows: two derivations of one number drift, and
 * this one is visible.
 *
 * Pure module: types plus `conditional.ts`, itself pure. No React, no Redux.
 */

import type { VertexViewIR } from '../ir/irTypes';
import { toRules, formatPredicate } from '../../../ui/ConditionalEditor/conditional';

/** The three border axes, in the order the OVERRIDES table lists them. */
export const BORDER_AXES = ['color', 'width', 'style'] as const;
export type BorderAxis = typeof BORDER_AXES[number];

export interface BorderOverrideRow {
    /** Pretty-printed predicate — the WHEN cell. */
    whenText: string;
    /** The axes carrying a rule with this predicate — the OVERRIDES cell. */
    axes: BorderAxis[];
}

/**
 * The OVERRIDES table of the Border section (D1, slice 2).
 *
 * A row is a PREDICATE plus the subset of axes that override under it, because that is
 * exactly how it is written: one rule in each of those axes. It is NOT a complete
 * BorderSpec with a filter above it. Rules are grouped by structural equality of `when`
 * — the predicate is plain data, so its JSON is the identity — in first-seen order
 * across color, width, style.
 *
 * `divergent` is true when the axes that carry rules do not carry the SAME predicates.
 * There the grouping cannot honestly present one row per condition, so every axis keeps
 * its own row and the panel says why, instead of implying an alignment that is not in
 * the IR.
 */
export function borderOverrideRows(
    border: VertexViewIR['shape']['border'],
): { rows: BorderOverrideRow[]; divergent: boolean } {
    const rows: BorderOverrideRow[] = [];
    const byPredicate = new Map<string, BorderOverrideRow>();
    const keysPerAxis: Set<string>[] = [];
    for (const axis of BORDER_AXES) {
        const rules = toRules(border?.[axis] as any).rules ?? [];
        if (!rules.length) continue;
        const keys = new Set<string>();
        for (const r of rules) {
            const key = JSON.stringify(r.when ?? null);
            keys.add(key);
            const existing = byPredicate.get(key);
            if (existing) {
                if (!existing.axes.includes(axis)) existing.axes.push(axis);
                continue;
            }
            const row: BorderOverrideRow = { whenText: formatPredicate(r.when), axes: [axis] };
            byPredicate.set(key, row);
            rows.push(row);
        }
        keysPerAxis.push(keys);
    }
    const first = keysPerAxis[0];
    const divergent = keysPerAxis.length > 1 && keysPerAxis.some((s, i) => i > 0
        && (s.size !== first.size || [...s].some((k) => !first.has(k))));
    return { rows, divergent };
}
