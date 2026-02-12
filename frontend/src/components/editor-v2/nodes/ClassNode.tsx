import { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import ViewpointRenderer from '../viewpoint/ViewpointRenderer';
import { useEditorContextSafe } from '../contexts/EditorContext';

export interface ClassNodeData {
    label: string;
    attributes?: Array<{ name: string; type: string }>;
    jsxString?: string;
    [key: string]: unknown;
}

export type ClassNodeType = Node<ClassNodeData, 'classNode'>;

function ClassNode({ id, data, selected }: NodeProps<ClassNodeType>) {
    const { setNodes } = useReactFlow();
    const editorContext = useEditorContextSafe();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(data.label);

    // Sync local state when data.label changes externally (e.g., from PropertiesPanel or undo)
    useEffect(() => {
        setName(data.label);
    }, [data.label]);

    const handleDoubleClick = useCallback(() => {
        setEditing(true);
    }, []);

    const commitName = useCallback(() => {
        setEditing(false);
        // Only update if name actually changed
        if (name !== data.label) {
            // Take snapshot for undo before changing
            editorContext?.takeSnapshot();
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === id ? { ...n, data: { ...n.data, label: name } } : n
                )
            );
        }
    }, [id, name, data.label, setNodes, editorContext]);

    const handleBlur = useCallback(() => {
        commitName();
    }, [commitName]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                commitName();
            } else if (e.key === 'Escape') {
                setName(data.label); // Revert to original
                setEditing(false);
            }
        },
        [commitName, data.label]
    );

    // If there's a jsxString, use ViewpointRenderer
    if (data.jsxString) {
        return (
            <div className={`class-node viewpoint-wrapper ${selected ? 'selected' : ''}`}>
                <NodeResizer
                    isVisible={selected}
                    minWidth={120}
                    minHeight={60}
                    lineClassName="node-resize-line"
                    handleClassName="node-resize-handle"
                />
                {/* 4 anchor points */}
                <Handle type="target" position={Position.Top} id="top" className="anchor-handle" />
                <Handle type="source" position={Position.Right} id="right" className="anchor-handle" />
                <Handle type="target" position={Position.Bottom} id="bottom" className="anchor-handle" />
                <Handle type="source" position={Position.Left} id="left" className="anchor-handle" />
                <ViewpointRenderer jsxString={data.jsxString} context={data} />
            </div>
        );
    }

    return (
        <div className={`class-node ${selected ? 'selected' : ''}`}>
            <NodeResizer
                isVisible={selected}
                minWidth={180}
                minHeight={60}
                lineClassName="node-resize-line"
                handleClassName="node-resize-handle"
            />

            {/* 4 anchor points: top, right, bottom, left */}
            <Handle type="target" position={Position.Top} id="top" className="anchor-handle" />
            <Handle type="source" position={Position.Right} id="right" className="anchor-handle" />
            <Handle type="target" position={Position.Bottom} id="bottom" className="anchor-handle" />
            <Handle type="source" position={Position.Left} id="left" className="anchor-handle" />

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
        </div>
    );
}

export default ClassNode;
