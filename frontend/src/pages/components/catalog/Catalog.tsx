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


const Catalog = (props: ChildrenType) => {
    const [mode, setMode] = useState<string>("cards");
    const [activeTab, setActiveTab] = useState<'all' | 'public' | 'private' | 'collaborative'>('all');

    const CatalogFilters = () => {
        return (
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
        );
    }

    const CatalogMode = () => {
        return (
            <div className="catalog-view-controls">
                <div className="view-toggle">
                    <button
                        className={`view-btn ${mode === 'cards' ? 'active' : ''}`}
                        onClick={() => setMode('cards')}
                        title="Grid view"
                    >
                        <i className="bi bi-grid-3x3-gap" />
                    </button>
                    <button
                        className={`view-btn ${mode === 'list' ? 'active' : ''}`}
                        onClick={() => setMode('list')}
                        title="List view"
                    >
                        <i className="bi bi-list" />
                    </button>
                </div>
            </div>
        );
    }




    type CatalogType = {
        projects: LProject[];
        onCreateProject: () => void;
    }

    const CatalogReport = (props: CatalogType) => {
        // Filter by active tab
        var items = props.projects.filter(p => {
            if (activeTab === 'all') return true;
            return p.type === activeTab;
        });

        let projectNames: Dictionary<string, LProject> = {};
        for (let p of props.projects) {
            if (!p) continue;
            projectNames[p.name] = p;
        }

        // Sort by last modified (default)
        var sorted = _.sortBy(items, (obj: LProject) => -new Date(obj.lastModified).getTime());

        return (
            mode === "cards" ?
                <div className="project-cards-grid">
                    {sorted.map((p, i) => <Project key={i} data={p} mode={mode} pnames={projectNames} />)}
                </div>
            :
                <div className="row project-list">
                    <div className="row header">
                        <div className="col-4">Name</div>
                        <div className="col-1">Type</div>
                        <div className="col-3">Created</div>
                        <div className="col-2">Last modified</div>
                        <div className="col-2">Operation</div>
                    </div>
                    {sorted.map(p => (
                        <Project key={p.id} data={p} mode={mode} pnames={projectNames} />
                    ))}
                </div>
        );
    };

    // Handler for creating project
    const handleCreateProject = async () => {
        await ProjectsApi.create('private', undefined, undefined, undefined, props.projects);
        R.navigate("/allProjects");
    };

    // Check if there are no projects at all
    const hasNoProjects = !props.projects || props.projects.length === 0;

    return (
        <>
            {hasNoProjects ? (
                <EmptyState onCreateProject={handleCreateProject} />
            ) : (
                <>
                    <div className="catalog-header">
                        <CatalogFilters />
                        <CatalogMode />
                    </div>
                    <div className="catalog">
                        <CatalogReport projects={props.projects} onCreateProject={handleCreateProject} />
                    </div>
                </>
            )}
        </>
    );
}

export {Catalog}
