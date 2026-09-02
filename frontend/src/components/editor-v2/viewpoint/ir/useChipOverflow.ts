/**
 * useChipOverflow — the one width decision FL1 could not make (FL4).
 *
 * `jjform/layout.ts` says it in its own words: a chip input starts at 6 columns and goes to
 * 12 «when its chips overflow the container — which is a measurement in pixels, and this
 * module measures nothing. FL4 reads the flag, measures, and promotes». This is that
 * measurement, and it is the ONLY place in the form where a width comes from the DOM rather
 * than from the metamodel.
 *
 * ── What is measured, and why not the obvious thing ───────────────────────────
 *
 * Not `scrollWidth`. The chip run is a wrapping flex container, so its `scrollWidth` equals
 * its `clientWidth` whatever it holds: it does not overflow, it WRAPS, and the measurement
 * that looks like the natural one silently answers «never» for every input. What is measured
 * instead is the run's UNWRAPPED width — the chips' own widths plus the gaps between them —
 * against the width the field would have at 6 columns. Both numbers exist in either state,
 * which matters: a promoted field is already 12 wide, so asking the element how wide it is
 * would answer a different question every time it changed its mind.
 *
 * The half-row width is computed from the ROW, not from the cell, for the same reason:
 * `(rowWidth - columnGap) / 2` is what 6 of 12 columns are worth, and it does not move when
 * the cell does.
 *
 * ── The hysteresis ────────────────────────────────────────────────────────────
 *
 * The verdict itself is `formAutoLayout.overflowVerdict`, pure and unit-tested against the
 * oscillation it exists to prevent. It lives there rather than here because a threshold
 * validated by reading it is not validated (CLAUDE.md §5), and a hook is not something a
 * node test can execute.
 *
 * ── Why a hook per field ──────────────────────────────────────────────────────
 *
 * A single hook over the whole form would have to hold a map keyed by field, invalidate it
 * on every re-layout, and re-measure fields that did not change. One hook per chip cell
 * measures only that cell, unmounts with it, and cannot leak a stale entry — and the fields
 * that are not chip inputs pass `enabled: false` and never observe anything at all.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { overflowVerdict } from './formAutoLayout';

/** Fallback column gap, in px, when the computed style cannot be read (a detached node, a
 *  test environment with no layout). Matches the grid's own `--ir-form-col-gap` default. */
const FALLBACK_COL_GAP = 8;

/** Unwrapped width of a run of inline items: their own widths plus one gap between each
 *  pair. Read off the offset boxes rather than off `getBoundingClientRect`, so a transformed
 *  ancestor (the canvas zoom) does not scale the measurement into a different verdict. */
function runWidth(container: HTMLElement): number {
    const kids = Array.from(container.children) as HTMLElement[];
    if (kids.length === 0) return 0;
    let gap = 0;
    try {
        const cs = getComputedStyle(container);
        gap = parseFloat(cs.columnGap || cs.gap || '') || 0;
    } catch {
        // No layout engine: the widths below will be 0 too, and the verdict holds.
    }
    let total = gap * (kids.length - 1);
    for (const k of kids) total += k.offsetWidth;
    return total;
}

/** Width of one half row, from the grid the cell sits in. `0` when it cannot be read, which
 *  `overflowVerdict` treats as «not measured yet» and answers by holding its verdict. */
function halfRowWidth(cell: HTMLElement): number {
    const row = cell.parentElement;
    if (!row) return 0;
    let gap = FALLBACK_COL_GAP;
    try {
        const cs = getComputedStyle(row);
        gap = parseFloat(cs.columnGap || cs.gap || '') || FALLBACK_COL_GAP;
    } catch {
        // Keep the fallback.
    }
    const width = row.clientWidth;
    if (width <= 0) return 0;
    return (width - gap) / 2;
}

/** Class of the chip run inside a cell. The one DOM coupling in this hook, and it is a
 *  narrow one: the run is `ChipInputWidget`'s own root, whose class `controlClass('ir-chipinput', …)`
 *  emits unconditionally. Looking it up is what lets the ref sit on the CELL — which is the
 *  element whose span the promotion changes — instead of somewhere inside the widget, where
 *  it would need the widget to forward a ref it does not take. */
const RUN_SELECTOR = '.ir-chipinput';

export interface ChipOverflow {
    /** Put on the GRID CELL: the element whose span the verdict decides. */
    ref: (el: HTMLDivElement | null) => void;
    /** True when the field has been promoted to the whole row. */
    promoted: boolean;
}

/**
 * Measure a chip cell and say whether it has outgrown its half row.
 *
 * `enabled` is `LayoutField.growsOnOverflow`: a field FL1 did not flag never measures, never
 * observes and never promotes. Passing `false` is not a disabled hook — the hook still runs,
 * as it must — it is a hook that holds `false` and attaches no observer.
 */
export function useChipOverflow(enabled: boolean): ChipOverflow {
    const [promoted, setPromoted] = useState(false);
    const cellRef = useRef<HTMLDivElement | null>(null);
    const promotedRef = useRef(false);
    promotedRef.current = promoted;

    const measure = useCallback(() => {
        const cell = cellRef.current;
        if (!enabled || !cell) return;
        const run = cell.querySelector(RUN_SELECTOR) as HTMLElement | null;
        if (!run) return;
        const next = overflowVerdict(promotedRef.current, runWidth(run), halfRowWidth(cell));
        // Only on a change: setting the same value would still re-render, and this runs from
        // a ResizeObserver whose own callback the re-render can trigger again.
        if (next !== promotedRef.current) setPromoted(next);
    }, [enabled]);

    // Kept in a ref rather than in state: attaching the observer is a side effect of the node
    // arriving, and a state update here would re-run the render that produced the node.
    const observerRef = useRef<ResizeObserver | null>(null);
    const ref = useCallback((el: HTMLDivElement | null) => {
        cellRef.current = el;
        observerRef.current?.disconnect();
        observerRef.current = null;
        if (!el || !enabled) return;
        // Absent in a node environment, and in browsers older than this app supports. Its
        // absence costs the resize half of the measurement, not the measurement.
        if (typeof ResizeObserver === 'undefined') { measure(); return; }
        const ro = new ResizeObserver(() => measure());
        // The row, because the promotion is about the row's width; the cell's own width is
        // the CONSEQUENCE of the verdict and observing it would close the loop.
        if (el.parentElement) ro.observe(el.parentElement);
        observerRef.current = ro;
        measure();
    }, [enabled, measure]);

    // Every commit: the chips themselves change on a keystroke, and a mutation of the run is
    // not a resize of the row, so the observer above would not see it.
    useEffect(() => { measure(); });

    useEffect(() => () => { observerRef.current?.disconnect(); }, []);

    // A field that stops being a chip input drops its promotion with the flag, or the cell
    // would keep the whole row for a control that no longer needs it.
    useEffect(() => { if (!enabled && promotedRef.current) setPromoted(false); }, [enabled]);

    return { ref, promoted };
}
