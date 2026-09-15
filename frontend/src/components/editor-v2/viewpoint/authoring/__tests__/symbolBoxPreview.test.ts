/**
 * Pure-helper tests for the realistic preview strip (D8 wiring).
 *
 * SymbolBoxPreview.tsx is import-safe in the node vitest env (React, the
 * marker registry, the shape registry and the catalog types are all pure at
 * import time; no joiner, no monaco, no window). Only the exported pure
 * helpers are exercised here: the component itself is a presentation shell
 * whose contract is visual (smoke criteria of the D8-preview prompt).
 */

import { describe, expect, it } from 'vitest';
import { captionForBox, fitScale } from '../SymbolBoxPreview';

describe('fitScale', () => {
    it('renders 1:1 when the box already fits the stage', () => {
        expect(fitScale({ w: 190, h: 58 }, 560, 88)).toBe(1);
    });

    it('never enlarges a small box', () => {
        expect(fitScale({ w: 40, h: 20 }, 560, 88)).toBe(1);
    });

    it('reduces on width when width is the binding side', () => {
        expect(fitScale({ w: 1120, h: 58 }, 560, 88)).toBe(0.5);
    });

    it('reduces on height when height is the binding side', () => {
        expect(fitScale({ w: 190, h: 176 }, 560, 88)).toBe(0.5);
    });

    it('picks the most binding side, not the first', () => {
        // width would allow 0.5, height only allows 0.25
        expect(fitScale({ w: 1120, h: 352 }, 560, 88)).toBe(0.25);
    });

    it('falls back to 1 on a degenerate box instead of dividing by zero', () => {
        expect(fitScale({ w: 0, h: 58 }, 560, 88)).toBe(1);
        expect(fitScale({ w: 190, h: 0 }, 560, 88)).toBe(1);
    });
});

describe('captionForBox', () => {
    it('formats the derived caption as in the mockup, English UI', () => {
        expect(captionForBox({ w: 190, h: 58 }, 'derived')).toBe('190 × 58 px · derived from ink (D8)');
    });

    it('declares the manual size when a resize won', () => {
        expect(captionForBox({ w: 210, h: 90 }, 'manual')).toBe('210 × 90 px · manual size');
    });

    it('rounds fractional dimensions for display', () => {
        expect(captionForBox({ w: 190.4, h: 57.6 }, 'derived')).toBe('190 × 58 px · derived from ink (D8)');
    });
});
