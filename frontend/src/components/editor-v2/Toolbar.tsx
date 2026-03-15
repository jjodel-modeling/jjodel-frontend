import { useState, useEffect, useRef, useCallback } from 'react';
import type { NotationMode, ColorScheme } from './types';
import ColorSchemeSelector from './components/ColorSchemeSelector';
import { LayoutMode, getSavedLayoutMode, saveLayoutMode } from '../abstract/Dock';
import { isProjectOverviewPage } from '../../utils/navigationUtils';

interface ToolbarProps {
    snapEnabled: boolean;
    onToggleSnap: () => void;
    onFitView: () => void;
    onDeleteSelected: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    notation: NotationMode;
    onNotationChange: (notation: NotationMode) => void;
    onAutoLayout?: () => void;
    onDuplicateSelected?: () => void;
    colorScheme: ColorScheme;
    onColorSchemeChange: (scheme: ColorScheme) => void;
    // Zoom controls
    zoomLevel?: number;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetZoom?: () => void;
    // Alignment (inline — replaces undo/redo group when 2+ selected)
    selectedCount?: number;
    onAlignLeft?: () => void;
    onAlignCenterV?: () => void;
    onAlignRight?: () => void;
    onAlignTop?: () => void;
    onAlignCenterH?: () => void;
    onAlignBottom?: () => void;
    onDistributeH?: () => void;
    onDistributeV?: () => void;
}

const NOTATION_OPTIONS: Array<{ id: NotationMode; name: string; desc: string; icon: string }> = [
    { id: 'uml',        name: 'Structured',        desc: 'Class diagram like',  icon: 'bi-diagram-3' },
    { id: 'simplified',  name: 'Simplified', desc: 'Names only, minimal',     icon: 'bi-list' },
    { id: 'compact',     name: 'Compact',    desc: 'Headers only',            icon: 'bi-textarea' },
    { id: 'wireframe',   name: 'Wireframe',  desc: 'Blueprint style',         icon: 'bi-bounding-box-circles' },
    { id: 'er',          name: 'ER',         desc: 'Entity-Relationship',     icon: 'bi-database' },
];

/**
 * Compact toolbar (Row 2) for the editor.
 *
 * Layout:
 * [↶][↷][⧉][🗑] | VIEW [Structured ▾] [Theme: X ▾] | LAYOUT [⊞][⊟] | [● Abstract syntax] | ——spacer—— | [−] 100% [+] [⤢] | [⤢/⊞]
 */
// SVG icons for alignment tools (moved from AlignmentToolbar)
const AlignIcons = {
    left: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="1.5" height="14" rx="0.5" />
            <rect x="4" y="3" width="10" height="3" rx="0.5" />
            <rect x="4" y="9" width="7" height="3" rx="0.5" />
        </svg>
    ),
    centerV: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="7.25" y="1" width="1.5" height="14" rx="0.5" opacity="0.4" />
            <rect x="2" y="3" width="12" height="3" rx="0.5" />
            <rect x="3.5" y="9" width="9" height="3" rx="0.5" />
        </svg>
    ),
    right: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="13.5" y="1" width="1.5" height="14" rx="0.5" />
            <rect x="2" y="3" width="10" height="3" rx="0.5" />
            <rect x="5" y="9" width="7" height="3" rx="0.5" />
        </svg>
    ),
    top: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="14" height="1.5" rx="0.5" />
            <rect x="3" y="4" width="3" height="10" rx="0.5" />
            <rect x="9" y="4" width="3" height="7" rx="0.5" />
        </svg>
    ),
    centerH: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="7.25" width="14" height="1.5" rx="0.5" opacity="0.4" />
            <rect x="3" y="2" width="3" height="12" rx="0.5" />
            <rect x="9" y="3.5" width="3" height="9" rx="0.5" />
        </svg>
    ),
    bottom: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="13.5" width="14" height="1.5" rx="0.5" />
            <rect x="3" y="2" width="3" height="10" rx="0.5" />
            <rect x="9" y="5" width="3" height="7" rx="0.5" />
        </svg>
    ),
    distributeH: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="1.5" height="14" rx="0.5" opacity="0.4" />
            <rect x="13.5" y="1" width="1.5" height="14" rx="0.5" opacity="0.4" />
            <rect x="4" y="3" width="3" height="10" rx="0.5" />
            <rect x="9" y="5" width="3" height="6" rx="0.5" />
        </svg>
    ),
    distributeV: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="14" height="1.5" rx="0.5" opacity="0.4" />
            <rect x="1" y="13.5" width="14" height="1.5" rx="0.5" opacity="0.4" />
            <rect x="3" y="4" width="10" height="3" rx="0.5" />
            <rect x="5" y="9" width="6" height="3" rx="0.5" />
        </svg>
    ),
};

function Toolbar({
    snapEnabled,
    onToggleSnap,
    onFitView,
    onDeleteSelected,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    notation,
    onNotationChange,
    onAutoLayout,
    onDuplicateSelected,
    colorScheme,
    onColorSchemeChange,
    zoomLevel,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    selectedCount = 0,
    onAlignLeft,
    onAlignCenterV,
    onAlignRight,
    onAlignTop,
    onAlignCenterH,
    onAlignBottom,
    onDistributeH,
    onDistributeV,
}: ToolbarProps) {
    const [notationOpen, setNotationOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const prevPanelMode = useRef<LayoutMode>('sidebar');

    const currentNotation = NOTATION_OPTIONS.find(n => n.id === notation) ?? NOTATION_OPTIONS[0];

    // ── Layout mode state (synced via CustomEvent + localStorage) ──
    const [layoutMode, setLayoutMode] = useState<LayoutMode>(getSavedLayoutMode);

    useEffect(() => {
        const handleLayoutChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.mode) setLayoutMode(detail.mode);
        };
        window.addEventListener('jjodel:layout-mode-change', handleLayoutChange);
        return () => window.removeEventListener('jjodel:layout-mode-change', handleLayoutChange);
    }, []);

    const handleLayoutModeChange = useCallback((mode: LayoutMode, resetToDefault = false) => {
        setLayoutMode(mode);
        saveLayoutMode(mode);
        document.body.setAttribute('data-layout-mode', mode);
        window.dispatchEvent(new CustomEvent('jjodel:layout-mode-change', {
            detail: { mode, resetToDefault }
        }));
    }, []);

    const handleLayoutModeDoubleClick = useCallback((mode: LayoutMode) => {
        handleLayoutModeChange(mode, true);
    }, [handleLayoutModeChange]);

    const showLayoutControls = !isProjectOverviewPage();

    // Close dropdown on click outside
    useEffect(() => {
        if (!notationOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setNotationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick, true);
        return () => document.removeEventListener('mousedown', handleClick, true);
    }, [notationOpen]);

    // Close dropdown on Escape
    useEffect(() => {
        if (!notationOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setNotationOpen(false);
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [notationOpen]);

    const handleSelect = useCallback((id: NotationMode) => {
        onNotationChange(id);
        setNotationOpen(false);
    }, [onNotationChange]);

    return (
        <div className="editor-v2-toolbar">
            {/* ── Actions / Alignment group (swaps in-place) ── */}
            {selectedCount >= 2 && onAlignLeft ? (
                <div className="toolbar-group toolbar-group--align">
                    <span className="toolbar-group__label">ALIGN</span>
                    <button className="toolbar-btn" onClick={onAlignLeft} title="Align left">
                        {AlignIcons.left}
                    </button>
                    <button className="toolbar-btn" onClick={onAlignCenterV} title="Align center (vertical axis)">
                        {AlignIcons.centerV}
                    </button>
                    <button className="toolbar-btn" onClick={onAlignRight} title="Align right">
                        {AlignIcons.right}
                    </button>
                    <div className="toolbar-align-divider" />
                    <button className="toolbar-btn" onClick={onAlignTop} title="Align top">
                        {AlignIcons.top}
                    </button>
                    <button className="toolbar-btn" onClick={onAlignCenterH} title="Align center (horizontal axis)">
                        {AlignIcons.centerH}
                    </button>
                    <button className="toolbar-btn" onClick={onAlignBottom} title="Align bottom">
                        {AlignIcons.bottom}
                    </button>
                    {selectedCount >= 3 && onDistributeH && (
                        <>
                            <div className="toolbar-align-divider" />
                            <button className="toolbar-btn" onClick={onDistributeH} title="Distribute horizontally">
                                {AlignIcons.distributeH}
                            </button>
                            <button className="toolbar-btn" onClick={onDistributeV} title="Distribute vertically">
                                {AlignIcons.distributeV}
                            </button>
                        </>
                    )}
                    <span className="toolbar-selection-count">{selectedCount} selected</span>
                </div>
            ) : (
                <div className="toolbar-group">
                    <button
                        className="toolbar-btn"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                    >
                        <i className="bi bi-arrow-counterclockwise" />
                    </button>
                    <button
                        className="toolbar-btn"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <i className="bi bi-arrow-clockwise" />
                    </button>
                    {onDuplicateSelected && (
                        <button
                            className="toolbar-btn"
                            onClick={onDuplicateSelected}
                            title="Duplicate selected"
                        >
                            <i className="bi bi-copy" />
                        </button>
                    )}
                    <button
                        className="toolbar-btn danger"
                        onClick={onDeleteSelected}
                        title="Delete selected (Delete/Backspace)"
                    >
                        <i className="bi bi-trash" />
                    </button>
                </div>
            )}

            <div className="toolbar-separator" />

            {/* ── VIEW group (with label) ── */}
            <div className="toolbar-group toolbar-group--labeled">
                <span className="toolbar-group__label">VIEW</span>

                {/* Notation/Structure dropdown */}
                <div className="notation-selector" ref={dropdownRef}>
                    <button
                        className="toolbar-dropdown-btn"
                        onClick={() => setNotationOpen(prev => !prev)}
                        title="Notation mode"
                    >
                        <span>{currentNotation.name}</span>
                        <i className="bi bi-chevron-down toolbar-dropdown-btn__chevron" />
                    </button>
                    {notationOpen && (
                        <div className="notation-selector__dropdown">
                            {NOTATION_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    className={`notation-selector__option ${notation === opt.id ? 'active' : ''}`}
                                    onClick={() => handleSelect(opt.id)}
                                >
                                    <i className={`bi ${opt.icon}`} />
                                    <div>
                                        <div className="notation-selector__option-name">{opt.name}</div>
                                        <div className="notation-selector__option-desc">{opt.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme/Color scheme dropdown */}
                <ColorSchemeSelector
                    colorScheme={colorScheme}
                    onColorSchemeChange={onColorSchemeChange}
                />
            </div>

            <div className="toolbar-separator" />

            {/* ── LAYOUT group (with label) ── */}
            <div className="toolbar-group toolbar-group--labeled">
                <span className="toolbar-group__label">LAYOUT</span>
                <button
                    className={`toolbar-btn ${snapEnabled ? 'active' : ''}`}
                    onClick={onToggleSnap}
                    title={snapEnabled ? 'Disable snap to grid' : 'Enable snap to grid'}
                >
                    <i className="bi bi-grid-3x3" />
                </button>
                {onAutoLayout && (
                    <button
                        className="toolbar-btn"
                        onClick={onAutoLayout}
                        title="Auto layout"
                    >
                        <i className="bi bi-diagram-3" />
                    </button>
                )}
            </div>

            <div className="toolbar-separator" />

            {/* ── Abstract syntax pill ── */}
            <button
                className="toolbar-syntax-pill toolbar-syntax-pill--active"
                title="Currently viewing abstract syntax"
            >
                <span className="toolbar-syntax-pill__dot" />
                Abstract syntax
            </button>

            {/* ── Spacer ── */}
            <div className="toolbar-spacer" />

            {/* ── Zoom controls (right-aligned) ── */}
            {onZoomOut && onZoomIn && onResetZoom && zoomLevel !== undefined && (
                <div className="toolbar-zoom">
                    <button
                        className="toolbar-btn"
                        onClick={onZoomOut}
                        title="Zoom out"
                    >
                        <i className="bi bi-dash" />
                    </button>
                    <button
                        className="toolbar-zoom__level"
                        onClick={onResetZoom}
                        title="Reset zoom"
                    >
                        {zoomLevel}%
                    </button>
                    <button
                        className="toolbar-btn"
                        onClick={onZoomIn}
                        title="Zoom in"
                    >
                        <i className="bi bi-plus" />
                    </button>
                    <button
                        className="toolbar-btn"
                        onClick={onFitView}
                        title="Fit to view"
                    >
                        <i className="bi bi-arrows-fullscreen" />
                    </button>
                </div>
            )}
            {/* Fallback: fit view button when zoom props not provided */}
            {(!onZoomIn || !onZoomOut) && (
                <button
                    className="toolbar-btn"
                    onClick={onFitView}
                    title="Fit to view"
                >
                    <i className="bi bi-arrows-fullscreen" />
                </button>
            )}

            {/* ── Panel toggle (after zoom) ── */}
            {showLayoutControls && (
                <>
                    <div className="toolbar-separator" />
                    <button
                        className="toolbar-btn"
                        onClick={() => {
                            if (layoutMode === 'canvas-only') {
                                // Restore previous panel mode
                                const prev = prevPanelMode.current;
                                handleLayoutModeChange(prev);
                            } else {
                                // Save current mode and go fullscreen
                                prevPanelMode.current = layoutMode;
                                handleLayoutModeChange('canvas-only');
                            }
                        }}
                        title={layoutMode === 'canvas-only' ? 'Show panel' : 'Fullscreen'}
                    >
                        <i className={layoutMode === 'canvas-only' ? 'bi bi-layout-sidebar-reverse' : 'bi bi-fullscreen'} />
                    </button>
                </>
            )}
        </div>
    );
}

export default Toolbar;
