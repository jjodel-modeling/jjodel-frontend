import { describe, it, expect } from 'vitest';
import {
    ghostParentSpreads,
    ghostParentConnector,
    GP_START_X,
    GP_START_Y,
    GP_CHIP_GAP,
    GP_DEFAULT_CHIP_WIDTH,
} from '../ghostParentGeometry';

// Parse "x,y x,y x,y" into the apex (first point).
const apexOf = (triangle: string) => triangle.split(' ')[0].split(',').map(Number);

describe('ghostParentConnector', () => {
    it('starts at the node-top-center for every spread (N = 1..5)', () => {
        for (let n = 1; n <= 5; n++) {
            const spreads = ghostParentSpreads(new Array(n).fill(100));
            for (const s of spreads) {
                const c = ghostParentConnector(undefined, s);
                expect(c.startX).toBe(GP_START_X);
                expect(c.startY).toBe(GP_START_Y);
            }
        }
    });

    it('puts the triangle apex at the chip: rest apex + spread + drag offset', () => {
        const c = ghostParentConnector({ dx: 5, dy: -20 }, 130);
        expect(c.apexX).toBe(6 + 130 + 5);
        expect(c.apexY).toBe(1 - 20);
        expect(apexOf(c.triangle)).toEqual([141, -19]);
    });

    it('dragging one parent leaves the connector of another one untouched', () => {
        const spreads = ghostParentSpreads([100, 100, 100]);
        const before = ghostParentConnector(undefined, spreads[2]);
        const dragged = ghostParentConnector({ dx: 40, dy: -30 }, spreads[0]);
        const after = ghostParentConnector(undefined, spreads[2]);
        expect(after).toEqual(before);
        expect(dragged.apexX).not.toBe(ghostParentConnector(undefined, spreads[0]).apexX);
    });

    it('is degenerate only when the apex lands on the node-end', () => {
        expect(ghostParentConnector({ dx: 0, dy: 17 }, 0).degenerate).toBe(true);
        expect(ghostParentConnector(undefined, 0).degenerate).toBe(false);
    });
});

describe('ghostParentSpreads', () => {
    it('returns 0 for a single parent', () => {
        expect(ghostParentSpreads([90])).toEqual([0]);
    });

    it('is symmetric around the node top-center', () => {
        for (let n = 2; n <= 5; n++) {
            const s = ghostParentSpreads(new Array(n).fill(100));
            for (let i = 0; i < n; i++) expect(s[i]).toBeCloseTo(-s[n - 1 - i], 6);
        }
    });

    it('never overlaps neighbouring chips, for mixed widths', () => {
        const widths = [60, 140, 90, 200, 75];
        for (let n = 2; n <= 5; n++) {
            const w = widths.slice(0, n);
            const s = ghostParentSpreads(w);
            for (let i = 0; i < n - 1; i++) {
                const rightOfI = s[i] + w[i] / 2;
                const leftOfNext = s[i + 1] - w[i + 1] / 2;
                expect(leftOfNext - rightOfI).toBeGreaterThanOrEqual(GP_CHIP_GAP - 1e-9);
            }
        }
    });

    it('uses the default width for unmeasured chips', () => {
        const s = ghostParentSpreads([undefined, undefined]);
        expect(s[1] - s[0]).toBeCloseTo(GP_DEFAULT_CHIP_WIDTH + GP_CHIP_GAP, 6);
    });
});
