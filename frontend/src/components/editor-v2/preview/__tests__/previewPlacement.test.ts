import { describe, expect, it } from 'vitest';
import { PLACEMENT_CLEARANCE, compartmentBelow, findFreeSpot, strikeOnRow, tooClose, type PlacementBox } from '../previewPlacement';

const anchor: PlacementBox = { x: 100, y: 100, width: 200, height: 100 };
const W = 180;
const H = 48;
const at = (p: { x: number; y: number }): PlacementBox => ({ ...p, width: W, height: H });

describe('tooClose', () => {
    it('is false at exactly the clearance, true one pixel inside it', () => {
        const a: PlacementBox = { x: 0, y: 0, width: 10, height: 10 };
        expect(tooClose({ x: 10 + PLACEMENT_CLEARANCE, y: 0, width: 10, height: 10 }, a)).toBe(false);
        expect(tooClose({ x: 10 + PLACEMENT_CLEARANCE - 1, y: 0, width: 10, height: 10 }, a)).toBe(true);
    });
});

describe('findFreeSpot', () => {
    it('goes right of the anchor when it is free', () => {
        expect(findFreeSpot(anchor, W, H, [anchor])).toEqual({ x: 380, y: 100 });
    });

    it('goes below when right is taken, left when below is taken too, above last', () => {
        const right = { x: 380, y: 100, width: 50, height: 50 };
        const below = { x: 100, y: 224, width: 50, height: 50 };
        const left = { x: -160, y: 100, width: 50, height: 50 };
        expect(findFreeSpot(anchor, W, H, [anchor, right])).toEqual({ x: 100, y: 224 });
        expect(findFreeSpot(anchor, W, H, [anchor, right, below])).toEqual({ x: -160, y: 100 });
        expect(findFreeSpot(anchor, W, H, [anchor, right, below, left])).toEqual({ x: 100, y: 28 });
    });

    it('keeps the clearance from every taken box, not only the touching ones', () => {
        // A box 20 px right of the straight right spot: inside 24 px of clearance, so right is refused.
        const near = { x: 380 + W + 20, y: 100, width: 10, height: 10 };
        const spot = findFreeSpot(anchor, W, H, [anchor, near])!;
        expect(spot).toEqual({ x: 100, y: 224 });
        expect(tooClose(at(spot), near)).toBe(false);
    });

    it('slides along the sides, nearest first, when all four straight spots are taken', () => {
        const walls = [
            anchor,
            { x: 380, y: 100, width: 50, height: 50 },
            { x: 100, y: 224, width: 50, height: 50 },
            { x: -160, y: 100, width: 50, height: 50 },
            { x: 100, y: 28, width: 50, height: 50 },
        ];
        const spot = findFreeSpot(anchor, W, H, walls)!;
        expect(spot).not.toBeNull();
        for (const w of walls) expect(tooClose(at(spot), w)).toBe(false);
        // Two slide steps from a straight spot (one step still touches the right wall): right, 80 px down.
        expect(spot).toEqual({ x: 380, y: 180 });
    });

    it('returns null when nothing within the slide range is free', () => {
        const everything = { x: -5000, y: -5000, width: 10000, height: 10000 };
        expect(findFreeSpot(anchor, W, H, [everything])).toBeNull();
    });

    it('is deterministic: the same input, the same spot', () => {
        const taken = [anchor, { x: 380, y: 100, width: 50, height: 50 }];
        expect(findFreeSpot(anchor, W, H, taken)).toEqual(findFreeSpot(anchor, W, H, [...taken]));
    });
});

describe('compartmentBelow and strikeOnRow', () => {
    it('a compartment has the owner x and width, its top at the owner bottom, no gap', () => {
        const box = compartmentBelow(anchor, 2, 18);
        expect(box).toEqual({ x: 100, y: 200, width: 200, height: 2 * 18 + 8 });
    });

    it('a second compartment stacks flush under the first', () => {
        const first = compartmentBelow(anchor, 2, 18);
        expect(compartmentBelow(anchor, 1, 18, first)).toEqual({ x: 100, y: 200 + first.height, width: 200, height: 26 });
    });

    it('the strike is the measured row, placed from the node corner', () => {
        expect(strikeOnRow(anchor, { dx: 8, dy: 40, width: 184, height: 20 })).toEqual({ x: 108, y: 140, width: 184, height: 20 });
    });
});
