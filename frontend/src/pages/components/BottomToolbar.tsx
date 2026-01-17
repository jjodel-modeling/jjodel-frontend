import React from 'react';
import './bottomToolbar.scss';

/**
 * Bottom Toolbar Component
 * Visible only in editor states (S6 and S7)
 * Contains 3 sections:
 * 1. Tools commands (dynamic - from metamodel)
 * 2. Grid/Snap toggles
 * 3. Zoom controls
 */

interface BottomToolbarProps {
    visible?: boolean;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({ visible = true }) => {
    if (!visible) return null;

    return (
        <div className="bottom-toolbar">
            {/* Section 1: Tools Commands (dynamic content from metamodel) */}
            <div className="toolbar-section tools-section">
                <button className="toolbar-btn" disabled title="Select tool">
                    <i className="bi bi-cursor" />
                </button>
                <button className="toolbar-btn" disabled title="Pan tool">
                    <i className="bi bi-arrows-move" />
                </button>
                <div className="toolbar-divider" />
                <span className="toolbar-label">Tools</span>
            </div>

            {/* Section 2: Grid/Snap Toggles */}
            <div className="toolbar-section grid-section">
                <button className="toolbar-btn" disabled title="Toggle grid">
                    <i className="bi bi-grid-3x3" />
                    <span>Grid</span>
                </button>
                <button className="toolbar-btn" disabled title="Toggle snap to grid">
                    <i className="bi bi-magnet" />
                    <span>Snap</span>
                </button>
            </div>

            {/* Section 3: Zoom Controls */}
            <div className="toolbar-section zoom-section">
                <button className="toolbar-btn" disabled title="Zoom out">
                    <i className="bi bi-zoom-out" />
                </button>
                <span className="zoom-level">100%</span>
                <button className="toolbar-btn" disabled title="Zoom in">
                    <i className="bi bi-zoom-in" />
                </button>
                <button className="toolbar-btn" disabled title="Fit to screen">
                    <i className="bi bi-fullscreen" />
                </button>
            </div>
        </div>
    );
};

export { BottomToolbar };
