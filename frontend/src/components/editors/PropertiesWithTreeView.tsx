import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Info } from './Info';
import { TreeViewContent } from '../TreeViewSidebar/TreeViewContent';
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
 */

// localStorage keys
const STORAGE_KEY_VISIBLE = 'jjodel_tree_view_visible';
const STORAGE_KEY_WIDTH = 'jjodel_tree_view_width';

// Tree View width constraints (in pixels)
const TREE_VIEW_DEFAULT_WIDTH = 280;
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

    // Initialize tree view visibility from localStorage
    const [isTreeViewVisible, setIsTreeViewVisible] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_VISIBLE);
        // Default to true (visible) if not set
        return saved !== null ? saved === 'true' : true;
    });

    // Initialize tree view width from localStorage (in pixels)
    const [treeViewWidth, setTreeViewWidth] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_WIDTH);
        if (saved !== null) {
            const parsed = parseInt(saved, 10);
            // Check if it's a valid pixel value
            if (!isNaN(parsed) && parsed >= TREE_VIEW_MIN_WIDTH && parsed <= TREE_VIEW_MAX_WIDTH) {
                return parsed;
            }
            // Migration: if value is between 0-100, it's old percentage format
            // Convert to pixels assuming ~700px container width
            if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
                const convertedWidth = Math.round((parsed / 100) * 700);
                return Math.max(TREE_VIEW_MIN_WIDTH, Math.min(TREE_VIEW_MAX_WIDTH, convertedWidth));
            }
        }
        return TREE_VIEW_DEFAULT_WIDTH;
    });

    // Save tree view width to localStorage when it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_WIDTH, String(treeViewWidth));
    }, [treeViewWidth]);

    // Save visibility to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_VISIBLE, String(isTreeViewVisible));
    }, [isTreeViewVisible]);

    // Toggle tree view visibility
    const toggleTreeView = useCallback(() => {
        setIsTreeViewVisible(prev => {
            const newValue = !prev;
            // Dispatch event for any external listeners
            window.dispatchEvent(new CustomEvent('jjodel:properties-tree-view-toggle', {
                detail: { visible: newValue }
            }));
            return newValue;
        });
    }, []);

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
            const maxTreeWidth = containerWidth - PROPERTIES_MIN_WIDTH - 8; // 8px for resizer
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
    }, []);

    // Auto-hide Tree View when container is too narrow
    useEffect(() => {
        const checkWidth = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.getBoundingClientRect().width;

            // Auto-hide if too narrow and tree is visible
            if (containerWidth < AUTO_HIDE_THRESHOLD && isTreeViewVisible) {
                setIsTreeViewVisible(false);
            }
        };

        // Check on mount and on resize
        checkWidth();
        window.addEventListener('resize', checkWidth);

        return () => {
            window.removeEventListener('resize', checkWidth);
        };
    }, [isTreeViewVisible]);

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
                    >
                        <div className="panel-resizer-handle" />
                    </div>

                    {/* Tree View - FIXED WIDTH */}
                    <div
                        className="tree-view-panel-container"
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
                <div className="tree-view-collapsed" onClick={toggleTreeView} title="Expand Tree View">
                    <i className="bi bi-chevron-left" />
                </div>
            )}

        </div>
    );
};

export default PropertiesWithTreeView;
