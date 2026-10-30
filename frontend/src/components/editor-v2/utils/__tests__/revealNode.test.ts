/**
 * revealViewport — SELECT_NODE brings the node into view on React Flow's own pane (P-2026-10-25-1441).
 *
 * Measured by P-2026-10-25-1355 on a canvas narrowed beside a generator tab: React Flow 528 px wide (201..729 on
 * screen) in a 1440 px window; the window-based centre put the node at 627..842, past the right edge.
 */
import { describe, it, expect } from 'vitest';
import { revealViewport, type FlowBox, type FlowViewport } from '../revealNode';

const NARROW = { width: 528, height: 760 };

function onScreen(node: FlowBox, vp: FlowViewport) {
    return {
        left: node.x * vp.zoom + vp.x,
        top: node.y * vp.zoom + vp.y,
        right: (node.x + node.width) * vp.zoom + vp.x,
        bottom: (node.y + node.height) * vp.zoom + vp.y,
    };
}

describe('revealViewport', () => {
    it('kills: window-based centre — a node outside the narrowed pane ends inside it, centred at one third', () => {
        const node = { x: 900, y: 300, width: 215, height: 120 };
        const next = revealViewport(node, { x: 0, y: 0, zoom: 1 }, NARROW);
        expect(next).not.toBeNull();
        const box = onScreen(node, next!);
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(NARROW.width);
        expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.bottom).toBeLessThanOrEqual(NARROW.height);
        expect((box.left + box.right) / 2).toBeCloseTo(NARROW.width / 3);
        expect((box.top + box.bottom) / 2).toBeCloseTo(NARROW.height / 3);
    });

    it('kills: move on every select — a node already fully inside leaves the viewport alone', () => {
        expect(revealViewport({ x: 100, y: 80, width: 215, height: 120 }, { x: -40, y: 10, zoom: 1.25 }, NARROW)).toBeNull();
        // Touching the edges still counts as inside.
        expect(revealViewport({ x: 0, y: 0, width: 528, height: 760 }, { x: 0, y: 0, zoom: 1 }, NARROW)).toBeNull();
    });

    it('kills: fitView used — the zoom is the one the viewport had', () => {
        const next = revealViewport({ x: -2000, y: 1500, width: 215, height: 120 }, { x: 0, y: 0, zoom: 0.6 }, NARROW);
        expect(next?.zoom).toBe(0.6);
        const box = onScreen({ x: -2000, y: 1500, width: 215, height: 120 }, next!);
        expect(box.right - box.left).toBeCloseTo(215 * 0.6);
    });

    it('a node partly outside is revealed too', () => {
        const node = { x: 420, y: 100, width: 215, height: 120 };
        const next = revealViewport(node, { x: 0, y: 0, zoom: 1 }, NARROW);
        expect(next).not.toBeNull();
        expect(onScreen(node, next!).right).toBeLessThanOrEqual(NARROW.width);
    });

    it('measures the part the right inset leaves uncovered', () => {
        const pane = { width: 1398, height: 876 };
        // Inside the pane but under the overlay (from 990): revealed, one third into the uncovered 990 px.
        const node = { x: 1100, y: 100, width: 200, height: 80 };
        const next = revealViewport(node, { x: 0, y: 0, zoom: 1 }, pane, 408);
        expect(next).not.toBeNull();
        const box = onScreen(node, next!);
        expect((box.left + box.right) / 2).toBeCloseTo(990 / 3);
        expect(revealViewport(node, { x: 0, y: 0, zoom: 1 }, pane)).toBeNull();
    });

    it('on a full-width pane it places an off-screen node where the window-based centre did', () => {
        // Full width: the pane is the window less the overlay, as the old formula assumed.
        const win = { innerWidth: 1440, innerHeight: 900 }, inset = 408;
        const node = { x: 3000, y: -900, width: 215, height: 120 };
        const vp = { x: 0, y: 0, zoom: 0.8 };
        const cx = node.x + node.width / 2, cy = node.y + node.height / 2;
        const before = { x: -cx * vp.zoom + (win.innerWidth - inset) / 3, y: -cy * vp.zoom + win.innerHeight / 3, zoom: vp.zoom };
        const next = revealViewport(node, vp, { width: win.innerWidth, height: win.innerHeight }, inset);
        expect(next!.x).toBeCloseTo(before.x);
        expect(next!.y).toBeCloseTo(before.y);
        expect(next!.zoom).toBe(before.zoom);
    });

    it('a node larger than the pane starts at its top-left corner', () => {
        const node = { x: 50, y: 50, width: 900, height: 1000 };
        const next = revealViewport(node, { x: 0, y: 0, zoom: 1 }, NARROW);
        const box = onScreen(node, next!);
        expect(box.left).toBeCloseTo(0);
        expect(box.top).toBeCloseTo(0);
    });

    it('a pane with no size yet leaves the viewport alone', () => {
        expect(revealViewport({ x: 900, y: 0, width: 215, height: 120 }, { x: 0, y: 0, zoom: 1 }, { width: 0, height: 0 })).toBeNull();
        expect(revealViewport({ x: 900, y: 0, width: 215, height: 120 }, { x: 0, y: 0, zoom: 1 }, { width: 300, height: 400 }, 500)).toBeNull();
    });
});
