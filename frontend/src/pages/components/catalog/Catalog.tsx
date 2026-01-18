import React, {useState} from "react";
import {type Dictionary, LProject, R} from "../../../joiner";
import { Menu, Item } from "../menu/Menu";
import { Project } from "../Project";
import { ProjectsApi } from "../../../api/persistance";

import { icon } from "../icons/Icons";
import "./catalog.scss"
import _ from "lodash";

// Empty State Component - NEW DESIGN
const EmptyState = (props: { onCreateProject: () => void }) => {
    return (
        <div className="dashboard-empty-state">
            <div className="empty-state-icon">
                <i className="bi bi-rocket-takeoff" />
            </div>
            <h2 className="empty-state-title">Welcome to Jjodel!</h2>
            <p className="empty-state-description">
                Create your first project to start modeling. Jjodel makes metamodeling accessible for research and education.
            </p>
            <button className="empty-state-btn" onClick={props.onCreateProject}>
                <i className="bi bi-plus-lg" />
                Create your first project
            </button>
            <a
                href="https://www.jjodel.io/getting-started/"
                target="_blank"
                rel="noopener noreferrer"
                className="empty-state-link"
            >
                New to Jjodel? Check out the Getting Started guide
                <i className="bi bi-arrow-right" />
            </a>
        </div>
    );
}

// Hidden - using empty state instead
export const CatalogInfoCard = (props: any) => null;
type ChildrenType = {
    projects?: any;
    children?: any;
};


type ViewMode = 'cards' | 'compact';

const Catalog = (props: ChildrenType) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [activeTab, setActiveTab] = useState<'all' | 'public' | 'private' | 'collaborative'>('all');

    // Handler for creating project
    const handleCreateProject = async () => {
        await ProjectsApi.create('private', undefined, undefined, undefined, props.projects);
        R.navigate("/allProjects");
    };

    // Check if there are no projects at all
    const hasNoProjects = !props.projects || props.projects.length === 0;

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

        // Compact view - mini cards without cover
        if (viewMode === 'compact') {
            return (
                <div className="projects-compact">
                    {filteredProjects.map((p, i) => <Project key={p.id || i} data={p} mode="list" index={i} pnames={projectNames} />)}
                </div>
            );
        }

        // Grid layout with cards (default)
        return (
            <div className="project-cards-grid">
                {filteredProjects.map((p, i) => <Project key={p.id || i} data={p} mode="cards" index={i} pnames={projectNames} />)}
            </div>
        );
    };

    return (
        <>
            {hasNoProjects ? (
                <EmptyState onCreateProject={handleCreateProject} />
            ) : (
                <>
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
                                    className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                                    onClick={() => setViewMode('cards')}
                                    title="Grid view"
                                    aria-label="Grid view"
                                >
                                    <i className="bi bi-grid-3x3-gap" />
                                </button>
                                <button
                                    className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`}
                                    onClick={() => setViewMode('compact')}
                                    title="Compact view"
                                    aria-label="Compact view"
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
                    <div className="catalog">
                        {renderProjects()}
                    </div>
                </>
            )}
        </>
    );
}

export {Catalog}
