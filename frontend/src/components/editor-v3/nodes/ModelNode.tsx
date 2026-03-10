/**
 * Editor V3 — ModelNode: THE single node type for all elements.
 *
 * Structural wrapper: handles selection, resize, anchors, inline editing.
 * Delegates all visual rendering to ModelNodeContent (viewpoint dispatcher).
 */

import React, { useCallback, useState, memo } from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import type { ModelNodeData } from '../types';
import { DynamicAnchors } from './DynamicAnchors';
import { InlineEditor } from './InlineEditor';
import { ModelNodeContent } from '../viewpoint/ModelNodeContent';
import { syncSizeToJjom, syncNodeLabel } from '../sync/canvasToJjomV3';
import { MIN_NODE_WIDTH, MIN_NODE_HEIGHT } from '../constants';

function ModelNodeComponent({ id, data: rawData, selected }: NodeProps) {
    // Cast from Record<string, unknown> to our typed ModelNodeData
    const data = rawData as unknown as ModelNodeData;
    const {
        modelElementId,
        modelClassName,
        label,
        width,
        height,
        anchors,
        cssState,
        zoom,
    } = data;

    // Inline editing state
    const [editingField, setEditingField] = useState<string | null>(null);

    // Resize handler
    const handleResize = useCallback((_event: any, params: { width: number; height: number }) => {
        syncSizeToJjom(id, params.width, params.height);
    }, [id]);

    // Start inline editing
    const handleStartEditing = useCallback((field: string) => {
        setEditingField(field);
    }, []);

    // Commit inline edit
    const handleCommitEdit = useCallback((newValue: string) => {
        if (editingField === 'name') {
            syncNodeLabel(modelElementId, newValue);
        }
        // Future: handle attr:id, op:id, lit:id, ref:id edits
        setEditingField(null);
    }, [editingField, modelElementId]);

    // Cancel inline edit
    const handleCancelEdit = useCallback(() => {
        setEditingField(null);
    }, []);

    // Determine CSS class based on element type
    const typeClass = `v3-node--${modelClassName.replace('D', '').toLowerCase()}`;

    return (
        <div
            className={`v3-node ${typeClass} ${selected ? 'v3-node--selected' : ''}`}
            style={{
                ...cssState as React.CSSProperties,
                transform: zoom.x !== 1 || zoom.y !== 1
                    ? `scale(${zoom.x}, ${zoom.y})`
                    : undefined,
            }}
        >
            <NodeResizer
                isVisible={selected}
                minWidth={MIN_NODE_WIDTH}
                minHeight={MIN_NODE_HEIGHT}
                onResizeEnd={handleResize}
            />

            <DynamicAnchors nodeId={id} anchors={anchors} />

            <div className="v3-node__content">
                {editingField === 'name' ? (
                    <div className="v3-node__header">
                        <InlineEditor
                            value={label}
                            onCommit={handleCommitEdit}
                            onCancel={handleCancelEdit}
                            className="v3-inline-editor--name"
                            placeholder="Name"
                        />
                    </div>
                ) : (
                    <ModelNodeContent
                        nodeId={id}
                        data={data}
                        isSelected={!!selected}
                        width={width}
                        height={height}
                        onStartEditing={handleStartEditing}
                    />
                )}
            </div>
        </div>
    );
}

export const ModelNode = memo(ModelNodeComponent);
