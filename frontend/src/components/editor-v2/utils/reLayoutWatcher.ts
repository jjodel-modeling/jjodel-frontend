/**
 * Pure state machine for the "re-run auto-layout once M1 edges materialize" watcher.
 *
 * Why it exists: in the transformation → open flow, a freshly-created graph runs its
 * first ELK auto-layout ~50ms after mount, BEFORE the asynchronously-materialized M1
 * reference edges (father/mother, created by useJjomSync Step 4 with a deferred commit)
 * have reached the React Flow edge state. So ELK lays out an edge-less graph and Step B's
 * side recalc has no M1 edges to re-side — the grid layout and grid-frozen sides persist.
 * See docs/discovery/2026-07-07-s4b-recalc-bypass.md (H2 confirmed).
 *
 * This watcher arms after that first layout (justCreated path only), waits for the M1
 * reference edges to appear in RF state, debounces to collect the whole incremental-sync
 * bundle, then re-runs the SAME handleAutoLayout exactly once. A manual drag or the window
 * timeout disarms it without re-running. It is a pure reducer so the arm/debounce/disarm
 * transitions can be unit-tested without React/React Flow (which crash in the node test env).
 *
 * The host (EditorV2) owns the timers and performs the emitted effect.
 */

/** Edge types that count as reference edges materializing after layout. */
const REFERENCE_EDGE_TYPES = new Set(['reference', 'instanceRef', 'composition']);

/** Count reference-family edges (the ones that arrive asynchronously post-layout). */
export function countReferenceEdges(edges: ReadonlyArray<{ type?: string }>): number {
    let n = 0;
    for (const e of edges) {
        if (e.type && REFERENCE_EDGE_TYPES.has(e.type)) n++;
    }
    return n;
}

export type ReLayoutPhase = 'idle' | 'armed' | 'pending' | 'done';

export interface ReLayoutState {
    phase: ReLayoutPhase;
    /** Reference-edge count captured when the watcher was armed. */
    baseline: number;
}

export type ReLayoutEvent =
    | { type: 'ARM'; refEdgeCount: number }
    | { type: 'EDGES'; refEdgeCount: number }
    | { type: 'DEBOUNCE_FIRE' }
    | { type: 'WINDOW_TIMEOUT' }
    | { type: 'DRAG' };

/** Side effect the host must perform after a transition. */
export type ReLayoutEffect = 'none' | 'arm_window' | 'start_debounce' | 'rerun' | 'cleanup';

export const INITIAL_RELAYOUT_STATE: ReLayoutState = { phase: 'idle', baseline: 0 };

/**
 * Pure transition. Terminal 'done' is reached by exactly one of: a debounced re-run
 * (effect 'rerun'), a manual drag, or the window timeout (both 'cleanup'). Once done,
 * every event is a no-op — so at most ONE re-run happens per arming.
 */
export function reduceReLayout(
    state: ReLayoutState,
    event: ReLayoutEvent,
): { state: ReLayoutState; effect: ReLayoutEffect } {
    switch (state.phase) {
        case 'idle':
            // Arm only on an explicit ARM (fired only on the justCreated path).
            if (event.type === 'ARM') {
                return { state: { phase: 'armed', baseline: event.refEdgeCount }, effect: 'arm_window' };
            }
            return { state, effect: 'none' };

        case 'armed':
            if (event.type === 'EDGES') {
                // First arrival of new reference edges → start collecting the bundle.
                if (event.refEdgeCount > state.baseline) {
                    return { state: { ...state, phase: 'pending' }, effect: 'start_debounce' };
                }
                return { state, effect: 'none' };
            }
            if (event.type === 'DRAG' || event.type === 'WINDOW_TIMEOUT') {
                return { state: { phase: 'done', baseline: state.baseline }, effect: 'cleanup' };
            }
            return { state, effect: 'none' };

        case 'pending':
            if (event.type === 'EDGES') {
                // More edges still arriving — restart the debounce to catch the whole batch.
                return { state, effect: 'start_debounce' };
            }
            if (event.type === 'DEBOUNCE_FIRE') {
                return { state: { phase: 'done', baseline: state.baseline }, effect: 'rerun' };
            }
            if (event.type === 'DRAG' || event.type === 'WINDOW_TIMEOUT') {
                return { state: { phase: 'done', baseline: state.baseline }, effect: 'cleanup' };
            }
            return { state, effect: 'none' };

        case 'done':
        default:
            return { state, effect: 'none' };
    }
}
