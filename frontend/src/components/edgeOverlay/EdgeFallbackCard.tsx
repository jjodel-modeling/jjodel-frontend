import React from 'react';

/**
 * L2 — Native fallback card for an isEdge view whose endpoint expressions are NOT both resolvable.
 *
 * Phase 2A moved isEdge handling out of the default jsxString into the TS rendering layer
 * (`graphElement.tsx` `renderView`): for an edge view, both endpoints resolved -> the template
 * returns `null` (the SVG `EdgeOverlay` draws the arc); at least one unresolved -> this card is
 * rendered instead, so the instance stays visible, selectable, and fixable from the properties
 * panel (no user trap).
 *
 * The wrapper (`GraphElementComponent`) owns selection, drag and the properties-panel link: it
 * injects `className` (with `mainView` / selection classes), `style` (`--top`/`--left`, zIndex),
 * the mouse/key handlers, and a `ref` (`this.html`) via `React.cloneElement` on this element's
 * root. Therefore:
 *   - this component is a `forwardRef` so the injected `ref` reaches the root DOM node (jQuery
 *     draggable attaches to it);
 *   - it merges the injected `className` AFTER its own base classes and spreads the remaining
 *     injected props onto the single root `<div>` (never a Fragment — `cloneElement` needs one
 *     element).
 *
 * Styling is the existing `.jjodel-default-view --edge-like --edge-fallback` rules in
 * `frontend/src/styles/default-view.scss` (dashed cyan border, compact, preview visible, hint
 * hidden). The component renders only header (plain-text name + type pill) and the `S1 → ?`
 * preview — name editing happens through the properties panel, not inline.
 */
export interface EdgeFallbackCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The M1 LObject instance carrying the edge (e.g. T1). */
    data: any;
    /** Resolved source endpoint LObject, or a falsy value when unresolved. */
    srcL: any;
    /** Resolved target endpoint LObject, or a falsy value when unresolved. */
    tgtL: any;
    /** Decorator overlays (validation/constraint badges) from the wrapper's `otherViews`. Pre-rendered
     *  elements injected by `GraphElementComponent.renderView`; rendered inside the card root for native
     *  parity (the pre-2A `<View>` fallback rendered `{decorators}`). */
    decorators?: React.ReactNode;
}

// L2 — scalar props that `GraphElementComponent` injects from `this.props` onto this card via cloneElement
// (graphElement.tsx:1496-1499). The pre-2A `<View>` fallback absorbed them; this native `<div>` would
// otherwise emit React "unknown DOM attribute" warnings for each. The wrapper's selection/drag hooks
// (`id`, `data-nodeid`, `style`, `on*`, `tabIndex`) are DOM-valid and intentionally NOT listed here, so
// they keep passing through untouched.
const NON_DOM_INJECTED_PROPS = [
    'nodeid', 'dataid', 'viewid', 'parentviewid', 'parentnodeid', 'graphid', 'parentViewId', 'htmlindex',
    'isGraph', 'isGraphVertex', 'isVertex', 'isEdgePoint', 'isEdge', 'isVoid', 'isField',
];

export const EdgeFallbackCard = React.forwardRef<HTMLDivElement, EdgeFallbackCardProps>(
    function EdgeFallbackCard({ data, srcL, tgtL, decorators, className, children, ...rest }, ref): React.ReactElement {
        const base = 'root jjodel-default-view jjodel-default-view--edge-like jjodel-default-view--edge-fallback';
        const name: string = data && data.name ? data.name : 'unnamed';
        const typeName: string | null =
            data && data.instanceof && data.instanceof.name ? data.instanceof.name : null;
        const srcName: string = srcL && srcL.name ? srcL.name : '?';
        const tgtName: string = tgtL && tgtL.name ? tgtL.name : '?';
        // Keep only DOM-valid props on the native root; strip the wrapper-injected non-DOM scalars
        // (see NON_DOM_INJECTED_PROPS note above).
        const domProps = Object.fromEntries(
            Object.entries(rest).filter(([k]) => !NON_DOM_INJECTED_PROPS.includes(k)),
        );

        return (
            <div ref={ref} className={base + (className ? ' ' + className : '')} {...domProps}>
                <div className={'jjodel-default-view__header'}>
                    <label className={'jjodel-default-view__name'}>{name}</label>
                    {typeName ? <span className={'jjodel-default-view__type'}>{typeName}</span> : null}
                </div>
                <div className={'jjodel-default-view__edge-preview'}>{srcName + ' → ' + tgtName}</div>
                {decorators}
            </div>
        );
    }
);

export default EdgeFallbackCard;
