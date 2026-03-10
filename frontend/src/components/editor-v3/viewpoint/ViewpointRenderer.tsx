/**
 * Editor V3 — ViewpointRenderer: renders a custom JSX view inside a React Flow node.
 *
 * Handles:
 * - Loading the DViewElement from JjOM
 * - Getting/compiling the view from cache
 * - Building the execution context
 * - Injecting scoped CSS
 * - Wrapping in error boundary
 *
 * Used by ModelNodeContent when a node has a non-null viewId.
 */

import React, { useMemo, memo } from 'react';
import { LPointerTargetable } from '../../../joiner';
import { viewpointCache } from './ViewpointCache';
import { useViewContext } from './ViewpointContext';
import { viewpointBuiltins } from './builtins/BuiltInComponents';
import { ScopedCSS } from './builtins/ScopedCSS';
import { ViewpointErrorBoundary } from './builtins/ErrorBoundary';
import type { ModelSnapshot, CompiledView } from '../types';

export interface ViewpointRendererProps {
    modelElementId: string;
    viewId: string;
    modelSnapshot: ModelSnapshot;
    width: number;
    height: number;
}

/**
 * Hook: get or compile the view for a viewId.
 */
function useCompiledView(viewId: string): CompiledView {
    return useMemo(() => {
        try {
            const viewElement = LPointerTargetable.fromPointer(viewId);
            if (!viewElement) {
                return {
                    render: () => null,
                    css: '',
                    hash: '',
                    error: `View element not found: ${viewId}`,
                };
            }
            return viewpointCache.get(viewId, viewElement);
        } catch (e) {
            return {
                render: () => null,
                css: '',
                hash: '',
                error: e instanceof Error ? e.message : String(e),
            };
        }
    }, [viewId]);
}

/**
 * ViewpointRenderer — renders a compiled custom view.
 */
function ViewpointRendererInner({
    modelElementId,
    viewId,
    modelSnapshot,
    width,
    height,
}: ViewpointRendererProps) {
    // 1. Get compiled view (cached)
    const compiledView = useCompiledView(viewId);

    // 2. Build execution context
    const context = useViewContext(modelElementId, viewId, modelSnapshot);

    // 3. Compilation error → show inline
    if (compiledView.error) {
        return (
            <div className="viewpoint-error">
                <i className="bi bi-exclamation-triangle" />
                <div className="viewpoint-error__msg">
                    <strong>Compilation Error</strong>
                    <pre>{compiledView.error}</pre>
                </div>
            </div>
        );
    }

    // 4. Render with scoped CSS + error boundary
    let rendered: React.ReactNode = null;
    try {
        rendered = (compiledView.render as any)(context, viewpointBuiltins);
    } catch (e) {
        return (
            <div className="viewpoint-error">
                <i className="bi bi-exclamation-triangle" />
                <div className="viewpoint-error__msg">
                    <strong>Render Error</strong>
                    <pre>{e instanceof Error ? e.message : String(e)}</pre>
                </div>
            </div>
        );
    }

    return (
        <ScopedCSS css={compiledView.css} viewId={viewId}>
            <ViewpointErrorBoundary viewId={viewId}>
                {rendered}
            </ViewpointErrorBoundary>
        </ScopedCSS>
    );
}

export const ViewpointRenderer = memo(ViewpointRendererInner);
