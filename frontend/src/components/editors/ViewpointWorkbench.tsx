import React, {useState, useCallback, useRef, useEffect} from 'react';
import './ViewpointWorkbench.scss';
import {LPointerTargetable, LViewPoint, LProject, LModel, Pointer} from '../../joiner';
import {TreeNodeType} from './viewpoint/ViewTreeNode';
import ViewpointBreadcrumb from './viewpoint/ViewpointBreadcrumb';
import ViewTree from './viewpoint/ViewTree';
import WorkbenchCanvas from './viewpoint/WorkbenchCanvas';
import WorkbenchEditors from './viewpoint/WorkbenchEditors';
import WorkbenchProperties from './viewpoint/WorkbenchProperties';

interface ViewpointWorkbenchProps {
    viewpointId: Pointer<any>;
}

const ViewpointWorkbench: React.FC<ViewpointWorkbenchProps> = ({ viewpointId }) => {
    const lViewpoint = LPointerTargetable.fromPointer(viewpointId) as LViewPoint | undefined;

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedNodeType, setSelectedNodeType] = useState<TreeNodeType | null>(null);
    const [canvasHeight, setCanvasHeight] = useState(240);
    const [isResizing, setIsResizing] = useState(false);
    const [previewModelId, setPreviewModelId] = useState<string | null>(null);
    const [isExpertMode, setIsExpertMode] = useState(false);
    const [highlightMode, setHighlightMode] = useState(true);
    const [filterMode, setFilterMode] = useState(false);
    const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
    const [canvasRefreshKey, setCanvasRefreshKey] = useState(0);
    const [propertiesWidth, setPropertiesWidth] = useState(320);

    const canvasHeightRef = useRef(canvasHeight);
    canvasHeightRef.current = canvasHeight;

    // Get project and models
    let project: LProject | undefined;
    let availableModels: LModel[] = [];
    try {
        project = LProject.getProject();
        availableModels = project?.models || [];
    } catch { /* project not available */ }

    const handleNodeSelect = useCallback((nodeId: string, nodeType: TreeNodeType) => {
        setSelectedNodeId(nodeId);
        setSelectedNodeType(nodeType);
    }, []);

    const handleCreateView = useCallback(() => {
        // Will be implemented in a later prompt
        console.log('[ViewpointWorkbench] Create view requested');
    }, []);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startY = e.clientY;
        const startHeight = canvasHeightRef.current;

        const handleMouseMove = (ev: MouseEvent) => {
            const delta = ev.clientY - startY;
            const newHeight = Math.max(100, Math.min(startHeight + delta, 500));
            setCanvasHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    const propertiesWidthRef = useRef(propertiesWidth);
    propertiesWidthRef.current = propertiesWidth;

    const handlePropertiesResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = propertiesWidthRef.current;

        const onMove = (ev: MouseEvent) => {
            const delta = startX - ev.clientX;
            const newWidth = Math.max(320, Math.min(startWidth + delta, 500));
            setPropertiesWidth(newWidth);
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, []);

    if (!lViewpoint) {
        return (
            <div className="viewpoint-workbench">
                <div className="viewpoint-workbench__empty">
                    <i className="bi bi-eye-slash" style={{ fontSize: 24, color: '#94a3b8' }} />
                    <span>Viewpoint not found</span>
                </div>
            </div>
        );
    }

    // Find selected view name for resize handle label
    let selectedViewName = '';
    if (selectedNodeId && selectedNodeType === 'view') {
        try {
            const sv = LPointerTargetable.fromPointer(selectedNodeId);
            if (sv && (sv as any).name) selectedViewName = (sv as any).name;
        } catch { /* ignore */ }
    }

    return (
        <div className="viewpoint-workbench">
            <ViewpointBreadcrumb
                viewpoint={lViewpoint}
                project={project!}
                availableModels={availableModels}
                selectedModelId={previewModelId}
                onModelSelect={setPreviewModelId}
                isExpertMode={isExpertMode}
                onToggleExpertMode={() => setIsExpertMode(v => !v)}
            />
            <div className="viewpoint-workbench__body">
                <div className="viewpoint-workbench__tree">
                    <ViewTree
                        viewpoint={lViewpoint}
                        selectedNodeId={selectedNodeId}
                        onNodeSelect={handleNodeSelect}
                        onCreateView={handleCreateView}
                    />
                </div>
                <div className="viewpoint-workbench__center">
                    <WorkbenchCanvas
                        viewpointId={viewpointId}
                        previewModelId={previewModelId}
                        selectedViewId={selectedNodeType === 'view' ? selectedNodeId : null}
                        highlightMode={highlightMode}
                        filterMode={filterMode}
                        isFullscreen={isCanvasFullscreen}
                        onToggleHighlight={() => setHighlightMode(v => !v)}
                        onToggleFilter={() => setFilterMode(v => !v)}
                        onToggleFullscreen={() => setIsCanvasFullscreen(v => !v)}
                        height={canvasHeight}
                        refreshKey={canvasRefreshKey}
                    />
                    {isCanvasFullscreen ? null : <div
                        className={`viewpoint-workbench__resize-handle ${isResizing ? 'viewpoint-workbench__resize-handle--resizing' : ''}`}
                        onMouseDown={handleResizeMouseDown}
                    >
                        <span className="viewpoint-workbench__resize-grip" />
                        {selectedViewName && (
                            <span className="viewpoint-workbench__resize-label">{selectedViewName}</span>
                        )}
                        <div className="viewpoint-workbench__resize-actions">
                            <button
                                className="viewpoint-workbench__resize-btn"
                                title="Duplicate view"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => console.log('[ViewpointWorkbench] Duplicate view')}
                            >
                                <i className="bi bi-copy" />
                            </button>
                            <button
                                className="viewpoint-workbench__resize-btn"
                                title="Delete view"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => console.log('[ViewpointWorkbench] Delete view')}
                            >
                                <i className="bi bi-trash3" />
                            </button>
                        </div>
                    </div>}
                    {!isCanvasFullscreen && (
                        <WorkbenchEditors
                            selectedNodeId={selectedNodeId}
                            selectedNodeType={selectedNodeType}
                            isExpertMode={isExpertMode}
                            onViewUpdate={() => {
                                setCanvasRefreshKey(k => k + 1);
                            }}
                        />
                    )}
                </div>
                <div
                    className="viewpoint-workbench__properties-resize"
                    onMouseDown={handlePropertiesResizeStart}
                />
                <WorkbenchProperties
                    viewpointId={viewpointId}
                    selectedNodeId={selectedNodeId}
                    selectedNodeType={selectedNodeType}
                    isExpertMode={isExpertMode}
                    style={{ width: propertiesWidth, minWidth: 320 }}
                />
            </div>
        </div>
    );
};

export default ViewpointWorkbench;
