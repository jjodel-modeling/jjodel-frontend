/**
 * EdgeMarkerEditorModal
 * Visual editor for SVG path markers (head/tail) of edges
 *
 * Features:
 * - Preset library with categorized marker shapes
 * - Interactive SVG preview with draggable handles
 * - Live preview of marker on a sample edge
 * - Monaco editor for direct path editing
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import Editor from '@monaco-editor/react';
import { compactMonacoOptions, mergeMonacoOptions } from './monacoConfig';
import { MARKER_PRESETS, MarkerPreset, PresetCategory, findPresetByPath } from './markerPresets';
import { InteractivePathCanvas } from './InteractivePathCanvas';
import { PathData, parsePath, serializePath } from './pathDataModel';
import './EdgeMarkerEditorModal.scss';

// ============================================
// TYPES
// ============================================

export type MarkerFillMode = 'filled' | 'outline';

export interface EdgeMarkerEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (path: string) => void;
    initialPath?: string;
    markerPosition: 'head' | 'tail';
}

// ============================================
// COMPONENT
// ============================================

export const EdgeMarkerEditorModal: React.FC<EdgeMarkerEditorModalProps> = ({
    isOpen,
    onClose,
    onApply,
    initialPath = '',
    markerPosition,
}) => {
    // State
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [currentFill, setCurrentFill] = useState<string>('currentColor');
    const [currentStroke, setCurrentStroke] = useState<string>('currentColor');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Arrows', 'UML']));
    const [editorValue, setEditorValue] = useState(initialPath);
    const [previewPosition, setPreviewPosition] = useState<'head' | 'tail'>(markerPosition);
    const [fillMode, setFillMode] = useState<MarkerFillMode>('filled');
    const [zoom, setZoom] = useState(1);          // 0.5 - 4, default 1

    // PathData for interactive canvas
    const [pathData, setPathData] = useState<PathData>(() => parsePath(initialPath));

    // Stable unique ID for the live preview marker
    const [previewMarkerId] = useState(() => `marker-prev-${Math.random().toString(36).slice(2, 8)}`);

    // Ref for debounce timeout
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Reset state when modal opens with new initial path
    useEffect(() => {
        if (isOpen) {
            setCurrentPath(initialPath);
            setEditorValue(initialPath);
            setPreviewPosition(markerPosition);
            setPathData(parsePath(initialPath));

            // Try to find matching preset for initial path
            const preset = findPresetByPath(initialPath);
            if (preset) {
                setCurrentFill(preset.fill);
                setCurrentStroke(preset.stroke);
            } else {
                setCurrentFill('currentColor');
                setCurrentStroke('currentColor');
            }
        }
    }, [isOpen, initialPath, markerPosition]);

    // Sync pathData when currentPath changes from Monaco or presets
    useEffect(() => {
        const parsed = parsePath(currentPath);
        const serialized = serializePath(parsed);
        const currentSerialized = serializePath(pathData);

        // Only update if actually different (avoid infinite loops)
        if (serialized !== currentSerialized) {
            setPathData(parsed);
        }
    }, [currentPath]);

    // Handle path data changes from interactive canvas
    const handlePathDataChange = useCallback((newData: PathData) => {
        setPathData(newData);
        const newPathStr = serializePath(newData);
        setCurrentPath(newPathStr);
        setEditorValue(newPathStr);
    }, []);

    // Handle keyboard shortcuts (Escape to close)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle preset selection
    const handlePresetSelect = useCallback((preset: MarkerPreset) => {
        setCurrentPath(preset.path);
        setCurrentFill(preset.fill);
        setCurrentStroke(preset.stroke);
        setEditorValue(preset.path);
    }, []);

    // Handle Monaco editor changes with debounce
    const handleEditorChange = useCallback((value: string | undefined) => {
        if (value === undefined) return;

        setEditorValue(value);

        // Clear existing timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce path update
        debounceRef.current = setTimeout(() => {
            const trimmed = value.trim();
            setCurrentPath(trimmed);

            // Try to find matching preset
            const preset = findPresetByPath(trimmed);
            if (preset) {
                setCurrentFill(preset.fill);
                setCurrentStroke(preset.stroke);
            }
        }, 300);
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // Toggle category expansion
    const toggleCategory = useCallback((categoryName: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryName)) {
                next.delete(categoryName);
            } else {
                next.add(categoryName);
            }
            return next;
        });
    }, []);

    // Handle apply
    const handleApply = useCallback(() => {
        onApply(currentPath);
        onClose();
    }, [currentPath, onApply, onClose]);

    // Monaco options
    const monacoOptions = useMemo(() => mergeMonacoOptions(compactMonacoOptions, {
        lineNumbers: 'off',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        fontSize: 13,
        fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
        padding: { top: 12, bottom: 12},
        renderLineHighlight: 'none',
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        scrollbar: {
            vertical: 'auto',
            horizontal: 'hidden',
            verticalScrollbarSize: 6,
        },
    }), []);

    // Check if a preset is currently active
    const isPresetActive = useCallback((preset: MarkerPreset) => {
        return preset.path === currentPath;
    }, [currentPath]);

    // Determine fill color for preview (resolve 'currentColor')
    const previewFill = useMemo(() => {
        if (currentFill === 'currentColor') return '#334155';
        if (currentFill === 'white') return '#ffffff';
        return 'none';
    }, [currentFill]);

    const previewStroke = useMemo(() => {
        if (currentStroke === 'currentColor') return '#334155';
        return 'none';
    }, [currentStroke]);

    // Get fill and stroke based on fill mode
    const getFillStroke = useCallback((mode: MarkerFillMode): { fill: string; stroke: string } => {
        switch (mode) {
            case 'filled':
                return { fill: '#334155', stroke: '#334155' };
            case 'outline':
                return { fill: 'none', stroke: '#334155' };
 
        }
    }, []);

    const { fill: markerFill, stroke: markerStroke } = getFillStroke(fillMode);

    // Unique ID for the marker to avoid conflicts with other markers in the DOM
    const uniqueId = useId();
    const markerId = `marker-preview-${uniqueId.replace(/:/g, '')}`;

    // Calculate viewBox based on zoom (marker lives in 0-10 space)
    // Base size 30 means marker occupies ~1/3 of the view at zoom=1
    const baseSize = 30;
    const viewBoxSize = baseSize / zoom;  // zoom=1 → 30×30 area, zoom=2 → 15×15
    const viewBoxOffset = (10 - viewBoxSize) / 2;  // center on marker midpoint (5,5)
    const shapeViewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="edge-marker-editor-modal__overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${markerPosition} marker`}
        >
            <div
                className="edge-marker-editor-modal__dialog"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="edge-marker-editor-modal__header">
                    <h3>
                        <i className="bi bi-bezier2" />
                        Edge {markerPosition === 'head' ? 'Head' : 'Tail'} Marker
                    </h3>
                    <button
                        className="edge-marker-editor-modal__close-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Body */}
                <div className="edge-marker-editor-modal__body">
                    {/* Left: Presets Panel */}
                    <div className="edge-marker-editor-modal__presets">
                        <div className="edge-marker-editor-modal__presets-header">
                            Presets
                        </div>
                        <div className="edge-marker-editor-modal__presets-list">
                            {MARKER_PRESETS.map((category) => (
                                <div key={category.name} className="edge-marker-editor-modal__preset-category">
                                    <button
                                        className="edge-marker-editor-modal__preset-category-header"
                                        onClick={() => toggleCategory(category.name)}
                                    >
                                        <i className={`bi bi-chevron-${expandedCategories.has(category.name) ? 'down' : 'right'}`} />
                                        <span>{category.name}</span>
                                    </button>
                                    {expandedCategories.has(category.name) && (
                                        <div className="edge-marker-editor-modal__preset-items">
                                            {category.presets.map((preset) => (
                                                <button
                                                    key={preset.name}
                                                    className={`edge-marker-editor-modal__preset-item ${isPresetActive(preset) ? 'edge-marker-editor-modal__preset-item--active' : ''}`}
                                                    onClick={() => handlePresetSelect(preset)}
                                                >
                                                    <svg
                                                        viewBox="-1 -1 12 12"
                                                        className="edge-marker-editor-modal__preset-thumb"
                                                    >
                                                        {preset.path && (
                                                            <path
                                                                d={preset.path}
                                                                fill={preset.fill === 'currentColor' ? '#334155' : preset.fill === 'white' ? '#ffffff' : 'none'}
                                                                stroke="#334155"
                                                                strokeWidth="0.8"
                                                            />
                                                        )}
                                                    </svg>
                                                    <span>{preset.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center: Canvas / Preview */}
                    <div className="edge-marker-editor-modal__canvas-area">
                        {/* Shape Preview */}
                        <div className="edge-marker-editor-modal__shape-preview">
                            <div className="edge-marker-editor-modal__shape-header">
                                <span className="edge-marker-editor-modal__shape-label">Shape Preview</span>
                                <div className="marker-fill-toggle">
                                    <button
                                        type="button"
                                        className={`marker-fill-toggle__btn ${fillMode === 'filled' ? 'marker-fill-toggle__btn--active' : ''}`}
                                        onClick={() => setFillMode('filled')}
                                    >
                                        Filled
                                    </button>
                                    <button
                                        type="button"
                                        className={`marker-fill-toggle__btn ${fillMode === 'outline' ? 'marker-fill-toggle__btn--active' : ''}`}
                                        onClick={() => setFillMode('outline')}
                                    >
                                        Outline
                                    </button>
                                </div>
                            </div>
                            <div className="edge-marker-editor-modal__shape-container">
                                {/* Interactive Path Canvas */}
                                <div className="edge-marker-editor-modal__shape-svg">
                                    <InteractivePathCanvas
                                        pathData={pathData}
                                        onPathChange={handlePathDataChange}
                                        fillMode={fillMode}
                                        zoom={zoom}
                                        viewBox={shapeViewBox}
                                        markerId={markerId}
                                    />
                                </div>

                                {/* Vertical Zoom Slider */}
                                <div className="marker-zoom-slider-container">
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="4"
                                        step="0.25"
                                        value={zoom}
                                        onChange={e => setZoom(parseFloat(e.target.value))}
                                        className="marker-zoom-slider"
                                        aria-label="Zoom"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="edge-marker-editor-modal__live-preview">
                            <div className="edge-marker-editor-modal__live-label">Live Preview</div>
                            <div className="edge-marker-editor-modal__live-content">
                                {/* Head/Tail Toggle - vertical, on the left */}
                                <div className="marker-preview-toggle">
                                    <button
                                        type="button"
                                        className={`marker-preview-toggle__option ${previewPosition === 'head' ? 'marker-preview-toggle__option--active' : ''}`}
                                        onClick={() => setPreviewPosition('head')}
                                    >
                                        Head
                                    </button>
                                    <button
                                        type="button"
                                        className={`marker-preview-toggle__option ${previewPosition === 'tail' ? 'marker-preview-toggle__option--active' : ''}`}
                                        onClick={() => setPreviewPosition('tail')}
                                    >
                                        Tail
                                    </button>
                                </div>

                                {/* SVG Preview */}
                                {(() => {
                                    // Single color for both line and marker (ensures visual consistency)
                                    const edgeColor = '#334155';
                                    const hasValidPath = currentPath && currentPath.trim().length > 0;

                                    return (
                                        <svg
                                            viewBox="0 0 300 50"
                                            preserveAspectRatio="xMidYMid meet"
                                            style={{ flex: 1, height: '50px', overflow: 'visible' }}
                                        >
                                            {hasValidPath && (
                                                <defs>
                                                    <marker
                                                        id={previewMarkerId}
                                                        viewBox="0 0 10 10"
                                                        refX={previewPosition === 'head' ? 10 : 0}
                                                        refY="5"
                                                        markerWidth="12"
                                                        markerHeight="12"
                                                        orient="0"
                                                    >
                                                        <path
                                                            d={currentPath}
                                                            fill={fillMode === 'filled' ? edgeColor : '#ffffff'}
                                                            stroke={edgeColor}  
                                                            strokeWidth="0.5"
                                                        />
                                                    </marker>
                                                </defs>
                                            )}

                                            {/* Edge line */}
                                            <line
                                                x1="50"
                                                y1="25"
                                                x2="250"
                                                y2="25"
                                                stroke={edgeColor}
                                                strokeWidth="2"
                                                markerEnd={hasValidPath && previewPosition === 'head' ? `url(#${previewMarkerId})` : undefined}
                                                markerStart={hasValidPath && previewPosition === 'tail' ? `url(#${previewMarkerId})` : undefined}
                                            />

                                            {/* Labels */}
                                            <text x="38" y="29" fontSize="12" fill={edgeColor} textAnchor="middle">A</text>
                                            <text x="262" y="29" fontSize="12" fill={edgeColor} textAnchor="middle">B</text>
                                        </svg>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Right: Monaco Editor */}
                    <div className="edge-marker-editor-modal__code-panel">
                        <div className="edge-marker-editor-modal__code-header">
                            <i className="bi bi-code-slash" />
                            Path Code
                        </div>
                        <div className="edge-marker-editor-modal__code-editor">
                            <Editor
                                height="100%"
                                value={editorValue}
                                onChange={handleEditorChange}
                                defaultLanguage="plaintext"
                                options={monacoOptions}
                                theme="vs"
                            />
                        </div>
                        <div className="edge-marker-editor-modal__code-hint">
                            SVG path commands: M (move), L (line), Q (quadratic), C (cubic), Z (close)
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="edge-marker-editor-modal__footer">
                    <button
                        className="edge-marker-editor-modal__btn edge-marker-editor-modal__btn--cancel"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="edge-marker-editor-modal__btn edge-marker-editor-modal__btn--apply"
                        onClick={handleApply}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default EdgeMarkerEditorModal;
