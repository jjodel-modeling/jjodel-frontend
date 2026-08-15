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

/** First .react-flow__node wrapper rendering `viewId` inside an active dock pane. */
function resolveCanvasNode(viewId: string): HTMLElement | null {
    const marks = document.querySelectorAll<HTMLElement>(`.mm-node[data-viewid="${CSS.escape(viewId)}"]`);
    for (const mark of Array.from(marks)) {
        const pane = mark.closest('.dock-tabpane');
        if (pane && !pane.classList.contains('dock-tabpane-active')) continue;
        const wrapper = mark.closest<HTMLElement>('.react-flow__node');
        if (wrapper) return wrapper;
    }
    return null;
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

export default useCanvasNodeBox;
