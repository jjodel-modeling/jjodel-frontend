import jj from '../../../static/img/jj-k.png'; 

let icon: { [name: string]: any}  = {
    new: <i className="bi bi-plus-square"></i>,
    close: <i className="bi bi-dash-square"></i>,
    edit: <i className="bi bi-pencil-square"></i>,
    duplicate: <i className="bi bi-files"></i>,
    copy: <i className="bi bi-files"></i>,
    undo: <i className="bi bi-arrow-counterclockwise"></i>,
    redo: <i className="bi bi-arrow-clockwise"></i>, 
    save: <i className="bi bi-upload"></i>,
    
    
    import: <i className="bi bi-arrow-bar-left"></i>,
    export: <i className="bi bi-arrow-bar-right"></i>,
    download: <i className="bi bi-cloud-download"></i>,

    favorite: <i className="bi bi-star"></i>,
    share: <i className="bi bi-share"></i>,
    delete: <i className="bi bi-trash3"></i>,

    grid: <i className="bi bi-grid-3x3-gap"></i>,
    maximize: <i className="bi bi-arrows-fullscreen"></i>,
    'zoom-in': <i className="bi bi-zoom-in"></i>,
    'zoom-out': <i className="bi bi-zoom-out"></i>,
    help: <i className="bi bi-question-square"></i>,
    'whats-new': <i className="bi bi-clock"></i>,
    home: <i className="bi bi-house"></i>,
    'getting-started': <i className="bi bi-airplane"></i>,
    manual: <i className="bi bi-journals"></i>,
    legal: <i className="bi bi-mortarboard"></i>,
    about: <img src={jj} width={15}/>,
   'jjodel-dark': <img src={jj} width={15}/>,
   'jjodel-clear': <img style={{border: '1px solid var(--color)', borderRadius: '2px', marginRight: '11px'}} src={jj} width={15}/>,
    logout: <i className="bi bi-box-arrow-right"></i>,
    dashboard2: <i className="bi bi-grid"></i>,
    dashboard: <i className="bi bi-columns-gap"></i>,
    profile: <i className="bi bi-person-square"></i>,
    settings: <i className="bi bi-sliders"></i>,
    recent: <i className="bi bi-clock"></i>,
    folder: <i className="bi bi-folder"></i>,
    template: <i className="bi bi-code-square"></i>,
    template2: <i className="bi bi-lightbulb"></i>
    
};

export {icon};