import { useState, useEffect, useRef, useCallback } from 'react';
import type { NotationMode, ColorScheme } from './types';
import ColorSchemeSelector from './components/ColorSchemeSelector';

interface ToolbarProps {
    snapEnabled: boolean;
    onToggleSnap: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
    onFitView: () => void;
    onDeleteSelected: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
    notation: NotationMode;
    onNotationChange: (notation: NotationMode) => void;
    colorScheme: ColorScheme;
    onColorSchemeChange: (scheme: ColorScheme) => void;
}

const NOTATION_OPTIONS: Array<{ id: NotationMode; name: string; desc: string; icon: string }> = [
    { id: 'uml',        name: 'UML',        desc: 'Standard class diagram',  icon: 'bi-diagram-3' },
    { id: 'simplified',  name: 'Simplified', desc: 'Names only, minimal',     icon: 'bi-list' },
    { id: 'compact',     name: 'Compact',    desc: 'Headers only',            icon: 'bi-textarea' },
    { id: 'wireframe',   name: 'Wireframe',  desc: 'Blueprint style',         icon: 'bi-bounding-box-circles' },
    { id: 'er',          name: 'ER',         desc: 'Entity-Relationship',     icon: 'bi-database' },
];

/**
 * Compact toolbar for editor controls.
 * Provides undo/redo, zoom, snap-to-grid toggle, delete, theme, and notation mode.
 */
function Toolbar({
    snapEnabled,
    onToggleSnap,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onFitView,
    onDeleteSelected,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    theme,
    onToggleTheme,
    notation,
    onNotationChange,
    colorScheme,
    onColorSchemeChange,
}: ToolbarProps) {
    const [notationOpen, setNotationOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentNotation = NOTATION_OPTIONS.find(n => n.id === notation) ?? NOTATION_OPTIONS[0];

    // Close dropdown on click outside
    useEffect(() => {
        if (!notationOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setNotationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
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
            {/* Undo/Redo */}
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
            </div>

            <div className="toolbar-separator" />

            {/* Zoom */}
            <div className="toolbar-group">
                <button
                    className="toolbar-btn"
                    onClick={onZoomIn}
                    title="Zoom in"
                >
                    <i className="bi bi-zoom-in" />
                </button>
                <button
                    className="toolbar-btn"
                    onClick={onZoomOut}
                    title="Zoom out"
                >
                    <i className="bi bi-zoom-out" />
                </button>
                <button
                    className="toolbar-btn"
                    onClick={onResetZoom}
                    title="Reset zoom (100%)"
                >
                    <i className="bi bi-aspect-ratio" />
                </button>
                <button
                    className="toolbar-btn"
                    onClick={onFitView}
                    title="Fit view"
                >
                    <i className="bi bi-arrows-fullscreen" />
                </button>
            </div>

            <div className="toolbar-separator" />

            {/* Snap */}
            <div className="toolbar-group">
                <button
                    className={`toolbar-btn ${snapEnabled ? 'active' : ''}`}
                    onClick={onToggleSnap}
                    title={snapEnabled ? 'Disable snap to grid' : 'Enable snap to grid'}
                >
                    <i className="bi bi-grid-3x3" />
                </button>
            </div>

            <div className="toolbar-separator" />

            {/* Delete */}
            <div className="toolbar-group">
                <button
                    className="toolbar-btn danger"
                    onClick={onDeleteSelected}
                    title="Delete selected (Delete/Backspace)"
                >
                    <i className="bi bi-trash" />
                </button>
            </div>

            <div className="toolbar-separator" />

            {/* Theme toggle */}
            <div className="toolbar-group">
                <button
                    className="toolbar-btn"
                    onClick={onToggleTheme}
                    title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                >
                    <i className={theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon'} />
                </button>
            </div>

            <div className="toolbar-separator" />

            {/* Notation selector */}
            <div className="toolbar-group">
                <div className="notation-selector" ref={dropdownRef}>
                    <button
                        className="toolbar-btn notation-selector__trigger"
                        onClick={() => setNotationOpen(prev => !prev)}
                        title="Notation mode"
                    >
                        <i className={`bi ${currentNotation.icon}`} />
                        <span className="notation-selector__label">{currentNotation.name}</span>
                        <i className="bi bi-chevron-down notation-selector__chevron" />
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
            </div>

            <div className="toolbar-separator" />

            {/* Color scheme selector */}
            <div className="toolbar-group">
                <ColorSchemeSelector
                    colorScheme={colorScheme}
                    onColorSchemeChange={onColorSchemeChange}
                />
            </div>

            <div className="toolbar-spacer" />

            <div className="toolbar-hint">
                <span>Shift+drag for box select | Ctrl+C/V/X</span>
            </div>
        </div>
    );
}

export default Toolbar;
