import {useState, useMemo, useEffect} from "react";
import {type Dictionary, LProject} from "../../../joiner";
import { Project } from "../Project";
import { EmptyDashboard } from "../../../components/EmptyDashboard/EmptyDashboard";
import { DevModeLabel } from "../../../components/DevModeLabel/DevModeLabel";
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
};

const PROJECTS_PER_BATCH = 12;

const ListViewWithLoadMore = ({ projects, projectNames, allTags }: ListViewProps) => {
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
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>('slider');
    const [activeTab, setActiveTab] = useState<'all' | 'public' | 'private' | 'collaborative'>('all');
    const [currentPage, setCurrentPage] = useState(0);
    const [activeTag, setActiveTag] = useState<string | null>(null); // Single-select Netflix-style

    // Track window width for responsive slider grid
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            if (p.tags && Array.isArray(p.tags)) {
                p.tags.forEach((t: string) => {
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

    // Display mode based on project count
    const displayMode = useMemo(() => {
        const count = props.projects?.length || 0;
        if (count < 6) return 'subtle';
        if (count < 12) return 'normal';
        return 'prominent';
    }, [props.projects]);

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
                p.tags && p.tags.includes(activeTag)
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
        return (
            <ListViewWithLoadMore
                projects={filteredProjects}
                projectNames={projectNames}
                allTags={allTags}
            />
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
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        className="search-clear"
                                        onClick={() => setSearchQuery("")}
                                        aria-label="Clear search"
                                    >
                                        <i className="bi bi-x" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tag Filters - Netflix Style */}
                    {tagStats.length > 0 && (
                        <div className={`tag-filters-netflix tag-filters-netflix--${displayMode}`}>
                            <div className="tag-filters-netflix__label">
                                <i className="bi bi-tag" />
                                <span>TAGS:</span>
                            </div>
                            <div className="tag-filters-netflix__scroll">
                                {tagStats.map(({ tag, count }) => (
                                    <button
                                        key={tag}
                                        className={`tag-chip ${activeTag === tag ? 'tag-chip--active' : ''}`}
                                        onClick={() => {
                                            setActiveTag(prev => prev === tag ? null : tag);
                                            setCurrentPage(0); // Reset pagination on filter change
                                        }}
                                        title={`${count} project${count > 1 ? 's' : ''}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            {activeTag && (
                                <div className="tag-filters-netflix__count">
                                    <i className="bi bi-funnel" />
                                    {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="catalog">
                        {renderProjects()}
                    </div>
                </>
            )}
        </>
    );
}

export {Catalog}
