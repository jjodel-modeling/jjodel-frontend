/**
 * Canvas right-inset helpers (F3 2026-07-29).
 *
 * The floating Properties+Tree overlay covers the right edge of the full-width
 * canvas. Its footprint (width + gutter) is published by the overlay onto
 * <body> as the CSS variable `--jj-canvas-right-inset`. These helpers let the
 * viewport-fit math read that value so centering and anchored controls reserve
 * room for the overlay. Viewport-only: no sync/D-layer imports.
 */

/** Current right inset in px (overlay footprint), or 0 when the overlay is hidden. */
export function getCanvasRightInset(): number {
    if (typeof window === 'undefined') return 0;
    const raw = getComputedStyle(document.body).getPropertyValue('--jj-canvas-right-inset');
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
}

/**
 * A ReactFlow `fitView` padding that reserves room on the right for the overlay.
 * When the overlay is hidden (inset 0) it returns the plain relative `base`,
 * byte-identical to the previous behaviour. Otherwise `base` stays on
 * top/bottom/left (same relative breathing) and the right gets the overlay inset
 * plus a small 20px of breathing, in px.
 */
export function fitPadding(
    base: number = 0.2
): number | { top: number; bottom: number; left: number; right: `${number}px` } {
    const inset = getCanvasRightInset();
    if (inset <= 0) return base;
    return { top: base, bottom: base, left: base, right: `${inset + 20}px` };
}
