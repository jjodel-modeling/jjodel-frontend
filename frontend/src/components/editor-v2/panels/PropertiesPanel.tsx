import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { ClassNodeData } from '../nodes/ClassNode';
import type { NestedFlowNodeData } from '../nodes/NestedFlowNode';

interface PropertiesPanelProps {
    selectedNodes: Node[];
    selectedEdges: Edge[];
    onNodeChange: (nodeId: string, data: Partial<ClassNodeData | NestedFlowNodeData>) => void;
    onEdgeChange: (edgeId: string, data: Partial<Edge>) => void;
}

/**
 * Properties panel for editing selected nodes and edges.
 * Shows different content based on selection type.
 */
function PropertiesPanel({
    selectedNodes,
    selectedEdges,
    onNodeChange,
    onEdgeChange,
}: PropertiesPanelProps) {
    const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
    const selectedEdge = selectedEdges.length === 1 ? selectedEdges[0] : null;

    // Nothing selected
    if (!selectedNode && !selectedEdge) {
        return (
            <div className="properties-panel">
                <div className="properties-panel__header">Properties</div>
                <div className="properties-panel__empty">
                    <i className="bi bi-cursor" />
                    <span>Select a node or edge</span>
                </div>
            </div>
        );
    }

    // Multiple selection
    if (selectedNodes.length > 1 || selectedEdges.length > 1) {
        const count = selectedNodes.length + selectedEdges.length;
        return (
            <div className="properties-panel">
                <div className="properties-panel__header">Properties</div>
                <div className="properties-panel__empty">
                    <i className="bi bi-collection" />
                    <span>{count} items selected</span>
                </div>
            </div>
        );
    }

    // Single node selected
    if (selectedNode) {
        return (
            <div className="properties-panel">
                <div className="properties-panel__header">
                    <i className="bi bi-box" />
                    Node Properties
                </div>
                <NodeProperties
                    node={selectedNode}
                    onChange={(data) => onNodeChange(selectedNode.id, data)}
                />
            </div>
        );
    }

    // Single edge selected
    if (selectedEdge) {
        return (
            <div className="properties-panel">
                <div className="properties-panel__header">
                    <i className="bi bi-arrow-right" />
                    Edge Properties
                </div>
                <EdgeProperties
                    edge={selectedEdge}
                    onChange={(data) => onEdgeChange(selectedEdge.id, data)}
                />
            </div>
        );
    }

    return null;
}

interface NodePropertiesProps {
    node: Node;
    onChange: (data: Partial<ClassNodeData | NestedFlowNodeData>) => void;
}

function NodeProperties({ node, onChange }: NodePropertiesProps) {
    const data = node.data as ClassNodeData | NestedFlowNodeData;

    const handleLabelChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange({ label: e.target.value });
        },
        [onChange]
    );

    return (
        <div className="properties-panel__content">
            <div className="property-group">
                <label className="property-label">ID</label>
                <div className="property-value readonly">{node.id}</div>
            </div>

            <div className="property-group">
                <label className="property-label">Type</label>
                <div className="property-value readonly">{node.type}</div>
            </div>

            <div className="property-group">
                <label className="property-label">Label</label>
                <input
                    type="text"
                    className="property-input"
                    value={data.label || ''}
                    onChange={handleLabelChange}
                />
            </div>

            <div className="property-group">
                <label className="property-label">Position</label>
                <div className="property-row">
                    <div className="property-coord">
                        <span>X</span>
                        <span>{Math.round(node.position.x)}</span>
                    </div>
                    <div className="property-coord">
                        <span>Y</span>
                        <span>{Math.round(node.position.y)}</span>
                    </div>
                </div>
            </div>

            {node.measured && (
                <div className="property-group">
                    <label className="property-label">Size</label>
                    <div className="property-row">
                        <div className="property-coord">
                            <span>W</span>
                            <span>{Math.round(node.measured.width || 0)}</span>
                        </div>
                        <div className="property-coord">
                            <span>H</span>
                            <span>{Math.round(node.measured.height || 0)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ClassNode specific: attributes */}
            {node.type === 'classNode' && (data as ClassNodeData).attributes && (
                <div className="property-group">
                    <label className="property-label">Attributes</label>
                    <div className="property-attributes">
                        {((data as ClassNodeData).attributes || []).map((attr, i) => (
                            <div key={i} className="property-attribute">
                                <span className="attr-name">{attr.name}</span>
                                <span className="attr-type">{attr.type}</span>
                            </div>
                        ))}
                        {((data as ClassNodeData).attributes || []).length === 0 && (
                            <div className="property-empty-list">No attributes</div>
                        )}
                    </div>
                </div>
            )}

            {/* NestedFlowNode specific: children count */}
            {node.type === 'nestedFlowNode' && (
                <div className="property-group">
                    <label className="property-label">Children</label>
                    <div className="property-value readonly">
                        {((data as NestedFlowNodeData).children || []).length} vertices
                    </div>
                </div>
            )}
        </div>
    );
}

interface EdgePropertiesProps {
    edge: Edge;
    onChange: (data: Partial<Edge>) => void;
}

function EdgeProperties({ edge, onChange }: EdgePropertiesProps) {
    const handleLabelChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange({ label: e.target.value });
        },
        [onChange]
    );

    return (
        <div className="properties-panel__content">
            <div className="property-group">
                <label className="property-label">ID</label>
                <div className="property-value readonly">{edge.id}</div>
            </div>

            <div className="property-group">
                <label className="property-label">Type</label>
                <div className="property-value readonly">{edge.type || 'default'}</div>
            </div>

            <div className="property-group">
                <label className="property-label">Label</label>
                <input
                    type="text"
                    className="property-input"
                    value={String(edge.label || '')}
                    onChange={handleLabelChange}
                />
            </div>

            <div className="property-group">
                <label className="property-label">Source</label>
                <div className="property-connection">
                    <span className="conn-node">{edge.source}</span>
                    <span className="conn-handle">{edge.sourceHandle || 'default'}</span>
                </div>
            </div>

            <div className="property-group">
                <label className="property-label">Target</label>
                <div className="property-connection">
                    <span className="conn-node">{edge.target}</span>
                    <span className="conn-handle">{edge.targetHandle || 'default'}</span>
                </div>
            </div>
        </div>
    );
}

export default PropertiesPanel;
