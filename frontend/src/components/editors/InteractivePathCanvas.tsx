/**
 * InteractivePathCanvas
 * Interactive SVG overlay for editing path points
 *
 * Features:
 * - Drag vertices to move endpoints
 * - Drag control handles for curves
 * - Click on segment to add point
 * - Right-click to convert segment type or delete
 * - Shift key for snap-to-grid
 * - Delete/Backspace to remove hovered point
 * - Cmd+Z / Ctrl+Z to undo, Shift+Cmd+Z / Shift+Ctrl+Z / Ctrl+Y to redo
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    PathData,
    PathPoint,
    CommandType,
    uid,
    serializePath,
    updatePoint,
    insertPointOnSegment,
    removePoint,
    convertSegment,
    findClosestSegment,
    snapToGrid,
} from './pathDataModel';
import './InteractivePathCanvas.scss';

// ============================================
// TYPES
// ============================================

interface InteractivePathCanvasProps {
    /** Current path data points */
    pathData: PathData;
    /** Callback when path data changes */
    onPathChange: (newData: PathData) => void;
    /** Fill mode for the shape */
    fillMode: 'filled' | 'outline';
    /** Current zoom level */
    zoom: number;
    /** ViewBox string */
    viewBox: string;
    /** Marker ID for grid pattern */
    markerId: string;
    /** External snap-to-grid control. When provided, Shift key acts as temporary invert. */
    snapEnabled?: boolean;
    /** External highlight: makes this point visually emphasized (e.g. from sidebar hover). */
    highlightedPointId?: string | null;
}

type InteractionState = 'idle' | 'hovering' | 'dragging';
type DragField = 'endpoint' | 'cp' | 'cp1' | 'cp2';

interface ContextMenuState {
    x: number;
    y: number;
    pointId: string;
}

// ============================================
// COMPONENT
// ============================================

export const InteractivePathCanvas: React.FC<InteractivePathCanvasProps> = ({
    pathData,
    onPathChange,
    fillMode,
    zoom,
    viewBox,
    markerId,
    snapEnabled,
    highlightedPointId,
}) => {
    // Interaction state
    const [interactionState, setInteractionState] = useState<InteractionState>('idle');
    const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
    const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
    const [draggingField, setDraggingField] = useState<DragField>('endpoint');
    const [isSnapEnabled, setIsSnapEnabled] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [handlesVisible, setHandlesVisible] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Refs
    const svgRef = useRef<SVGSVGElement>(null);
    const pointerIdRef = useRef<number | null>(null);
    const justDraggedRef = useRef(false);
    const pointerMovedRef = useRef(false);

    // Undo/redo history
    const historyRef = useRef<PathData[]>([]);
    const historyIndexRef = useRef(-1);
    const isUndoRedoRef = useRef(false);

    // Show curve handles (tangent lines + control points) for a specific point
    const showCurveHandles = useCallback((pointId: string): boolean => {
        return selectedNodeId === pointId || hoveredPointId === pointId;
    }, [selectedNodeId, hoveredPointId]);

    // Show endpoint handles when hovering the path OR when a node is selected
    const showHandlesOnCanvas = handlesVisible || selectedNodeId !== null;

    // Parse viewBox for grid
    const viewBoxParts = viewBox.split(' ').map(Number);
    const viewBoxOffset = viewBoxParts[0] || 0;
    const viewBoxSize = viewBoxParts[2] || 30;

    // ========================================
    // COORDINATE CONVERSION
    // ========================================

    const clientToSvg = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };

        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;

        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };

        const svgPt = pt.matrixTransform(ctm.inverse());
        return { x: svgPt.x, y: svgPt.y };
    }, []);

    // ========================================
    // KEYBOARD HANDLERS
    // ========================================

    // Shift key tracking (snap toggle)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsSnapEnabled(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsSnapEnabled(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Delete key (remove point)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && hoveredPointId && handlesVisible) {
                e.preventDefault();
                const newData = removePoint(pathData, hoveredPointId);
                if (newData) {
                    onPathChange(newData);
                    setHoveredPointId(null);
                }
            }
            // Escape: close context menu, then deselect node
            if (e.key === 'Escape') {
                if (contextMenu) {
                    setContextMenu(null);
                } else if (selectedNodeId) {
                    setSelectedNodeId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hoveredPointId, handlesVisible, pathData, onPathChange, contextMenu, selectedNodeId]);

    // ========================================
    // UNDO / REDO
    // ========================================

    // Record path snapshots — skip during drag (only record when drag ends)
    useEffect(() => {
        if (isUndoRedoRef.current) {
            isUndoRedoRef.current = false;
            return;
        }
        if (interactionState === 'dragging') return;

        const history = historyRef.current;
        const index = historyIndexRef.current;

        // Initialize on first render
        if (history.length === 0) {
            historyRef.current = [pathData];
            historyIndexRef.current = 0;
            return;
        }

        // Skip if unchanged
        if (JSON.stringify(history[index]) === JSON.stringify(pathData)) return;

        // Truncate future history (branching after undo)
        historyRef.current = history.slice(0, index + 1);
        historyRef.current.push(pathData);
        historyIndexRef.current = historyRef.current.length - 1;

        // Cap at 100 entries
        if (historyRef.current.length > 100) {
            historyRef.current = historyRef.current.slice(-100);
            historyIndexRef.current = historyRef.current.length - 1;
        }
    }, [pathData, interactionState]);

    const undo = useCallback(() => {
        if (historyIndexRef.current <= 0) return;
        isUndoRedoRef.current = true;
        historyIndexRef.current--;
        onPathChange(historyRef.current[historyIndexRef.current]);
    }, [onPathChange]);

    const redo = useCallback(() => {
        if (historyIndexRef.current >= historyRef.current.length - 1) return;
        isUndoRedoRef.current = true;
        historyIndexRef.current++;
        onPathChange(historyRef.current[historyIndexRef.current]);
    }, [onPathChange]);

    // Cmd+Z / Ctrl+Z = undo, Shift+Cmd+Z / Shift+Ctrl+Z / Ctrl+Y = redo
    // Uses capture phase so it fires before app-level undo/redo handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const mod = e.metaKey || e.ctrlKey;
            if (!mod) return;

            if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                undo();
            } else if (e.key.toLowerCase() === 'z' && e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                redo();
            } else if (e.key.toLowerCase() === 'y') {
                e.preventDefault();
                e.stopPropagation();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [undo, redo]);

    // ========================================
    // DRAG HANDLERS
    // ========================================

    const handlePointerDown = useCallback((
        e: React.PointerEvent,
        pointId: string,
        field: DragField
    ) => {
        // Only left mouse button (0 = left, 2 = right)
        if (e.button !== 0) return;

        e.stopPropagation();
        e.preventDefault();
        pointerMovedRef.current = false;

        // Pointer capture on SVG root for reliable drag tracking
        if (svgRef.current) {
            svgRef.current.setPointerCapture(e.pointerId);
            pointerIdRef.current = e.pointerId;
        }

        setDraggingPointId(pointId);
        setDraggingField(field);
        setInteractionState('dragging');
        setContextMenu(null);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (interactionState !== 'dragging' || !draggingPointId) return;
        pointerMovedRef.current = true;

        // When snapEnabled prop is provided, Shift key acts as temporary invert;
        // when not provided, Shift key enables snap (legacy behavior).
        const effectiveSnap = snapEnabled != null
            ? (snapEnabled !== isSnapEnabled)   // XOR: Shift inverts the toggle
            : isSnapEnabled;                    // Legacy: Shift enables snap

        const { x, y } = clientToSvg(e.clientX, e.clientY);
        const snappedX = snapToGrid(x, effectiveSnap);
        const snappedY = snapToGrid(y, effectiveSnap);

        let updates: Partial<PathPoint> = {};
        switch (draggingField) {
            case 'endpoint':
                updates = { x: snappedX, y: snappedY };
                break;
            case 'cp':
                updates = { cx: snappedX, cy: snappedY };
                break;
            case 'cp1':
                updates = { cx1: snappedX, cy1: snappedY };
                break;
            case 'cp2':
                updates = { cx2: snappedX, cy2: snappedY };
                break;
        }

        onPathChange(updatePoint(pathData, draggingPointId, updates));
    }, [interactionState, draggingPointId, draggingField, clientToSvg, isSnapEnabled, snapEnabled, pathData, onPathChange]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        // Release pointer capture
        if (svgRef.current && pointerIdRef.current !== null) {
            svgRef.current.releasePointerCapture(pointerIdRef.current);
            pointerIdRef.current = null;
        }

        // If pointer didn't move and we were on an endpoint, it's a click → toggle selection
        if (!pointerMovedRef.current && draggingPointId && draggingField === 'endpoint') {
            setSelectedNodeId(prev => prev === draggingPointId ? null : draggingPointId);
        }

        // Track drag completion to prevent false canvas clicks
        justDraggedRef.current = interactionState === 'dragging';

        setDraggingPointId(null);
        setDraggingField('endpoint');
        setInteractionState(handlesVisible ? 'hovering' : 'idle');
    }, [handlesVisible, interactionState, draggingPointId, draggingField]);

    // ========================================
    // SEGMENT CLICK (ADD POINT)
    // ========================================

    const handleSegmentClick = useCallback((e: React.MouseEvent) => {
        if (interactionState === 'dragging') return;
        if (!handlesVisible && !selectedNodeId) return;

        const { x, y } = clientToSvg(e.clientX, e.clientY);
        const segmentIndex = findClosestSegment(pathData, x, y, 3 / zoom);

        if (segmentIndex >= 0) {
            e.stopPropagation(); // Prevent canvas click from also firing
            const newData = insertPointOnSegment(pathData, segmentIndex);
            onPathChange(newData);
        }
    }, [interactionState, handlesVisible, selectedNodeId, clientToSvg, pathData, zoom, onPathChange]);

    // ========================================
    // CANVAS CLICK (DRAW POINTS)
    // ========================================

    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        // Ignore clicks right after a drag operation
        if (justDraggedRef.current) {
            justDraggedRef.current = false;
            return;
        }

        // If a node is selected, click on empty canvas deselects it
        if (selectedNodeId) {
            setSelectedNodeId(null);
            return;
        }

        const { x, y } = clientToSvg(e.clientX, e.clientY);

        // Apply snap-to-grid
        const effectiveSnap = snapEnabled != null
            ? (snapEnabled !== isSnapEnabled)   // XOR: Shift inverts the toggle
            : isSnapEnabled;                    // Legacy: Shift enables snap
        const snappedX = snapToGrid(x, effectiveSnap);
        const snappedY = snapToGrid(y, effectiveSnap);

        if (pathData.length === 0) {
            // First click: add M (moveTo) command
            onPathChange([{
                id: uid(),
                command: 'M',
                x: snappedX,
                y: snappedY,
            }]);
        } else {
            // Subsequent clicks: add L (lineTo) command
            const newPoint: PathPoint = {
                id: uid(),
                command: 'L',
                x: snappedX,
                y: snappedY,
            };

            // Insert before Z if the path is closed
            const lastPoint = pathData[pathData.length - 1];
            if (lastPoint.command === 'Z') {
                const newData = [...pathData];
                newData.splice(pathData.length - 1, 0, newPoint);
                onPathChange(newData);
            } else {
                onPathChange([...pathData, newPoint]);
            }
        }
    }, [selectedNodeId, clientToSvg, snapEnabled, isSnapEnabled, pathData, onPathChange]);

    // ========================================
    // CONTEXT MENU
    // ========================================

    const handleContextMenu = useCallback((e: React.MouseEvent, pointId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const point = pathData.find(p => p.id === pointId);
        if (!point || point.command === 'Z') return;

        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            pointId,
        });
    }, [pathData]);

    const handleConvert = useCallback((newCommand: CommandType) => {
        if (!contextMenu) return;
        const newData = convertSegment(pathData, contextMenu.pointId, newCommand);
        onPathChange(newData);
        setContextMenu(null);
    }, [contextMenu, pathData, onPathChange]);

    const handleDeleteFromMenu = useCallback(() => {
        if (!contextMenu) return;
        const newData = removePoint(pathData, contextMenu.pointId);
        if (newData) {
            onPathChange(newData);
            if (selectedNodeId === contextMenu.pointId) setSelectedNodeId(null);
        }
        setContextMenu(null);
    }, [contextMenu, pathData, onPathChange, selectedNodeId]);

    // ========================================
    // HOVER HANDLERS (on interaction layer <g>)
    // ========================================

    const handleInteractionLayerEnter = useCallback(() => {
        setHandlesVisible(true);
        setInteractionState(prev => prev === 'dragging' ? 'dragging' : 'hovering');
    }, []);

    const handleInteractionLayerLeave = useCallback(() => {
        // Don't hide during drag
        if (interactionState === 'dragging') return;

        setHandlesVisible(false);
        setInteractionState('idle');
        setHoveredPointId(null);
    }, [interactionState]);

    // ========================================
    // RENDER HELPERS
    // ========================================

    const pathString = serializePath(pathData);
    const hasPath = pathData.length > 0;

    // Scale factors for handles (inverse to zoom so they stay visually consistent)
    const handleSize = 0.5 / zoom;
    const controlHandleSize = 0.4 / zoom;
    const strokeWidth = 0.5 / zoom;
    const tangentStrokeWidth = 0.15 / zoom;
    const hitZoneWidth = 3 / zoom;

    // ========================================
    // RENDER
    // ========================================

    return (
        <>
            <svg
                ref={svgRef}
                viewBox={viewBox}
                className={`interactive-path-canvas ${showHandlesOnCanvas ? 'interactive-path-canvas--handles-visible' : ''} ${interactionState === 'dragging' ? 'interactive-path-canvas--dragging' : ''}`}
                preserveAspectRatio="xMidYMid meet"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={handleCanvasClick}
                onContextMenu={(e) => e.preventDefault()}
            >
                {/* Layer 1: Grid pattern */}
                <defs>
                    <pattern id={`grid-${markerId}`} width="1" height="1" patternUnits="userSpaceOnUse">
                        <circle cx="0.5" cy="0.5" r={0.15 / zoom} fill="#94a3b8" opacity="0.4" />
                    </pattern>
                </defs>
                <rect
                    x={viewBoxOffset}
                    y={viewBoxOffset}
                    width={viewBoxSize}
                    height={viewBoxSize}
                    fill={`url(#grid-${markerId})`}
                />

                {/* Origin crosshair */}
                <line
                    x1={viewBoxOffset}
                    y1="5"
                    x2={viewBoxOffset + viewBoxSize}
                    y2="5"
                    stroke="#94a3b8"
                    strokeWidth={0.08 / zoom}
                    opacity="0.3"
                />
                <line
                    x1="5"
                    y1={viewBoxOffset}
                    x2="5"
                    y2={viewBoxOffset + viewBoxSize}
                    stroke="#94a3b8"
                    strokeWidth={0.08 / zoom}
                    opacity="0.3"
                />

                {/* Marker bounding box (0-10) */}
                <rect
                    x="0"
                    y="0"
                    width="10"
                    height="10"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth={0.06 / zoom}
                    strokeDasharray={`${0.3 / zoom} ${0.2 / zoom}`}
                    opacity="0.5"
                />

                {/* Layer 2: The filled/stroked shape (non-interactive) */}
                {hasPath && (
                    <path
                        d={pathString}
                        fill={fillMode === 'filled' ? '#0ea5e9' : 'transparent'}
                        stroke="#0ea5e9"
                        strokeWidth={strokeWidth}
                        className="interactive-path-canvas__shape"
                    />
                )}

                {/* Layer 3: Interaction layer — wraps hit zone + handles */}
                {/* Mouse enter/leave on this <g> controls handle visibility */}
                {hasPath && (
                    <g
                        className="interactive-path-canvas__interaction-layer"
                        onMouseEnter={handleInteractionLayerEnter}
                        onMouseLeave={handleInteractionLayerLeave}
                    >
                        {/* Hit zone (invisible, for hover detection + click to add) */}
                        <path
                            d={pathString}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={hitZoneWidth}
                            className="interactive-path-canvas__hit-zone"
                            onClick={handleSegmentClick}
                        />

                        {/* Tangent lines (control point → endpoint) */}
                        {showHandlesOnCanvas && pathData.map((point, i) => {
                            const prev = pathData[i - 1];
                            if (!prev) return null;
                            if (!showCurveHandles(point.id)) return null;

                            if (point.command === 'Q' && point.cx != null && point.cy != null) {
                                return (
                                    <g key={`tangent-${point.id}`} className="interactive-path-canvas__tangent-group">
                                        <line
                                            x1={prev.x}
                                            y1={prev.y}
                                            x2={point.cx}
                                            y2={point.cy}
                                            stroke="#0ea5e9"
                                            strokeWidth={tangentStrokeWidth}
                                            strokeDasharray={`${0.3 / zoom} ${0.2 / zoom}`}
                                            opacity={0.6}
                                            className="interactive-path-canvas__tangent"
                                        />
                                        <line
                                            x1={point.cx}
                                            y1={point.cy}
                                            x2={point.x}
                                            y2={point.y}
                                            stroke="#0ea5e9"
                                            strokeWidth={tangentStrokeWidth}
                                            strokeDasharray={`${0.3 / zoom} ${0.2 / zoom}`}
                                            opacity={0.6}
                                            className="interactive-path-canvas__tangent"
                                        />
                                    </g>
                                );
                            }

                            if (point.command === 'C' && point.cx1 != null && point.cy1 != null && point.cx2 != null && point.cy2 != null) {
                                return (
                                    <g key={`tangent-${point.id}`} className="interactive-path-canvas__tangent-group">
                                        <line
                                            x1={prev.x}
                                            y1={prev.y}
                                            x2={point.cx1}
                                            y2={point.cy1}
                                            stroke="#0ea5e9"
                                            strokeWidth={tangentStrokeWidth}
                                            strokeDasharray={`${0.3 / zoom} ${0.2 / zoom}`}
                                            opacity={0.6}
                                            className="interactive-path-canvas__tangent"
                                        />
                                        <line
                                            x1={point.cx2}
                                            y1={point.cy2}
                                            x2={point.x}
                                            y2={point.y}
                                            stroke="#0ea5e9"
                                            strokeWidth={tangentStrokeWidth}
                                            strokeDasharray={`${0.3 / zoom} ${0.2 / zoom}`}
                                            opacity={0.6}
                                            className="interactive-path-canvas__tangent"
                                        />
                                    </g>
                                );
                            }

                            return null;
                        })}

                        {/* Control point handles (smaller, amber color) */}
                        {showHandlesOnCanvas && pathData.map((point) => {
                            if (!showCurveHandles(point.id)) return null;
                            const elements: React.ReactNode[] = [];

                            // Q control point
                            if (point.command === 'Q' && point.cx != null && point.cy != null) {
                                elements.push(
                                    <circle
                                        key={`cp-${point.id}`}
                                        cx={point.cx}
                                        cy={point.cy}
                                        r={controlHandleSize}
                                        className="interactive-path-canvas__handle interactive-path-canvas__handle--control"
                                        fill="#ffffff"
                                        stroke="#f59e0b"
                                        strokeWidth={tangentStrokeWidth}
                                        onPointerDown={(e) => handlePointerDown(e, point.id, 'cp')}
                                        onClick={(e) => e.stopPropagation()}
                                        onContextMenu={(e) => e.preventDefault()}
                                    />
                                );
                            }

                            // C control points
                            if (point.command === 'C') {
                                if (point.cx1 != null && point.cy1 != null) {
                                    elements.push(
                                        <circle
                                            key={`cp1-${point.id}`}
                                            cx={point.cx1}
                                            cy={point.cy1}
                                            r={controlHandleSize}
                                            className="interactive-path-canvas__handle interactive-path-canvas__handle--control"
                                            fill="#ffffff"
                                            stroke="#f59e0b"
                                            strokeWidth={tangentStrokeWidth}
                                            onPointerDown={(e) => handlePointerDown(e, point.id, 'cp1')}
                                            onClick={(e) => e.stopPropagation()}
                                            onContextMenu={(e) => e.preventDefault()}
                                        />
                                    );
                                }
                                if (point.cx2 != null && point.cy2 != null) {
                                    elements.push(
                                        <circle
                                            key={`cp2-${point.id}`}
                                            cx={point.cx2}
                                            cy={point.cy2}
                                            r={controlHandleSize}
                                            className="interactive-path-canvas__handle interactive-path-canvas__handle--control"
                                            fill="#ffffff"
                                            stroke="#f59e0b"
                                            strokeWidth={tangentStrokeWidth}
                                            onPointerDown={(e) => handlePointerDown(e, point.id, 'cp2')}
                                            onClick={(e) => e.stopPropagation()}
                                            onContextMenu={(e) => e.preventDefault()}
                                        />
                                    );
                                }
                            }

                            return elements.length > 0 ? <g key={`cps-${point.id}`}>{elements}</g> : null;
                        })}

                        {/* Endpoint handles — always visible */}
                        {pathData
                            .filter(p => p.command !== 'Z')
                            .map((point) => {
                                const isHovered = hoveredPointId === point.id;
                                const isHighlighted = highlightedPointId === point.id;
                                const isDragging = draggingPointId === point.id && draggingField === 'endpoint';
                                const isSelected = selectedNodeId === point.id;
                                const emphasized = isHovered || isHighlighted || isDragging || isSelected;

                                return (
                                    <circle
                                        key={`ep-${point.id}`}
                                        cx={point.x}
                                        cy={point.y}
                                        r={emphasized ? handleSize * 1.3 : handleSize}
                                        className={`interactive-path-canvas__handle interactive-path-canvas__handle--endpoint ${
                                            isDragging ? 'interactive-path-canvas__handle--dragging' : ''
                                        } ${isHighlighted ? 'interactive-path-canvas__handle--highlighted' : ''
                                        } ${isSelected ? 'interactive-path-canvas__handle--selected' : ''}`}
                                        fill={isSelected ? '#0ea5e9' : isHighlighted ? '#0ea5e9' : '#ffffff'}
                                        stroke="#0ea5e9"
                                        strokeWidth={isSelected ? 0.3 / zoom : 0.2 / zoom}
                                        onPointerDown={(e) => handlePointerDown(e, point.id, 'endpoint')}
                                        onPointerEnter={() => setHoveredPointId(point.id)}
                                        onPointerLeave={() => setHoveredPointId(null)}
                                        onContextMenu={(e) => handleContextMenu(e, point.id)}
                                    />
                                );
                            })
                        }
                    </g>
                )}

                {/* Empty state */}
                {!hasPath && (
                    <text
                        x="5"
                        y="5.5"
                        textAnchor="middle"
                        fontSize={1.2 / zoom}
                        fill="#94a3b8"
                        opacity="0.7"
                        style={{ pointerEvents: 'none' }}
                    >
                        Click to start drawing
                    </text>
                )}
            </svg>

            {/* Context Menu (rendered via Portal) */}
            {contextMenu && createPortal(
                <>
                    <div
                        className="path-context-menu__backdrop"
                        onClick={() => setContextMenu(null)}
                    />
                    <div
                        className="path-context-menu"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        {(() => {
                            const point = pathData.find(p => p.id === contextMenu.pointId);
                            if (!point) return null;

                            // First M point (path start): show info only
                            if (point.command === 'M' && pathData.indexOf(point) === 0) {
                                return (
                                    <div className="path-context-menu__item" style={{ opacity: 0.5, cursor: 'default' }}>
                                        <i className="bi bi-geo-alt" />
                                        <span>Start point</span>
                                    </div>
                                );
                            }

                            const options: { label: string; icon: string; command: CommandType }[] = [];

                            if (point.command !== 'L') {
                                options.push({ label: 'Straight (L)', icon: 'bi-dash-lg', command: 'L' });
                            }
                            if (point.command !== 'Q') {
                                options.push({ label: 'Quadratic curve (Q)', icon: 'bi-bezier', command: 'Q' });
                            }
                            if (point.command !== 'C') {
                                options.push({ label: 'Cubic curve (C)', icon: 'bi-bezier2', command: 'C' });
                            }
                            if (point.command !== 'M') {
                                options.push({ label: 'Move to (M)', icon: 'bi-geo-alt', command: 'M' });
                            }

                            return (
                                <>
                                    {options.map(opt => (
                                        <button
                                            key={opt.command}
                                            className="path-context-menu__item"
                                            onClick={() => handleConvert(opt.command)}
                                        >
                                            <i className={`bi ${opt.icon}`} />
                                            <span>{opt.label}</span>
                                        </button>
                                    ))}
                                    <div className="path-context-menu__divider" />
                                    <button
                                        className="path-context-menu__item path-context-menu__item--danger"
                                        onClick={handleDeleteFromMenu}
                                    >
                                        <i className="bi bi-trash3" />
                                        <span>Delete point</span>
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </>,
                document.body
            )}
        </>
    );
};

export default InteractivePathCanvas;
