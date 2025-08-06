import './icons.scss';

import jj from '../../../static/img/jj-k.png';
import { Tooltip } from '../../../components/forEndUser/Tooltip';
import { Logo, MetamodelIcon, ModelIcon } from '../../../components/logo';

import { LuPackage2 } from "react-icons/lu";
import { CgPlayButtonR, CgPlayPauseR, CgPlayTrackNextR, CgToolbarTop as Toolbar } from "react-icons/cg";

export let icon: { [name: string]: any} = {
    'new': <i className="bi bi-plus-circle-dotted"/>,
    close: <i className="bi bi-x-lg"/>,
    edit: <i className="bi bi-pencil-square"/>,
    duplicate: <i className="bi bi-files"/>,
    copy: <i className="bi bi-files"/>,
    undo: <i className="bi bi-arrow-counterclockwise"/>,
    redo: <i className="bi bi-arrow-clockwise"/>,
    save: <i className="bi bi-floppy"/>,
    loadl: <i className="bi bi-arrow-clockwise"/>,
    select: <i className="bi bi-check"/>,
    check: <i className="bi bi-check"/>,
    deselect: <i className="bi bi-check2"/>,
    add: <i className="bi bi-plus-circle-dotted"/>,
    validation: <i className="bi bi-check2-circle"/>,
    validate: <i className="bi bi-clipboard-check"/>,
    faq: <i className="bi bi-chat-left-dots"/>,
    'user-guide': <i className="bi bi-journal-text"/>,
    glossary: <i className="bi bi-book"/>,
    tools: <i className="bi bi-tools" />,

    'import': <i className="bi bi-cloud-upload"/>,
    'export': <i className="bi bi-arrow-bar-right"/>,
    download: <i className="bi bi-cloud-download"/>,

    favorite: <i className="bi bi-star"/>,
    favoriteFill: <i className="bi bi-star-fill"/>,
    share: <i className="bi bi-share"/>,
    delete: <i className="bi bi-trash3"/>,
    'delete-confirm': <i className="bi bi-question-square-fill confirm"/>,
    refresh: <i className="bi bi-arrow-clockwise"/>,
    up: <i className="bi bi-arrow-up"/>,
    down: <i className="bi bi-arrow-down"/>,
    lock: <i className="bi bi-lock"/>,
    unlock: <i className="bi bi-unlock"/>,
    view: <i className="bi bi-window-plus"/>,
    grid: <i className="bi bi-grid-3x3-gap"/>,
    maximize: <i className="bi bi-arrows-fullscreen"/>,
    fullscreen: <i className="bi bi-arrows-fullscreen"/>,
    pausecircle: <i className="bi bi-pause-circle"/>,
    playcircle: <i className="bi bi-play-circle"/>,
    stepcircle: <i className="bi bi-step-circle"/>,
    pausesquare: <CgPlayPauseR />,
    playsquare: <CgPlayButtonR />,
    stepsquare: <CgPlayTrackNextR />,
    eye: <i className="bi bi-eye" />,
    eyeslash: <i className="bi bi-eye-slash" />,
    'fullscreen-exit': <i className="bi bi-fullscreen-exit"/>,
    'zoom-in': <i className="bi bi-zoom-in"/>,
    'zoom-out': <i className="bi bi-zoom-out"/>,
    help: <i className="bi bi-question-square"/>,
    'whats-, Metamodel': <i className="bi bi-bell"/>,
    home: <i className="bi bi-house"/>,
    'getting-started': <i className="bi bi-airplane"/>,
    manual: <i className="bi bi-journals"/>,
    legal: <i className="bi bi-mortarboard"/>,
    about: <Logo style={{width: 15}} className={'menuitem'}/>,
    'jjodel-dark': <img src={jj} width={15} className={'menuitem'} alt={'jjodel logo'}/>,
    'jjodel-clear': <img
        style={{border: '1px solid var(--color)', borderRadius: '2px', marginTop: '2px', marginRight: '-2px'}} src={jj}
        width={16} className={'menuitem'} alt={'jjodel logo'}/>,

    jjodel: <Logo style={{fontSize: '1.5em'}} className={'menuitem'}/>,
    metamodel: <MetamodelIcon className={'menuitem'} style={{fontSize: '1.5em'}}/>,
    model: <ModelIcon className={'menuitem'} style={{fontSize: '1.5em'}}/>,
    project: <LuPackage2 style={{fontSize: '1.5em'}}/>,

    logout: <i className="bi bi-box-arrow-right"/>,
    dashboard2: <i className="bi bi-grid"/>,
    dashboard: <i className="bi bi-columns-gap"/>,
    profile: <i className="bi bi-person-square"/>,
    settings: <i className="bi bi-sliders"/>,
    recent: <i className="bi bi-clock-history"/>,
    folder: <i className="bi bi-folder"/>,
    template: <i className="bi bi-code-square"/>,
    template2: <i className="bi bi-lightbulb"/>,
    extend: <i className="bi bi-caret-up"/>,
    ai: <i className="bi bi-stars"/>,
    metrics: <i className="bi bi-graph-up"/>,
    analytics: <i className="bi bi-graph-up"/>,
    submenu: <i className="bi bi-chevron-right float-end"/>,
    contract: <i className="bi bi-arrows-angle-contract"/>,
    expand: <i className="bi bi-arrows-angle-expand"/>,
    alphabetical: <i className="bi bi-sort-alpha-down"/>,
    created: <i className="bi bi-calendar2-plus"/>,
    modified: <i className="bi bi-clock"/>,
    lastModified: <i className="bi bi-clock"/>,
    link: <i className="bi bi-link-45deg" style={{scale: '1.2'}}/>,
    learn: <i className="bi bi-infinity"/>,
    video: <i className="bi bi-youtube"/>,
    roadmap: <i className="bi bi-calendar3"/>,
    support: <i className="bi bi-life-preserver"/>,
    'report-bug': <i className="bi bi-bug"/>,
    'feature-request': <i className="bi bi-hand-index"/>,
    contact: <i className="bi bi-card-text"/>,
    'toggle-grid': <i className="bi bi-grid-1x2"/>,
    'toggle-snap': <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"
                        className="bi bi-layout-sidebar" viewBox="0 0 16 16">
        <path
            d="M6 1H1v14h5z m9 0h-5v5h5zm0 9v5M0 1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm9 0a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1zm1 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1z"/>
    </svg>,
    'reset-layout': <i className="bi bi-columns"/>,
    sidebar: <i className="bi bi-layout-sidebar"/>,
    toolbar2: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"
                   className="bi bi-layout-sidebar" viewBox="0 0 16 16">
        <path
            d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2z m2 -1 a1 1 0 0 0 -1 1v2h14v-2a1 1 0 0 0 -1 -1zm -1 4l 0 7a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1v-7z"/>
    </svg>
}

