import React, { useState, useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import ViewpointRenderer from '../viewpoint/ViewpointRenderer';

export interface ClassNodeData {
    label: string;
    attributes?: Array<{ name: string; type: string }>;
    jsxString?: string;
    [key: string]: unknown;
}

export type ClassNodeType = Node<ClassNodeData, 'classNode'>;

function ClassNode({ data, selected }: NodeProps<ClassNodeType>) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(data.label);

    const handleDoubleClick = useCallback(() => {
        setEditing(true);
    }, []);

    const handleBlur = useCallback(() => {
        setEditing(false);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setEditing(false);
        }
    }, []);

    // If there's a jsxString, use ViewpointRenderer
    if (data.jsxString) {
        return (
            <div className={`class-node viewpoint-wrapper ${selected ? 'selected' : ''}`}>
                <Handle type="target" position={Position.Left} />
                <ViewpointRenderer jsxString={data.jsxString} context={data} />
                <Handle type="source" position={Position.Right} />
            </div>
        );
    }

    return (
        <div className={`class-node ${selected ? 'selected' : ''}`}>
            <Handle type="target" position={Position.Left} />

            <div className="class-node__header" onDoubleClick={handleDoubleClick}>
                {editing ? (
                    <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                    />
                ) : (
                    <span>{name}</span>
                )}
            </div>

            {data.attributes?.map((attr, i) => (
                <div key={i} className="class-node__field">
                    <span className="field-name">{attr.name}</span>
                    <span className="field-type">{attr.type}</span>
                </div>
            ))}

            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default ClassNode;
