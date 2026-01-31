import React, { useState, useEffect } from 'react';
import './bottomToolbar.scss';
import { PinnableDock } from '../../components/dock/MyRcDock';

/**
 * Bottom Toolbar Component
 * Visible only when editor tabs (metamodel/model) are open
 * Contains 3 sections:
 * 1. Tools commands (dynamic - from metamodel)
 * 2. Grid/Snap toggles
 * 3. Zoom controls
 */

interface BottomToolbarProps {
    visible?: boolean;
}

/**
 * Check if there are any editor tabs open (metamodel or model tabs)
 * Editor tabs have closable: true and are in the 'models' group
 */
const hasEditorTabsOpen = (): boolean => {
    try {
        if (!PinnableDock.instance) return false;
        const layout = PinnableDock.instance.getLayout();
        if (!layout?.dockbox?.children?.[0]) return false;

        // Get the models panel (first child)
        const modelsPanel = layout.dockbox.children[0] as any;
        if (!modelsPanel?.tabs) return false;

        // Check if there are any closable tabs (editor tabs)
        // ModelsSummaryTab has closable: false, editor tabs have closable: true
        return modelsPanel.tabs.some((tab: any) => tab.closable === true);
    } catch {
        return false;
    }
};

const BottomToolbar: React.FC<BottomToolbarProps> = ({ visible = true }) => {
    const [hasEditors, setHasEditors] = useState(false);

    useEffect(() => {
        // Check initially
        setHasEditors(hasEditorTabsOpen());

        // Poll for changes (rc-dock doesn't have a clean event for layout changes)
        const interval = setInterval(() => {
            setHasEditors(hasEditorTabsOpen());
        }, 500);

        return () => clearInterval(interval);
    }, []);

    // Only show when visible prop is true AND there are editor tabs open
    if (!visible || !hasEditors) return null;

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
