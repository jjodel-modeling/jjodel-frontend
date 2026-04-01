import React, { useMemo } from 'react';
import { LPointerTargetable, LViewPoint, Defaults, Pointer } from '../../../joiner';
import { TreeNodeType } from './ViewTreeNode';
import ViewpointProperties from './properties/ViewpointProperties';
import ViewProperties from './properties/ViewProperties';
import NodeProperties from './properties/NodeProperties';
import './properties/properties.scss';

interface WorkbenchPropertiesProps {
    viewpointId: string;
    selectedNodeId: string | null;
    selectedNodeType: TreeNodeType | null;
    isExpertMode: boolean;
    style?: React.CSSProperties;
}

const WorkbenchProperties: React.FC<WorkbenchPropertiesProps> = ({
    viewpointId,
    selectedNodeId,
    selectedNodeType,
    isExpertMode,
    style,
}) => {
    const lViewpoint = useMemo(() => {
        try {
            return LPointerTargetable.fromPointer(viewpointId as Pointer) as LViewPoint;
        } catch { return null; }
    }, [viewpointId]);

    // Compute readOnly: default views are read-only unless in expert mode
    const readOnly = useMemo(() => {
        if (!selectedNodeId || selectedNodeType !== 'view') return false;
        return !isExpertMode && Defaults.check(selectedNodeId);
    }, [selectedNodeId, selectedNodeType, isExpertMode]);

    const renderContent = () => {
        // No selection or viewpoint selected → show viewpoint properties
        if (!selectedNodeId || selectedNodeType === 'viewpoint') {
            if (!lViewpoint) {
                return (
                    <div className="workbench-properties__empty">
                        <i className="bi bi-sliders" style={{ fontSize: 20, color: '#94a3b8' }} />
                        <span>No viewpoint loaded</span>
                    </div>
                );
            }
            return (
                <ViewpointProperties
                    viewpoint={lViewpoint}
                    readOnly={!isExpertMode && Defaults.check(viewpointId)}
                />
            );
        }

        // View selected → full property panel
        if (selectedNodeType === 'view') {
            return (
                <ViewProperties
                    viewId={selectedNodeId}
                    viewpointId={viewpointId}
                    isExpertMode={isExpertMode}
                    readOnly={readOnly}
                />
            );
        }

        // Model or Graph selected
        if (selectedNodeType === 'model' || selectedNodeType === 'graph') {
            return (
                <NodeProperties
                    nodeId={selectedNodeId}
                    nodeType={selectedNodeType}
                />
            );
        }

        return (
            <div className="workbench-properties__empty">
                <i className="bi bi-sliders" style={{ fontSize: 20, color: '#94a3b8' }} />
                <span>Select an item to see its properties</span>
            </div>
        );
    };

    return (
        <div className="viewpoint-workbench__properties" style={style}>
            {renderContent()}
        </div>
    );
};

export default WorkbenchProperties;
