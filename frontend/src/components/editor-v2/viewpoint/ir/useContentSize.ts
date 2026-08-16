/**
 * useContentSize - box of a geometric shape derived from the ink it must hold.
 *
 * Closes the consumer side of the sizing contract (D8/D9): shapeRegistry.ts
 * answers "how big must the box be for this content" and this hook supplies the
 * measurement, through `boxFromIntrinsic`. It applies to shapes that carry a
 * supplement (ellipse, circle, diamond); the shapes whose outline fills its box
 * keep the CSS content-hug of irStyle.ts, which is verified behaviour.
 *
 * Three measured facts shape the implementation (discovery
 * docs/discovery/discovery_2026-08-15_cablaggio_taglia_da_contenuto.md):
 *
 * 1. The measurement must be taken at the INTRINSIC size, not on the live box.
 *    `margin: auto 0` on a centred label and the flex rows of a compartment both
 *    redistribute with the box, so a measurement taken in place moves with the
 *    box it is meant to determine, and the iteration diverges instead of
 *    converging (measured: an ellipse holding three rows went 336x88 then
 *    409x99). At `max-content` the reading is invariant over every box tried
 *    (75 cases) and reaches a fixed point in one step (15 cases).
 * 2. `max-content` goes on `.ir-node-content` itself, never on a wrapper around
 *    its children: they are flex items with an explicit `order` (irStyle.ts) and
 *    a wrapper would make that order inert and break the auto margins.
 * 3. The contract answers in content coordinates while the consumer sets a
 *    border box, so the chrome is subtracted before and added back after. That
 *    correction lives in `boxFromIntrinsic` and is worth exactly the 2px of
 *    border on a rect, where nothing else absorbs it.
 */

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useSelector } from 'react-redux';
import { useReactFlow } from '@xyflow/react';
import { boxFromIntrinsic, getShapeDescriptor, hasSizeSupplement, type IntrinsicMeasure, type Size } from './shapeRegistry';
import type { ShapeForm } from './irTypes';

const px = (v: string): number => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

/**
 * Read the content element at its intrinsic size and put it back as it was.
 *
 * The floors are neutralised so the only floors that apply are the contract's,
 * and `aspect-ratio` is dropped so a circle reports its content and not its
 * shape. `offsetWidth`/`offsetHeight` rather than a client rect: the canvas
 * viewport carries a `scale()` transform and a client rect would report screen
 * pixels, which would tie the derived box to the zoom level (measured: 152.97,
 * 76.48 and 305.94 at zoom 1, 0.5 and 2, against 153 every time for offsetWidth).
 */
function measureIntrinsic(el: HTMLElement): IntrinsicMeasure {
    const cs = getComputedStyle(el);
    const chromeX = px(cs.borderLeftWidth) + px(cs.borderRightWidth) + px(cs.paddingLeft) + px(cs.paddingRight);
    const chromeY = px(cs.borderTopWidth) + px(cs.borderBottomWidth) + px(cs.paddingTop) + px(cs.paddingBottom);
    const s = el.style;
    const saved = {
        width: s.width, height: s.height, minWidth: s.minWidth, minHeight: s.minHeight, aspectRatio: s.aspectRatio,
    };
    s.width = 'max-content';
    s.height = 'max-content';
    s.minWidth = '0';
    s.minHeight = '0';
    s.aspectRatio = 'auto';
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    s.width = saved.width;
    s.height = saved.height;
    s.minWidth = saved.minWidth;
    s.minHeight = saved.minHeight;
    s.aspectRatio = saved.aspectRatio;
    return { w, h, chromeX, chromeY };
}

/**
 * How many consecutive commits this hook may write the same size before it gives
 * up on that vertex. Three is one more than the two a legitimate settle needs
 * (write, then confirm) and far below React's nested-update limit.
 */
const MAX_UNACCEPTED_WRITES = 3;

/**
 * Keep the React Flow node sized after the content of its IR view.
 *
 * The size is written in session only, on the same channel the size propagation
 * uses (top-level width/height with `measured` reset). Nothing reaches the
 * D-layer: `syncSizeToJjom` would raise `isResized`, which is exactly the flag
 * that tells `manualSizeOf` a human chose that size, and the derived size is a
 * function of the content, to be recomputed rather than stored. That also means
 * no write-back loop: the persistence filter in EditorV2 keys on
 * `resizing !== undefined`, which a programmatic write never sets.
 *
 * A manual resize wins and switches the derivation off for that vertex, because
 * it raises `isResized`; "Reset size" clears the flag and gives the derived size
 * back.
 */
export function useContentDrivenSize(
    vertexId: string,
    form: ShapeForm | undefined,
    ref: RefObject<HTMLDivElement | null>,
): void {
    const { getNode, setNodes } = useReactFlow();
    const isResized = useSelector((s: any) => !!s?.idlookup?.[vertexId]?.isResized);
    const desc = getShapeDescriptor(form);
    const active = hasSizeSupplement(desc) && !isResized;
    /** The last size this hook wrote, to tell our own size from somebody else's. */
    const written = useRef<Size | null>(null);
    /**
     * Consecutive commits in which the store did NOT come back with the size this
     * hook wrote, while the measurement had not moved. See the budget below.
     */
    const unaccepted = useRef(0);
    const [, remeasure] = useState(0);

    // On a cold load the fonts can land after the first paint, and every
    // measurement here is a text measurement. One re-measure, armed only while
    // they are still pending, so a warm app pays nothing.
    useEffect(() => {
        const fonts = (document as any).fonts;
        if (!fonts?.ready || fonts.status === 'loaded') return;
        let alive = true;
        fonts.ready.then(() => { if (alive) remeasure(t => t + 1); });
        return () => { alive = false; };
    }, []);

    // No dependency array on purpose: the trigger is a commit of the content,
    // which is when the ink can have changed. The work is guarded below, so a
    // commit that changes nothing costs one style write and one layout read.
    useLayoutEffect(() => {
        if (!active) {
            written.current = null;
            unaccepted.current = 0;
            return;
        }
        const el = ref.current;
        if (!el) return;

        // Do not fight a size owned by somebody else. A resize drag writes
        // width/height on every pointer move while `isResized` only lands on
        // commit, so during the gesture the node carries a size that is not ours.
        const node = getNode(vertexId);
        // A vertex the React Flow store does not hold cannot be sized. Without
        // this the `curW == null` branch below reads as "nobody owns the size",
        // the write goes through, `nds.map` matches nothing, and `setNodes` still
        // hands the store a fresh array — a commit per commit, forever. React
        // kills the tree at the 50th nested update and the canvas goes white.
        if (!node) {
            written.current = null;
            unaccepted.current = 0;
            return;
        }
        const curW = node.width;
        const curH = node.height;
        const mine = written.current;
        const ours = curW == null || curH == null
            || (mine !== null && curW === mine.w && curH === mine.h);
        if (!ours) {
            unaccepted.current = 0;
            return;
        }

        const size = boxFromIntrinsic(desc, measureIntrinsic(el));
        // Same answer as last commit: the measurement has not moved, so if the
        // store still disagrees it is not going to start agreeing.
        const sameTarget = mine !== null && mine.w === size.w && mine.h === size.h;
        written.current = size;
        if (curW === size.w && curH === size.h) {
            unaccepted.current = 0;
            return;
        }
        if (!sameTarget) unaccepted.current = 0;

        // Write budget. The effect has no dependency array on purpose (the trigger
        // is a commit of the content), so its only guarantee of termination is
        // that the next commit observes the size just written. When another writer
        // resets it on every cycle that guarantee is void and the two ping-pong.
        // Yielding costs a node drawn at the CSS content-hug size; not yielding
        // costs the whole canvas.
        unaccepted.current += 1;
        if (unaccepted.current > MAX_UNACCEPTED_WRITES) {
            if (unaccepted.current === MAX_UNACCEPTED_WRITES + 1) {
                console.warn(
                    '[useContentDrivenSize] size write not adopted by the store, yielding',
                    { vertexId, form, store: { w: curW, h: curH }, derived: size },
                );
            }
            return;
        }

        setNodes(nds => {
            let changed = false;
            const next = nds.map(n => {
                if (n.id !== vertexId) return n;
                if (n.width === size.w && n.height === size.h) return n;
                changed = true;
                return { ...n, width: size.w, height: size.h, measured: undefined };
            });
            // Same reference when nothing moved: the store skips the update and the
            // commit that would have re-run this effect never happens.
            return changed ? next : nds;
        });
    });
}
