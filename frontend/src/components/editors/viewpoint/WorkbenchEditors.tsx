import React, { useCallback, useMemo } from 'react';
import { LViewElement, LPointerTargetable, Defaults } from '../../../joiner';
import { TreeNodeType } from './ViewTreeNode';
import PredicateEditor from './PredicateEditor';
import TemplateEditor from './TemplateEditor';
import StyleEditor from './StyleEditor';
import './editors.scss';

interface WorkbenchEditorsProps {
    selectedNodeId: string | null;
    selectedNodeType: TreeNodeType | null;
    isExpertMode: boolean;
    onViewUpdate: () => void;
}

const WorkbenchEditors: React.FC<WorkbenchEditorsProps> = ({
    selectedNodeId,
    selectedNodeType,
    isExpertMode,
    onViewUpdate,
}) => {
    // Resolve the selected view
    const selectedView: LViewElement | null = useMemo(() => {
        if (!selectedNodeId || selectedNodeType !== 'view') return null;
        try {
            const resolved = LPointerTargetable.fromPointer(selectedNodeId);
            if (resolved && (resolved as any).className) {
                return resolved as LViewElement;
            }
        } catch { /* view not found */ }
        return null;
    }, [selectedNodeId, selectedNodeType]);

    const readOnly = useMemo(() => {
        if (!selectedView) return true;
        return !isExpertMode && Defaults.check(selectedView.id);
    }, [selectedView, isExpertMode]);

    const handleViewUpdate = useCallback(() => {
        onViewUpdate();
    }, [onViewUpdate]);

    // Empty state
    if (!selectedView) {
        return (
            <div className="viewpoint-workbench__editors">
                <div className="workbench-editors__empty">
                    <i className="bi bi-code-slash" />
                    <span>Select a view from the tree to edit</span>
                </div>
            </div>
        );
    }

    return (
        <div className="viewpoint-workbench__editors" style={{ position: 'relative' }}>
            <div className="workbench-editors">
                {/* Predicate — small */}
                <div className="workbench-editors__predicate">
                    <PredicateEditor
                        view={selectedView}
                        readOnly={readOnly}
                        onViewUpdate={handleViewUpdate}
                    />
                </div>

                {/* Template — largest */}
                <div className="workbench-editors__template">
                    <TemplateEditor
                        view={selectedView}
                        readOnly={readOnly}
                        onViewUpdate={handleViewUpdate}
                    />
                </div>

                {/* Style — medium */}
                <div className="workbench-editors__style">
                    <StyleEditor
                        view={selectedView}
                        readOnly={readOnly}
                        onViewUpdate={handleViewUpdate}
                    />
                </div>
            </div>
        </div>
    );
};

export default WorkbenchEditors;
