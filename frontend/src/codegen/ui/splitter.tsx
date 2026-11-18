/**
 * splitter — the vertical splitter between the generator tab's editor column and its right pane (Preview, Run,
 * Check), P-2026-10-24-1515.
 *
 * The position is a ratio: the editor column's share of the width right of the template list, which keeps its fixed
 * width. Dragged with the mouse, or with the keyboard when focused (Left/Right by `SPLIT_STEP_PX`); each side keeps
 * at least `SPLIT_MIN_PX`; a double-click resets to `DEFAULT_SPLIT_RATIO`. The ratio is kept per viewer in
 * `localStorage` under `SPLIT_STORAGE_KEY`, every read and write in try/catch, the default when absent or broken.
 */

import React, { useRef } from 'react';

export const SPLIT_STORAGE_KEY = 'jjodel.codegen.tabSplit';
export const DEFAULT_SPLIT_RATIO = 0.55;
export const SPLIT_MIN_PX = 200;
export const SPLIT_STEP_PX = 16;

/**
 * The editor column's width `px` within `width`, kept `min` from the start and `minEnd` from the end; the middle when
 * both cannot be.
 */
export function clampSplit(px: number, width: number, min: number = SPLIT_MIN_PX, minEnd: number = min): number {
    if (width <= min + minEnd) return width / 2;
    return Math.min(width - minEnd, Math.max(min, px));
}

/** The ratio of a clamped position. */
export function splitRatio(px: number, width: number, min: number = SPLIT_MIN_PX, minEnd: number = min): number {
    return width > 0 ? clampSplit(px, width, min, minEnd) / width : DEFAULT_SPLIT_RATIO;
}

const validRatio = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 1;

/** The stored ratio, the default when absent, broken or unreadable. */
export function readSplitRatio(storage: Pick<Storage, 'getItem'> | null = defaultStorage()): number {
    try {
        const raw = storage?.getItem(SPLIT_STORAGE_KEY);
        if (raw === null || raw === undefined) return DEFAULT_SPLIT_RATIO;
        const value: unknown = JSON.parse(raw);
        return validRatio(value) ? value : DEFAULT_SPLIT_RATIO;
    } catch {
        return DEFAULT_SPLIT_RATIO;
    }
}

/** Stores the ratio; a storage that refuses is ignored. */
export function writeSplitRatio(ratio: number, storage: Pick<Storage, 'setItem'> | null = defaultStorage()): void {
    if (!validRatio(ratio)) return;
    try {
        storage?.setItem(SPLIT_STORAGE_KEY, JSON.stringify(ratio));
    } catch {
        // Private mode or a full quota: the ratio lives for this tab only.
    }
}

function defaultStorage(): Storage | null {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
        return null;
    }
}

/**
 * Where the split is measured: the left edge of the editor column's flexible part and the width it shares with the
 * right pane's, the columns' paddings and borders left out; the minimums of either part, the default `SPLIT_MIN_PX`.
 */
export interface SplitArea {
    readonly left: number;
    readonly width: number;
    readonly minStart?: number;
    readonly minEnd?: number;
}

export interface ColumnSplitterProps {
    readonly ratio: number;
    readonly onRatio: (ratio: number) => void;
    /** The area now, null while it is not laid out. */
    readonly area: () => SplitArea | null;
}

/** The splitter itself: a focusable vertical separator. */
export function ColumnSplitter({ ratio, onRatio, area }: ColumnSplitterProps): React.ReactElement {
    const dragging = useRef<number | null>(null);
    const last = useRef(ratio);
    last.current = ratio;

    const moveTo = (px: number): number | null => {
        const a = area();
        if (!a || a.width <= 0) return null;
        const next = splitRatio(px, a.width, a.minStart ?? SPLIT_MIN_PX, a.minEnd ?? a.minStart ?? SPLIT_MIN_PX);
        onRatio(next);
        return next;
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        dragging.current = e.pointerId;
    };
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragging.current !== e.pointerId) return;
        const a = area();
        if (a) last.current = moveTo(e.clientX - a.left) ?? last.current;
    };
    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragging.current !== e.pointerId) return;
        dragging.current = null;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        writeSplitRatio(last.current);
    };
    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        e.stopPropagation();
        const a = area();
        if (!a) return;
        const next = moveTo(ratio * a.width + (e.key === 'ArrowLeft' ? -SPLIT_STEP_PX : SPLIT_STEP_PX));
        if (next !== null) writeSplitRatio(next);
    };
    const onDoubleClick = () => {
        onRatio(DEFAULT_SPLIT_RATIO);
        writeSplitRatio(DEFAULT_SPLIT_RATIO);
    };

    return (
        <div
            className="codegen-tpl__splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the editor and the generation"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ratio * 100)}
            tabIndex={0}
            title="Drag to resize; double-click to reset"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            onDoubleClick={onDoubleClick}
        />
    );
}
