import { describe, it, expect } from 'vitest';
import {
    reduceReLayout,
    countReferenceEdges,
    INITIAL_RELAYOUT_STATE,
    type ReLayoutState,
    type ReLayoutEvent,
    type ReLayoutEffect,
} from '../reLayoutWatcher';

/** Drive a sequence of events from the initial state, collecting the emitted effects. */
function run(events: ReLayoutEvent[]): { state: ReLayoutState; effects: ReLayoutEffect[] } {
    let state = INITIAL_RELAYOUT_STATE;
    const effects: ReLayoutEffect[] = [];
    for (const ev of events) {
        const r = reduceReLayout(state, ev);
        state = r.state;
        effects.push(r.effect);
    }
    return { state, effects };
}

describe('countReferenceEdges', () => {
    it('counts only reference-family edge types', () => {
        expect(countReferenceEdges([
            { type: 'reference' }, { type: 'instanceRef' }, { type: 'composition' },
            { type: 'inheritance' }, { type: undefined }, {},
        ])).toBe(3);
    });
});

describe('reduceReLayout — re-run watcher state machine (S4b Step A)', () => {
    it('happy path: arm → edges arrive → debounce fires → exactly one re-run', () => {
        const { state, effects } = run([
            { type: 'ARM', refEdgeCount: 0 },
            { type: 'EDGES', refEdgeCount: 2 },   // M1 edges arrive
            { type: 'EDGES', refEdgeCount: 4 },   // more of the bundle
            { type: 'DEBOUNCE_FIRE' },
        ]);
        expect(effects).toEqual(['arm_window', 'start_debounce', 'start_debounce', 'rerun']);
        expect(state.phase).toBe('done');
    });

    it('re-runs at most once: events after the re-run are no-ops (no re-arm)', () => {
        const { state, effects } = run([
            { type: 'ARM', refEdgeCount: 0 },
            { type: 'EDGES', refEdgeCount: 3 },
            { type: 'DEBOUNCE_FIRE' },            // → rerun, done
            { type: 'EDGES', refEdgeCount: 9 },   // ignored
            { type: 'DEBOUNCE_FIRE' },            // ignored
            { type: 'ARM', refEdgeCount: 0 },     // cannot re-arm
        ]);
        expect(effects).toEqual(['arm_window', 'start_debounce', 'rerun', 'none', 'none', 'none']);
        expect(state.phase).toBe('done');
    });

    it('a drag during the window disarms without re-running', () => {
        const { state, effects } = run([
            { type: 'ARM', refEdgeCount: 1 },
            { type: 'EDGES', refEdgeCount: 3 },   // pending
            { type: 'DRAG' },                     // user interaction → disarm
            { type: 'DEBOUNCE_FIRE' },            // stale timer, ignored
        ]);
        expect(effects).toEqual(['arm_window', 'start_debounce', 'cleanup', 'none']);
        expect(state.phase).toBe('done');
    });

    it('the window timeout disarms without re-running when no edges arrive', () => {
        const { state, effects } = run([
            { type: 'ARM', refEdgeCount: 2 },
            { type: 'EDGES', refEdgeCount: 2 },   // no increase → still armed
            { type: 'WINDOW_TIMEOUT' },
        ]);
        expect(effects).toEqual(['arm_window', 'none', 'cleanup']);
        expect(state.phase).toBe('done');
    });

    it('never arms without an ARM (idle ignores EDGES) — saved projects do not re-layout', () => {
        const { state, effects } = run([
            { type: 'EDGES', refEdgeCount: 5 },
            { type: 'EDGES', refEdgeCount: 8 },
            { type: 'DEBOUNCE_FIRE' },
        ]);
        expect(effects).toEqual(['none', 'none', 'none']);
        expect(state.phase).toBe('idle');
    });

    it('edges that do not exceed the baseline keep it armed (no premature debounce)', () => {
        const { state, effects } = run([
            { type: 'ARM', refEdgeCount: 4 },
            { type: 'EDGES', refEdgeCount: 4 },   // equal, not >
            { type: 'EDGES', refEdgeCount: 3 },   // fewer (a removal)
        ]);
        expect(effects).toEqual(['arm_window', 'none', 'none']);
        expect(state.phase).toBe('armed');
    });
});
