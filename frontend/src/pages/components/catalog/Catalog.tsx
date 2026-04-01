import {useState, useMemo, useEffect, useCallback, useRef} from "react";
import {useSearchParams} from "react-router-dom";
import {type Dictionary, LProject, DProject, U} from "../../../joiner";
import { Project } from "../Project";
import { EmptyDashboard } from "../../../components/EmptyDashboard/EmptyDashboard";
import { DevModeLabel } from "../../../components/DevModeLabel/DevModeLabel";
import { ConfirmDialog } from "../../../components/ConfirmDialog/ConfirmDialog";
import { AddTagDialog } from "../../../components/AddTagDialog/AddTagDialog";
import { ProjectsApi } from "../../../api/persistance";
import { buildProjectExportJson } from '../../../model/megamodelPersistence';
import { getRuntimeMegamodel } from '../../../model/megamodelRuntime';
import "./catalog.scss"
import _ from "lodash";

// Hidden - using empty state instead
export const CatalogInfoCard = (props: any) => null;
type ChildrenType = {
    projects?: any;
    children?: any;
    onNewProject?: () => void;
};


type ViewMode = 'compact' | 'slider';

// List View with Load More button
type ListViewProps = {
    projects: LProject[];
    projectNames: Dictionary<string, LProject>;
    allTags: string[];
    // Selection props
    selectedProjects: Set<string>;
    onSelectProject: (projectId: string, shiftKey: boolean) => void;
};

const PROJECTS_PER_BATCH = 12;

const ListViewWithLoadMore = ({
    projects,
    projectNames,
    allTags,
    selectedProjects,
    onSelectProject
}: ListViewProps) => {
    const [visibleCount, setVisibleCount] = useState(PROJECTS_PER_BATCH);
    const [previousCount, setPreviousCount] = useState(0); // Track for stagger animation

    // Reset when projects change (filter applied)
    useEffect(() => {
        setVisibleCount(PROJECTS_PER_BATCH);
        setPreviousCount(0); // Reset animation tracking
    }, [projects]);

    const visibleProjects = projects.slice(0, visibleCount);
    const remainingCount = projects.length - visibleCount;
    const hasMore = remainingCount > 0;

    const handleLoadMore = () => {
        setPreviousCount(visibleCount); // Save current count before loading more
        setVisibleCount(prev => prev + PROJECTS_PER_BATCH);
    };

    return (
        <div className="project-rows-grid">
            {visibleProjects.map((p, i) => {
                // Calculate animation index for newly loaded projects
                const isNewlyLoaded = i >= previousCount;
                const animationIndex = isNewlyLoaded ? i - previousCount : -1;

                return (
                    <Project
                        key={p.id || i}
                        data={p}
                        mode="list"
                        index={i}
                        pnames={projectNames}
                        allTags={allTags}
                        animationIndex={animationIndex}
                        isSelected={selectedProjects.has(p.id)}
                        onSelect={onSelectProject}
                    />
                );
            })}

            {/* Load More Button */}
            {hasMore ? (
                <div className="project-list__load-more">
                    <button className="load-more-button" onClick={handleLoadMore}>
                        <svg
                            className="load-more-icon"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <span>Load More</span>
                        <span className="remaining-count">({remainingCount} remaining)</span>
                    </button>
                </div>
            ) : projects.length > PROJECTS_PER_BATCH ? (
                <div className="project-list__all-loaded">
                    <svg
                        className="check-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>All projects loaded ({projects.length} total)</span>
                </div>
            ) : null}
        </div>
    );
};

const Catalog = (props: ChildrenType) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>('slider');
    const [currentPage, setCurrentPage] = useState(0);
    const [activeTag, setActiveTag] = useState<string | null>(null); // Single-select Netflix-style

    // Search input ref for keyboard shortcut
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Detect if user is on Mac for keyboard shortcut display
    const isMac = useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        // Modern approach with fallback
        const userAgentData = (navigator as any).userAgentData;
        if (userAgentData?.platform) {
            return userAgentData.platform.toLowerCase().includes('mac');
        }
        // Fallback to userAgent
        return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }, []);

    // Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux) to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isShortcut = (e.metaKey || e.ctrlKey) && e.key === 'k';
            if (isShortcut) {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Read filter from URL params and sync with activeTab
    const filterParam = searchParams.get('filter') as 'all' | 'public' | 'private' | 'collaborative' | null;
    const activeTab = filterParam && ['public', 'private', 'collaborative'].includes(filterParam) ? filterParam : 'all';

    // Handler to change filter - updates URL which syncs sidebar
    const setActiveTab = useCallback((tab: 'all' | 'public' | 'private' | 'collaborative') => {
        if (tab === 'all') {
            // Remove filter param for 'all'
            searchParams.delete('filter');
        } else {
            searchParams.set('filter', tab);
        }
        setSearchParams(searchParams);
    }, [searchParams, setSearchParams]);

    // Bulk selection state (for list view)
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

    // Delete confirmation modal state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Add tag dialog state
    const [showAddTagDialog, setShowAddTagDialog] = useState(false);

    // Track window width for responsive slider grid
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Clear selection when switching view modes or filters
    useEffect(() => {
        setSelectedProjects(new Set());
        setLastSelectedId(null);
    }, [viewMode, activeTab, activeTag]);

    // Selection handlers for bulk operations
    const handleSelectProject = useCallback((projectId: string, shiftKey: boolean) => {
        setSelectedProjects(prev => {
            const next = new Set(prev);

            // Shift+Click for range selection
            if (shiftKey && lastSelectedId && props.projects) {
                const projectIds = props.projects.map((p: LProject) => p.id);
                const startIndex = projectIds.indexOf(lastSelectedId);
                const endIndex = projectIds.indexOf(projectId);

                if (startIndex !== -1 && endIndex !== -1) {
                    const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
                    projectIds.slice(min, max + 1).forEach((id: string) => next.add(id));
                }
            } else {
                // Normal click: toggle selection
                if (next.has(projectId)) {
                    next.delete(projectId);
                } else {
                    next.add(projectId);
                }
            }

            return next;
        });

        setLastSelectedId(projectId);
    }, [lastSelectedId, props.projects]);

    const handleSelectAll = useCallback(() => {
        if (!props.projects) return;

        const allIds = props.projects.map((p: LProject) => p.id);
        if (selectedProjects.size === allIds.length) {
            setSelectedProjects(new Set()); // Deselect all
        } else {
            setSelectedProjects(new Set(allIds)); // Select all
        }
    }, [props.projects, selectedProjects.size]);

    const handleClearSelection = useCallback(() => {
        setSelectedProjects(new Set());
        setLastSelectedId(null);
    }, []);

    // Bulk action handlers
    // Show delete confirmation modal
    const handleBulkDeleteClick = useCallback(() => {
        if (selectedProjects.size === 0) return;
        setShowDeleteConfirm(true);
    }, [selectedProjects.size]);

    // Perform actual deletion after modal confirmation
    const handleBulkDeleteConfirm = useCallback(async () => {
        const count = selectedProjects.size;
        if (count === 0) return;

        setShowDeleteConfirm(false);

        try {
            const projectsToDelete = props.projects?.filter((p: LProject) => selectedProjects.has(p.id)) || [];
            for (const project of projectsToDelete) {
                await project.delete();
            }
            handleClearSelection();
            U.alert('i', 'Success', `${count} project${count > 1 ? 's' : ''} deleted successfully`);
        } catch (error) {
            console.error('Bulk delete error:', error);
            U.alert('e', 'Error', 'Failed to delete some projects');
        }
    }, [selectedProjects, props.projects, handleClearSelection]);

    const handleBulkExport = useCallback(async () => {
        const count = selectedProjects.size;
        if (count === 0) return;

        try {
            const projectsToExport = props.projects?.filter((p: LProject) => selectedProjects.has(p.id)) || [];
            for (const project of projectsToExport) {
                U.download(`${project.name}.jjodel`, JSON.stringify(buildProjectExportJson(project.__raw as unknown as Record<string, unknown>, getRuntimeMegamodel(project.id))));
            }
            handleClearSelection();
            U.alert('i', 'Success', `${count} project${count > 1 ? 's' : ''} exported`);
        } catch (error) {
            console.error('Bulk export error:', error);
            U.alert('e', 'Error', 'Failed to export some projects');
        }
    }, [selectedProjects, props.projects, handleClearSelection]);

    // Show add tag dialog
    const handleBulkAddTagClick = useCallback(() => {
        if (selectedProjects.size === 0) return;
        setShowAddTagDialog(true);
    }, [selectedProjects.size]);

    // Perform actual tag addition after dialog confirmation
    const handleBulkAddTagConfirm = useCallback(async (tagName: string) => {
        const count = selectedProjects.size;
        if (count === 0) return;

        setShowAddTagDialog(false);

        try {
            const projectsToTag: LProject[] = props.projects?.filter((p: LProject) => selectedProjects.has(p.id)) || [];
            for (const project of projectsToTag) {
                const currentTags = project.tagNames || [];
                if (!currentTags.includes(tagName)) {
                    const updatedTags = [...currentTags, tagName];
                    await ProjectsApi.updateTags(project.__raw as DProject, updatedTags);
                }
            }
            handleClearSelection();
            U.alert('i', 'Success', `Tag "${tagName}" added to ${count} project${count > 1 ? 's' : ''}`);
        } catch (error) {
            console.error('Bulk add tag error:', error);
            U.alert('e', 'Error', 'Failed to add tag to some projects');
        }
    }, [selectedProjects, props.projects, handleClearSelection]);

    // Responsive slider grid: 1-3 columns × 3 rows (max 3 columns)
    // ≥1200px: 3 cols × 3 rows = 9 cards
    // 768-1199px: 2 cols × 3 rows = 6 cards
    // <768px: 1 col × 3 rows = 3 cards
    const cardsPerPage = useMemo(() => {
        if (windowWidth >= 1200) return 9;  // 3×3 (max)
        if (windowWidth >= 768) return 6;   // 2×3
        return 3;                            // 1×3
    }, [windowWidth]);

    // Reset page when cardsPerPage changes (prevents out-of-bounds page on resize)
    useEffect(() => {
        setCurrentPage(0);
    }, [cardsPerPage]);

    // Collect all unique tags from projects, sorted by frequency
    const tagStats = useMemo(() => {
        if (!props.projects) return [];
        const tagCounts = new Map<string, number>();

        props.projects.forEach((p: LProject) => {
            if (p.tagNames && Array.isArray(p.tagNames)) {
                p.tagNames.forEach((t: string) => {
                    tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
                });
            }
        });

        // Convert to array and sort by frequency (most used first)
        return Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);
    }, [props.projects]);

    // Extract just the tag names for passing to Project components
    const allTags = useMemo(() => tagStats.map(t => t.tag), [tagStats]);

    // Check if there are no projects at all
    // Use Array.isArray for safer check, and also check for empty array-like objects
    const projectsArray = props.projects;
    const hasNoProjects = !projectsArray ||
        (Array.isArray(projectsArray) && projectsArray.length === 0) ||
        (!Array.isArray(projectsArray) && (!projectsArray.length || projectsArray.length === 0));

    // Remove debug logs in production

    // Filter and sort projects
    const getFilteredProjects = () => {
        if (!props.projects) return [];

        // Filter by active tab
        let items = props.projects.filter((p: LProject) => {
            if (activeTab === 'all') return true;
            return p.type === activeTab;
        });

        // Filter by search query
        if (searchQuery.trim()) {
            items = items.filter((p: LProject) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by active tag (single-select)
        if (activeTag) {
            items = items.filter((p: LProject) =>
                p.tagNames && p.tagNames.includes(activeTag)
            );
        }

        // Sort by last modified (default)
        return _.sortBy(items, (obj: LProject) => -new Date(obj.lastModified).getTime());
    };

    const filteredProjects = getFilteredProjects();

    // Build project names dictionary
    const projectNames: Dictionary<string, LProject> = {};
    if (props.projects) {
        for (let p of props.projects) {
            if (!p) continue;
            projectNames[p.name] = p;
        }
    }

    // Slider pagination
    const totalPages = Math.ceil(filteredProjects.length / cardsPerPage);

    const prevPage = () => setCurrentPage(p => Math.max(0, p - 1));
    const nextPage = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

    // Render projects based on view mode
    const renderProjects = () => {
        // No results message
        if (filteredProjects.length === 0 && searchQuery.trim()) {
            return (
                <div className="no-results">
                    <i className="bi bi-search" />
                    <p>No projects found for "{searchQuery}"</p>
                </div>
            );
        }

        // Slider view - 3x3 grid with pagination and smooth animation
        if (viewMode === 'slider') {
            return (
                <div className="projects-slider">
                    <div className="slider-grid-container">
                        <div
                            className="slider-track"
                            style={{
                                transform: `translateX(-${currentPage * 100}%)`,
                                transition: 'transform 400ms ease-out'
                            }}
                        >
                            {Array.from({ length: totalPages }).map((_, pageIndex) => (
                                <div className="slider-page" key={pageIndex}>
                                    {filteredProjects
                                        .slice(pageIndex * cardsPerPage, (pageIndex + 1) * cardsPerPage)
                                        .map((p, i) => (
                                            <Project
                                                key={p.id || `${pageIndex}-${i}`}
                                                data={p}
                                                mode="cards"
                                                index={pageIndex * cardsPerPage + i}
                                                pnames={projectNames}
                                                allTags={allTags}
                                            />
                                        ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="slider-navigation">
                            <button
                                className="slider-arrow prev"
                                onClick={prevPage}
                                disabled={currentPage === 0}
                                aria-label="Previous page"
                            >
                                <i className="bi bi-chevron-left" />
                            </button>

                            <div className="slider-dots">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={`slider-dot ${i === currentPage ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(i)}
                                        aria-label={`Go to page ${i + 1}`}
                                    />
                                ))}
                            </div>

                            <button
                                className="slider-arrow next"
                                onClick={nextPage}
                                disabled={currentPage >= totalPages - 1}
                                aria-label="Next page"
                            >
                                <i className="bi bi-chevron-right" />
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        // Compact/List view - rows with Load More button (default fallback)
        const allSelected = selectedProjects.size === filteredProjects.length && filteredProjects.length > 0;
        const someSelected = selectedProjects.size > 0 && selectedProjects.size < filteredProjects.length;
        const hasSelection = selectedProjects.size > 0;

        return (
            <div className="list-view-container">
                {/* Unified Projects Toolbar */}
                <div className="projects-toolbar">
                    <div className="toolbar-left">
                        {/* Select All Checkbox - ALWAYS visible */}
                        <input
                            type="checkbox"
                            className="toolbar-checkbox"
                            checked={allSelected}
                            ref={(el) => {
                                if (el) {
                                    el.indeterminate = someSelected;
                                }
                            }}
                            onChange={handleSelectAll}
                            aria-label="Select all projects"
                            title={allSelected ? "Deselect all" : someSelected ? "Select all" : "Select all"}
                        />

                        {/* Selection count - show when projects selected */}
                        {hasSelection && (
                            <span className="toolbar-selection-count">
                                {selectedProjects.size} project{selectedProjects.size > 1 ? 's' : ''} selected
                            </span>
                        )}

                        {/* Tags */}
                        {tagStats.length > 0 && (
                            <>
                                <span className="toolbar-tags-label">TAGS:</span>
                                <div className="toolbar-tag-filters">
                                    {tagStats.map(({ tag, count }) => (
                                        <button
                                            key={tag}
                                            className={`toolbar-tag-pill ${activeTag === tag ? 'toolbar-tag-pill--active' : ''}`}
                                            onClick={() => {
                                                setActiveTag(prev => prev === tag ? null : tag);
                                                setCurrentPage(0);
                                            }}
                                            title={`${count} project${count > 1 ? 's' : ''}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Bulk Actions - only show when selection > 0 */}
                    {hasSelection && (
                        <div className="toolbar-right">
                            <button
                                className="toolbar-btn toolbar-btn--delete"
                                onClick={handleBulkDeleteClick}
                                title={`Delete ${selectedProjects.size} project${selectedProjects.size > 1 ? 's' : ''}`}
                            >
                                <i className="bi bi-trash" />
                                <span>Delete</span>
                            </button>

                            <button
                                className="toolbar-btn"
                                onClick={handleBulkExport}
                                title={`Export ${selectedProjects.size} project${selectedProjects.size > 1 ? 's' : ''}`}
                            >
                                <i className="bi bi-download" />
                                <span>Export</span>
                            </button>

                            <button
                                className="toolbar-btn"
                                onClick={handleBulkAddTagClick}
                                title={`Add tag to ${selectedProjects.size} project${selectedProjects.size > 1 ? 's' : ''}`}
                            >
                                <i className="bi bi-tag" />
                                <span>Add Tag</span>
                            </button>

                            <button
                                className="toolbar-btn toolbar-btn--cancel"
                                onClick={handleClearSelection}
                                title="Clear selection"
                            >
                                <span>Cancel</span>
                            </button>
                        </div>
                    )}
                </div>

                <ListViewWithLoadMore
                    projects={filteredProjects}
                    projectNames={projectNames}
                    allTags={allTags}
                    selectedProjects={selectedProjects}
                    onSelectProject={handleSelectProject}
                />
            </div>
        );
    };

    return (
        <>
            {hasNoProjects ? (
                <EmptyDashboard onNewProject={props.onNewProject || (() => {})} />
            ) : (
                <>
                    {/* Dev Mode Label for Project Grid */}
                    <DevModeLabel componentId="T3.2" />

                    <div className="catalog-header">
                        {/* Filter Tabs */}
                        <div className="catalog-filter-tabs">
                            <button
                                className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveTab('all')}
                            >
                                All
                            </button>
                            <button
                                className={`filter-tab ${activeTab === 'public' ? 'active' : ''}`}
                                onClick={() => setActiveTab('public')}
                            >
                                Public
                            </button>
                            <button
                                className={`filter-tab ${activeTab === 'private' ? 'active' : ''}`}
                                onClick={() => setActiveTab('private')}
                            >
                                Private
                            </button>
                            <button
                                className={`filter-tab ${activeTab === 'collaborative' ? 'active' : ''}`}
                                onClick={() => setActiveTab('collaborative')}
                            >
                                Collaborative
                            </button>
                        </div>

                        {/* Controls: View Toggle + Search */}
                        <div className="catalog-controls">
                            <div className="view-toggle">
                                <button
                                    className={`view-btn ${viewMode === 'slider' ? 'active' : ''}`}
                                    onClick={() => { setViewMode('slider'); setCurrentPage(0); }}
                                    title="Slider view"
                                    aria-label="Slider view"
                                >
                                    <i className="bi bi-grid-3x3-gap" />
                                </button>
                                <button
                                    className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`}
                                    onClick={() => setViewMode('compact')}
                                    title="List view"
                                    aria-label="List view"
                                >
                                    <i className="bi bi-list" />
                                </button>
                            </div>

                            <div className="projects-search">
                                <i className="bi bi-search" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery ? (
                                    <button
                                        className="search-clear"
                                        onClick={() => setSearchQuery("")}
                                        aria-label="Clear search"
                                    >
                                        <i className="bi bi-x" />
                                    </button>
                                ) : (
                                    <div className="search-shortcut">
                                        <kbd className="shortcut-key">{isMac ? '⌘' : 'Ctrl'}</kbd>
                                        <kbd className="shortcut-key">K</kbd>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tags Toolbar - unified styling for slider view (no checkbox/bulk actions) */}
                    {viewMode === 'slider' && tagStats.length > 0 && (
                        <div className="projects-toolbar projects-toolbar--grid">
                            <div className="toolbar-left">
                                <span className="toolbar-tags-label">TAGS:</span>
                                <div className="toolbar-tag-filters">
                                    {tagStats.map(({ tag, count }) => (
                                        <button
                                            key={tag}
                                            className={`toolbar-tag-pill ${activeTag === tag ? 'toolbar-tag-pill--active' : ''}`}
                                            onClick={() => {
                                                setActiveTag(prev => prev === tag ? null : tag);
                                                setCurrentPage(0);
                                            }}
                                            title={`${count} project${count > 1 ? 's' : ''}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                {activeTag && (
                                    <span className="toolbar-filter-count">
                                        <i className="bi bi-funnel" />
                                        {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="catalog">
                        {renderProjects()}
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Projects"
                message={`Are you sure you want to delete ${selectedProjects.size} project${selectedProjects.size > 1 ? 's' : ''}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={handleBulkDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            {/* Add Tag Dialog */}
            <AddTagDialog
                isOpen={showAddTagDialog}
                projectCount={selectedProjects.size}
                existingTags={allTags}
                onConfirm={handleBulkAddTagConfirm}
                onCancel={() => setShowAddTagDialog(false)}
            />
        </>
    );
}

export {Catalog}
