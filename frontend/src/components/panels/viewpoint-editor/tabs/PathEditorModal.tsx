/**
 * PathEditorModal
 * Overlay modal for visually editing SVG path strings.
 * Layout: sidebar (path string + config + commands list) | canvas + zoom.
 */

import React, { useState, useEffect, useCallback, useId, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { InteractivePathCanvas } from '../../../editors/InteractivePathCanvas';
import {
    PathData,
    PathPoint,
    CommandType,
    normalizePath,
    parsePath,
    serializePath,
    updatePoint,
    removePoint,
    convertSegment,
} from '../../../editors/pathDataModel';
import PathPresetsPopover from './PathPresetsPopover';

// ============================================
// TYPES
// ============================================

type FillMode = 'filled' | 'outline';

interface PathEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    pathString: string;
    initialFillMode?: FillMode;
    onPathChange: (newPath: string, fillMode: FillMode) => void;
}

// Command badge color map
const CMD_COLORS: Record<CommandType, string> = {
    M: '#8b5cf6', // violet
    L: '#0ea5e9', // cyan
    Q: '#f59e0b', // amber
    C: '#10b981', // emerald
    A: '#ec4899', // pink
    Z: '#94a3b8', // slate
};

// ============================================
// COMPONENT
// ============================================

const PathEditorModal: React.FC<PathEditorModalProps> = ({
    isOpen,
    onClose,
    pathString,
    initialFillMode = 'outline',
    onPathChange,
}) => {
    const [pathData, setPathData] = useState<PathData>(() => parsePath(pathString));
    const [fillMode, setFillMode] = useState<FillMode>(initialFillMode);
    const [zoom, setZoom] = useState(1);
    const [localPathString, setLocalPathString] = useState(pathString);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [highlightedPointId, setHighlightedPointId] = useState<string | null>(null);
    const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

    const [presetsOpen, setPresetsOpen] = useState(false);
    const presetsButtonRef = useRef<HTMLButtonElement>(null);

    // Command context menu (inline in commands list)
    const [cmdMenuPointId, setCmdMenuPointId] = useState<string | null>(null);
    const cmdMenuRef = useRef<HTMLDivElement>(null);

    const uniqueId = useId();
    const markerId = `path-editor-${uniqueId.replace(/:/g, '')}`;

    // Track previous open state to only reset on open transition
    const wasOpenRef = useRef(false);

    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            setPathData(parsePath(pathString));
            setLocalPathString(pathString);
            setFillMode(initialFillMode);
            setZoom(1);
            setSelectedPointId(null);
            setHighlightedPointId(null);
            setCmdMenuPointId(null);
        }
        wasOpenRef.current = isOpen;
    }, [isOpen, pathString, initialFillMode]);

    // ========================================
    // DATA FLOW
    // ========================================

    /** Update local state only (no parent propagation until Save) */
    const commitPathData = useCallback((newData: PathData) => {
        setPathData(newData);
        setLocalPathString(serializePath(newData));
    }, []);

    // Canvas → local state
    const handleCanvasPathChange = useCallback((newData: PathData) => {
        commitPathData(newData);
    }, [commitPathData]);

    // Textarea → parse → local state
    const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setLocalPathString(val);
        try {
            const parsed = parsePath(val);
            if (parsed.length > 0 || val.trim() === '') {
                setPathData(parsed);
            }
        } catch {
            // Partial/invalid path while typing — keep previous pathData
        }
    }, []);

    // Normalize on blur: rewrite textarea with clean absolute commands (M, L, C, Z)
    const handleTextareaBlur = useCallback(() => {
        if (localPathString.trim() === '') return;
        try {
            const normalized = normalizePath(localPathString);
            setLocalPathString(normalized);
            const parsed = parsePath(normalized);
            if (parsed.length > 0) {
                setPathData(parsed);
            }
        } catch {
            // Invalid path — leave textarea text as-is
        }
    }, [localPathString]);

    // Save: propagate to parent + close
    const handleSave = useCallback(() => {
        onPathChange(localPathString, fillMode);
        onClose();
    }, [localPathString, fillMode, onPathChange, onClose]);

    // Cancel: close without saving
    const handleCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    // Escape to cancel (close without saving)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (cmdMenuPointId) {
                    setCmdMenuPointId(null);
                } else {
                    handleCancel();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleCancel, cmdMenuPointId]);

    // Prevent body scroll
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Close cmd menu on outside click
    useEffect(() => {
        if (!cmdMenuPointId) return;
        const handler = (e: MouseEvent) => {
            if (cmdMenuRef.current && !cmdMenuRef.current.contains(e.target as Node)) {
                setCmdMenuPointId(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [cmdMenuPointId]);

    // ========================================
    // COMMAND LIST ACTIONS
    // ========================================

    const handleCoordChange = useCallback((pointId: string, field: string, value: number) => {
        const updates: Partial<PathPoint> = { [field]: value };
        const newData = updatePoint(pathData, pointId, updates);
        commitPathData(newData);
    }, [pathData, commitPathData]);

    const handleConvertCommand = useCallback((pointId: string, newCmd: CommandType) => {
        const newData = convertSegment(pathData, pointId, newCmd);
        commitPathData(newData);
        setCmdMenuPointId(null);
    }, [pathData, commitPathData]);

    const handleDeleteCommand = useCallback((pointId: string) => {
        const newData = removePoint(pathData, pointId);
        if (newData) {
            commitPathData(newData);
            if (selectedPointId === pointId) setSelectedPointId(null);
            if (highlightedPointId === pointId) setHighlightedPointId(null);
        }
        setCmdMenuPointId(null);
    }, [pathData, commitPathData, selectedPointId, highlightedPointId]);

    // Load a preset path into the editor (confirmation is handled inline by the popover)
    const handlePresetClick = useCallback((presetPath: string, filled: boolean) => {
        const parsed = parsePath(presetPath);
        commitPathData(parsed);
        if (filled) setFillMode('filled');
        setSelectedPointId(null);
        setHighlightedPointId(null);
    }, [commitPathData]);

    // Effective highlighted = sidebar hover or sidebar click-selected
    const effectiveHighlightId = highlightedPointId ?? selectedPointId;

    if (!isOpen) return null;

    // ViewBox centered on the 0-10 marker box
    const baseSize = 30;
    const viewBoxSize = baseSize / zoom;
    const viewBoxOffset = (10 - viewBoxSize) / 2;
    const shapeViewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

    return createPortal(
        <div className="path-editor-modal__overlay" onClick={handleCancel}>
            <div
                className="path-editor-modal__dialog"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="path-editor-modal__header">
                    <div className="path-editor-modal__header-left">
                        <i className="bi bi-bezier2" />
                        <span className="path-editor-modal__title">Jjodel SVG Path Editor</span>
                    </div>
                    <div className="path-editor-modal__header-actions">
                        <button
                            className="path-editor-modal__cancel-btn"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button
                            className="path-editor-modal__save-btn"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                    </div>
                </div>

                {/* Toolbar hints */}
                <div className="path-editor-modal__toolbar">
                    <div className="path-editor-modal__hint">
                        <i className="bi bi-arrows-move" />
                        <span>Drag points</span>
                    </div>
                    <div className="path-editor-modal__hint-sep" />
                    <div className="path-editor-modal__hint">
                        <i className="bi bi-cursor" />
                        <span>Click to add</span>
                    </div>
                    <div className="path-editor-modal__hint-sep" />
                    <div className="path-editor-modal__hint">
                        <i className="bi bi-mouse" />
                        <span>Right-click to edit</span>
                    </div>
                </div>

                {/* Body — sidebar + canvas */}
                <div className="path-editor-modal__body">
                    {/* Sidebar */}
                    <div className="path-editor-modal__sidebar">
                        {/* PATH section */}
                        <div className="path-editor-modal__section">
                            <div className="path-editor-modal__section-label">Path</div>
                            <textarea
                                className="path-editor-modal__path-textarea"
                                value={localPathString}
                                onChange={handleTextareaChange}
                                onBlur={handleTextareaBlur}
                                placeholder="M 0 0 L 10 10"
                                spellCheck={false}
                                rows={4}
                            />
                        </div>

                        {/* CONFIGURATION section */}
                        <div className="path-editor-modal__section">
                            <div className="path-editor-modal__section-label">Configuration</div>

                            <label className="path-editor-modal__config-row">
                                <input
                                    type="checkbox"
                                    checked={snapToGrid}
                                    onChange={() => setSnapToGrid(s => !s)}
                                />
                                <i className="bi bi-grid-3x3" />
                                <span>Snap to grid</span>
                            </label>

                            <label className="path-editor-modal__config-row">
                                <input
                                    type="checkbox"
                                    checked={showGrid}
                                    onChange={() => setShowGrid(g => !g)}
                                />
                                <i className="bi bi-grid" />
                                <span>Show grid</span>
                            </label>

                            <div className="path-editor-modal__config-group">
                                <span className="path-editor-modal__config-group-label">Fill mode</span>
                                <div className="path-editor-modal__fill-toggle">
                                    <button
                                        className={`path-editor-modal__fill-btn ${fillMode === 'filled' ? 'path-editor-modal__fill-btn--active' : ''}`}
                                        onClick={() => setFillMode('filled')}
                                    >
                                        Filled
                                    </button>
                                    <button
                                        className={`path-editor-modal__fill-btn ${fillMode === 'outline' ? 'path-editor-modal__fill-btn--active' : ''}`}
                                        onClick={() => setFillMode('outline')}
                                    >
                                        Outline
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* PRESETS button + popover */}
                        <div className="path-editor-modal__section">
                            <div className="path-editor-modal__section-label">Presets</div>
                            <button
                                ref={presetsButtonRef}
                                className={`path-editor-modal__presets-btn ${presetsOpen ? 'path-editor-modal__presets-btn--active' : ''}`}
                                onClick={() => setPresetsOpen(o => !o)}
                            >
                                <i className="bi bi-grid-3x3-gap" />
                                <span>Browse Shapes &amp; Icons</span>
                                <i className="bi bi-chevron-right path-editor-modal__presets-btn-chevron" />
                            </button>
                            {presetsOpen && (
                                <PathPresetsPopover
                                    anchorRef={presetsButtonRef}
                                    hasExistingPath={pathData.length > 0}
                                    onSelect={(pathD, filled) => {
                                        handlePresetClick(pathD, filled);
                                        setPresetsOpen(false);
                                    }}
                                    onClose={() => setPresetsOpen(false)}
                                />
                            )}
                        </div>

                        {/* COMMANDS section */}
                        <div className="path-editor-modal__section path-editor-modal__section--commands">
                            <div className="path-editor-modal__section-label">
                                Commands
                                <span className="path-editor-modal__section-count">{pathData.length}</span>
                            </div>
                            <div className="path-editor-modal__commands-list">
                                {pathData.map((point) => (
                                    <div
                                        key={point.id}
                                        className={`path-editor-modal__cmd-row ${selectedPointId === point.id ? 'path-editor-modal__cmd-row--selected' : ''} ${highlightedPointId === point.id ? 'path-editor-modal__cmd-row--highlighted' : ''}`}
                                        onMouseEnter={() => setHighlightedPointId(point.id)}
                                        onMouseLeave={() => setHighlightedPointId(null)}
                                        onClick={() => setSelectedPointId(prev => prev === point.id ? null : point.id)}
                                    >
                                        <span
                                            className="path-editor-modal__cmd-badge"
                                            style={{ background: CMD_COLORS[point.command] }}
                                        >
                                            {point.command}
                                        </span>

                                        {/* Center zone (flex:1) — arc params for A, empty spacer for M/L */}
                                        {point.command === 'A' ? (
                                            <div className="path-editor-modal__cmd-center">
                                                <input
                                                    className="path-editor-modal__coord-input"
                                                    type="number"
                                                    step="0.1"
                                                    value={point.rx ?? 0}
                                                    onChange={e => handleCoordChange(point.id, 'rx', parseFloat(e.target.value) || 0)}
                                                    onClick={e => e.stopPropagation()}
                                                    title="rx"
                                                    placeholder="rx"
                                                />
                                                <input
                                                    className="path-editor-modal__coord-input"
                                                    type="number"
                                                    step="0.1"
                                                    value={point.ry ?? 0}
                                                    onChange={e => handleCoordChange(point.id, 'ry', parseFloat(e.target.value) || 0)}
                                                    onClick={e => e.stopPropagation()}
                                                    title="ry"
                                                    placeholder="ry"
                                                />
                                                <input
                                                    className="path-editor-modal__coord-input"
                                                    type="number"
                                                    step="1"
                                                    value={point.rotation ?? 0}
                                                    onChange={e => handleCoordChange(point.id, 'rotation', parseFloat(e.target.value) || 0)}
                                                    onClick={e => e.stopPropagation()}
                                                    title="rotation"
                                                    placeholder="rot"
                                                />
                                                <label className="path-editor-modal__arc-flag" onClick={e => e.stopPropagation()} title="Large Arc">
                                                    <input
                                                        type="checkbox"
                                                        checked={(point.largeArc ?? 0) === 1}
                                                        onChange={e => handleCoordChange(point.id, 'largeArc', e.target.checked ? 1 : 0)}
                                                    />
                                                    <span>L</span>
                                                </label>
                                                <label className="path-editor-modal__arc-flag" onClick={e => e.stopPropagation()} title="Sweep">
                                                    <input
                                                        type="checkbox"
                                                        checked={(point.sweep ?? 0) === 1}
                                                        onChange={e => handleCoordChange(point.id, 'sweep', e.target.checked ? 1 : 0)}
                                                    />
                                                    <span>S</span>
                                                </label>
                                            </div>
                                        ) : point.command !== 'Z' ? (
                                            <div className="path-editor-modal__cmd-center" />
                                        ) : (
                                            <span className="path-editor-modal__cmd-z-label">close</span>
                                        )}

                                        {/* Right zone — x,y inputs (fixed width, aligned across all commands) */}
                                        {point.command !== 'Z' && (
                                            <div className="path-editor-modal__cmd-xy">
                                                <input
                                                    className="path-editor-modal__coord-input"
                                                    type="number"
                                                    step="0.1"
                                                    value={point.x}
                                                    onChange={e => handleCoordChange(point.id, 'x', parseFloat(e.target.value) || 0)}
                                                    onClick={e => e.stopPropagation()}
                                                    title="x"
                                                />
                                                <input
                                                    className="path-editor-modal__coord-input"
                                                    type="number"
                                                    step="0.1"
                                                    value={point.y}
                                                    onChange={e => handleCoordChange(point.id, 'y', parseFloat(e.target.value) || 0)}
                                                    onClick={e => e.stopPropagation()}
                                                    title="y"
                                                />
                                            </div>
                                        )}

                                        {/* Actions menu — rendered for all non-Z rows to preserve flex alignment */}
                                        {point.command !== 'Z' && (
                                            <div className="path-editor-modal__cmd-actions" ref={cmdMenuPointId === point.id ? cmdMenuRef : undefined}>
                                                {!(point.command === 'M' && pathData.indexOf(point) === 0) && (
                                                    <>
                                                        <button
                                                            className="path-editor-modal__cmd-menu-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCmdMenuPointId(prev => prev === point.id ? null : point.id);
                                                            }}
                                                            title="Actions"
                                                        >
                                                            <i className="bi bi-three-dots" />
                                                        </button>

                                                        {cmdMenuPointId === point.id && (
                                                            <div className="path-editor-modal__cmd-dropdown">
                                                                {point.command !== 'L' && (
                                                                    <button onClick={(e) => { e.stopPropagation(); handleConvertCommand(point.id, 'L'); }}>
                                                                        <span className="path-editor-modal__cmd-badge path-editor-modal__cmd-badge--sm" style={{ background: CMD_COLORS.L }}>L</span>
                                                                        Straight
                                                                    </button>
                                                                )}
                                                                {point.command !== 'Q' && (
                                                                    <button onClick={(e) => { e.stopPropagation(); handleConvertCommand(point.id, 'Q'); }}>
                                                                        <span className="path-editor-modal__cmd-badge path-editor-modal__cmd-badge--sm" style={{ background: CMD_COLORS.Q }}>Q</span>
                                                                        Quadratic
                                                                    </button>
                                                                )}
                                                                {point.command !== 'C' && (
                                                                    <button onClick={(e) => { e.stopPropagation(); handleConvertCommand(point.id, 'C'); }}>
                                                                        <span className="path-editor-modal__cmd-badge path-editor-modal__cmd-badge--sm" style={{ background: CMD_COLORS.C }}>C</span>
                                                                        Cubic
                                                                    </button>
                                                                )}
                                                                {point.command !== 'M' && (
                                                                    <button onClick={(e) => { e.stopPropagation(); handleConvertCommand(point.id, 'M'); }}>
                                                                        <span className="path-editor-modal__cmd-badge path-editor-modal__cmd-badge--sm" style={{ background: CMD_COLORS.M }}>M</span>
                                                                        Move to
                                                                    </button>
                                                                )}
                                                                <div className="path-editor-modal__cmd-dropdown-divider" />
                                                                <button
                                                                    className="path-editor-modal__cmd-dropdown-danger"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCommand(point.id); }}
                                                                >
                                                                    <i className="bi bi-trash3" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {pathData.length === 0 && (
                                    <div className="path-editor-modal__commands-empty">
                                        No commands yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Canvas area */}
                    <div className="path-editor-modal__canvas-area">
                        <div className={`path-editor-modal__canvas ${!showGrid ? 'path-editor-modal__canvas--no-grid' : ''}`}>
                            <InteractivePathCanvas
                                pathData={pathData}
                                onPathChange={handleCanvasPathChange}
                                fillMode={fillMode}
                                zoom={zoom}
                                viewBox={shapeViewBox}
                                markerId={markerId}
                                snapEnabled={snapToGrid}
                                highlightedPointId={effectiveHighlightId}
                            />
                        </div>

                        {/* Zoom bar */}
                        <div className="path-editor-modal__zoom">
                            <i className="bi bi-dash" />
                            <input
                                type="range"
                                min="0.5"
                                max="4"
                                step="0.25"
                                value={zoom}
                                onChange={e => setZoom(parseFloat(e.target.value))}
                                className="path-editor-modal__zoom-slider"
                                aria-label="Zoom"
                            />
                            <i className="bi bi-plus" />
                            <span className="path-editor-modal__zoom-value">{Math.round(zoom * 100)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default PathEditorModal;
