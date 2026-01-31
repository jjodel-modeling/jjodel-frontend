import {Defaults, Dictionary, DocString, Pointer, Pointers, store, SetFieldAction} from '../../joiner';
import {Constructors, DProject, LProject, R, U} from '../../joiner';
import React, {JSX, useState} from "react";

import {ProjectsApi} from '../../api/persistance';
import {Divisor, Item, Menu} from './menu/Menu';

import {icon} from './icons/Icons';
import {compressToUTF16} from "async-lz-string";
import {formatVersionNumber} from '../../utils/versionUtils';
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
    allTags?: string[];
    animationIndex?: number; // For stagger animation on Load More
    // Selection props (for list view bulk operations)
    isSelected?: boolean;
    onSelect?: (projectId: string, shiftKey: boolean) => void;
};
type PropsCard = {
    data: LProject;
    mode?: 'cards' | 'compact';
    index?: number;
    key: any;
    pnames: Dictionary<string, LProject>;
    allTags?: string[];
};
type PropsList = {
    data: LProject;
    mode?: string;
    key: any;
    pnames: Dictionary<string, LProject>;
    allTags?: string[];
    animationIndex?: number; // For stagger animation on Load More
    // Selection props (for list view bulk operations)
    isSelected?: boolean;
    onSelect?: (projectId: string, shiftKey: boolean) => void;
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
    console.log('[DEBUG Project] Card props:', props);
    console.log('[DEBUG Project] data.tags:', data.tags);

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

    const saveTag = async (input: string) => {
        console.log('[DEBUG saveTag] Input received:', input);
        console.log('[DEBUG saveTag] Project ID:', data.id);
        console.log('[DEBUG saveTag] Project __raw:', data.__raw);

        if (input && input.trim()) {
            const currentTags = data.tags || [];
            console.log('[DEBUG saveTag] Current tags:', currentTags);

            // Split by comma, trim, lowercase, remove empty and duplicates
            const newTags = input
                .split(',')
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag && !currentTags.includes(tag));

            console.log('[DEBUG saveTag] New tags to add:', newTags);

            if (newTags.length > 0) {
                const updatedTags = [...currentTags, ...newTags];
                console.log('[DEBUG saveTag] Updated tags array:', updatedTags);
                console.log('[DEBUG saveTag] Calling ProjectsApi.updateTags...');
                await ProjectsApi.updateTags(data.__raw as DProject, updatedTags);
                console.log('[DEBUG saveTag] ProjectsApi.updateTags completed');
            }
        }
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
        const [showTagPopover, setShowTagPopover] = useState(false);
        const [tagInput, setTagInput] = useState('');

        // Debug: log allTags received
        console.log('[DEBUG ProjectCard] allTags in popover:', props.allTags);

        // Filter suggestions based on input
        const suggestions = tagInput.trim()
            ? (props.allTags || []).filter(tag =>
                tag.toLowerCase().includes(tagInput.toLowerCase()) &&
                !(data.tags || []).includes(tag)
              )
            : [];

        // Debug: log input and suggestions
        if (tagInput.trim()) {
            console.log('[DEBUG ProjectCard] Input:', tagInput);
            console.log('[DEBUG ProjectCard] Suggestions:', suggestions);
        }

        function getClickedElement(e: any){
            // Don't navigate if clicking on interactive elements
            if (e.target.closest('.project-card__action') ||
                e.target.closest('.menu-button') ||
                e.target.closest('.dropdown') ||
                e.target.closest('.tag-popover') ||
                e.target.className.includes('bi-star')) {
                return;
            }
            selectProject(false);
        }

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
                {/* Accent Bar - Uniform slate color */}
                <div className="project-card__accent" />

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
                                    <Item icon={<i className="bi bi-tag" />} action={e => setShowTagPopover(true)}>Add tag</Item>
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
                        <span className="project-card__version" title="Project revision - Auto-increments on each save">
                            Rev {formatVersionNumber(data.version)}
                        </span>
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

                    {/* Tags Row (if present) */}
                    {data.tags && data.tags.length > 0 && (
                        <div className="project-card__tags">
                            {data.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="project-card__tag">{tag}</span>
                            ))}
                            {data.tags.length > 3 && (
                                <span className="project-card__tag-more">
                                    +{data.tags.length - 3} more
                                    <span className="project-card__tag-tooltip">
                                        <svg
                                            className="project-card__tag-tooltip-icon"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                                            <line x1="7" y1="7" x2="7.01" y2="7"/>
                                        </svg>
                                        {data.tags.slice(3).join(', ')}
                                    </span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Tag Popover */}
                {showTagPopover && (
                    <div className="tag-popover" onClick={e => e.stopPropagation()}>
                        <div className="tag-popover__input-row">
                            <input
                                type="text"
                                placeholder="Tag name..."
                                autoFocus
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && tagInput.trim()) {
                                        saveTag(tagInput);
                                        setTagInput('');
                                        setShowTagPopover(false);
                                    }
                                    if (e.key === 'Escape') {
                                        setTagInput('');
                                        setShowTagPopover(false);
                                    }
                                }}
                            />
                            <button onClick={() => { setTagInput(''); setShowTagPopover(false); }}>×</button>
                        </div>
                        {suggestions.length > 0 && (
                            <div className="tag-popover__suggestions">
                                {suggestions.slice(0, 5).map(tag => (
                                    <button
                                        key={tag}
                                        className="tag-popover__suggestion"
                                        onClick={() => {
                                            saveTag(tag);
                                            setTagInput('');
                                            setShowTagPopover(false);
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </article>
        );
    }


    /* COMPACT LIST - Row view with colored dot and tags */

    function ProjectList(props: PropsList): JSX.Element {
        const [showTagPopover, setShowTagPopover] = useState(false);
        const [tagInput, setTagInput] = useState('');

        // Filter suggestions based on input
        const suggestions = tagInput.trim()
            ? (props.allTags || []).filter(tag =>
                tag.toLowerCase().includes(tagInput.toLowerCase()) &&
                !(data.tags || []).includes(tag)
              )
            : [];

        // Debug: log input and suggestions
        if (tagInput.trim()) {
            console.log('[DEBUG ProjectList] Input:', tagInput);
            console.log('[DEBUG ProjectList] Suggestions:', suggestions);
        }

        // Get badge label for project type
        const getBadgeLabel = () => {
            switch (data.type) {
                case 'private': return 'Private';
                case 'public': return 'Public';
                case 'collaborative': return 'Collab';
                default: return 'Project';
            }
        };

        // Get author display name
        const getAuthorName = () => {
            if (typeof data.author === 'string') {
                if (data.author === 'Offline') return 'You';
                return data.author;
            }
            const authorName = data.author?.name || '';
            if (authorName === 'Offline') return 'You';
            return authorName || 'You';
        };

        // Animation class and delay for stagger effect on Load More
        const { animationIndex = -1, isSelected = false, onSelect } = props;
        const isAnimating = animationIndex >= 0;
        const animationStyle = isAnimating
            ? { animationDelay: `${animationIndex * 50}ms` }
            : undefined;

        // Handle checkbox click
        const handleCheckboxChange = (e: React.MouseEvent<HTMLInputElement>) => {
            e.stopPropagation();
            if (onSelect) {
                onSelect(data.id, e.shiftKey);
            }
        };

        return (
            <div
                className={`project-row ${isAnimating ? 'project-row--entering' : ''} ${isSelected ? 'project-row--selected' : ''}`}
                style={animationStyle}
                onClick={(e) => {
                    // Don't navigate if clicking on interactive elements
                    if ((e.target as HTMLElement).closest('.project-row__actions') ||
                        (e.target as HTMLElement).closest('.project-row__checkbox') ||
                        (e.target as HTMLElement).closest('.menu-button') ||
                        (e.target as HTMLElement).closest('.dropdown') ||
                        (e.target as HTMLElement).closest('.tag-popover')) {
                        return;
                    }
                    selectProject();
                }}
            >
                {/* Selection Checkbox (replaces colored dot) */}
                <div className="project-row__checkbox">
                    <input
                        type="checkbox"
                        className="project-checkbox"
                        checked={isSelected}
                        onClick={handleCheckboxChange}
                        onChange={() => {}} // Controlled by onClick
                        aria-label={`Select ${data.name}`}
                    />
                </div>

                {/* Project name */}
                <span className="project-row__name">{data.name}</span>

                {/* Badge */}
                <span className={`project-row__badge project-row__badge--${data.type}`}>
                    {getBadgeLabel()}
                </span>

                {/* Author */}
                <span className="project-row__author">{getAuthorName()}</span>

                {/* Tags - max 2 with tooltip for hidden tags */}
                <div className="project-row__tags">
                    {data.tags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="project-row__tag">{tag}</span>
                    ))}
                    {data.tags && data.tags.length > 2 && (
                        <span className="project-row__tag-more">
                            +{data.tags.length - 2}
                            <span className="project-row__tag-tooltip">
                                <svg
                                    className="project-row__tag-tooltip-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                                </svg>
                                {data.tags.slice(2).join(', ')}
                            </span>
                        </span>
                    )}
                </div>

                {/* Version */}
                <span className="project-row__version" title="Project revision - Auto-increments on each save">
                    Rev {formatVersionNumber(data.version)}
                </span>

                {/* Time */}
                <span className="project-row__time">{formatDate(data.lastModified)}</span>

                {/* Actions */}
                <div className="project-row__actions">
                    <button
                        className={`project-row__favorite ${data.isFavorite ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(data); }}
                        aria-label={data.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <i className={data.isFavorite ? 'bi bi-star-fill' : 'bi bi-star'} />
                    </button>
                    <div className="menu-button project-row__menu">
                        <Menu>
                            <Item icon={<i className="bi bi-folder2-open" />} action={e => {selectProject()}}>Open</Item>
                            <Item icon={icon['download']} action={e => exportProject()}>Download</Item>
                            <Item icon={icon['tools']} action={e => selectProject(true)}>Repair & open</Item>
                            <Divisor />
                            <Item icon={icon['favorite']} action={(e => toggleFavorite(data))}>{!data.isFavorite ? 'Add to favorites' : 'Remove from favorites'}</Item>
                            <Item icon={<i className="bi bi-tag" />} action={e => setShowTagPopover(true)}>Add tag</Item>
                            <Divisor />
                            <Item icon={icon['delete']} action={async e => await deleteProject()}>Delete</Item>
                        </Menu>
                    </div>
                </div>

                {/* Tag Popover */}
                {showTagPopover && (
                    <div className="tag-popover" onClick={e => e.stopPropagation()}>
                        <div className="tag-popover__input-row">
                            <input
                                type="text"
                                placeholder="Tag name..."
                                autoFocus
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && tagInput.trim()) {
                                        saveTag(tagInput);
                                        setTagInput('');
                                        setShowTagPopover(false);
                                    }
                                    if (e.key === 'Escape') {
                                        setTagInput('');
                                        setShowTagPopover(false);
                                    }
                                }}
                            />
                            <button onClick={() => { setTagInput(''); setShowTagPopover(false); }}>×</button>
                        </div>
                        {suggestions.length > 0 && (
                            <div className="tag-popover__suggestions">
                                {suggestions.slice(0, 5).map(tag => (
                                    <button
                                        key={tag}
                                        className="tag-popover__suggestion"
                                        onClick={() => {
                                            saveTag(tag);
                                            setTagInput('');
                                            setShowTagPopover(false);
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }


    return(<>
        {props.mode === "cards" || props.mode === "compact" ?
            <ProjectCard key={props.key} data={props.data} pnames={props.pnames} mode={props.mode} index={props.index} allTags={props.allTags} /> :
            <ProjectList key={props.key} data={props.data} pnames={props.pnames} allTags={props.allTags} animationIndex={props.animationIndex} isSelected={props.isSelected} onSelect={props.onSelect} />
        }
    </>);
}

export {Project};
