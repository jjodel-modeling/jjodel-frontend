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
}

/**
 * Compact toolbar for editor controls.
 * Provides undo/redo, zoom, snap-to-grid toggle, and delete actions.
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
}: ToolbarProps) {
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

            <div className="toolbar-spacer" />

            <div className="toolbar-hint">
                <span>Shift+drag for box select | Ctrl+C/V/X</span>
            </div>
        </div>
    );
}

export default Toolbar;
