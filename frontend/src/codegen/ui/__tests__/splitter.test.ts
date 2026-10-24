/**
 * splitter — the generator tab's column splitter: the clamp to the minimums and the ratio kept per viewer
 * (P-2026-10-24-1515). Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import {
    DEFAULT_SPLIT_RATIO, SPLIT_MIN_PX, SPLIT_STORAGE_KEY, clampSplit, readSplitRatio, splitRatio, writeSplitRatio,
} from '../splitter';

const memory = (initial: Record<string, string> = {}) => {
    const data = new Map(Object.entries(initial));
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
};

describe('clampSplit', () => {
    it('keeps the minimum on either side (kills: no clamp)', () => {
        expect(clampSplit(100, 1000)).toBe(SPLIT_MIN_PX);
        expect(clampSplit(900, 1000)).toBe(1000 - SPLIT_MIN_PX);
        expect(clampSplit(500, 1000)).toBe(500);
        expect(splitRatio(0, 1000)).toBeCloseTo(SPLIT_MIN_PX / 1000);
    });

    it('takes the middle when the width cannot hold both minimums (kills: clamp inverted on a narrow tab)', () => {
        expect(clampSplit(100, 400)).toBe(200);
    });
});

describe('readSplitRatio / writeSplitRatio', () => {
    it('reads back a stored ratio (kills: the stored value ignored)', () => {
        const storage = memory();
        writeSplitRatio(0.4, storage);
        expect(storage.data.get(SPLIT_STORAGE_KEY)).toBe('0.4');
        expect(readSplitRatio(storage)).toBe(0.4);
    });

    it('falls back to the default on a broken value (kills: parse error throws)', () => {
        expect(readSplitRatio(memory({ [SPLIT_STORAGE_KEY]: '{not json' }))).toBe(DEFAULT_SPLIT_RATIO);
        expect(readSplitRatio(memory({ [SPLIT_STORAGE_KEY]: '1.7' }))).toBe(DEFAULT_SPLIT_RATIO);
        expect(readSplitRatio(memory())).toBe(DEFAULT_SPLIT_RATIO);
        expect(readSplitRatio({ getItem: () => { throw new Error('denied'); } })).toBe(DEFAULT_SPLIT_RATIO);
        expect(() => writeSplitRatio(0.5, { setItem: () => { throw new Error('quota'); } })).not.toThrow();
    });
});
