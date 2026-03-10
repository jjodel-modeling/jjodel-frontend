import { useState, useEffect, useRef, useCallback } from 'react';
import type { NotationMode, ColorScheme } from './types';
import ColorSchemeSelector from './components/ColorSchemeSelector';

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
    onPolymetricView?: () => void;
    colorScheme: ColorScheme;
    onColorSchemeChange: (scheme: ColorScheme) => void;
}

const NOTATION_OPTIONS: Array<{ id: NotationMode; name: string; desc: string; icon: string }> = [
    { id: 'uml',        name: 'Structured',        desc: 'Class diagram like',  icon: 'bi-diagram-3' },
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
    onFitView,
    onDeleteSelected,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    notation,
    onNotationChange,
    onAutoLayout,
    onPolymetricView,
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

            {/* View */}
            <div className="toolbar-group">
                <button
                    className="toolbar-btn"
                    onClick={onFitView}
                    title="Fit view"
                >
                    <i className="bi bi-arrows-fullscreen" />
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

            {/* Color scheme */}
            <div className="toolbar-group">
                <ColorSchemeSelector
                    colorScheme={colorScheme}
                    onColorSchemeChange={onColorSchemeChange}
                />
            </div>

            {onPolymetricView && (
                <>
                    <div className="toolbar-separator" />
                    <div className="toolbar-group">
                        <button
                            className="toolbar-btn"
                            onClick={onPolymetricView}
                            title="Polymetric View"
                        >
                            <i className="bi bi-grid-3x3-gap" />
                        </button>
                    </div>
                </>
            )}

            <div className="toolbar-spacer" />

            <div className="toolbar-hint">
                <span>Shift+drag for box select | Ctrl+C/V/X</span>
            </div>
        </div>
    );
}

export default Toolbar;
