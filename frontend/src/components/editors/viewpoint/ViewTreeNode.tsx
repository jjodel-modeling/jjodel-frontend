import React, {useState} from 'react';

export type TreeNodeType = 'viewpoint' | 'model' | 'graph' | 'view';

export interface ViewTreeNodeData {
    id: string;
    name: string;
    nodeType: TreeNodeType;
    isExclusive?: boolean;
    children?: ViewTreeNodeData[];
}

interface ViewTreeNodeProps {
    node: ViewTreeNodeData;
    depth: number;
    selectedNodeId: string | null;
    onNodeSelect: (nodeId: string, nodeType: TreeNodeType) => void;
    defaultExpanded?: boolean;
}

const badgeConfig: Record<TreeNodeType, { letter: string; bg: string; color: string }> = {
    viewpoint: { letter: 'VP', bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
    model:     { letter: 'M',  bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
    graph:     { letter: 'G',  bg: 'rgba(20,184,166,0.15)',  color: '#14b8a6' },
    view:      { letter: 'V',  bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
};

const ViewTreeNode: React.FC<ViewTreeNodeProps> = ({
    node,
    depth,
    selectedNodeId,
    onNodeSelect,
    defaultExpanded = true,
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeId === node.id;
    const badge = badgeConfig[node.nodeType];

    const levelClass = depth <= 2 ? `view-tree__node--level-${depth}` : '';

    return (
        <>
            <div
                className={`view-tree__node ${levelClass} ${isSelected ? 'view-tree__node--selected' : ''}`}
                onClick={() => onNodeSelect(node.id, node.nodeType)}
            >
                {hasChildren ? (
                    <span
                        className="view-tree__toggle"
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    >
                        {expanded ? '▼' : '▶'}
                    </span>
                ) : (
                    <span className="view-tree__toggle">&nbsp;</span>
                )}
                <span
                    className="view-tree__badge"
                    style={{ background: badge.bg, color: badge.color }}
                >
                    {badge.letter}
                </span>
                <span className="view-tree__name">{node.name || 'Unnamed'}</span>
                {node.nodeType === 'view' && !node.isExclusive && (
                    <i className={'bi bi-layers view-tree__icon'} title={'Overlay'} />
                )}
            </div>
            {hasChildren && expanded && node.children!.map(child => (
                <ViewTreeNode
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={onNodeSelect}
                />
            ))}
        </>
    );
};

export default ViewTreeNode;
