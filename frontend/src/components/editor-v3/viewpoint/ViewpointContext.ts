/**
 * Editor V3 — ViewpointContext: builds the execution context for custom JSX views.
 *
 * The context provides model data, graph node, view element, and view stack
 * to the compiled JSX function at render time.
 */

import { useMemo } from 'react';
import { LPointerTargetable } from '../../../joiner';
import type { ViewContext, ModelSnapshot } from '../types';

/**
 * Build a ViewContext for rendering a custom view.
 *
 * @param modelElementId - ID of the DModelElement (DClass, DObject, etc.)
 * @param viewId - ID of the DViewElement
 * @param modelSnapshot - Pre-built snapshot from the sync layer
 */
export function buildViewContext(
    modelElementId: string,
    viewId: string | null,
    modelSnapshot: ModelSnapshot,
): ViewContext {
    let data: any = null;
    let node: any = null;
    let view: any = null;
    const views: any[] = [];

    try {
        data = LPointerTargetable.fromPointer(modelElementId);
    } catch { /* ignore */ }

    try {
        if (viewId) {
            view = LPointerTargetable.fromPointer(viewId);
        }
    } catch { /* ignore */ }

    return {
        data,
        node,
        view,
        views,
        constants: {},
        usageDeclarations: {},
    };
}

/**
 * React hook version — memoizes the context based on key inputs.
 */
export function useViewContext(
    modelElementId: string,
    viewId: string | null,
    modelSnapshot: ModelSnapshot,
): ViewContext {
    return useMemo(
        () => buildViewContext(modelElementId, viewId, modelSnapshot),
        [modelElementId, viewId, modelSnapshot],
    );
}
