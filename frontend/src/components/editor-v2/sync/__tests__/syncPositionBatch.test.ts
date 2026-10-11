/**
 * syncPositionBatchToJjom — a vertex's position and size as one record (P-2026-10-11-1156, R-GV-17, LIR
 * `docs/lir/lir_2026-10-11_gv_drag_frame_box_write.md` §2).
 *
 * MEASURED (LIR §1.4): the S6 Auto layout wrote a resized pool's position with this batch and its size with
 * `syncSizeBatchToJjom` in the same tick; each call materializes the whole per-viewpoint record from the store as it
 * is, so the later record took back the earlier's position (Shop drawn at 48,568, record 100,100).
 *
 * Same fake-barrel idiom as `syncDeleteEdge.test.ts`: the joiner barrel reaches monaco, which dereferences `window`
 * at import, so it is mocked; the subject, `canvasToJjom.ts`, runs for real, with `vertexLayout.ts` and
 * `syncState.ts`. Writes are spies: the assertion is the exact actions and the TRANSACTION they share.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Any = any;

const H = vi.hoisted(() => ({
    state: { idlookup: {} as Record<string, Any> },
    key: 'VP' as string | null,
    log: [] as Array<{ kind: string; args: Any[]; depth: number }>,
    depth: 0,
    transactions: 0,
}));

vi.mock('../../../../joiner', () => {
    const rec = (kind: string) => (...args: Any[]) => { H.log.push({ kind, args, depth: H.depth }); return true; };
    return {
        store: { getState: () => H.state },
        LPointerTargetable: { fromPointer: () => null },
        TRANSACTION: (_name: string, fn: () => void) => { H.transactions++; H.depth++; try { fn(); } finally { H.depth--; } },
        SetFieldAction: { new: rec('SetFieldAction') },
        DeleteElementAction: { new: rec('DeleteElementAction') },
        DVertex: {}, DEdge: {}, DVoidEdge: {}, DObject: {}, DModel: {}, DClass: {}, DEnumerator: {}, DPackage: {}, GraphSize: {},
    };
});
vi.mock('../m1EdgeSweep', () => ({ sweepAllM1ReferenceGraphs: vi.fn() }));
vi.mock('../../hooks/useOrphanFeatures', () => ({ captureAttributeOrphanValues: vi.fn() }));
vi.mock('../../viewpoint/layout/vertexLayoutAdapter', () => ({ getActiveLayoutKey: () => H.key }));

import { syncPositionBatchToJjom, syncSizeBatchToJjom } from '../canvasToJjom';
import { clearCanvasUpdated, isCanvasUpdated } from '../syncState';

/** Shop: seed 1,2 10x20, and under VP the record of the fixture, sized by hand. */
const SHOP = { className: 'DVertex', id: 'Vshop', x: 1, y: 2, w: 10, h: 20, isResized: false,
    layoutByViewpoint: { VP: { x: 100, y: 100, w: 900, h: 360, isResized: true } } };
const TASK = { className: 'DVertex', id: 'Vtask', x: 300, y: 160, w: 140, h: 60, isResized: false };

/** What the actions write into one vertex's record under VP, applied in order as the reducer's '+=' merge does. */
function recordAfter(id: string) {
    let record = { ...H.state.idlookup[id].layoutByViewpoint?.VP };
    for (const e of H.log) {
        const [target, field, value, op] = e.args;
        if (e.kind === 'SetFieldAction' && target === id && field === 'layoutByViewpoint' && op === '+=') record = { ...value.VP };
    }
    return record;
}

beforeEach(() => {
    H.state.idlookup = { Vshop: structuredClone(SHOP), Vtask: structuredClone(TASK) };
    H.key = 'VP';
    H.log.length = 0;
    H.transactions = 0;
    clearCanvasUpdated('Vshop');
    clearCanvasUpdated('Vtask');
});

describe('syncPositionBatchToJjom: an update without w/h writes what it wrote before', () => {
    it('under a viewpoint: one dictionary action, the record\'s own size and flag kept', () => {
        syncPositionBatchToJjom([{ id: 'Vshop', x: 48, y: 568 }]);
        expect(H.transactions).toBe(1);
        expect(H.log).toEqual([{ kind: 'SetFieldAction', depth: 1,
            args: ['Vshop', 'layoutByViewpoint', { VP: { x: 48, y: 568, w: 900, h: 360, isResized: true } }, '+=', false] }]);
        expect(isCanvasUpdated('Vshop')).toBe(true);
    });
    it('on the seed (no layout key): x and y only', () => {
        H.key = null;
        syncPositionBatchToJjom([{ id: 'Vtask', x: 320, y: 176 }]);
        expect(H.log.map(e => e.args)).toEqual([['Vtask', 'x', 320, undefined, false], ['Vtask', 'y', 176, undefined, false]]);
    });
    it('a w or an h alone is not a size: the position only', () => {
        syncPositionBatchToJjom([{ id: 'Vshop', x: 48, y: 568, w: 1632 }]);
        expect(recordAfter('Vshop')).toEqual({ x: 48, y: 568, w: 900, h: 360, isResized: true });
    });
});

describe('syncPositionBatchToJjom: an update with w and h writes the box as one record', () => {
    it('under a viewpoint: position, size and the hand-set flag in the same action', () => {
        syncPositionBatchToJjom([{ id: 'Vshop', x: 48, y: 568, w: 1632, h: 360 }]);
        expect(H.transactions).toBe(1);
        expect(H.log).toEqual([{ kind: 'SetFieldAction', depth: 1,
            args: ['Vshop', 'layoutByViewpoint', { VP: { x: 48, y: 568, w: 1632, h: 360, isResized: true } }, '+=', false] }]);
    });
    it('on the seed: x, y, w, h and isResized, in one TRANSACTION', () => {
        H.key = null;
        syncPositionBatchToJjom([{ id: 'Vtask', x: 320, y: 176, w: 200, h: 80 }]);
        expect(H.transactions).toBe(1);
        expect(H.log.map(e => e.args)).toEqual([
            ['Vtask', 'x', 320, undefined, false], ['Vtask', 'y', 176, undefined, false],
            ['Vtask', 'w', 200, undefined, false], ['Vtask', 'h', 80, undefined, false], ['Vtask', 'isResized', true, undefined, false],
        ]);
    });
    it('a mixed batch: the sized update carries its size, the other its position only', () => {
        syncPositionBatchToJjom([{ id: 'Vshop', x: 48, y: 568, w: 1632, h: 360 }, { id: 'Vtask', x: 320, y: 176 }]);
        expect(H.transactions).toBe(1);
        expect(H.log.map(e => e.args[2])).toEqual([
            { VP: { x: 48, y: 568, w: 1632, h: 360, isResized: true } },
            { VP: { x: 320, y: 176, w: 140, h: 60, isResized: false } },
        ]);
    });
    it('the two calls of before, in one tick, lose the position; the one batch keeps both (the S6 cause, LIR §1)', () => {
        syncPositionBatchToJjom([{ id: 'Vshop', x: 48, y: 568 }]);
        syncSizeBatchToJjom([{ vertexId: 'Vshop', w: 1632, h: 360 }]);
        expect(recordAfter('Vshop')).toEqual({ x: 100, y: 100, w: 1632, h: 360, isResized: true });
        H.log.length = 0;
        syncPositionBatchToJjom([{ id: 'Vshop', x: 48, y: 568, w: 1632, h: 360 }]);
        expect(recordAfter('Vshop')).toEqual({ x: 48, y: 568, w: 1632, h: 360, isResized: true });
    });
});
