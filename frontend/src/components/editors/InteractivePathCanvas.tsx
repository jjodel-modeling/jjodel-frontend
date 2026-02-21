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
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    PathData,
    PathPoint,
    CommandType,
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
}) => {
    // Interaction state
    const [interactionState, setInteractionState] = useState<InteractionState>('idle');
    const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
    const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
    const [draggingField, setDraggingField] = useState<DragField>('endpoint');
    const [isSnapEnabled, setIsSnapEnabled] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [handlesVisible, setHandlesVisible] = useState(false);

    // Refs
    const svgRef = useRef<SVGSVGElement>(null);
    const pointerIdRef = useRef<number | null>(null);

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
            // Escape closes context menu
            if (e.key === 'Escape' && contextMenu) {
                setContextMenu(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hoveredPointId, handlesVisible, pathData, onPathChange, contextMenu]);

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

        const { x, y } = clientToSvg(e.clientX, e.clientY);
        const snappedX = snapToGrid(x, isSnapEnabled);
        const snappedY = snapToGrid(y, isSnapEnabled);

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
    }, [interactionState, draggingPointId, draggingField, clientToSvg, isSnapEnabled, pathData, onPathChange]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        // Release pointer capture
        if (svgRef.current && pointerIdRef.current !== null) {
            svgRef.current.releasePointerCapture(pointerIdRef.current);
            pointerIdRef.current = null;
        }

        setDraggingPointId(null);
        setDraggingField('endpoint');
        setInteractionState(handlesVisible ? 'hovering' : 'idle');
    }, [handlesVisible]);

    // ========================================
    // SEGMENT CLICK (ADD POINT)
    // ========================================

    const handleSegmentClick = useCallback((e: React.MouseEvent) => {
        if (interactionState === 'dragging') return;
        if (!handlesVisible) return;

        const { x, y } = clientToSvg(e.clientX, e.clientY);
        const segmentIndex = findClosestSegment(pathData, x, y, 3 / zoom);

        if (segmentIndex >= 0) {
            const newData = insertPointOnSegment(pathData, segmentIndex);
            onPathChange(newData);
        }
    }, [interactionState, handlesVisible, clientToSvg, pathData, zoom, onPathChange]);

    // ========================================
    // CONTEXT MENU
    // ========================================

    const handleContextMenu = useCallback((e: React.MouseEvent, pointId: string) => {
        console.log('CONTEXT MENU TRIGGERED', pointId);
        e.preventDefault();
        e.stopPropagation();

        const point = pathData.find(p => p.id === pointId);
        if (!point || point.command === 'M' || point.command === 'Z') return;

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
        }
        setContextMenu(null);
    }, [contextMenu, pathData, onPathChange]);

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
                className={`interactive-path-canvas ${handlesVisible ? 'interactive-path-canvas--handles-visible' : ''} ${interactionState === 'dragging' ? 'interactive-path-canvas--dragging' : ''}`}
                preserveAspectRatio="xMidYMid meet"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
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
                        {handlesVisible && pathData.map((point, i) => {
                            const prev = pathData[i - 1];
                            if (!prev) return null;

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
                        {handlesVisible && pathData.map((point) => {
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
                                            onContextMenu={(e) => e.preventDefault()}
                                        />
                                    );
                                }
                            }

                            return elements.length > 0 ? <g key={`cps-${point.id}`}>{elements}</g> : null;
                        })}

                        {/* Endpoint handles (larger, cyan) */}
                        {handlesVisible && pathData
                            .filter(p => p.command !== 'Z')
                            .map((point) => {
                                const isHovered = hoveredPointId === point.id;
                                const isDragging = draggingPointId === point.id && draggingField === 'endpoint';

                                return (
                                    <circle
                                        key={`ep-${point.id}`}
                                        cx={point.x}
                                        cy={point.y}
                                        r={isHovered || isDragging ? handleSize * 1.3 : handleSize}
                                        className={`interactive-path-canvas__handle interactive-path-canvas__handle--endpoint ${
                                            isDragging ? 'interactive-path-canvas__handle--dragging' : ''
                                        }`}
                                        fill="#ffffff"
                                        stroke="#0ea5e9"
                                        strokeWidth={0.2 / zoom}
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
                        fontSize={1.5 / zoom}
                        fill="#94a3b8"
                        opacity="0.7"
                    >
                        No marker
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

                            return options.map(opt => (
                                <button
                                    key={opt.command}
                                    className="path-context-menu__item"
                                    onClick={() => handleConvert(opt.command)}
                                >
                                    <i className={`bi ${opt.icon}`} />
                                    <span>{opt.label}</span>
                                </button>
                            ));
                        })()}

                        <div className="path-context-menu__divider" />

                        <button
                            className="path-context-menu__item path-context-menu__item--danger"
                            onClick={handleDeleteFromMenu}
                        >
                            <i className="bi bi-trash3" />
                            <span>Delete point</span>
                        </button>
                    </div>
                </>,
                document.body
            )}
        </>
    );
};

export default InteractivePathCanvas;
