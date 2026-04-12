import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
    LPointerTargetable, LModel, LGraph, LViewElement,
    DGraph, DPointerTargetable, Constructors, Pointer,
    DefaultNode, Try, transientProperties, DState
} from '../../../joiner';
import {useSelector} from 'react-redux';

export interface WorkbenchCanvasProps {
    viewpointId: string;
    previewModelId: string | null;
    selectedViewId: string | null;
    highlightMode: boolean;
    filterMode: boolean;
    isFullscreen: boolean;
    onToggleHighlight: () => void;
    onToggleFilter: () => void;
    onToggleFullscreen: () => void;
    height: number;
    refreshKey: number; // increment to force re-render
}

const WorkbenchCanvas: React.FC<WorkbenchCanvasProps> = ({
    viewpointId,
    previewModelId,
    selectedViewId,
    highlightMode,
    filterMode,
    isFullscreen,
    onToggleHighlight,
    onToggleFilter,
    onToggleFullscreen,
    height,
    refreshKey,
}) => {
    const [graphReady, setGraphReady] = useState(false);

    // Resolve model and graph from Redux
    const graphs = useSelector((state: DState) => state.graphs);
    const model = useMemo(() => {
        if (!previewModelId) return null;
        try { return LModel.fromPointer(previewModelId); }
        catch { return null; }
    }, [previewModelId]);

    const graph = useMemo<LGraph | null>(() => {
        if (!previewModelId) return null;
        try {
            const allGraphs: DGraph[] = DGraph.fromPointer(graphs);
            const match = allGraphs.find(g => g.model === previewModelId && (g as any).graphStyle !== 'v2-flow');
            return match ? LGraph.fromPointer(match.id) : null;
        } catch { return null; }
    }, [previewModelId, graphs]);

    // Auto-create DGraph if missing (same pattern as ModelTab)
    useEffect(() => {
        if (!previewModelId || !model) return;
        if (!graph) {
            const graphid = Constructors.DGraph_makeID(previewModelId);
            if (!DPointerTargetable.pendingCreation[graphid]) {
                DGraph.new(0, previewModelId);
            }
            // Wait for Redux propagation
            const timer = setTimeout(() => setGraphReady(true), 200);
            return () => clearTimeout(timer);
        } else {
            setGraphReady(true);
        }
    }, [previewModelId, model, graph]);

    // Reset graphReady when model changes
    useEffect(() => {
        setGraphReady(false);
    }, [previewModelId]);

    // Resolve selected view info for status bar
    const selectedViewInfo = useMemo(() => {
        if (!selectedViewId) return null;
        try {
            const v = LPointerTargetable.fromPointer(selectedViewId) as LViewElement;
            if (!v) return null;
            return {
                name: v.name || 'Unnamed view',
                appliableToClasses: (v as any).__raw?.appliableToClasses || [],
            };
        } catch { return null; }
    }, [selectedViewId]);

    // Count matched elements for status bar
    const matchInfo = useMemo(() => {
        if (!selectedViewId || !graph || !model) return { count: 0, total: 0 };
        try {
            const tn = transientProperties.node;
            let matched = 0;
            let total = 0;
            for (const nid of Object.keys(tn)) {
                const nodeProps = tn[nid];
                if (!nodeProps?.viewScores) continue;
                total++;
                const score = nodeProps.viewScores[selectedViewId];
                if (score && (score as any).finalScore > 0) {
                    matched++;
                }
            }
            return { count: matched, total };
        } catch { return { count: 0, total: 0 }; }
    }, [selectedViewId, graph, model, refreshKey]);

    // Status text
    const statusText = useMemo(() => {
        if (!selectedViewInfo) return null;
        const viewName = selectedViewInfo.name;
        const mode = filterMode ? 'filtered' : highlightMode ? 'highlighted' : '';
        if (matchInfo.count > 0 && mode) {
            return `Editing: ${viewName} — ${matchInfo.count} element${matchInfo.count !== 1 ? 's' : ''} matched, ${mode}`;
        }
        if (matchInfo.count > 0) {
            return `Editing: ${viewName} — ${matchInfo.count} element${matchInfo.count !== 1 ? 's' : ''} matched`;
        }
        return `Editing: ${viewName}`;
    }, [selectedViewInfo, matchInfo, highlightMode, filterMode]);

    const isEmpty = !previewModelId;
    const containerStyle: React.CSSProperties = isFullscreen
        ? { flex: 1, position: 'relative' }
        : { height: isEmpty ? 80 : height, position: 'relative' };

    // Highlight/filter CSS classes applied to the canvas container
    const canvasClasses = [
        'viewpoint-workbench__canvas',
        isEmpty ? 'workbench-canvas--empty' : '',
        highlightMode && selectedViewId ? 'workbench-canvas--highlight' : '',
        filterMode && selectedViewId ? 'workbench-canvas--filter' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={canvasClasses} style={containerStyle}>
            {/* Mini-toolbar — hidden when no model selected */}
            {!isEmpty && <div className="workbench-canvas__toolbar">
                <div className="workbench-canvas__toolbar-group">
                    <button
                        className={`workbench-canvas__control ${highlightMode ? 'workbench-canvas__control--active' : ''}`}
                        onClick={onToggleHighlight}
                        title="Highlight matched elements"
                    >
                        <i className="bi bi-highlighter" /> Highlight
                    </button>
                    <button
                        className={`workbench-canvas__control ${filterMode ? 'workbench-canvas__control--active' : ''}`}
                        onClick={onToggleFilter}
                        title="Show only matched elements"
                    >
                        <i className="bi bi-funnel" /> Filter
                    </button>
                </div>
                <div className="workbench-canvas__toolbar-spacer" />
                <button
                    className="workbench-canvas__control"
                    onClick={onToggleFullscreen}
                    title={isFullscreen ? 'Exit fullscreen' : 'Expand canvas'}
                >
                    <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`} />
                </button>
            </div>}

            {/* Canvas content */}
            <div className="workbench-canvas__content" key={refreshKey}>
                {!previewModelId && (
                    <div className="workbench-placeholder">
                        <i className="bi bi-easel" style={{ fontSize: 20, color: '#94a3b8' }} />
                        <span>Select a preview model to see the canvas</span>
                    </div>
                )}
                {previewModelId && !model && (
                    <div className="workbench-placeholder">
                        <i className="bi bi-exclamation-triangle" style={{ fontSize: 20, color: '#f59e0b' }} />
                        <span>Model not found</span>
                    </div>
                )}
                {previewModelId && model && !graph && (
                    <div className="workbench-placeholder">
                        <span>Building the Graph...</span>
                    </div>
                )}
                {previewModelId && model && graph && (
                    <div className="workbench-canvas__editor-wrap">
                        <Try>
                            <div className="GraphContainer h-100 w-100" style={{ position: 'relative' }}>
                                <DefaultNode data={model as any} nodeid={graph.id} graphid={graph.id} />
                            </div>
                        </Try>
                    </div>
                )}
            </div>

            {/* Status bar */}
            {statusText && (
                <div className="workbench-canvas__status">
                    {statusText}
                </div>
            )}
        </div>
    );
};

export default WorkbenchCanvas;
