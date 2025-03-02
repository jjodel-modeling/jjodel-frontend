import './icons.scss';

import jj from '../../../static/img/jj-k.png';
import { Tooltip } from '../../../components/forEndUser/Tooltip';
import { Logo, MetamodelIcon, ModelIcon } from '../../../components/logo';

import { LuPackage2 } from "react-icons/lu";
import { CgToolbarTop as Toolbar } from "react-icons/cg";

export let icon: { [name: string]: any} = {
    'new': <i className="bi bi-plus-circle-dotted menuitem"></i>,
    close: <i className="bi bi-x-lg menuitem"></i>,
    edit: <i className="bi bi-pencil-square menuitem"></i>,
    duplicate: <i className="bi bi-files menuitem"></i>,
    copy: <i className="bi bi-files menuitem"></i>,
    undo: <i className="bi bi-arrow-counterclockwise menuitem"></i>,
    redo: <i className="bi bi-arrow-clockwise menuitem"></i>,
    save: <i className="bi bi-floppy menuitem"></i>,
    select: <i className="bi bi-check menuitem"></i>,
    deselect: <i className="bi bi-check2 menuitem"></i>,
    add: <i className="bi bi-plus-circle-dotted menuitem"></i>,
    validation: <i className="bi bi-check2-circle menuitem"></i>,
    validate: <i className="bi bi-clipboard-check menuitem"></i>,
    faq: <i className="bi bi-chat-left-dots menuitem"></i>,
    'user-guide': <i className="bi bi-journal-text menuitem"></i>,
    glossary: <i className="bi bi-book menuitem"></i>,

    'import': <i className="bi bi-cloud-upload menuitem"></i>,
    'export': <i className="bi bi-arrow-bar-right menuitem"></i>,
    download: <i className="bi bi-cloud-download menuitem"></i>,

    favorite: <i className="bi bi-star menuitem"></i>,
    favoriteFill: <i className="bi bi-star-fill menuitem"></i>,
    share: <i className="bi bi-share menuitem"></i>,
    delete: <i className="bi bi-trash3 menuitem"></i>,
    'delete-confirm': <i className="bi bi-question-square-fill menuitem confirm"></i>,
    refresh: <i className="bi bi-arrow-clockwise menuitem"></i>,
    up: <i className="bi bi-arrow-up menuitem"></i>,
    down: <i className="bi bi-arrow-down menuitem"></i>,
    lock: <i className="bi bi-lock menuitem" style={{marginRight: '10px'}}></i>,
    unlock: <i className="bi bi-unlock menuitem" style={{marginRight: '10px'}}></i>,
    view: <i className="bi bi-window-plus menuitem"></i>,
    grid: <i className="bi bi-grid-3x3-gap menuitem"></i>,
    maximize: <i className="bi bi-arrows-fullscreen menuitem"></i>,
    fullscreen: <i className="bi bi-arrows-fullscreen menuitem"></i>,
    'fullscreen-exit': <i className="bi bi-fullscreen-exit"></i>,
    'zoom-in': <i className="bi bi-zoom-in menuitem"></i>,
    'zoom-out': <i className="bi bi-zoom-out menuitem"></i>,
    help: <i className="bi bi-question-square menuitem"></i>,
    'whats-, Metamodel': <i className="bi bi-bell menuitem"></i>,
    home: <i className="bi bi-house menuitem"></i>,
    'getting-started': <i className="bi bi-airplane menuitem"></i>,
    manual: <i className="bi bi-journals menuitem"></i>,
    legal: <i className="bi bi-mortarboard menuitem"></i>,
    about: <Logo style={{width: 15}} className={'menuitem'}/>,
    'jjodel-dark': <img src={jj} width={15} className={'menuitem'}/>,
    'jjodel-clear': <img
        style={{border: '1px solid var(--color)', borderRadius: '2px', marginTop: '2px', marginRight: '-2px'}} src={jj}
        width={16} className={'menuitem'}/>,

    jjodel: <Logo style={{fontSize: '1.5em'}} className={'menuitem'}/>,
    metamodel: <MetamodelIcon className={'menuitem'} style={{fontSize: '1.5em'}}/>,
    model: <ModelIcon className={'menuitem'} style={{fontSize: '1.5em'}}/>,
    project: <LuPackage2 style={{fontSize: '1.5em'}} className='menuitem'/>,

    logout: <i className="bi bi-box-arrow-right menuitem"></i>,
    dashboard2: <i className="bi bi-grid menuitem"></i>,
    dashboard: <i className="bi bi-columns-gap menuitem"></i>,
    profile: <i className="bi bi-person-square menuitem"></i>,
    settings: <i className="bi bi-sliders menuitem"></i>,
    recent: <i className="bi bi-clock-history menuitem"></i>,
    folder: <i className="bi bi-folder menuitem"></i>,
    template: <i className="bi bi-code-square menuitem"></i>,
    template2: <i className="bi bi-lightbulb menuitem"></i>,
    extend: <i className="bi bi-caret-up menuitem" style={{paddingBottom: '2px'}}></i>,
    ai: <i className="bi bi-stars"></i>,
    metrics: <i className="bi bi-graph-up" style={{marginRight: '10px'}}></i>,
    analytics: <i className="bi bi-graph-up menuitem"></i>,
    submenu: <i className="bi bi-chevron-right menuitem float-end"></i>,
    contract: <i className="bi bi-arrows-angle-contract"></i>,
    expand: <i className="bi bi-arrows-angle-expand"></i>,
    alphabetical: <i className="bi bi-sort-alpha-down"></i>,
    created: <i className="bi bi-calendar2-plus"></i>,
    modified: <i className="bi bi-clock"></i>,
    lastModified: <i className="bi bi-clock"></i>,
    link: <i style={{scale: '1.2'}}
             className="bi bi-link-45deg menuitem"></i>,
    learn: <i className="bi bi-infinity menuitem"></i>,
    video: <i className="bi bi-youtube menuitem"></i>,
    roadmap: <i className="bi bi-calendar3 menuitem"></i>,
    support: <i className="bi bi-life-preserver menuitem"></i>,
    'report-bug': <i className="bi bi-bug menuitem"></i>,
    'feature-request': <i className="bi bi-hand-index menuitem"></i>,
    contact: <i className="bi bi-card-text menuitem"></i>,
    'toggle-grid': <i className="bi bi-grid-1x2 menuitem"></i>,
    'toggle-snap': <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"
                        className="bi bi-layout-sidebar" viewBox="0 0 16 16">
        <path
            d="M6 1H1v14h5z m9 0h-5v5h5zm0 9v5M0 1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm9 0a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1zm1 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1z"/>
    </svg>,
    'reset-layout': <i className="bi bi-columns menuitem"></i>,
    sidebar: <i className="bi bi-layout-sidebar menuitem"></i>,
    toolbar2: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"
                   className="bi bi-layout-sidebar" viewBox="0 0 16 16">
        <path
            d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2z m2 -1 a1 1 0 0 0 -1 1v2h14v-2a1 1 0 0 0 -1 -1zm -1 4l 0 7a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1v-7z"/>
    </svg>
}

