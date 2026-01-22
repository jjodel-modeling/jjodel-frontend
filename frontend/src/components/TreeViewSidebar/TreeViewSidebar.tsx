import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useResolution, Resolution } from '../../hooks/useResolution';
import { TreeViewContent } from './TreeViewContent';
import './tree-view-sidebar.scss';

/**
 * TreeViewSidebar Component
 *
 * Resolution-adaptive sidebar for viewing metamodel hierarchy:
 * - Monitor (>=2560px): Permanent right sidebar, open by default
 * - Desktop (1920-2559px): Collapsible right sidebar, collapsed by default
 * - Laptop (<1920px): Floating overlay on demand
 */

interface TreeViewSidebarProps {
    className?: string;
}

// LocalStorage keys
const STORAGE_KEY_OPEN = 'jjodel_tree_view_open';
const STORAGE_KEY_WIDTH = 'jjodel_tree_view_width';

// Width constraints
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 280;

export const TreeViewSidebar: React.FC<TreeViewSidebarProps> = ({ className }) => {
    const resolution = useResolution();

    // Initialize open state based on resolution and localStorage
    const [isOpen, setIsOpen] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_OPEN);
        if (saved !== null) return saved === 'true';
        // Default: open on high-res monitors, closed otherwise
        return typeof window !== 'undefined' && window.innerWidth >= 2560;
    });

    // Initialize width from localStorage
    const [width, setWidth] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_WIDTH);
        return saved ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parseInt(saved, 10))) : DEFAULT_WIDTH;
    });

    // Dragging state for resize handle
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(DEFAULT_WIDTH);

    // Handle toggle
    const handleToggle = useCallback(() => {
        const newState = !isOpen;
        setIsOpen(newState);
        localStorage.setItem(STORAGE_KEY_OPEN, newState.toString());
    }, [isOpen]);

    // Listen for toggle events from navbar and keyboard shortcuts
    useEffect(() => {
        const handleToggleEvent = () => handleToggle();
        window.addEventListener('jjodel:toggle-tree-view', handleToggleEvent);
        return () => window.removeEventListener('jjodel:toggle-tree-view', handleToggleEvent);
    }, [handleToggle]);

    // Handle ESC key to close overlay (laptop mode)
    useEffect(() => {
        if (resolution !== 'laptop' || !isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                localStorage.setItem(STORAGE_KEY_OPEN, 'false');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [resolution, isOpen]);

    // Handle resize drag start
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartX.current = e.clientX;
        dragStartWidth.current = width;
    }, [width]);

    // Handle resize drag
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Resize handle is on the left side, so moving left increases width
            const deltaX = dragStartX.current - e.clientX;
            const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragStartWidth.current + deltaX));
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            localStorage.setItem(STORAGE_KEY_WIDTH, width.toString());
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, width]);

    // Handle element selection in overlay mode (auto-close)
    const handleOverlaySelect = useCallback(() => {
        if (resolution === 'laptop') {
            setIsOpen(false);
            localStorage.setItem(STORAGE_KEY_OPEN, 'false');
        }
    }, [resolution]);

    // Handle backdrop click (close overlay)
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
            localStorage.setItem(STORAGE_KEY_OPEN, 'false');
        }
    }, []);

    // Laptop mode: render as floating overlay
    if (resolution === 'laptop') {
        if (!isOpen) return null;

        return (
            <div className="tree-view-overlay" onClick={handleBackdropClick}>
                <div className="tree-view-overlay__content">
                    <div className="tree-view-overlay__header">
                        <div className="tree-view-overlay__title">
                            <i className="bi bi-diagram-2" />
                            <span>Tree View</span>
                        </div>
                        <button
                            className="tree-view-overlay__close"
                            onClick={() => {
                                setIsOpen(false);
                                localStorage.setItem(STORAGE_KEY_OPEN, 'false');
                            }}
                            aria-label="Close Tree View"
                        >
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                    <div className="tree-view-overlay__body">
                        <TreeViewContent onSelect={handleOverlaySelect} />
                    </div>
                </div>
            </div>
        );
    }

    // Desktop/Monitor mode: render as collapsible sidebar
    return (
        <div
            className={`tree-view-sidebar ${isOpen ? 'tree-view-sidebar--open' : 'tree-view-sidebar--collapsed'} ${className || ''} ${isDragging ? 'tree-view-sidebar--dragging' : ''}`}
            style={isOpen ? { width: `${width}px` } : undefined}
        >
            {/* Toggle button */}
            <button
                className="tree-view-sidebar__toggle"
                onClick={handleToggle}
                aria-label={isOpen ? 'Collapse Tree View' : 'Expand Tree View'}
            >
                <i className={`bi bi-chevron-${isOpen ? 'right' : 'left'}`} />
            </button>

            {/* Collapsed state indicator */}
            {!isOpen && (
                <div className="tree-view-sidebar__collapsed-label">
                    <i className="bi bi-diagram-2" />
                </div>
            )}

            {/* Expanded content */}
            {isOpen && (
                <>
                    {/* Resize handle */}
                    <div
                        className="tree-view-sidebar__resize-handle"
                        onMouseDown={handleResizeStart}
                    />

                    {/* Header */}
                    <div className="tree-view-sidebar__header">
                        <i className="bi bi-diagram-2" />
                        <span>Tree View</span>
                    </div>

                    {/* Tree content */}
                    <div className="tree-view-sidebar__body">
                        <TreeViewContent />
                    </div>
                </>
            )}
        </div>
    );
};

export default TreeViewSidebar;
