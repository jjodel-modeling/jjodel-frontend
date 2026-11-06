/**
 * The Refactoring tab beside the target's tab (P-2026-10-25-0020): the dock action, the split
 * decision by window width, the split ratio.
 */
import { describe, it, expect } from 'vitest';
import {
    BESIDE_MIN_WINDOW, SPLIT_RATIO_DEFAULT, besideAction, besideMode, clampSplitRatio, splitSizes,
} from '../refactoringBeside';

describe('besideMode', () => {
    it('is beside from the threshold up when the dock can place the tabs, the fallback otherwise', () => {
        expect(besideMode(BESIDE_MIN_WINDOW, true)).toBe('beside');
        expect(besideMode(1600, true)).toBe('beside');
        expect(besideMode(BESIDE_MIN_WINDOW - 1, true)).toBe('fallback');
        expect(besideMode(1600, false)).toBe('fallback');
    });
});

describe('besideAction', () => {
    const S = 'script_1';
    const T = 'mm';

    it('splits the script panel right with a new tab when the target is not open', () => {
        expect(besideAction([{ id: 'p0', tabIds: ['summary', S] }], S, T)).toEqual({ kind: 'split-open', panelId: 'p0' });
    });

    it('splits with the open tab, never a second instance, when it sits in the script panel', () => {
        expect(besideAction([{ id: 'p0', tabIds: [T, S] }], S, T)).toEqual({ kind: 'split-move', panelId: 'p0' });
    });

    it('raises the target already right of the script panel', () => {
        expect(besideAction([{ id: 'p0', tabIds: [S] }, { id: 'p1', tabIds: ['x', T] }], S, T)).toEqual({ kind: 'activate', panelId: 'p1' });
    });

    it('moves into or opens in the panel right of the script panel when there is one', () => {
        expect(besideAction([{ id: 'p0', tabIds: [S, T] }, { id: 'p1', tabIds: ['old'] }], S, T)).toEqual({ kind: 'move-into', panelId: 'p1' });
        expect(besideAction([{ id: 'p0', tabIds: [S] }, { id: 'p1', tabIds: ['old'] }], S, T)).toEqual({ kind: 'open-into', panelId: 'p1' });
    });

    it('moves the target open left of the script panel into the right one', () => {
        expect(besideAction([{ id: 'p0', tabIds: [T] }, { id: 'p1', tabIds: [S] }], S, T)).toEqual({ kind: 'split-move', panelId: 'p1' });
    });

    it('is unavailable when the script tab is not in a top-level panel or there is no target', () => {
        expect(besideAction([{ id: 'p0', tabIds: [T] }], S, T)).toEqual({ kind: 'unavailable' });
        expect(besideAction([{ id: 'p0', tabIds: [S] }], S, '')).toEqual({ kind: 'unavailable' });
    });
});

describe('split ratio', () => {
    it('clamps to 0.25..0.75 and falls back to the default on garbage', () => {
        expect(clampSplitRatio(0.1)).toBe(0.25);
        expect(clampSplitRatio(0.9)).toBe(0.75);
        expect(clampSplitRatio(0.5)).toBe(0.5);
        expect(clampSplitRatio(NaN)).toBe(SPLIT_RATIO_DEFAULT);
        expect(clampSplitRatio(0)).toBe(SPLIT_RATIO_DEFAULT);
    });

    it('shares the two sizes 40/60 by default, keeping their sum', () => {
        expect(splitSizes(200, 200, SPLIT_RATIO_DEFAULT)).toEqual([160, 240]);
        const [l, r] = splitSizes(300, 500, 0.5);
        expect(l + r).toBe(800);
        expect(l).toBe(400);
    });
});
