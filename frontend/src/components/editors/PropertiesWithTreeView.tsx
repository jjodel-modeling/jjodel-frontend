import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Info } from './Info';
import { NodeEditor } from './NodeEditor';
import { TreeViewContent } from '../TreeViewSidebar/TreeViewContent';
import { useTreeViewPanel } from '../../contexts/TreeViewPanelContext';
import './properties-with-tree-view.scss';
// Import tree view styles for icon colors and tree node styling
import '../TreeViewSidebar/tree-view-sidebar.scss';
import { JjodelEvents } from '../../events/registry';

/**
 * PropertiesWithTreeView Component
 *
 * A split panel that combines:
 * - Left: Properties of the selected element (FLUID - takes remaining space)
 * - Right: Tree View of the metamodel hierarchy (FIXED 260px)
 *
 * The Tree View can be toggled on/off with a button in the header.
 * Auto-expands when JjScript execution starts.
 */

const TREE_VIEW_WIDTH = 260;

interface PropertiesWithTreeViewProps {
    mode: 'popup' | 'tab' | 'inline';
}

export const PropertiesWithTreeView: React.FC<PropertiesWithTreeViewProps> = ({ mode }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Expert/Advanced mode — controls visibility of NODE section
    const advanced = useSelector((state: any) => state.advanced);
    const [nodeOpen, setNodeOpen] = useState(false);

    // TODO: redirect to panels/viewpoint-editor

    // Get tree view state from context
    const {
        isVisible: isTreeViewVisible,
        toggle: toggleTreeView,
        isHighlighted,
        isScriptExecuting,
    } = useTreeViewPanel();

    // Listen for external toggle events (e.g., from keyboard shortcut)
    useEffect(() => {
        const handleExternalToggle = () => {
            toggleTreeView();
        };
        window.addEventListener(JjodelEvents.TOGGLE_TREE_VIEW, handleExternalToggle);
        return () => {
            window.removeEventListener(JjodelEvents.TOGGLE_TREE_VIEW, handleExternalToggle);
        };
    }, [toggleTreeView]);

    // For non-tab modes, just render Info without the split
    if (mode !== 'tab') {
        return <Info mode={mode} />;
    }

    // Right panel visibility is controlled by CSS via body[data-editor-type].
    // Always render content so it's ready when the panel becomes visible.

    return (
        <div
            ref={containerRef}
            className={`properties-with-tree-view ${isTreeViewVisible ? 'tree-visible' : 'tree-hidden'}`}
        >
            {/* Properties Panel (Left) - FLUID */}
            <div className="properties-panel-container">
                <Info mode={mode} />

                {/* NODE section — Expert mode only */}
                {advanced && (
                    <div className="properties-node-section">
                        <button
                            className="properties-node-section__header"
                            onClick={() => setNodeOpen(!nodeOpen)}
                            type="button"
                        >
                            <i className={`bi bi-chevron-${nodeOpen ? 'down' : 'right'}`} />
                            <i className="bi bi-bounding-box-circles" />
                            <span>NODE</span>
                        </button>
                        {nodeOpen && (
                            <div className="properties-node-section__content">
                                <NodeEditor />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tree View Panel (Right) - Expanded */}
            {isTreeViewVisible ? (
                <>
                    {/* Tree View - FIXED WIDTH */}
                    <div
                        className={`tree-view-panel-container ${isHighlighted ? 'tree-view-panel-container--highlighted' : ''} ${isScriptExecuting ? 'tree-view-panel-container--executing' : ''}`}
                        style={{ width: `${TREE_VIEW_WIDTH}px`, minWidth: `${TREE_VIEW_WIDTH}px`, maxWidth: `${TREE_VIEW_WIDTH}px` }}
                    >
                        <div className="tree-view-panel-header">
                            <i className="bi bi-diagram-2" />
                            <span>TREE VIEW</span>
                            {isScriptExecuting && (
                                <span className="tree-view-executing-badge">
                                    <span className="pulse-dot" />
                                    Executing
                                </span>
                            )}
                            <button
                                className="tree-view-toggle-btn"
                                onClick={toggleTreeView}
                                title="Collapse Tree View"
                            >
                                <i className="bi bi-chevron-right" />
                            </button>
                        </div>
                        <div className="tree-view-panel-body">
                            <TreeViewContent />
                        </div>
                    </div>
                </>
            ) : (
                /* Tree View Panel - Collapsed */
                <div
                    className={`tree-view-collapsed ${isHighlighted ? 'tree-view-collapsed--highlighted' : ''}`}
                    onClick={toggleTreeView}
                    title="Expand Tree View"
                >
                    <i className="bi bi-chevron-left" />
                </div>
            )}

        </div>
    );
};

export default PropertiesWithTreeView;
