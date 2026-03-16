import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Info } from './Info';
import { NodeEditor } from './NodeEditor';
import { TreeViewContent } from '../TreeViewSidebar/TreeViewContent';
import { useTreeViewPanel } from '../../contexts/TreeViewPanelContext';
import './properties-with-tree-view.scss';
// Import tree view styles for icon colors and tree node styling
import '../TreeViewSidebar/tree-view-sidebar.scss';

/**
 * PropertiesWithTreeView Component
 *
 * A split panel that combines:
 * - Left: Properties of the selected element (FLUID - takes remaining space)
 * - Right: Tree View of the metamodel hierarchy (FIXED WIDTH in pixels)
 *
 * The Tree View can be toggled on/off with a button in the header.
 * The Tree View width is resizable via a draggable divider.
 * Auto-expands when JjScript execution starts.
 */

// Tree View width constraints (in pixels)
const TREE_VIEW_MIN_WIDTH = 200;
const TREE_VIEW_MAX_WIDTH = 500;

// Minimum Properties panel width (in pixels)
const PROPERTIES_MIN_WIDTH = 300;

// Auto-hide threshold: if container is narrower than this, hide Tree View
const AUTO_HIDE_THRESHOLD = 650;

interface PropertiesWithTreeViewProps {
    mode: 'popup' | 'tab' | 'inline';
}

export const PropertiesWithTreeView: React.FC<PropertiesWithTreeViewProps> = ({ mode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    // Expert/Advanced mode — controls visibility of NODE section
    const advanced = useSelector((state: any) => state.advanced);
    const [nodeOpen, setNodeOpen] = useState(false);

    // Get tree view state from context
    const {
        isVisible: isTreeViewVisible,
        toggle: toggleTreeView,
        hide: hideTreeView,
        isHighlighted,
        width: treeViewWidth,
        setWidth: setTreeViewWidth,
        isScriptExecuting,
    } = useTreeViewPanel();

    // Listen for external toggle events (e.g., from keyboard shortcut)
    useEffect(() => {
        const handleExternalToggle = () => {
            toggleTreeView();
        };
        window.addEventListener('jjodel:toggle-tree-view', handleExternalToggle);
        return () => {
            window.removeEventListener('jjodel:toggle-tree-view', handleExternalToggle);
        };
    }, [toggleTreeView]);

    // Handle resize start
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;
        startXRef.current = e.clientX;
        startWidthRef.current = treeViewWidth;

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.body.classList.add('resizing-tree-view');
        // Add class to container for visual feedback
        containerRef.current?.classList.add('is-resizing');
    }, [treeViewWidth]);

    // Handle resize move and end
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current || !containerRef.current) return;

            // Calculate delta (negative = dragging left = wider tree)
            const deltaX = startXRef.current - e.clientX;
            let newWidth = startWidthRef.current + deltaX;

            // Clamp between min and max
            newWidth = Math.max(TREE_VIEW_MIN_WIDTH, Math.min(TREE_VIEW_MAX_WIDTH, newWidth));

            // Also ensure Properties panel doesn't get too narrow
            const containerWidth = containerRef.current.getBoundingClientRect().width;
            const maxTreeWidth = containerWidth - PROPERTIES_MIN_WIDTH - 1; // 1px for resizer
            newWidth = Math.min(newWidth, maxTreeWidth);

            setTreeViewWidth(newWidth);
        };

        const handleMouseUp = () => {
            if (isResizing.current) {
                isResizing.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.body.classList.remove('resizing-tree-view');
                containerRef.current?.classList.remove('is-resizing');
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.body.classList.remove('resizing-tree-view');
        };
    }, [setTreeViewWidth]);

    // Auto-hide Tree View when container is too narrow
    useEffect(() => {
        const checkWidth = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.getBoundingClientRect().width;

            // Auto-hide if too narrow and tree is visible
            if (containerWidth < AUTO_HIDE_THRESHOLD && isTreeViewVisible) {
                hideTreeView();
            }
        };

        // Check on mount and on resize
        checkWidth();
        window.addEventListener('resize', checkWidth);

        return () => {
            window.removeEventListener('resize', checkWidth);
        };
    }, [isTreeViewVisible, hideTreeView]);

    // For non-tab modes, just render Info without the split
    if (mode !== 'tab') {
        return <Info mode={mode} />;
    }

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
                    {/* Resizable Divider */}
                    <div
                        className="panel-resizer"
                        onMouseDown={handleResizeStart}
                        title="Drag to resize"
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize tree view"
                        tabIndex={0}
                    />


                    {/* Tree View - FIXED WIDTH with transitions */}
                    <div
                        className={`tree-view-panel-container ${isHighlighted ? 'tree-view-panel-container--highlighted' : ''} ${isScriptExecuting ? 'tree-view-panel-container--executing' : ''}`}
                        style={{
                            flexBasis: `${treeViewWidth}px`,
                            width: `${treeViewWidth}px`,
                            minWidth: `${TREE_VIEW_MIN_WIDTH}px`,
                            maxWidth: `${TREE_VIEW_MAX_WIDTH}px`
                        }}
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
