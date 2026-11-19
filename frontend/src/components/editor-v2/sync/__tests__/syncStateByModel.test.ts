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
