/**
 * The automatic orientation of a bar (P-2026-10-03-1304, Q3, docs/lir/lir_2026-10-03_bar_orientation.md, design in
 * docs/discovery/discovery_2026-10-03_derived_notations_edges.md §10): the sum of the unit vectors from the bar's
 * centre to its connected neighbours, by absolute component; 20 percent hysteresis on the axis ratio; the session memo.
 */
import { describe, expect, it } from 'vitest';
import { BAR_HYSTERESIS, barOrientation, rememberedBarOrientation, rememberBarOrientation, resetBarOrientations } from '../barOrientation';

const c = { x: 0, y: 0 };

describe('barOrientation: the rule', () => {
    it('no previous: neighbours across make it upright, along lying; a tie upright', () => {
        expect(barOrientation(c, [{ x: 200, y: 10 }], undefined)).toBe('upright');
        expect(barOrientation(c, [{ x: 10, y: -200 }], undefined)).toBe('lying');
        expect(barOrientation(c, [{ x: 100, y: 100 }], undefined)).toBe('upright');
    });

    it('sums the neighbours by direction, not by distance (DemoFlowB fork at rest: its three neighbours across, 7.32)', () => {
        // d1 far up-right, left and right on its row: the sum says across.
        expect(barOrientation(c, [{ x: 800, y: -300 }, { x: 420, y: 14 }, { x: 840, y: 14 }], undefined)).toBe('upright');
    });

    it('20 percent hysteresis: an upright bar turns lying only past 1.2, a lying one upright only past 1.2', () => {
        expect(BAR_HYSTERESIS).toBe(1.2);
        // sy / sx = 1.15: inside the band, both keep what they had.
        const inside = { x: 100, y: 115 };
        expect(barOrientation(c, [inside], 'upright')).toBe('upright');
        expect(barOrientation(c, [inside], 'lying')).toBe('lying');
        // 1.3: past it, the upright one turns.
        expect(barOrientation(c, [{ x: 100, y: 130 }], 'upright')).toBe('lying');
        expect(barOrientation(c, [{ x: 130, y: 100 }], 'lying')).toBe('upright');
    });

    it('no neighbour: it keeps what it had, upright when it had nothing', () => {
        expect(barOrientation(c, [], 'lying')).toBe('lying');
        expect(barOrientation(c, [], undefined)).toBe('upright');
    });

    it('a neighbour shaken by +-3 px at the diagonal turns it at most once (511 times without the hysteresis, measured)', () => {
        let o = barOrientation(c, [{ x: 141, y: 141 }], undefined);
        let turns = 0;
        let seed = 7;
        const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
        for (let i = 0; i < 1000; i++) {
            const next = barOrientation(c, [{ x: 141 + (rnd() - 0.5) * 6, y: 141 + (rnd() - 0.5) * 6 }], o);
            if (next !== o) { turns++; o = next; }
        }
        expect(turns).toBeLessThanOrEqual(1);
    });
});

describe('the session memo', () => {
    it('remembers per vertex and forgets on a viewpoint change, not on the same one', () => {
        resetBarOrientations('VP1');
        rememberBarOrientation('v1', 'lying');
        expect(rememberedBarOrientation('v1')).toBe('lying');
        resetBarOrientations('VP1');
        expect(rememberedBarOrientation('v1')).toBe('lying');
        resetBarOrientations('VP2');
        expect(rememberedBarOrientation('v1')).toBeUndefined();
    });
});
