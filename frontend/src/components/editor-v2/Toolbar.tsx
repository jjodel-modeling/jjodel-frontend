import React from 'react';

interface ToolbarProps {
    snapEnabled: boolean;
    onToggleSnap: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitView: () => void;
    onDeleteSelected: () => void;
}

/**
 * Compact toolbar for editor controls.
 * Provides zoom, snap-to-grid toggle, and delete actions.
 */
function Toolbar({
    snapEnabled,
    onToggleSnap,
    onZoomIn,
    onZoomOut,
    onFitView,
    onDeleteSelected,
}: ToolbarProps) {
    return (
        <div className="editor-v2-toolbar">
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
                    onClick={onFitView}
                    title="Fit view"
                >
                    <i className="bi bi-arrows-fullscreen" />
                </button>
            </div>

            <div className="toolbar-separator" />

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

            <div className="toolbar-group">
                <button
                    className="toolbar-btn danger"
                    onClick={onDeleteSelected}
                    title="Delete selected (Delete/Backspace)"
                >
                    <i className="bi bi-trash" />
                </button>
            </div>

            <div className="toolbar-spacer" />

            <div className="toolbar-hint">
                <span>Shift+drag for box select</span>
            </div>
        </div>
    );
}

export default Toolbar;
