/**
 * Sync registries keyed by model (multi-tab L4c, P-2026-11-19-1530, R-MT-29).
 *
 * The registries of syncState.ts record the model that wrote each entry. Releasing model A
 * (the unmount of its last instance) clears A's entries and the shared bucket, never B's.
 * A writer called without a model id files under the shared bucket, cleared on every release
 * as before L4c. Readers keep their signatures and see entries of every model.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as S from '../syncState';
import { createCompositionEdgeForObjects } from '../canvasToJjom';

type Any = any;

// Fake joiner barrel (idiom of syncDeleteEdge.test.ts): the barrel reaches monaco, which
// dereferences `window` at import. canvasToJjom.ts runs for real against it (L4d).
const H = vi.hoisted(() => ({
    state: { idlookup: {} as Record<string, Any> },
    nextEdge: 0,
}));

vi.mock('../../../../joiner', () => ({
    store: { getState: () => H.state },
    LPointerTargetable: { fromPointer: (id: string) => (id ? H.state.idlookup[id] ?? null : null) },
    TRANSACTION: (_name: string, fn: () => void) => { fn(); },
    SetFieldAction: { new: () => true },
    DeleteElementAction: { new: () => true },
    DVertex: {}, DEdge: {}, DObject: {}, DModel: {}, DClass: {}, DEnumerator: {}, DPackage: {}, GraphSize: {},
    DVoidEdge: { new2: () => ({ id: `edge-${++H.nextEdge}` }) },
}));
vi.mock('../m1EdgeSweep', () => ({ sweepAllM1ReferenceGraphs: vi.fn() }));
vi.mock('../../hooks/useOrphanFeatures', () => ({ captureAttributeOrphanValues: vi.fn() }));
vi.mock('../../viewpoint/layout/vertexLayoutAdapter', () => ({ getActiveLayoutKey: () => 'abstract' }));

function clearAll(): void {
    S.clearAllCanvasUpdated();
    S.clearSyncModes();
    S.clearDropCreated();
    S.clearEdgeRefIds();
    S.clearCanvasEdgePairs();
}

function releaseModel(modelId: string): void {
    S.clearAllCanvasUpdated(modelId);
    S.clearSyncModes(modelId);
    S.clearDropCreated(modelId);
    S.clearEdgeRefIds(modelId);
    S.clearCanvasEdgePairs(modelId);
}

function writeFor(modelId: string | undefined, tag: string): void {
    S.markCanvasUpdated(`u-${tag}`, modelId);
    S.markCanvasUpdatedBatch([`ub-${tag}`], modelId);
    S.setSyncMode(`n-${tag}`, 'faithful', modelId);
    S.markDropCreated(`d-${tag}`, modelId);
    S.setEdgeRefId(`e-${tag}`, `r-${tag}`, modelId);
    S.markCanvasEdgePair(`s-${tag}`, `t-${tag}`, modelId);
}

function present(tag: string): boolean[] {
    return [
        S.isCanvasUpdated(`u-${tag}`),
        S.isCanvasUpdated(`ub-${tag}`),
        S.getSyncMode(`n-${tag}`) === 'faithful',
        S.getEdgeRefId(`e-${tag}`) === `r-${tag}`,
        S.hasCanvasEdgePair(`s-${tag}→t-${tag}`),
    ];
}

beforeEach(() => clearAll());
afterEach(() => { vi.useRealTimers(); clearAll(); });

describe('syncState registries keyed by model', () => {
    it('releasing model A keeps every entry of model B', () => {
        writeFor('A', 'a');
        writeFor('B', 'b');
        releaseModel('A');
        expect(present('a')).toEqual([false, false, false, false, false]);
        expect(present('b')).toEqual([true, true, true, true, true]);
        expect(S.consumeDropCreated('d-a')).toBe(false);
        expect(S.consumeDropCreated('d-b')).toBe(true);
    });

    it('readers see the entries of every model, with unchanged signatures', () => {
        writeFor('A', 'a');
        writeFor('B', 'b');
        expect(present('a')).toEqual([true, true, true, true, true]);
        expect(present('b')).toEqual([true, true, true, true, true]);
        expect(S.consumeDropCreated('d-a')).toBe(true);
        expect(S.consumeDropCreated('d-a')).toBe(false);
    });

    it('a write without a model id files under the shared bucket, cleared on any release', () => {
        writeFor(undefined, 'x');
        writeFor('B', 'b');
        releaseModel('A');
        expect(present('x')).toEqual([false, false, false, false, false]);
        expect(S.consumeDropCreated('d-x')).toBe(false);
        expect(present('b')).toEqual([true, true, true, true, true]);
    });

    it('a clear without a model id clears every model, as before', () => {
        writeFor('A', 'a');
        writeFor('B', 'b');
        clearAll();
        expect(present('a')).toEqual([false, false, false, false, false]);
        expect(present('b')).toEqual([false, false, false, false, false]);
    });

    it('the last writer of a key owns it', () => {
        S.markCanvasEdgePair('v1', 'v2', 'A');
        S.markCanvasEdgePair('v1', 'v2', 'B');
        releaseModel('A');
        expect(S.hasCanvasEdgePair('v1→v2')).toBe(true);
        releaseModel('B');
        expect(S.hasCanvasEdgePair('v1→v2')).toBe(false);
    });

    it('a single-pair clear removes the pair whatever model wrote it', () => {
        S.markCanvasEdgePair('v1', 'v2', 'A');
        S.clearCanvasEdgePair('v1', 'v2');
        expect(S.hasCanvasEdgePair('v1→v2')).toBe(false);
    });

    it('the anti-bounce window is unchanged for keyed entries', () => {
        vi.useFakeTimers();
        vi.setSystemTime(1_000_000);
        S.markCanvasUpdated('v', 'B');
        vi.setSystemTime(1_000_300);
        expect(S.isCanvasUpdated('v')).toBe(true);
        vi.setSystemTime(1_000_301);
        expect(S.isCanvasUpdated('v')).toBe(false);
        S.markCanvasUpdatedBatch(['w'], 'B');
        vi.setSystemTime(1_000_700);
        S.purgeExpired();
        expect(S.isCanvasUpdated('w')).toBe(false);
    });

    it('clearCanvasUpdated removes one id whatever model wrote it', () => {
        S.markCanvasUpdated('v', 'A');
        S.clearCanvasUpdated('v');
        expect(S.isCanvasUpdated('v')).toBe(false);
    });
});

// Multi-tab L4d (P-2026-11-19-1610): an editor releases registries only when it releases the
// last canvas of its model, and then only that model's entries (and the shared bucket).
describe('releaseModelRegistries', () => {
    it('a model-less release leaves every model and the shared bucket untouched', () => {
        writeFor('A', 'a');
        writeFor('B', 'b');
        writeFor(undefined, 'x');
        expect(S.releaseModelRegistries(undefined, {})).toBe(false);
        expect(present('a')).toEqual([true, true, true, true, true]);
        expect(present('b')).toEqual([true, true, true, true, true]);
        expect(present('x')).toEqual([true, true, true, true, true]);
        expect(S.consumeDropCreated('d-a')).toBe(true);
        expect(S.consumeDropCreated('d-b')).toBe(true);
        expect(S.consumeDropCreated('d-x')).toBe(true);
    });

    it('clears only on the last release of a model, and only that model and the shared bucket', () => {
        const t1 = {}, t2 = {};
        S.acquirePopulateOwner('A', t1);
        S.acquirePopulateOwner('A', t2);
        writeFor('A', 'a');
        writeFor('B', 'b');
        writeFor(undefined, 'x');
        expect(S.releaseModelRegistries('A', t1)).toBe(false);
        expect(present('a')).toEqual([true, true, true, true, true]);
        expect(present('x')).toEqual([true, true, true, true, true]);
        expect(S.releaseModelRegistries('A', t2)).toBe(true);
        expect(present('a')).toEqual([false, false, false, false, false]);
        expect(present('x')).toEqual([false, false, false, false, false]);
        expect(present('b')).toEqual([true, true, true, true, true]);
        expect(S.consumeDropCreated('d-b')).toBe(true);
    });

    it('a token that does not hold the model clears nothing', () => {
        writeFor('A', 'a');
        expect(S.releaseModelRegistries('A', {})).toBe(false);
        expect(present('a')).toEqual([true, true, true, true, true]);
    });
});

describe('createCompositionEdgeForObjects files under its model', () => {
    beforeEach(() => {
        H.state.idlookup = {
            g1: { id: 'g1', subElements: ['vp', 'vc'] },
            vp: { className: 'DVertex', id: 'vp', model: 'parent' },
            vc: { className: 'DVertex', id: 'vc', model: 'child' },
            parent: { id: 'parent', instanceof: { allReferences: [{ id: 'ref', name: 'items' }] } },
            child: { id: 'child' },
        };
    });

    it('a composition edge written with a model id survives the release of another model', () => {
        const t = {};
        S.acquirePopulateOwner('A', t);
        const edgeId = createCompositionEdgeForObjects('g1', 'parent', 'child', 'items', 'B');
        expect(edgeId).not.toBeNull();
        expect(S.isCanvasUpdated(edgeId!)).toBe(true);
        expect(S.releaseModelRegistries('A', t)).toBe(true);
        expect(S.isCanvasUpdated(edgeId!)).toBe(true);
    });

    it('without a model id it still files under the shared bucket', () => {
        const t = {};
        S.acquirePopulateOwner('A', t);
        const edgeId = createCompositionEdgeForObjects('g1', 'parent', 'child', 'items');
        expect(S.isCanvasUpdated(edgeId!)).toBe(true);
        S.releaseModelRegistries('A', t);
        expect(S.isCanvasUpdated(edgeId!)).toBe(false);
    });
});
