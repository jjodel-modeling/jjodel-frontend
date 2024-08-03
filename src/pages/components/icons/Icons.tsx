import './icons.scss';

import jj from '../../../static/img/jj-k.png'; 

let icon: { [name: string]: any}  = {
    new: <i className="bi bi-plus-circle-dotted menuitem"></i>,
    close: <i className="bi bi-x-lg menuitem"></i>,
    edit: <i className="bi bi-pencil-square menuitem"></i>,
    duplicate: <i className="bi bi-files menuitem"></i>,
    copy: <i className="bi bi-files menuitem"></i>,
    undo: <i className="bi bi-arrow-counterclockwise menuitem"></i>,
    redo: <i className="bi bi-arrow-clockwise menuitem"></i>, 
    save: <i className="bi bi-upload menuitem"></i>,
    select: <i className="bi bi-check menuitem"></i>,
    deselect: <i className="bi bi-check2 menuitem"></i>,
    
    import: <i className="bi bi-arrow-bar-left menuitem"></i>,
    export: <i className="bi bi-arrow-bar-right menuitem"></i>,
    download: <i className="bi bi-cloud-download menuitem"></i>,

    favorite: <i className="bi bi-star menuitem"></i>,
    share: <i className="bi bi-share menuitem"></i>,
    delete: <i className="bi bi-trash3 menuitem"></i>,

    up: <i className="bi bi-arrow-up menuitem"></i>,
    down: <i className="bi bi-arrow-down menuitem"></i>,

    lock: <i className="bi bi-lock menuitem" style={{marginRight: '10px'}}></i>,
    unlock: <i className="bi bi-unlock menuitem" style={{marginRight: '10px'}}></i>,

    view: <i className="bi bi-file menuitem"></i>,


    grid: <i className="bi bi-grid-3x3-gap menuitem"></i>,
    maximize: <i className="bi bi-arrows-fullscreen menuitem"></i>,
    'zoom-in': <i className="bi bi-zoom-in menuitem"></i>,
    'zoom-out': <i className="bi bi-zoom-out menuitem"></i>,
    help: <i className="bi bi-question-square menuitem"></i>,
    'whats-new': <i className="bi bi-clock menuitem"></i>,
    home: <i className="bi bi-house menuitem"></i>,
    'getting-started': <i className="bi bi-airplane menuitem"></i>,
    manual: <i className="bi bi-journals menuitem"></i>,
    legal: <i className="bi bi-mortarboard menuitem"></i>,
    about: <img src={jj} width={15} className={'menuitem'}/>,
   'jjodel-dark': <img src={jj} width={15} className={'menuitem'}/>,
   'jjodel-clear': <img style={{border: '1px solid var(--color)', borderRadius: '2px', marginTop: '2px', marginRight: '-2px'}} src={jj} width={16} className={'menuitem'}/>,
    logout: <i className="bi bi-box-arrow-right menuitem"></i>,
    dashboard2: <i className="bi bi-grid menuitem"></i>,
    dashboard: <i className="bi bi-columns-gap menuitem"></i>,
    profile: <i className="bi bi-person-square menuitem"></i>,
    settings: <i className="bi bi-sliders menuitem"></i>,
    recent: <i className="bi bi-clock menuitem"></i>,
    folder: <i className="bi bi-folder menuitem"></i>,
    template: <i className="bi bi-code-square menuitem"></i>,
    template2: <i className="bi bi-lightbulb menuitem"></i>,
    extend: <i className="bi bi-caret-up menuitem" style={{paddingBottom: '2px'}}></i>,
    ai: <i className="bi bi-magic menuitem"></i>
    
};

export {icon};