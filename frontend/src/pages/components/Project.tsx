import {Defaults, Dictionary, DocString, Pointer, Pointers, store} from '../../joiner';
import {Constructors, DProject, LProject, R, U} from '../../joiner';
import React, {JSX} from "react";

import {ProjectsApi} from '../../api/persistance';
import {Divisor, Item, Menu} from './menu/Menu';

import {icon} from './icons/Icons';
import {compressToUTF16} from "async-lz-string";
import './project-card.scss';

function formatDate(lastModified: number){
    
    let timeago = Date.now() - lastModified;
    let timeunit: string;
    let sec = 1000;
    let min = sec*60;
    let hr = min*60;
    let day = hr*24;
    let week = day*7;
    let month = day*24;
    let year = day*365;

    if (timeago < min) { timeago /= sec; timeunit = 'seconds'; }
    else if (timeago >= min && timeago < hr) { timeago /= min; timeunit = 'minutes'; }
    else if (timeago >= hr && timeago < day) { timeago /= hr; timeunit = 'hours'; }
    else if (timeago >= day && timeago < week) { timeago /= day; timeunit = 'days'; }
    else if (timeago >= week && timeago < month) { timeago /= week; timeunit = 'weeks'; }
    else if (timeago >= month && timeago < year) { timeago /= month; timeunit = 'months'; }
    else { timeago/= min; timeunit = 'years'; }

    return Math.round(timeago) + ' ' + timeunit + ' ago';
}


type Props = {
    data: LProject;
    mode?: string;
    index?: number;
    key: any;
    pnames: Dictionary<string, LProject>;
};
type PropsCard = {
    data: LProject;
    mode?: 'cards' | 'compact';
    index?: number;
    key: any;
    pnames: Dictionary<string, LProject>;
};
type PropsList = {
    data: LProject;
    mode?: string;
    key: any;
    pnames: Dictionary<string, LProject>;
};

type ProjectTypeType = {
    type: string;
}

function ProjectType(props: ProjectTypeType){
    return (<>
        {props.type === "public" && <i className="bi bi-unlock"></i>}
        {props.type === "private" && <i className="bi bi-lock"></i>}
        {props.type === "collaborative" && <i className="bi bi-diagram-3"></i>}
    </>);
}

export async function downloadDuplicate(project: DProject, pnames: Dictionary<string, any>): Promise<void> {
    project = await duplicateProject(project, pnames);
    U.download(`${project.name}.jjodel`, JSON.stringify(project));
}

export async function duplicateProject(project: DProject, pnames?: Dictionary<string, any>): Promise<DProject> {
    project = {...project} as any;
    let oldID = project.id;
    project.id = Constructors.makeID();

    if (project.name.indexOf('copy') === -1) project.name += ' copy';

    let projectNames: Dictionary<DocString<'name'>, Pointer>;
    if (pnames) projectNames = pnames;
    else {
        let state = store.getState();
        projectNames = {};
        for (let ptr of state.projects) {
            let p = state.idlookup[ptr];
            if (!p) continue;
            projectNames[p.name||''] = ptr;
        }
    }
    project.name = U.increaseEndingNumber(project.name, false, false, (str)=> { return !!projectNames[str]; })


    const state = JSON.parse(await U.decompressState(project.state));
    state.idlookup[oldID].id = project.id;
    state.idlookup[oldID].name = project.name;
    state.idlookup[project.id] = state.idlookup[oldID];
    delete state.idlookup[oldID];
    let str = JSON.stringify(state);
    str = U.replaceAll(str, oldID, project.id);
    let oldGUID = (project as any)._Id;
    if (oldGUID) {
        project._Id = '';
        str = U.replaceAll(str, oldGUID, '');
    }

    let renewAllIDs = true;
    if (renewAllIDs) {
        for (let id in state.idlookup){
            if (id === project.id || !Pointers.isPointer(id) || Defaults.check(id)) continue;
            str = U.replaceAll(str, id, Constructors.makeID());
        }
    }
    project.state = await compressToUTF16(str);
    state.idlookup[project.id] = {...project, state: ''} as any;
    return project;
}

function Project(props: Props): JSX.Element {
    const {data} = props;

    const toggleFavorite = async(project: LProject) => {
        await ProjectsApi.favorite(project.__raw as DProject);
    };

    const selectProject = (repair: boolean = false) => {
        R.navigate(`/project?id=${data.id}`+(repair ? '&repair=1' : ''), true);
        //U.resetState();
    }

    const exportProject = async() => {
        // await ProjectsApi.save(data);
        U.download(`${data.name}.jjodel`, JSON.stringify(data.__raw));
    }
    const deleteProject = async() => {
        data.delete();
    }

    // Type icon using Bootstrap Icons only
    const typeIcon = (type: string) => {
        switch(type){
            case 'public':
                return <i className="bi bi-unlock type-icon" />;
            case 'private':
                return <i className="bi bi-lock type-icon" />;
            case 'collaborative':
                return <i className="bi bi-people type-icon" />;
            default:
                return null;
        }
    }

    /* CARDS */

    type ProjectProps = {
        project: LProject
    }

    const Empty = (props: ProjectProps) => {
        return (<>
            {props.project.metamodelsNumber == 0 && props.project.modelsNumber == 0 && <><i title="empty project" className="bi bi-exclamation-circle"></i> <span>Empty</span></>}
            {/* {props.project.metamodels.length == 0 && props.project.models.length != 0 && <i style={{float: 'left'}} title="no models" className="bi bi-circle-half"></i>}
            {props.project.metamodels.length != 0 && props.project.models.length != 0 && <i style={{float: 'left'}} title="artifacts present" className="bi bi-circle-fill"></i>}*/}
        </>);
    }

    function ProjectCard(props: PropsCard): JSX.Element {

        function getClickedElement(e: any){
            // Don't navigate if clicking on interactive elements
            if (e.target.closest('.card-action-btn') ||
                e.target.closest('.menu-button') ||
                e.target.closest('.dropdown') ||
                e.target.className.includes('bi-star')) {
                return;
            }
            selectProject(false);
        }

        // CSS gradients for card covers - vibrant colors only
        const gradients = [
            // Blu/Cyan
            'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)',
            'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
            'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)',
            // Verde/Teal
            'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
            'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
            'linear-gradient(135deg, #96e6a1 0%, #d4fc79 100%)',
            // Viola/Rosa
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
            'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
            'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
            // Arancio/Rosso/Giallo
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
            'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
            'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
            // Rosa/Pesca
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            // Pastello vivace
            'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
            'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
        ];
        // Hash function for consistent color per project
        const hashCode = (str: string) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
            return Math.abs(hash);
        };
        // Select gradient based on project ID hash for consistent color
        const gradientIndex = hashCode(data.id || data.name || '') % gradients.length;
        const coverStyle = { background: gradients[gradientIndex] };

        // Get privacy label and icon
        const getPrivacyInfo = () => {
            switch (data.type) {
                case 'private':
                    return { icon: 'bi-lock-fill', label: 'Private' };
                case 'public':
                    return { icon: 'bi-unlock-fill', label: 'Public' };
                case 'collaborative':
                    return { icon: 'bi-people-fill', label: 'Collaborative' };
                default:
                    return { icon: 'bi-file-earmark', label: 'Project' };
            }
        };

        const privacyInfo = getPrivacyInfo();

        // Check if compact mode (passed via props.mode)
        const isCompact = props.mode === 'compact';

        return (
            <article
                className={`project-card-new ${isCompact ? 'compact' : ''}`}
                onClick={e => getClickedElement(e)}
                tabIndex={0}
                role="button"
                aria-label={`Open project ${data.name}`}
            >
                {/* Cover Gradient - hidden in compact mode */}
                {!isCompact && (
                    <div
                        className="card-cover"
                        style={coverStyle}
                    >
                        {/* Privacy Badge (top-left) */}
                        <span className="card-privacy-badge">
                            {privacyInfo.label}
                        </span>

                        {/* Actions (top-right) */}
                        <div className="card-actions">
                            <button
                                className={`card-action-btn ${data.isFavorite ? 'is-favorite' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(data); }}
                                aria-label={data.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <i className={data.isFavorite ? 'bi bi-star-fill' : 'bi bi-star'} />
                            </button>
                            <div className="menu-button">
                                <Menu>
                                    <Item icon={<i className="bi bi-folder2-open" />} action={e => {selectProject()}}>Open</Item>
                                    <Item icon={icon['download']} action={e => exportProject()}>Download</Item>
                                    <Item icon={icon['tools']} action={e => selectProject(true)}>Repair & open</Item>
                                    <Divisor />
                                    <Item icon={icon['favorite']} action={(e => toggleFavorite(data))}>{!data.isFavorite ? 'Add to favorites' : 'Remove from favorites'}</Item>
                                    <Divisor />
                                    <Item icon={icon['delete']} action={async e => await deleteProject()}>Delete</Item>
                                </Menu>
                            </div>
                        </div>
                    </div>
                )}

                {/* Compact mode header - shows privacy and actions inline */}
                {isCompact && (
                    <div className="card-compact-header">
                        <span className="card-privacy-badge-inline">
                            {privacyInfo.label}
                        </span>
                        <div className="card-actions-inline">
                            <button
                                className={`card-action-btn-sm ${data.isFavorite ? 'is-favorite' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(data); }}
                                aria-label={data.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <i className={data.isFavorite ? 'bi bi-star-fill' : 'bi bi-star'} />
                            </button>
                            <div className="menu-button">
                                <Menu>
                                    <Item icon={<i className="bi bi-folder2-open" />} action={e => {selectProject()}}>Open</Item>
                                    <Item icon={icon['download']} action={e => exportProject()}>Download</Item>
                                    <Item icon={icon['tools']} action={e => selectProject(true)}>Repair & open</Item>
                                    <Divisor />
                                    <Item icon={icon['favorite']} action={(e => toggleFavorite(data))}>{!data.isFavorite ? 'Add to favorites' : 'Remove from favorites'}</Item>
                                    <Divisor />
                                    <Item icon={icon['delete']} action={async e => await deleteProject()}>Delete</Item>
                                </Menu>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="card-body">
                    <h3 className="card-title">{data.name}</h3>
                    {/* Only show description if not default and not empty */}
                    {data.description && !data.description.startsWith('A new Project') && (
                        <p className="card-description">
                            {data.description.length > 60
                                ? data.description.substring(0, 60) + '...'
                                : data.description}
                        </p>
                    )}

                    {/* Stats Row with timestamp */}
                    <div className="card-stats">
                        <span className="card-stat">
                            <i className="bi bi-diagram-3" />
                            {data.metamodelsNumber} {data.metamodelsNumber === 1 ? 'metamodel' : 'metamodels'}
                        </span>
                        <span className="card-stat">
                            <i className="bi bi-file-earmark" />
                            {data.modelsNumber} {data.modelsNumber === 1 ? 'model' : 'models'}
                        </span>
                        <span className="card-stat-separator">·</span>
                        <span className="card-time">{formatDate(data.lastModified)}</span>
                    </div>
                </div>
            </article>
        );
    }


    /* COMPACT LIST - Mini cards without cover */

    function ProjectList(props: PropsList): JSX.Element {

        // Get badge label for project type
        const getBadgeLabel = () => {
            switch (data.type) {
                case 'private': return 'Private';
                case 'public': return 'Public';
                case 'collaborative': return 'Collaborative';
                default: return 'Project';
            }
        };

        return (
            <div
                className="compact-card"
                onClick={(e) => {
                    // Don't navigate if clicking on interactive elements
                    if ((e.target as HTMLElement).closest('.compact-card-actions') ||
                        (e.target as HTMLElement).closest('.menu-button') ||
                        (e.target as HTMLElement).closest('.dropdown')) {
                        return;
                    }
                    selectProject();
                }}
            >
                <div className="compact-card-left">
                    <span className="compact-card-name">{data.name}</span>
                    <span className="compact-card-stats">
                        {data.metamodelsNumber} metamodels · {data.modelsNumber} models · {formatDate(data.lastModified)}
                    </span>
                </div>
                <div className="compact-card-right">
                    <span className="compact-card-badge">{getBadgeLabel()}</span>
                    <div className="compact-card-actions">
                        <button
                            className={`compact-favorite-btn ${data.isFavorite ? 'is-favorite' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(data); }}
                            aria-label={data.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <i className={data.isFavorite ? 'bi bi-star-fill' : 'bi bi-star'} />
                        </button>
                        <div className="menu-button compact-menu-btn">
                            <Menu>
                                <Item icon={<i className="bi bi-folder2-open" />} action={e => {selectProject()}}>Open</Item>
                                <Item icon={icon['download']} action={e => exportProject()}>Download</Item>
                                <Item icon={icon['tools']} action={e => selectProject(true)}>Repair & open</Item>
                                <Divisor />
                                <Item icon={icon['favorite']} action={(e => toggleFavorite(data))}>{!data.isFavorite ? 'Add to favorites' : 'Remove from favorites'}</Item>
                                <Divisor />
                                <Item icon={icon['delete']} action={async e => await deleteProject()}>Delete</Item>
                            </Menu>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return(<>
        {props.mode === "cards" || props.mode === "compact" ?
            <ProjectCard key={props.key} data={props.data} pnames={props.pnames} mode={props.mode} index={props.index} /> :
            <ProjectList key={props.key} data={props.data} pnames={props.pnames} />
        }
    </>);
}

export {Project};
