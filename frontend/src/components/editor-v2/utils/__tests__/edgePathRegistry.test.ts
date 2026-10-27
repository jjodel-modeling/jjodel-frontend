import { describe, it, expect, afterEach } from 'vitest';
import {
    registerEdgePath,
    unregisterEdgePath,
    getEdgeCrossings,
    subscribeEdgePaths,
    getEdgePathsVersion,
} from '../edgeUtils';

// ---------------------------------------------------------------------------
// The path registry's version (P-2026-10-02-1450, T9): an edge computes its
// crossings at render, from paths other edges register in effects. The version
// tells it when to read them again. It moves once per burst (a task), only when
// the burst changed the registry: an edge whose effect unregisters and registers
// the same path again on every render must not move it, or the edges re-render
// each other without end ("Maximum update depth exceeded", measured on two demo
// scenes with a version that moved on each call).
// ---------------------------------------------------------------------------

const ids: string[] = [];
const reg = (id: string, points: { x: number; y: number }[], src = 'n1', tgt = 'n2', group?: string) => {
    if (!ids.includes(id)) ids.push(id);
    registerEdgePath(id, points, src, tgt, group);
};
/** Let the coalesced notification (scheduled with setTimeout 0) run. */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const H = [{ x: 0, y: 50 }, { x: 200, y: 50 }];
const V = [{ x: 100, y: 0 }, { x: 100, y: 100 }];

afterEach(async () => {
    // The registry is module state: leave it as found.
    for (const id of ids.splice(0)) unregisterEdgePath(id);
    await flush();
});

describe('edge path registry version', () => {
    it('R1 — registering a new path bumps the version and notifies once', async () => {
        let heard = 0;
        const off = subscribeEdgePaths(() => { heard++; });
        const v0 = getEdgePathsVersion();
        reg('r1', H);
        expect(getEdgePathsVersion()).toBe(v0); // not inside the burst
        await flush();
        expect(getEdgePathsVersion()).toBeGreaterThan(v0);
        expect(heard).toBe(1);
        off();
    });

    it('R2 — registering the same content again, as a new array, changes nothing', async () => {
        reg('r2', H);
        await flush();
        let heard = 0;
        const off = subscribeEdgePaths(() => { heard++; });
        const v0 = getEdgePathsVersion();
        reg('r2', H.map((p) => ({ ...p })));
        await flush();
        expect(getEdgePathsVersion()).toBe(v0);
        expect(heard).toBe(0);
        off();
    });

    it('R3 — a moved point bumps the version', async () => {
        reg('r3', H);
        await flush();
        const v0 = getEdgePathsVersion();
        reg('r3', [{ x: 0, y: 50 }, { x: 200, y: 58 }]);
        await flush();
        expect(getEdgePathsVersion()).toBeGreaterThan(v0);
    });

    it('R4 — one more point, same prefix, bumps the version', async () => {
        reg('r4', H);
        await flush();
        const v0 = getEdgePathsVersion();
        reg('r4', [...H, { x: 200, y: 90 }]);
        await flush();
        expect(getEdgePathsVersion()).toBeGreaterThan(v0);
    });

    it('R5 — same points, other endpoints or tree group: a change (crossings filter on them)', async () => {
        reg('r5', H, 'n1', 'n2');
        await flush();
        let v0 = getEdgePathsVersion();
        reg('r5', H, 'n1', 'n3');
        await flush();
        expect(getEdgePathsVersion()).toBeGreaterThan(v0);
        v0 = getEdgePathsVersion();
        reg('r5', H, 'n4', 'n3');
        await flush();
        expect(getEdgePathsVersion()).toBeGreaterThan(v0);
        v0 = getEdgePathsVersion();
        reg('r5', H, 'n4', 'n3', 'tree_n3');
        await flush();
        expect(getEdgePathsVersion()).toBeGreaterThan(v0);
    });

    it('R6 — unregistering a registered path bumps; an unknown id does not', async () => {
        reg('r6', H);
        await flush();
        const v0 = getEdgePathsVersion();
        unregisterEdgePath('r6-unknown');
        await flush();
        expect(getEdgePathsVersion()).toBe(v0);
        unregisterEdgePath('r6');
        await flush();
        expect(getEdgePathsVersion()).toBeGreaterThan(v0);
    });

    it('R7 — a burst of changes in one task is one notification', async () => {
        let heard = 0;
        const off = subscribeEdgePaths(() => { heard++; });
        reg('r7a', H);
        reg('r7b', V);
        reg('r7a', [{ x: 0, y: 60 }, { x: 200, y: 60 }]);
        unregisterEdgePath('r7b');
        expect(heard).toBe(0);
        await flush();
        expect(heard).toBe(1);
        reg('r7b', V);
        await flush();
        expect(heard).toBe(2);
        off();
    });

    it('R8 — an unsubscribed listener hears nothing more', async () => {
        let heard = 0;
        const off = subscribeEdgePaths(() => { heard++; });
        off();
        reg('r8', H);
        await flush();
        expect(heard).toBe(0);
    });

    it('R10 — unregister then register the same path in one burst (an effect re-run) is no change', async () => {
        reg('r10', H);
        await flush();
        let heard = 0;
        const off = subscribeEdgePaths(() => { heard++; });
        const v0 = getEdgePathsVersion();
        for (let i = 0; i < 5; i++) {
            unregisterEdgePath('r10');
            reg('r10', H.map((p) => ({ ...p })));
        }
        await flush();
        expect(getEdgePathsVersion()).toBe(v0);
        expect(heard).toBe(0);
        off();
    });

    it('R11 — unregister then register a different path in one burst is a change', async () => {
        reg('r11', H);
        await flush();
        const v0 = getEdgePathsVersion();
        unregisterEdgePath('r11');
        reg('r11', [{ x: 0, y: 70 }, { x: 200, y: 70 }]);
        await flush();
        expect(getEdgePathsVersion()).toBeGreaterThan(v0);
    });

    it('R12 — a path removed for good is a change even if another one re-registers', async () => {
        reg('r12a', H);
        reg('r12b', V);
        await flush();
        const v0 = getEdgePathsVersion();
        unregisterEdgePath('r12a');
        unregisterEdgePath('r12b');
        reg('r12b', V);
        await flush();
        expect(getEdgePathsVersion()).toBeGreaterThan(v0);
    });

    it('R9 — crossings read the latest registered path (the reason for the version)', () => {
        reg('r9h', H, 'a', 'b');
        reg('r9v', V, 'c', 'd');
        expect(getEdgeCrossings('r9h', H).map((c) => [c.x, c.y])).toEqual([[100, 50]]);
        // The vertical moves out of the horizontal's way: the crossing goes with it.
        reg('r9v', [{ x: 100, y: 60 }, { x: 100, y: 160 }], 'c', 'd');
        expect(getEdgeCrossings('r9h', H)).toEqual([]);
    });
});
