import {useState, MouseEventHandler, JSX} from 'react';
import {DProject, DUser, L, LProject, LUser, R, SetRootFieldAction, U, windoww} from '../../joiner';

import { icon } from './icons/Icons';
import {DashProps} from "./Dashboard";
import Collaborative from "../../components/collaborative/Collaborative";
import {ProjectsApi} from "../../api/persistance";
import storage from "../../data/storage";
import { isProjectModified } from '../../common/libraries/projectModified';
import { Tooltip } from '../../components/forEndUser/Tooltip';
import {SaveManager} from "../../components/topbar/SaveManager";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import { DevModeLabel } from '../../components/DevModeLabel/DevModeLabel';
import { buildProjectExportJson } from '../../model/megamodelPersistence';
import { getRuntimeMegamodel } from '../../model/megamodelRuntime';

interface StateProps {
    projects: LProject[];
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
};

const Item = (props: ItemProps) => {
    let action: (e:any)=>any = props.action as any;
    let navigate = useNavigate();
    if (typeof action === 'string') action = (e => R.navigate(`/${props.action}`, navigate));
    let finalaction = (e:any) =>{ props.onClick?.(e); action(e); }
/*
    let url: string = '';
    if (typeof props.action === 'string') url = props.action;*/
    return (<>

        {/*<Link to={url} className={'item ' + (props.dot ? 'red-dot' : '')}>{props.icon && props.icon}&nbsp;{props.children}</Link>*/}
            <div onClick={finalaction} className={'item ' + (props.dot ? 'red-dot' : '') + (props.active ? ' active' : '')}>
                {props.icon && props.icon}&nbsp;<span>{props.children}</span>
            </div>
    </>);
}

const Upload = () => {
    return(<></>);
    return(
        <div className={'upload'}>
            <i className="bi bi-arrow-up-circle"></i>
            <p>Drop your Jjodel project archive here to import it.</p>
        </div>
    );
};

type MenuProps = {
    children: any;
    title?: string;
    mode?: "collapsable";
    project?: boolean;
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
                        {isProjectModified() && props.project && <i className="bi bi-circle-fill modified"></i>}
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

const Divisor = () => {
    return (<hr className='my-1' />);
};

Menu.Item = Item;

function LeftBar(props: LeftBarProps): JSX.Element {

    const {active, project} = props;
    let user: LUser = props.user || L.fromPointer(DUser.current);
    const navigate = useNavigate();

    // Read/write filter from URL to sync with toolbar (no page reload)
    const [searchParams, setSearchParams] = useSearchParams();
    const currentFilter = searchParams.get('filter') || 'all';

    // Handler to change filter - navigates to allProjects with filter param (no page reload if already there)
    const handleFilterChange = (filter: 'all' | 'public' | 'private' | 'collaborative') => {
        const filterParam = filter === 'all' ? '' : `?filter=${filter}`;
        // Check if we're already on allProjects page
        if (window.location.pathname.includes('allProjects')) {
            // Just update search params without navigation
            const newParams = new URLSearchParams(searchParams);
            if (filter === 'all') {
                newParams.delete('filter');
            } else {
                newParams.set('filter', filter);
            }
            setSearchParams(newParams);
        } else {
            // Navigate to allProjects with filter
            R.navigate(`/allProjects${filterParam}`, navigate);
        }
    };

    const selectProject= (project: LProject) => {
        R.navigate(`/project?id=${project.id}`, true);
        U.resetState();
    };

    const closeProject = async () => {
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

    return(<>
        {/* Dev Mode Label */}
        <DevModeLabel componentId="T2.3" position="top-left" />

        {active === 'Project' ?
            <div className={'leftbar'}>
                {/* @ts-ignore */}
                <Menu title={props.project.name ? props.project.name : 'Unnamed Project'} project>
                    <Item action={exportProject} icon={icon['download']}>Download</Item>
                    {/* Export Metamodel removed - now in contextual menu on metamodel/model cards */}
                    <Item action={toggleFavorite} icon={!project?.isFavorite ? icon['favorite'] : icon['favoriteFill']}>{!project?.isFavorite ? 'Add to favorites ' : 'Remove from favorites '}</Item>
                    <Item action={closeProject} icon={icon['close']}>Close project </Item>
                </Menu>

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
                    <Item
                        action={() => window.open('https://www.jjodel.io/explore/', '_blank')}
                        icon={<i className="bi bi-compass" />}
                    >Explore</Item>
                </Menu>

                {/* Recently Modified - ONLY show if projects exist */}
                {hasProjects && props.projects &&
                    <Menu title={"Recently Modified"} mode={'collapsable'}>
                        {[...props.projects]
                            .sort((a,b) => (b.lastModified > a.lastModified) ?  1 : -1)
                            .slice(0,5)
                            .map(p => <Item key={p.id} icon={<i className="bi bi-file-earmark" />} action={e => selectProject(p)}>{p.name}</Item>)}
                    </Menu>
                }

                {/* Resources Section */}
                <Menu title={'Resources'} mode={'collapsable'}>
                    <Item
                        action={() => window.open('https://www.jjodel.io/manual/', '_blank')}
                        icon={<i className="bi bi-book" />}
                    >Documentation</Item>
                    <Item
                        action={() => window.open('https://www.jjodel.io/getting-started/', '_blank')}
                        icon={<i className="bi bi-mortarboard" />}
                    >Tutorials</Item>
                    <Item
                        action={() => window.open('https://www.jjodel.io/api/', '_blank')}
                        icon={<i className="bi bi-code-square" />}
                    >API Reference</Item>
                    <Item
                        action={() => window.open('https://github.com/jjodel', '_blank')}
                        icon={<i className="bi bi-github" />}
                    >GitHub</Item>
                </Menu>

            </div>
        }

    </>)
}

export {LeftBar};
