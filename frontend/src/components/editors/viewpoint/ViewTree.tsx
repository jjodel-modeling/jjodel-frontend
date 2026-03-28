import React, {useMemo} from 'react';
import ViewTreeNode, {ViewTreeNodeData, TreeNodeType} from './ViewTreeNode';
import {LViewPoint, LViewElement, DViewPoint} from '../../../joiner';

interface ViewTreeProps {
    viewpoint: LViewPoint;
    selectedNodeId: string | null;
    onNodeSelect: (nodeId: string, nodeType: TreeNodeType) => void;
    onCreateView: () => void;
}

function buildViewChildren(lView: LViewElement): ViewTreeNodeData[] {
    const children: ViewTreeNodeData[] = [];
    let subViews: LViewElement[];
    try {
        subViews = lView.subViews || [];
    } catch {
        subViews = [];
    }
    for (const sv of subViews) {
        if (!sv) continue;
        children.push({
            id: sv.id,
            name: sv.name || 'Unnamed View',
            nodeType: 'view',
            isExclusive: sv.__raw?.isExclusiveView ?? false,
            children: buildViewChildren(sv),
        });
    }
    return children;
}

function buildTreeData(viewpoint: LViewPoint): ViewTreeNodeData {
    const vpRaw = viewpoint.__raw;
    const isVP = vpRaw?.className === DViewPoint.cname;

    // Build flat list of child views grouped under the viewpoint
    const childViews = buildViewChildren(viewpoint as any as LViewElement);

    return {
        id: viewpoint.id,
        name: viewpoint.name || 'Unnamed Viewpoint',
        nodeType: 'viewpoint',
        children: childViews,
    };
}

const ViewTree: React.FC<ViewTreeProps> = ({
    viewpoint,
    selectedNodeId,
    onNodeSelect,
    onCreateView,
}) => {
    const treeData = useMemo(() => buildTreeData(viewpoint), [viewpoint]);

    return (
        <div className="view-tree">
            <div className="view-tree__header">
                <span>Views</span>
            </div>
            <div className="view-tree__content">
                <ViewTreeNode
                    node={treeData}
                    depth={0}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={onNodeSelect}
                />
            </div>
            <div className="view-tree__footer">
                <button
                    className="view-tree__add-btn"
                    onClick={onCreateView}
                    title="Create new view"
                >
                    <i className="bi bi-plus" /> New View
                </button>
            </div>
        </div>
    );
};

export default ViewTree;
