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
}

export const EdgeFallbackCard = React.forwardRef<HTMLDivElement, EdgeFallbackCardProps>(
    function EdgeFallbackCard({ data, srcL, tgtL, className, children, ...rest }, ref): React.ReactElement {
        const base = 'root jjodel-default-view jjodel-default-view--edge-like jjodel-default-view--edge-fallback';
        const name: string = data && data.name ? data.name : 'unnamed';
        const typeName: string | null =
            data && data.instanceof && data.instanceof.name ? data.instanceof.name : null;
        const srcName: string = srcL && srcL.name ? srcL.name : '?';
        const tgtName: string = tgtL && tgtL.name ? tgtL.name : '?';

        return (
            <div ref={ref} className={base + (className ? ' ' + className : '')} {...rest}>
                <div className={'jjodel-default-view__header'}>
                    <label className={'jjodel-default-view__name'}>{name}</label>
                    {typeName ? <span className={'jjodel-default-view__type'}>{typeName}</span> : null}
                </div>
                <div className={'jjodel-default-view__edge-preview'}>{srcName + ' → ' + tgtName}</div>
            </div>
        );
    }
);

export default EdgeFallbackCard;
