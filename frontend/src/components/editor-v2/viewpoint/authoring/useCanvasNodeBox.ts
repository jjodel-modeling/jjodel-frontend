/**
 * useCanvasNodeBox — the box of the canvas node rendering a view, read from
 * the DOM of the canvas that stays mounted under the modal.
 *
 * The content-driven size (useContentSize.ts) writes top-level width/height on
 * the React Flow node and @xyflow/react applies them as inline styles on the
 * .react-flow__node wrapper, so the wrapper's offsetWidth/offsetHeight ARE the
 * derived box, zoom-immune (layout metrics ignore the viewport scale(), the
 * same measured fact useContentSize relies on). The modal lives outside every
 * ReactFlow provider (App root), so the DOM is the one channel that needs no
 * engine change: the engine is consumed, never touched, and nothing is written
 * back anywhere.
 *
 * Resolution: the IR branch of ObjectNode marks its .mm-node with data-viewid.
 * The first match inside the ACTIVE dock pane wins: rc-dock keeps inactive
 * panes mounted and laid out off-screen, so an unfiltered query could return a
 * stale node of a hidden tab; the active pane carries .dock-tabpane-active.
 * closest('.react-flow__node') then supplies the box and, through data-id, the
 * representative vertex (used by the caller for the isResized read). With
 * several instances of the same view the first match in DOM order is the
 * representative, a ratified choice.
 *
 * Since slice 5 the same walk also serves useCanvasNodeBoxes(viewId, max), which
 * keeps the first `max` matches instead of the first one (D8): one scan, so the
 * single hook's "representative" and the multi hook's first tile are the same node
 * by construction and not by coincidence.
 *
 * Live update: a ResizeObserver on the resolved wrapper (fires only on real
 * size changes, after layout, whatever the cause: label edit, form change,
 * manual resize, reset size) plus a re-resolution on every render of the
 * caller, which already follows the ir via useSelector and so re-renders at
 * most once per debounced commit. No polling, no events, no per-keystroke
 * work. When nothing resolves the hook answers null and the caller degrades
 * honestly (symbolic fallback), never with an invented number.
 */

import { useEffect, useRef, useState } from 'react';

export interface CanvasNodeBox {
    /** wrapper offsetWidth, canvas layout px */
    readonly w: number;
    /** wrapper offsetHeight, canvas layout px */
    readonly h: number;
    /** data-id of the wrapper: the representative RF vertex for this view */
    readonly vertexId: string;
}

function sameBox(a: CanvasNodeBox | null, b: CanvasNodeBox | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.w === b.w && a.h === b.h && a.vertexId === b.vertexId;
}

/**
 * The .react-flow__node wrappers rendering `viewId` inside an active dock pane, in
 * DOM order, at most `max`. One scan for both hooks: the single-box one is this same
 * walk stopped at the first hit, so "the representative" and "the first instance"
 * cannot come to mean two different nodes.
 */
function resolveCanvasNodes(viewId: string, max: number): HTMLElement[] {
    const out: HTMLElement[] = [];
    if (!(max > 0)) return out;
    const marks = document.querySelectorAll<HTMLElement>(`.mm-node[data-viewid="${CSS.escape(viewId)}"]`);
    for (const mark of Array.from(marks)) {
        const pane = mark.closest('.dock-tabpane');
        if (pane && !pane.classList.contains('dock-tabpane-active')) continue;
        const wrapper = mark.closest<HTMLElement>('.react-flow__node');
        if (!wrapper || out.includes(wrapper)) continue;
        out.push(wrapper);
        if (out.length >= max) break;
    }
    return out;
}

/** First .react-flow__node wrapper rendering `viewId` inside an active dock pane. */
function resolveCanvasNode(viewId: string): HTMLElement | null {
    return resolveCanvasNodes(viewId, 1)[0] ?? null;
}

function readBox(wrapper: HTMLElement): CanvasNodeBox | null {
    const vertexId = wrapper.getAttribute('data-id');
    if (!vertexId) return null;
    const w = wrapper.offsetWidth;
    const h = wrapper.offsetHeight;
    if (!(w > 0) || !(h > 0)) return null;
    return { w, h, vertexId };
}

export function useCanvasNodeBox(viewId: string | null): CanvasNodeBox | null {
    const [box, setBox] = useState<CanvasNodeBox | null>(null);
    const observed = useRef<HTMLElement | null>(null);
    const observer = useRef<ResizeObserver | null>(null);

    // No dependency array on purpose (same discipline as useContentSize): the
    // trigger is a render of the caller, which is when the resolved element can
    // have changed. The state write is equality-guarded, so an idle render
    // costs one query and converges without looping.
    useEffect(() => {
        const el = viewId ? resolveCanvasNode(viewId) : null;
        if (el !== observed.current) {
            observer.current?.disconnect();
            observer.current = null;
            observed.current = el;
            if (el) {
                const ro = new ResizeObserver(() => {
                    const next = observed.current ? readBox(observed.current) : null;
                    setBox(prev => (sameBox(prev, next) ? prev : next));
                });
                ro.observe(el);
                observer.current = ro;
            }
        }
        const next = el ? readBox(el) : null;
        setBox(prev => (sameBox(prev, next) ? prev : next));
    });

    // Disconnect on unmount only; element swaps are handled above.
    useEffect(() => () => {
        observer.current?.disconnect();
        observer.current = null;
        observed.current = null;
    }, []);

    return box;
}

function sameBoxes(a: readonly CanvasNodeBox[], b: readonly CanvasNodeBox[]): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!sameBox(a[i], b[i])) return false;
    return true;
}

function sameElements(a: readonly HTMLElement[], b: readonly HTMLElement[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

/** Stable identity for "no instance", so an idle render never swaps the array. */
const NO_BOXES: readonly CanvasNodeBox[] = [];

/**
 * The boxes of every canvas node rendering `viewId`, in DOM order, at most `max`
 * (slice 5, D8). Same discipline as useCanvasNodeBox, widened to a set: one
 * ResizeObserver over ALL the resolved wrappers (one observer, several targets —
 * the callback re-reads the whole set, which is what keeps the tiles consistent
 * with each other), re-resolution on every render of the caller, and an equality
 * guard element by element so an unchanged canvas returns the same array identity.
 *
 * A wrapper whose box does not read (zero-sized, mid-layout) is dropped rather than
 * reported as a hole: a tile with no numbers has nothing honest to draw.
 */
export function useCanvasNodeBoxes(viewId: string | null, max: number): readonly CanvasNodeBox[] {
    const [boxes, setBoxes] = useState<readonly CanvasNodeBox[]>(NO_BOXES);
    const observed = useRef<HTMLElement[]>([]);
    const observer = useRef<ResizeObserver | null>(null);

    // No dependency array, same reason as above: the trigger is a render of the
    // caller, and every state write is equality-guarded.
    useEffect(() => {
        const els = viewId ? resolveCanvasNodes(viewId, max) : [];
        if (!sameElements(els, observed.current)) {
            observer.current?.disconnect();
            observer.current = null;
            observed.current = els;
            if (els.length > 0) {
                const ro = new ResizeObserver(() => {
                    const next = readBoxes(observed.current);
                    setBoxes(prev => (sameBoxes(prev, next) ? prev : next));
                });
                for (const el of els) ro.observe(el);
                observer.current = ro;
            }
        }
        const next = readBoxes(els);
        setBoxes(prev => (sameBoxes(prev, next) ? prev : next));
    });

    useEffect(() => () => {
        observer.current?.disconnect();
        observer.current = null;
        observed.current = [];
    }, []);

    return boxes;
}

function readBoxes(els: readonly HTMLElement[]): readonly CanvasNodeBox[] {
    const out: CanvasNodeBox[] = [];
    for (const el of els) {
        const b = readBox(el);
        if (b) out.push(b);
    }
    return out.length > 0 ? out : NO_BOXES;
}

export default useCanvasNodeBox;
