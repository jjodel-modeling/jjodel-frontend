import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useResolution, Resolution } from '../../hooks/useResolution';
import { TreeViewContent } from './TreeViewContent';
import { JjodelEvents } from '../../events/registry';
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

// Width constraints (polish 2026-05-12: default bumped +60 per dare respiro
// orizzontale ai nomi nidificati; bounds estesi per consentire drag più ampio).
const MIN_WIDTH = 240;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 340;

export const TreeViewSidebar: React.FC<TreeViewSidebarProps> = ({ className }) => {
    const resolution = useResolution();

    // Initialize open state based on resolution and localStorage
    const [isOpen, setIsOpen] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_OPEN);
        if (saved !== null) return saved === 'true';
        // Default: open on high-res monitors, closed otherwise
        return typeof window !== 'undefined' && window.innerWidth >= 2560;
    });

    // Initialize width from localStorage. Clamp protegge da valori salvati
    // fuori bound se MIN/MAX cambiano in versioni future; NaN guard per
    // localStorage corrotto o parsing fallito.
    const [width, setWidth] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_WIDTH);
        if (!saved) return DEFAULT_WIDTH;
        const parsed = parseInt(saved, 10);
        if (Number.isNaN(parsed)) return DEFAULT_WIDTH;
        return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parsed));
    });

    // Dragging state for resize handle
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(DEFAULT_WIDTH);

    // Ephemeral search-open state (default closed, never persisted). Collapsing
    // the sidebar / closing the overlay also closes the search.
    const [searchOpen, setSearchOpen] = useState(false);
    useEffect(() => {
        if (!isOpen) setSearchOpen(false);
    }, [isOpen]);

    // Handle toggle
    const handleToggle = useCallback(() => {
        const newState = !isOpen;
        setIsOpen(newState);
        localStorage.setItem(STORAGE_KEY_OPEN, newState.toString());
    }, [isOpen]);

    // Listen for toggle events from navbar and keyboard shortcuts
    useEffect(() => {
        const handleToggleEvent = () => handleToggle();
        window.addEventListener(JjodelEvents.TOGGLE_TREE_VIEW, handleToggleEvent);
        return () => window.removeEventListener(JjodelEvents.TOGGLE_TREE_VIEW, handleToggleEvent);
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

        // body-level cursor + user-select guard: mantiene il cursore col-resize
        // anche se il puntatore esce dalla hit zone durante il drag, e previene
        // selezioni di testo accidentali sul resto della pagina.
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
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
                        <div className="tree-view-overlay__actions">
                            <button
                                className={`tree-view-search-toggle ${searchOpen ? 'is-active' : ''}`}
                                onClick={() => setSearchOpen(v => !v)}
                                aria-label="Filter tree"
                                aria-pressed={searchOpen}
                            >
                                <i className="bi bi-search" />
                            </button>
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
                    </div>
                    <div className="tree-view-overlay__body">
                        <TreeViewContent searchOpen={searchOpen} onSearchClose={() => setSearchOpen(false)} onSelect={handleOverlaySelect} />
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
                        role="separator"
                        aria-orientation="vertical"
                    >
                        <i className={`bi bi-grip-vertical resize-grip-icon-vertical ${isDragging ? 'dragging' : ''}`} />
                    </div>

                    {/* Header */}
                    <div className="tree-view-sidebar__header">
                        <i className="bi bi-diagram-2" />
                        <span>Tree View</span>
                        <button
                            className={`tree-view-search-toggle ${searchOpen ? 'is-active' : ''}`}
                            onClick={() => setSearchOpen(v => !v)}
                            aria-label="Filter tree"
                            aria-pressed={searchOpen}
                        >
                            <i className="bi bi-search" />
                        </button>
                    </div>

                    {/* Tree content */}
                    <div className="tree-view-sidebar__body">
                        <TreeViewContent searchOpen={searchOpen} onSearchClose={() => setSearchOpen(false)} />
                    </div>
                </>
            )}
        </div>
    );
};

export default TreeViewSidebar;
