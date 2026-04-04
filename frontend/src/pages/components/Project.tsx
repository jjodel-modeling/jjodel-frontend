import {Defaults, Dictionary, DocString, Pointer, Pointers, store, SetFieldAction} from '../../joiner';
import {Constructors, DProject, LProject, R, U} from '../../joiner';
import React, {JSX, useState} from "react";

import {ProjectsApi} from '../../api/persistance';
import {Divisor, Item, Menu} from './menu/Menu';

import {icon} from './icons/Icons';
import {compressToUTF16} from "async-lz-string";
import {formatVersionNumber} from '../../utils/versionUtils';
import './project-card.scss';

// ── Project Color for Gallery Header Band ────────────────

interface ProjectColor {
  bg: string;
  text: string;
  revBorder: string;
  dot: string;
}

const PROJECT_PALETTE: ProjectColor[] = [
  { bg: '#f0f4ff', text: '#3730a3', revBorder: '#c7d2fe', dot: '#818cf8' }, // indigo
  { bg: '#f0fdf4', text: '#166534', revBorder: '#bbf7d0', dot: '#4ade80' }, // green
  { bg: '#fff7ed', text: '#9a3412', revBorder: '#fed7aa', dot: '#fb923c' }, // orange
  { bg: '#fdf4ff', text: '#6b21a8', revBorder: '#e9d5ff', dot: '#c084fc' }, // purple
  { bg: '#fff1f2', text: '#9f1239', revBorder: '#fecdd3', dot: '#fb7185' }, // rose
  { bg: '#f0fdfa', text: '#115e59', revBorder: '#99f6e4', dot: '#2dd4bf' }, // teal
  { bg: '#fefce8', text: '#713f12', revBorder: '#fef08a', dot: '#facc15' }, // yellow
  { bg: '#f0f9ff', text: '#075985', revBorder: '#bae6fd', dot: '#38bdf8' }, // sky
  { bg: '#faf5ff', text: '#581c87', revBorder: '#d8b4fe', dot: '#a855f7' }, // violet
  { bg: '#fff8f1', text: '#92400e', revBorder: '#fde68a', dot: '#fbbf24' }, // amber
  { bg: '#f0fdf9', text: '#064e3b', revBorder: '#a7f3d0', dot: '#34d399' }, // emerald
  { bg: '#f8f7ff', text: '#4c1d95', revBorder: '#ddd6fe', dot: '#8b5cf6' }, // purple-soft
];

function hashProjectId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getProjectColor(projectId: string): ProjectColor {
  return PROJECT_PALETTE[hashProjectId(projectId) % PROJECT_PALETTE.length];
}

// ── Status automatico da timestamp ─────────────────────

interface ProjectStatus {
  label: 'Active' | 'Idle' | 'Stale';
  bg: string;
  text: string;
}

function getProjectStatus(lastModified: number): ProjectStatus {
  const hoursAgo = (Date.now() - lastModified) / 3600000;
  if (hoursAgo < 48)  return { label: 'Active', bg: '#dcfce7', text: '#166534' };
  if (hoursAgo < 168) return { label: 'Idle',   bg: '#fef3c7', text: '#92400e' };
  return                     { label: 'Stale',  bg: '#f1f5f9', text: '#64748b' };
}

// ── End Project Color / Status ───────────────────────────

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
    console.log('[DEBUG Project] data.tagNames:', data.tagNames);

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
            const currentTags = data.tagNames || [];
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
                !(data.tagNames || []).includes(tag)
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
                className={`project-card project-card--${data.type || 'private'}${data.isFavorite ? ' project-card--favorite' : ''}`}
                onClick={e => getClickedElement(e)}
                tabIndex={0}
                role="button"
                aria-label={`Open project ${data.name}`}
            >
                {/* Accent Bar - Top, colored by type */}
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
                    {data.tagNames && data.tagNames.length > 0 && (
                        <div className="project-card__tags">
                            {data.tagNames.slice(0, 3).map(tag => (
                                <span key={tag} className="project-card__tag">{tag}</span>
                            ))}
                            {data.tagNames.length > 3 && (
                                <span className="project-card__tag-more">
                                    +{data.tagNames.length - 3} more
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
                                        {data.tagNames.slice(3).join(', ')}
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


    /* COMPACT LIST — table row with colored dot */

    function ProjectList(props: PropsList): JSX.Element {
        const rowColor = getProjectColor(String(data.id));
        const { animationIndex = -1, isSelected = false, onSelect } = props;
        const isAnimating = animationIndex >= 0;
        const animationStyle = isAnimating
            ? { animationDelay: `${animationIndex * 50}ms` }
            : undefined;

        const getBadgeLabel = () => {
            switch (data.type) {
                case 'private': return 'Private';
                case 'public': return 'Public';
                case 'collaborative': return 'Collaborative';
                default: return 'Private';
            }
        };

        return (
            <div
                className={`project-row ${isAnimating ? 'project-row--entering' : ''} ${isSelected ? 'project-row--selected' : ''}`}
                style={animationStyle}
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.project-row__checkbox') ||
                        (e.target as HTMLElement).closest('.project-row__actions') ||
                        (e.target as HTMLElement).closest('.menu-button') ||
                        (e.target as HTMLElement).closest('.dropdown')) {
                        return;
                    }
                    selectProject();
                }}
            >
                {/* Checkbox */}
                <div className="project-row__checkbox" onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        className="project-checkbox"
                        checked={isSelected}
                        onClick={(e) => { e.stopPropagation(); onSelect?.(data.id, e.shiftKey); }}
                        onChange={() => {}}
                        aria-label={`Select ${data.name}`}
                    />
                </div>

                {/* Colored dot */}
                <span
                    className="project-row__dot"
                    style={{ background: rowColor.dot }}
                />

                {/* Name + favorite star */}
                <span className="project-row__name">
                    {data.name}
                    {data.isFavorite && (
                        <i className="bi bi-star-fill" style={{ color: '#f59e0b', fontSize: 11, marginLeft: 4 }} />
                    )}
                </span>

                {/* Type badge */}
                <span className={`project-row__badge project-row__badge--${data.type}`}>
                    {getBadgeLabel()}
                </span>

                {/* Rev */}
                <span className="project-row__rev">
                    {formatVersionNumber(data.version)}
                </span>

                {/* Metamodels count */}
                <span className="project-row__count">{data.metamodelsNumber}</span>

                {/* Models count */}
                <span className="project-row__count">{data.modelsNumber}</span>

                {/* Modified */}
                <span className="project-row__time">{formatDate(data.lastModified)}</span>

                {/* Actions — visible on hover */}
                <div className="project-row__actions" onClick={e => e.stopPropagation()}>
                    <button
                        className="project-row__action-btn"
                        onClick={() => toggleFavorite(data)}
                        title={data.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <i className={`bi bi-star${data.isFavorite ? '-fill' : ''}`}
                           style={data.isFavorite ? { color: '#f59e0b' } : undefined} />
                    </button>
                    <div className="menu-button project-row__menu">
                        <Menu>
                            <Item icon={<i className="bi bi-folder2-open" />} action={() => selectProject()}>Open</Item>
                            <Item icon={icon['download']} action={() => exportProject()}>Download</Item>
                            <Item icon={icon['tools']} action={() => selectProject(true)}>Repair & open</Item>
                            <Divisor />
                            <Item icon={icon['favorite']} action={() => toggleFavorite(data)}>{!data.isFavorite ? 'Add to favorites' : 'Remove from favorites'}</Item>
                            <Divisor />
                            <Item icon={icon['delete']} action={async () => await deleteProject()}>Delete</Item>
                        </Menu>
                    </div>
                </div>
            </div>
        );
    }


    /* GALLERY CARD O — status-forward */

    function ProjectGalleryCard(): JSX.Element {
        const color  = getProjectColor(String(data.id));
        const status = getProjectStatus(data.lastModified);

        const metaCount  = data.metamodelsNumber ?? 0;
        const modelCount = data.modelsNumber ?? 0;
        const progressPct = metaCount > 0
            ? Math.min(100, Math.round((modelCount / metaCount) * 100))
            : 0;

        const timeLabel = (() => {
            const h = Math.floor((Date.now() - data.lastModified) / 3600000);
            if (h < 1)  return 'just now';
            if (h < 24) return `${h}h ago`;
            return `${Math.floor(h / 24)}d ago`;
        })();

        return (
            <article
                className="gallery-card"
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.gallery-card__header-actions') ||
                        (e.target as HTMLElement).closest('.menu-button') ||
                        (e.target as HTMLElement).closest('.dropdown')) {
                        return;
                    }
                    selectProject();
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open project ${data.name}`}
            >
                {/* Header: dot + name + actions */}
                <div className="gallery-card__header">
                    <div className="gallery-card__name-row">
                        <span
                            className="gallery-card__dot"
                            style={{ background: color.dot }}
                        />
                        <span className="gallery-card__name" title={data.name}>
                            {data.name}
                        </span>
                    </div>
                    <div className="gallery-card__header-actions">
                        <button
                            className="gallery-card__action-btn"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(data); }}
                            title={data.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <i
                                className={`bi bi-star${data.isFavorite ? '-fill' : ''}`}
                                style={data.isFavorite ? { color: '#f59e0b' } : undefined}
                            />
                        </button>
                        <div className="menu-button">
                            <Menu>
                                <Item icon={<i className="bi bi-folder2-open" />} action={() => selectProject()}>Open</Item>
                                <Item icon={icon['download']} action={() => exportProject()}>Download</Item>
                                <Item icon={icon['tools']} action={() => selectProject(true)}>Repair & open</Item>
                                <Divisor />
                                <Item icon={icon['favorite']} action={() => toggleFavorite(data)}>{!data.isFavorite ? 'Add to favorites' : 'Remove from favorites'}</Item>
                                <Divisor />
                                <Item icon={icon['delete']} action={async () => await deleteProject()}>Delete</Item>
                            </Menu>
                        </div>
                    </div>
                </div>

                {/* Status + Rev */}
                <div className="gallery-card__status-row">
                    <span
                        className="gallery-card__status"
                        style={{ background: status.bg, color: status.text }}
                    >
                        {status.label}
                    </span>
                    <span className="gallery-card__rev">Rev {formatVersionNumber(data.version)}</span>
                </div>

                {/* Progress bar models/metamodels */}
                <div className="gallery-card__progress-wrap">
                    <div className="gallery-card__progress-labels">
                        <span>Models / Metamodels</span>
                        <span>{modelCount} / {metaCount}</span>
                    </div>
                    <div className="gallery-card__progress-track">
                        <div
                            className="gallery-card__progress-fill"
                            style={{ width: `${progressPct}%`, background: color.dot }}
                        />
                    </div>
                </div>

                {/* Footer: timestamp */}
                <div className="gallery-card__footer">
                    <span className="gallery-card__footer-time">
                        Modified {timeLabel}
                    </span>
                </div>
            </article>
        );
    }

    return(<>
        {props.mode === "gallery" ? (
            <ProjectGalleryCard />
        ) : props.mode === "cards" || props.mode === "compact" ? (
            <ProjectCard key={props.key} data={props.data} pnames={props.pnames} mode={props.mode} index={props.index} allTags={props.allTags} />
        ) : (
            <ProjectList key={props.key} data={props.data} pnames={props.pnames} allTags={props.allTags} animationIndex={props.animationIndex} isSelected={props.isSelected} onSelect={props.onSelect} />
        )}
    </>);
}

export {Project};
