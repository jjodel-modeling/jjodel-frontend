/**
 * Editor V3 — ModelNodeContent: the viewpoint dispatcher.
 *
 * Resolves what to render for a given model element:
 * 1. If viewId is set → custom viewpoint (ViewpointRenderer)
 * 2. If built-in view found for (notation, kind) → render built-in view
 * 3. Fallback → simple label box
 *
 * This component is the bridge between ModelNode (structural) and the
 * viewpoint system (visual).
 */

import React, { memo } from 'react';
import { getBuiltInView, isCustomView, type BuiltInViewProps } from './registry/ViewRegistry';
import { ViewpointRenderer } from './ViewpointRenderer';
import type { ModelNodeData } from '../types';

// Ensure all built-in views are registered
import './notations';

export interface ModelNodeContentProps {
    nodeId: string;
    data: ModelNodeData;
    isSelected: boolean;
    width: number;
    height: number;
    onStartEditing?: (field: string) => void;
}

function ModelNodeContentInner({
    nodeId,
    data,
    isSelected,
    width,
    height,
    onStartEditing,
}: ModelNodeContentProps) {
    const { viewId, notation, colorScheme, theme, modelSnapshot, modelElementId, label } = data;

    // Path 1: Custom viewpoint — render via ViewpointRenderer (JSX pipeline)
    if (isCustomView(viewId)) {
        return (
            <ViewpointRenderer
                modelElementId={modelElementId}
                viewId={viewId!}
                modelSnapshot={modelSnapshot}
                width={width}
                height={height}
            />
        );
    }

    // Path 2: Built-in view from registry
    const BuiltInComponent = getBuiltInView(notation, modelSnapshot.kind);
    if (BuiltInComponent) {
        const props: BuiltInViewProps = {
            modelElementId,
            label,
            modelSnapshot,
            notation,
            colorScheme,
            theme,
            width,
            height,
            isSelected,
            onStartEditing,
        };
        return <BuiltInComponent {...props} />;
    }

    // Path 3: Fallback — try 'uml' notation if current notation has no view
    if (notation !== 'uml') {
        const FallbackComponent = getBuiltInView('uml', modelSnapshot.kind);
        if (FallbackComponent) {
            const props: BuiltInViewProps = {
                modelElementId,
                label,
                modelSnapshot,
                notation: 'uml',
                colorScheme,
                theme,
                width,
                height,
                isSelected,
                onStartEditing,
            };
            return <FallbackComponent {...props} />;
        }
    }

    // Path 4: Last resort — plain label
    return (
        <div className="v3-node__fallback">
            <div className="v3-node__header">
                <span className="v3-node__name">{data.label}</span>
            </div>
        </div>
    );
}

export const ModelNodeContent = memo(ModelNodeContentInner);
