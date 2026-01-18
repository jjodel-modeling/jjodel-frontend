import {Defaults, Dictionary, DocString, Pointer, Pointers, store} from '../../joiner';
import {Constructors, DProject, LProject, R, U} from '../../joiner';
import React, {JSX} from "react";

import {ProjectsApi} from '../../api/persistance';
import {Divisor, Item, Menu} from './menu/Menu';

import {icon} from './icons/Icons';
import {compressToUTF16} from "async-lz-string";
import {getAccentColor} from '../../utils/colorHash';
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
            if (e.target.closest('.project-card__action') ||
                e.target.closest('.menu-button') ||
                e.target.closest('.dropdown') ||
                e.target.className.includes('bi-star')) {
                return;
            }
            selectProject(false);
        }

        // Get accent color based on project name
        const accentColor = getAccentColor(data.name || '');

        // Get privacy label
        const getBadgeLabel = () => {
            switch (data.type) {
                case 'private': return 'Private';
                case 'public': return 'Public';
                case 'collaborative': return 'Collaborative';
                default: return 'Project';
            }
        };

        // Get author display name (show 'You' for offline mode)
        const getAuthorName = () => {
            if (typeof data.author === 'string') {
                if (data.author === 'Offline') return 'You';
                return data.author;
            }
            const authorName = data.author?.name || '';
            const authorSurname = data.author?.surname || '';
            // Check if it's the offline user
            if (authorName === 'Offline' && authorSurname === 'User') return 'You';
            if (authorName === 'Offline') return 'You';
            return authorName || authorSurname || 'You';
        };

        return (
            <article
                className="project-card"
                onClick={e => getClickedElement(e)}
                tabIndex={0}
                role="button"
                aria-label={`Open project ${data.name}`}
            >
                {/* Accent Bar */}
                <div className="project-card__accent" style={{ backgroundColor: accentColor }} />

                {/* Content */}
                <div className="project-card__content">
                    {/* Header: Title + Actions */}
                    <div className="project-card__header">
                        <h3 className="project-card__title">{data.name}</h3>
                        <div className="project-card__actions">
                            <button
                                className={`project-card__action ${data.isFavorite ? 'is-favorite' : ''}`}
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

                    {/* Meta Row: Badge, Owner, Version */}
                    <div className="project-card__meta">
                        <span className="project-card__badge">{getBadgeLabel()}</span>
                        <span className="project-card__author">{getAuthorName()}</span>
                        <span className="project-card__version">v{data.version || '2.0'}</span>
                    </div>

                    {/* Stats Row */}
                    <div className="project-card__stats">
                        <span className="project-card__stat">
                            <i className="bi bi-diagram-3" />
                            {data.metamodelsNumber} {data.metamodelsNumber === 1 ? 'metamodel' : 'metamodels'}
                        </span>
                        <span className="project-card__stat">
                            <i className="bi bi-file-earmark" />
                            {data.modelsNumber} {data.modelsNumber === 1 ? 'model' : 'models'}
                        </span>
                        <span className="project-card__time">{formatDate(data.lastModified)}</span>
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
