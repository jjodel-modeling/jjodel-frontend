import {useState, MouseEventHandler, JSX} from 'react';
import {useSelector} from 'react-redux';
import {DProject, LProject, LUser, R, U} from '../../joiner';

import {DashProps} from "./Dashboard";
import Collaborative from "../../components/collaborative/Collaborative";
import {ProjectsApi} from "../../api/persistance";
import { isProjectModified } from '../../common/libraries/projectModified';
import {useLocation, useNavigate, useSearchParams} from "react-router-dom";
import { DevModeLabel } from '../../components/DevModeLabel/DevModeLabel';
import { buildProjectExportJson } from '../../model/megamodelPersistence';
import { getRuntimeMegamodel } from '../../model/megamodelRuntime';
import DockManager from '../../components/abstract/DockManager';
import { createM2 } from './Navbar';
import { JjodelEvents } from '../../events/registry';

const SHARE_DISABLED_HINT = 'Only public projects can be shared';

function relativeTime(date: number | string | Date): string {
    const d = typeof date === 'number' ? date : (typeof date === 'string' ? new Date(date).getTime() : date.getTime());
    const diff = Date.now() - d;
    const h = Math.floor(diff / 3600000);
    const days = Math.floor(h / 24);
    if (h < 1) return 'now';
    if (h < 24) return `${h}h`;
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
}

export type LeftBarProps = {
    user?: LUser;
    active: DashProps['active']; // prende il tipo dal parent-component, così si evita di aggiornare entrambi o avere tipi discordanti.
    projects?: LProject[];
    project?: LProject;

};


type ItemProps = {
    children: string;
    icon?: any;
    action?: string | MouseEventHandler;
    dot?: boolean;
    onClick?: MouseEventHandler;
    active?: boolean;
    count?: number;
    muted?: boolean;
    danger?: boolean;
};

const Item = (props: ItemProps) => {
    let action: (e:any)=>any = props.action as any;
    let navigate = useNavigate();
    if (typeof action === 'string') action = (e => R.navigate(`/${props.action}`, navigate));
    let finalaction = (e:any) =>{ props.onClick?.(e); action?.(e); }

    const cls = [
        'item',
        props.dot ? 'red-dot' : '',
        props.active ? 'active' : '',
        props.muted ? 'item--muted' : '',
        props.danger ? 'item--danger' : '',
    ].filter(Boolean).join(' ');

    return (
        <div onClick={finalaction} className={cls}>
            {props.icon && props.icon}&nbsp;<span>{props.children}</span>
            {props.count !== undefined && <span className="item-count">{props.count}</span>}
        </div>
    );
}

type MenuProps = {
    children: any;
    title?: string;
    mode?: "collapsable";
};

const Menu = (props: MenuProps) => {
    const [open,setOpen] = useState(true);

    return (
        <div className='menu border-bottom'>
            {/* Only render title section if title exists */}
            {props.title && (
                <div className="menu-header" onClick={props.mode ? () => setOpen(!open) : undefined} style={props.mode ? {cursor: 'pointer'} : {}}>
                    <h1>
                        {props.title}
                    </h1>
                    {props.mode && (
                        <i className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                    )}
                </div>
            )}
            <div>
                {open && props.children}
            </div>
        </div>
    );
}

function LeftBar(props: LeftBarProps): JSX.Element {

    const {active, project} = props;
    let user: LUser = props.user || LUser.getUser();
    const navigate = useNavigate();
    const location = useLocation();

    // Read/write filter from URL to sync with toolbar (no page reload)
    const [searchParams, setSearchParams] = useSearchParams();
    const currentFilter = searchParams.get('filter') || 'all';

    // Mirrors the Catalog filter tabs (Catalog.tsx:179): when already on /allProjects,
    // just setSearchParams — no reload, no remount. When on another page, React Router's
    // navigate() does the URL change without a full reload (unlike R.navigate, which
    // hard-reloads via window.location.reload()). In HashRouter useLocation().pathname
    // returns the route inside the hash, so '/allProjects' matches correctly here —
    // window.location.pathname does not (it's '/' for HashRouter apps).
    const handleFilterChange = (filter: 'all' | 'public' | 'private' | 'collaborative') => {
        if (location.pathname === '/allProjects') {
            const newParams = new URLSearchParams(searchParams);
            if (filter === 'all') newParams.delete('filter');
            else newParams.set('filter', filter);
            setSearchParams(newParams);
        } else {
            const filterParam = filter === 'all' ? '' : `?filter=${filter}`;
            navigate(`/allProjects${filterParam}`);
        }
    };

    const selectProject= (project: LProject) => {
        R.navigate(`/project?id=${project.id}`, true);
        U.resetState();
    };

    const closeProject = () => {
        function doclose(){
            // Disable browser's beforeunload warning BEFORE navigating
            U.disableUnsavedChangesWarning();
            U.isProjectModified = false;
            // Use setTimeout to ensure the bypass flag is set before navigation triggers beforeunload
            setTimeout(() => {
                R.navigate('/allProjects', true);
                Collaborative.disconnect();
                U.resetState();
            }, 0);
        }

        async function saveAndClose() {
            if (project) {
                await ProjectsApi.save(project);
                U.isProjectModified = false;
            }
            // Disable browser's beforeunload warning BEFORE navigating
            U.disableUnsavedChangesWarning();
            doclose();
        }

        // Check for unsaved changes before closing
        if (isProjectModified()) {
            U.dialog2(
                'Unsaved changes',
                'You have unsaved changes. What do you want to do?',
                [
                    { txt: 'Cancel' },
                    { txt: "Don't save", action: doclose as any },
                    { txt: 'Save & Exit', action: saveAndClose as any }
                ]
            );
        } else {
            doclose();
        }
    }

    // "← All projects" reuses the same unsaved-check flow as closeProject
    const handleBackToProjects = closeProject;

    // Rail actions whose UI is owned by ProjectEditor (modals, the metamodel-selection
    // dropdown) are requested by CustomEvent, mirroring the OPEN_MEGAMODEL path below.
    // The tab is activated first because that UI renders inside `project_summary`, which
    // is not necessarily the active tab when the rail is visible (Documentation is).
    const requestFromProjectEditor = (eventName: string) => {
        DockManager.activateProjectSummary();
        window.dispatchEvent(new CustomEvent(eventName));
    };

    const toggleFavorite = async() => {
        await ProjectsApi.favorite(project?.__raw as DProject);
    };
    const exportProject = async() => {
        if(project) {
            await ProjectsApi.save(project);
            U.download(`${project?.name}.jjodel`, JSON.stringify(buildProjectExportJson(project?.__raw as unknown as Record<string, unknown>, project ? getRuntimeMegamodel(project.id) : undefined)));
        }
    }

    // Export Metamodel as .jmm file
    const exportMetamodel = async() => {
        if (!project) {
            U.alert('e', 'Error', 'No project open');
            return;
        }

        const metamodels = project.metamodels || [];
        if (metamodels.length === 0) {
            U.alert('w', 'No Metamodel', 'This project does not contain any metamodels to export.');
            return;
        }

        try {
            // Get the first metamodel (or could let user choose if multiple)
            const metamodel = metamodels[0];

            // Build the .jmm file structure
            const jmmData = {
                format_version: '1.0',
                metadata: {
                    name: metamodel.name || project.name + '-metamodel',
                    version: project.version?.toString() || '1.0.0',
                    author: project.author?.name || 'Unknown',
                    description: project.description || '',
                    exported_at: new Date().toISOString(),
                    source_project: project.id,
                    jjodel_version: '2.0'
                },
                metamodel: metamodel.__raw || metamodel
            };

            // Convert to JSON string (formatted)
            const jsonString = JSON.stringify(jmmData, null, 2);

            // Generate filename
            const filename = `${metamodel.name || project.name}-metamodel.jmm`;

            // Trigger download
            U.download(filename, jsonString);

            // Show success notification
            U.alert('i', 'Exported', `Metamodel exported: ${filename}`);

        } catch (error) {
            console.error('Export metamodel error:', error);
            U.alert('e', 'Export Failed', 'Error exporting metamodel. Please try again.');
        }
    }

    // Check if there are any projects for "Recently Modified" section
    const hasProjects = props.projects && props.projects.length > 0;

    // Collapsed state for project-sidebar sections (local-only)
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const toggleSection = (key: string) =>
        setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

    const openMegamodel = () => {
        window.dispatchEvent(new CustomEvent(JjodelEvents.OPEN_MEGAMODEL));
    };
    // Listener: ProjectEditor, which owns ShareProjectModal.
    const openShareModal = () => {
        requestFromProjectEditor(JjodelEvents.SHARE_PROJECT);
    };
    // ShareProjectModal renders nothing unless the project is public
    // (ShareProjectModal.tsx: `if (project.type !== 'public') return null`), so the rail
    // gates on the same condition rather than firing an event that produces no modal.
    //
    // Read the type from the D-layer instead of the `project` prop: ProjectDashboard
    // (Dashboard.tsx) rebuilds that proxy on render but is not connected to Redux, so it
    // only re-renders on a tab event — flipping the project to public from the visibility
    // badge would otherwise leave this entry greyed out until a tab opens or closes.
    const canShare = useSelector((state: any) =>
        (project?.id ? state?.idlookup?.[project.id]?.type : undefined) === 'public');

    const pMetamodels = project?.metamodels || [];
    const pModels = project?.models || [];
    const pViewpoints = project?.viewpoints || [];
    // LProject.transformations is synced by ProjectEditor via SetFieldAction (see ProjectEditor.tsx:169)
    const pTransformations = (((project as any)?.transformations) || []) as Array<{ id: string; name: string }>;

    const renderSection = (
        key: string,
        label: string,
        badge: 'M' | 'm' | 'T' | 'V',
        items: Array<{ id: string; name: string }>,
        onItemClick: (item: any) => void,
        onNewClick: () => void,
        newLabel: string,
    ) => {
        const isCollapsed = !!collapsedSections[key];
        return (
            <div className={`psb-section${isCollapsed ? ' collapsed' : ''}`}>
                <div className="psb-section-header" onClick={() => toggleSection(key)}>
                    <span className="psb-section-label">{label}</span>
                    <i className="bi bi-chevron-down psb-chevron" />
                </div>
                <div className="psb-section-body">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className="psb-item"
                            onClick={() => onItemClick(item)}
                            title={item.name}
                        >
                            <span className={`psb-badge psb-badge--${badge}`}>{badge}</span>
                            <span className="psb-item-name">{item.name}</span>
                            <i className="bi bi-arrow-right psb-item-arrow" />
                        </div>
                    ))}
                    <div className="psb-new" onClick={onNewClick}>
                        <i className="bi bi-plus" />
                        <span>{newLabel}</span>
                    </div>
                </div>
            </div>
        );
    };

    const isProjectActionsCollapsed = !!collapsedSections['project'];

    return(<>
        {/* Dev Mode Label */}
        <DevModeLabel componentId="T2.3" position="top-left" />

        {active === 'Project' ?
            <div className={'leftbar leftbar--project'}>
                {/* Back to all projects — with unsaved check */}
                <div className="psb-back" onClick={handleBackToProjects}>
                    <i className="bi bi-chevron-left" />
                    <span>All projects</span>
                </div>

                {/* Project Megamodel — single entry (listener in ProjectEditor.tsx:360) */}
                <div className="psb-megamodel" onClick={openMegamodel} title="Project Megamodel">
                    <i className="bi bi-diagram-3" />
                    <span className="psb-item-name">{project?.name || 'Project Megamodel'}</span>
                    <i className="bi bi-arrow-right psb-item-arrow" />
                </div>

                {renderSection(
                    'metamodels', 'Metamodels', 'M',
                    pMetamodels.map(m => ({ id: m.id, name: m.name })),
                    (m) => { const lm = pMetamodels.find(x => x.id === m.id); if (lm) DockManager.open2(lm); },
                    () => { if (project) createM2(project); },
                    'New metamodel',
                )}

                {renderSection(
                    'models', 'Models', 'm',
                    pModels.map(m => ({ id: m.id, name: m.name })),
                    (m) => { const lm = pModels.find(x => x.id === m.id); if (lm) DockManager.open2(lm); },
                    () => requestFromProjectEditor(JjodelEvents.CREATE_MODEL),
                    'New model',
                )}

                {renderSection(
                    'transformations', 'Transforms', 'T',
                    pTransformations.map(t => ({ id: t.id, name: t.name })),
                    // Opening a transformation needs source/target metamodels + the execute
                    // callback, all of which live in ProjectEditor: ask it to run its own
                    // handleOpenTransformation, the same path the Tree View entries use.
                    // No tab activation here — the handler opens (and activates) its own
                    // jjtl_* tab, so forcing the summary first would only flash it.
                    (t) => window.dispatchEvent(new CustomEvent(JjodelEvents.OPEN_TRANSFORMATION, { detail: { id: t.id } })),
                    () => requestFromProjectEditor(JjodelEvents.OPEN_NEW_TRANSFORMATION_DIALOG),
                    'New transform',
                )}

                {renderSection(
                    'viewpoints', 'Viewpoints', 'V',
                    pViewpoints.map(v => ({ id: v.id, name: v.name })),
                    (v) => { const lv = pViewpoints.find(x => x.id === v.id); if (lv) DockManager.openViewpoint(lv); },
                    () => requestFromProjectEditor(JjodelEvents.CREATE_VIEWPOINT),
                    'New viewpoint',
                )}

                {/* Project actions — collapsable, pushed to bottom by auto margin */}
                <div className={`psb-section psb-section--actions${isProjectActionsCollapsed ? ' collapsed' : ''}`}>
                    <div className="psb-section-header" onClick={() => toggleSection('project')}>
                        <span className="psb-section-label">Project</span>
                        <i className="bi bi-chevron-down psb-chevron" />
                    </div>
                    <div className="psb-section-body">
                        <div className="psb-action" onClick={exportProject}>
                            <i className="bi bi-download" />
                            <span>Download</span>
                        </div>
                        <div className="psb-action" onClick={toggleFavorite}>
                            <i className={`bi ${project?.isFavorite ? 'bi-star-fill' : 'bi-star'}`} />
                            <span>{project?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                        </div>
                        <div
                            className={`psb-action${canShare ? '' : ' psb-action--disabled'}`}
                            onClick={canShare ? openShareModal : undefined}
                            title={canShare ? undefined : SHARE_DISABLED_HINT}
                        >
                            <i className="bi bi-share" />
                            <span>Share</span>
                        </div>
                        <div className="psb-action psb-action--danger" onClick={closeProject}>
                            <i className="bi bi-x-circle" />
                            <span>Close project</span>
                        </div>
                    </div>
                </div>
            </div>
            :
            <div className={'leftbar'}>

                {user && user.email === 'admin@gmail.it' && <Menu title={'Administration'} mode={'collapsable'}>
                    <Item action={'usersInfo'} icon={<i className="bi bi-people" />}>Users</Item>
                    <Item action={'projectsInfo'} icon={<i className="bi bi-folder" />}>Projects</Item>
                    <Item action={'news'} icon={<i className="bi bi-newspaper" />}>News</Item>
                </Menu>}

                {/* Main Navigation - Workspace */}
                <Menu>
                    <Item action={'allProjects'} icon={<i className="bi bi-folder" />}>All projects</Item>
                </Menu>

                {/* Filters Section - Quick access to filtered views (synced with toolbar) */}
                <Menu title={'Filters'} mode={'collapsable'}>
                    <Item
                        action={() => handleFilterChange('private')}
                        icon={<i className="bi bi-lock" />}
                        active={currentFilter === 'private'}
                    >Private</Item>
                    <Item
                        action={() => handleFilterChange('public')}
                        icon={<i className="bi bi-globe" />}
                        active={currentFilter === 'public'}
                    >Public</Item>
                    <Item
                        action={() => handleFilterChange('collaborative')}
                        icon={<i className="bi bi-people" />}
                        active={currentFilter === 'collaborative'}
                    >Collaborative</Item>
                </Menu>

                {/* Favorites Section */}
                <Menu title={'Favorites'} mode={'collapsable'}>
                    {props.projects && props.projects.filter(p => p.isFavorite).length > 0 ? (
                        props.projects
                            .filter(p => p.isFavorite)
                            .map(p => <Item key={p.id} icon={<i className="bi bi-file-earmark" />} action={e => selectProject(p)}>{p.name}</Item>)
                    ) : (
                        <div className="sidebar-empty-text">No favorites yet</div>
                    )}
                </Menu>

                {/* Browse Section - Templates & Explore (moved from navbar tabs) */}
                <Menu title={'Browse'} mode={'collapsable'}>
                    <Item action={'templates'} icon={<i className="bi bi-grid-3x3-gap" />}>Templates</Item>
                    <Item action={'explore'} icon={<i className="bi bi-compass" />}>Explore</Item>
                </Menu>

                {/* Recently Modified - ONLY show if projects exist */}
                {hasProjects && props.projects &&
                    <Menu title={"Recently Modified"} mode={'collapsable'}>
                        {[...props.projects]
                            .sort((a,b) => (b.lastModified > a.lastModified) ?  1 : -1)
                            .slice(0,5)
                            .map(p => (
                                <div key={p.id} className="recmod-item" onClick={() => selectProject(p)}>
                                    <div className="recmod-left">
                                        <span className={`recmod-dot${p.isFavorite ? ' recmod-dot--favorite' : ''}`} />
                                        <span className="recmod-name">{p.name}</span>
                                    </div>
                                    <span className="recmod-time">{relativeTime(p.lastModified)}</span>
                                </div>
                            ))}
                    </Menu>
                }

                {/* Resources Section */}
                <Menu title={'Resources'} mode={'collapsable'}>
                    <Item
                        action={() => window.open('https://docs.jjodel.io/user-guide/dashboard/', '_blank')}
                        icon={<i className="bi bi-book" />}
                    >Documentation</Item>
                    <Item
                        action={() => window.open('https://docs.jjodel.io/getting-started/', '_blank')}
                        icon={<i className="bi bi-mortarboard" />}
                    >Tutorials</Item>
                    <Item
                        action={() => window.open('https://docs.jjodel.io/reference/jjom-api/', '_blank')}
                        icon={<i className="bi bi-code-square" />}
                    >API Reference</Item>
                    <Item
                        action={() => window.open('https://github.com/jjodel-modeling/repositories', '_blank')}
                        icon={<i className="bi bi-github" />}
                    >GitHub</Item>
                </Menu>

            </div>
        }

    </>)
}

export {LeftBar};
