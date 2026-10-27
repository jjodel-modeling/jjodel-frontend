/**
 * barOrientation — the automatic orientation of a bar (P-2026-10-03-1304, Q3, docs/lir/lir_2026-10-03_bar_orientation.md;
 * design in docs/discovery/discovery_2026-10-03_derived_notations_edges.md §10).
 *
 * A bar that declares a thickness (`ShapeSpec.barThickness`) has a square box and paints its ink upright or lying inside
 * it, so its long sides face its neighbours. The decision reads only the centres of the connected neighbours: a turn
 * moves no centre, so a bar never moves its own input and nothing can oscillate; the hysteresis takes a neighbour
 * hovering at the diagonal. The memo holds the previous orientation per vertex for the session (nothing is persisted)
 * and is dropped on a viewpoint change.
 *
 * Pure module (no joiner, no react).
 */

export type BarOrientation = 'upright' | 'lying';

/** An upright bar turns lying only when the along axis exceeds the across one by 20 percent, and the other way round. */
export const BAR_HYSTERESIS = 1.2;

/**
 * The orientation of a bar centred at `centre` whose connected neighbours are centred at `neighbours`: the sum of the
 * unit vectors to them by absolute component, sx across and sy along; across wants it upright (its long sides left and
 * right), along lying. With a `previous` orientation the other one wins only past `h`; with none, the larger sum wins,
 * a tie upright. No neighbour: the previous one, upright when there is none.
 */
export function barOrientation(centre: { x: number; y: number }, neighbours: ReadonlyArray<{ x: number; y: number }>, previous: BarOrientation | undefined, h = BAR_HYSTERESIS): BarOrientation {
    if (neighbours.length === 0) return previous ?? 'upright';
    let sx = 0, sy = 0;
    for (const n of neighbours) {
        const dx = n.x - centre.x, dy = n.y - centre.y;
        const len = Math.hypot(dx, dy) || 1;
        sx += Math.abs(dx) / len;
        sy += Math.abs(dy) / len;
    }
    if (previous === 'upright') return sy > h * sx ? 'lying' : 'upright';
    if (previous === 'lying') return sx > h * sy ? 'upright' : 'lying';
    return sx >= sy ? 'upright' : 'lying';
}

// ── The session memo ──────────────────────────────────────────────────────────────────────────────────

const memo = new Map<string, BarOrientation>();
let memoKey: string | null = null;

/** Drops every remembered orientation when `key` (the viewpoint's IR signature) changes; keeps them otherwise. */
export function resetBarOrientations(key: string | null): void {
    if (key === memoKey) return;
    memo.clear();
    memoKey = key;
}

export function rememberedBarOrientation(vertexId: string): BarOrientation | undefined {
    return memo.get(vertexId);
}

export function rememberBarOrientation(vertexId: string, orientation: BarOrientation): void {
    memo.set(vertexId, orientation);
}
