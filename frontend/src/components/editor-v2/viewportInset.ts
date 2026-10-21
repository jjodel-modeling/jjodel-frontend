/**
 * Canvas right-inset helpers (F3 2026-07-29).
 *
 * The floating Properties+Tree overlay covers the right edge of the full-width
 * canvas. Its footprint (width + gutter) is published by the overlay onto
 * <body> as the CSS variable `--jj-canvas-right-inset`. These helpers let the
 * viewport-fit math read that value so centering and anchored controls reserve
 * room for the overlay. Viewport-only: no sync/D-layer imports.
 */

import { useMemo } from 'react';

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
    return paddingForInset(getCanvasRightInset(), base);
}

function paddingForInset(
    inset: number,
    base: number,
): number | { top: number; bottom: number; left: number; right: `${number}px` } {
    if (inset <= 0) return base;
    return { top: base, bottom: base, left: base, right: `${inset + 20}px` };
}

/**
 * The inset as a render may read it (P-2026-10-21-1010). `getCanvasRightInset` costs a
 * `getComputedStyle(document.body)`, a document-wide style recalc, and the editor read it
 * in every render through `fitViewOptions` (round 3 report §3.4). The value has one writer,
 * PropertiesWithTreeView, inline on <body>; a MutationObserver on the body's `style`
 * attribute sees that write and refreshes the cache, after a string compare of the inline
 * declaration so another body style write (a drag cursor) costs no style read.
 */
const INSET_VAR = '--jj-canvas-right-inset';
let cachedInset: number | null = null;
let cachedRaw = '';

function canvasRightInsetForRender(): number {
    if (typeof window === 'undefined') return 0;
    if (typeof MutationObserver === 'undefined') return getCanvasRightInset();
    if (cachedInset === null) {
        cachedRaw = document.body.style.getPropertyValue(INSET_VAR);
        cachedInset = getCanvasRightInset();
        new MutationObserver(() => {
            const raw = document.body.style.getPropertyValue(INSET_VAR);
            if (raw === cachedRaw) return;
            cachedRaw = raw;
            cachedInset = getCanvasRightInset();
        }).observe(document.body, { attributes: true, attributeFilter: ['style'] });
    }
    return cachedInset;
}

/**
 * `fitViewOptions` for the ReactFlow prop: no style read in the render, and the same
 * object while the inset holds. React Flow copies the prop into its store whenever its
 * reference changes and uses it for every queued fit, not only the first (the `fitView`
 * prop can turn true after the mount), so the value follows the inset as before.
 */
export function useFitViewOptions(): { padding: ReturnType<typeof fitPadding>; maxZoom: number } {
    const inset = canvasRightInsetForRender();
    return useMemo(() => ({ padding: paddingForInset(inset, 0.2), maxZoom: 1 }), [inset]);
}
