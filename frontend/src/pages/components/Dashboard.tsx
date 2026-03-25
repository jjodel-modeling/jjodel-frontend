import {
    Dictionary, DProject,
    DState,
    DUser,
    DViewElement,
    Input,
    LPointerTargetable,
    LProject,
    LUser,
    LViewElement,
    LViewPoint,
    Pointer,
    SetFieldAction,
    SetRootFieldAction,
    U,
    Try, TRANSACTION, L
} from '../../joiner';
import {LeftBar, Navbar} from './';
import { RightPanel } from './RightPanel';
import { Badge } from '../../components/common/Badge';

import '../dashboard.scss'
import React, {JSX, ReactElement, useEffect, useRef, useState} from "react";
import {Btn, CommandBar, Sep} from '../../components/commandbar/CommandBar';

import colors000 from '../../static/img/colors-000.png';
import colors100 from '../../static/img/colors-100.png';
import colors101 from '../../static/img/colors-101.png';
import colors110 from '../../static/img/colors-110.png';
import colors111 from '../../static/img/colors-111.png';

import useQuery from '../../hooks/useQuery';

import { ElementBadge } from '../../components/common/ElementBadge';
import DockManager from '../../components/abstract/DockManager';
import Dock from "../../components/abstract/Dock";
import {CSS_Units} from "../../view/viewElement/view";
import {useStateIfMounted} from 'use-state-if-mounted';
import { Tooltip } from '../../components/forEndUser/Tooltip';
import { ProjectsApi } from '../../api/persistance';
import {Cards} from "./cards/Cards";
import {createM2} from "./Navbar";
import StatusBar from "../../components/StatusBar";


type UserProps = {
    name: string;
    initials: string;
};

const User = (props: UserProps) => {
    return (<>
        <div className={'user'}>
            <div className={'initials'}>
                <div>{props.initials}</div>
            </div>
            <div className={'name'}><h2>{props.name}'s projects</h2></div>
        </div>
    </>);
};

type TitleProps = {
    projectID?: Pointer<DProject>;
    version?: string;
    active: string;
    title: string;
    icon: ReactElement;
    description?: string;
    type?: 'private'|'public'|'collaborative';
}


const Title = (props: TitleProps) => {

    let [title, setTitle] = useStateIfMounted(props.title);
    let [description, setDescription] = useStateIfMounted(props.description);


    const [editTitle, setEditTitle] = useStateIfMounted(false);
    const [editDes, setEditDes] = useStateIfMounted(false);
    //if (!editTitle && title !== props.title) setTitle(props.title);
    //if (!editDes && description !== props.description) setDescription(props.description);

    const titleRef = useRef<HTMLElement>(null);
    const desRef = useRef<HTMLElement>(null);

    const ProjectProperties = () => {

        const server = 'http://app.jjodel.io';
        const projectLink = '/#/project?id='+props.projectID;

        function copyToClipboard(e: any) {
            //const server = document.getElementById('server');
            //const link = document.getElementById('link');
            let full_link = server + projectLink;
            console.log('copy to clipboard');
            U.clipboardCopy(full_link, ()=>U.alert('i', "Copied", "The project link has been copied to the Clipboard."));
        }

        let type = (props.type === "public");
            return (<><label className='text-end nav-commands d-flex' 
                        style={{float: `${props.type === 'public' ? 'left': 'none'}`}}>
                {props.type && <>
                    <Badge category="state" className="my-auto me-1">{props.type === "public" ? "Public" : props.type === "private" ? "Private" : "Collaborative"}</Badge>
                    
                    {props.type !== "collaborative" && 
                        <Input type="toggle"
                            className={"my-auto"}
                            style={{fontSize:'1.25em'}}
                            setter={(v) => {
                                if (!props.projectID) return;
                                let project: LProject = L.fromPointer(props.projectID);
                                project.type = v ? "public" : "private";
                                if (v) U.alert('i', "The project "+title+" is public", "It can be accessed only by those who have the public link.");
                            }}
                            getter={() => type}
                        />    
                    }
                </>
                }
            </label>
            {props.type === "public" &&
                <Tooltip tooltip={'Copy to Clipboard'} inline={true} position={'top'} offsetY={10}>
                    <span onClick={(e) => copyToClipboard(e)}className={'project-link'}>
                        <span id={'server'}>{server}</span><span id={'link'}>{projectLink}</span>
                    </span>
                </Tooltip>
            }
            </>
            );
        };

        



    return (<>
        <div className={'title'}>
            {props.active === 'Project' ?
                <div className={'project-list'}> {/* name */}
                    {editTitle ?
                        <h2>
                            <div>
                                {props.icon}
                                <input
                                    autoFocus
                                    type={'text'}
                                    value={title}
                                    onChange={(e)=>setTitle(e.target.value)}
                                    style={{padding: '0px', margin: '0'}}
                                    onBlur={(e) => {
                                        if (!props.projectID) return;
                                        if (!e.target.value) {
                                            U.alert('e', 'A Project Name is required.', 'Please provide a name to identify and organize your project effectively.');
                                            e.target.focus();
                                            return;
                                        }
                                        let project: LProject = L.fromPointer(props.projectID);
                                        project.name = e.target.value;
                                        setEditTitle(false);
                                    }}
                                />
                            </div>
                        </h2> :
                        <>
                            <Tooltip tooltip={'DoubleClick to edit'} inline={true} position={'left'} offsetX={10}>
                                <h2 onDoubleClick={() => {setEditTitle(true)}}>
                                {props.icon} {props.title}
                            </h2></Tooltip>
                        </>
                    }
                    <h6><ProjectProperties/></h6>
                    
                    {editDes ? 
                        <h3>
                            <textarea
                                autoFocus
                                rows={4}
                                cols={80}
                                value={description}
                                onChange={(e)=> {
                                    console.log('onchange', {e, tv:e.target.value, pv:props.description, sv:description})
                                    setDescription(e.target.value)
                                }}
                                onInput={(e)=> {
                                    console.log('onInput', {e, tv:e.target, pv:props.description, sv:description})
                                }}
                                onBlur={e => {
                                    if (!props.projectID) return;
                                    if (!e.target.value) {
                                        e.target.focus();
                                        U.alert('e', 'A Project Description is required.', 'Adding a description helps provide clarity and context for your project.');
                                        return;}
                                    let project: LProject = L.fromPointer(props.projectID);
                                    project.description = e.target.value;
                                    setEditDes(false);
                                }}
                            />
                        </h3>
                        :
                        <>
                            {props.description && <Tooltip tooltip={'DoubleClick to edit'} inline={true} position={'left'} offsetX={10}>
                                <h3 onDoubleClick={() => setEditDes(!editDes)}>{props.description}</h3>
                            </Tooltip>}
                        </>
                    }
                    
                </div>
                :
                <div className={'header'}>
                    <h2>{props.icon} {props.title}</h2>
                    {props.description && <h3>{props.description}</h3>}
                </div>
            }
            
        </div>
    </>);
};


export type DashProps = {
    children?: JSX.Element,
    className?: string;
    // NB: account and profile are both used, i don't know which to keep
    active: 'Account'|'Profile'|'Settings'|'Updates'|'Community'|'All'|'Archive'|'Templates'|'Recent' | 'Notes' | 'Project' | 'UsersInfo' | 'ProjectsInfo' | 'News';
    version?: Partial<DState["version"]>;
    project?: LProject;
    projects?:LProject[];
    style?: any;
    onNewProject?: () => void;
};


type CatalogProps = {
    children: any;
}

const Catalog = (props: CatalogProps) => {

    return props.children;
};

type ProjectDashboardProps = {
    children?: JSX.Element,
    // NB: account and profile are both used, i don't know which to keep
    active: 'Account'|'Profile'|'Settings'|'Updates'|'Community'|'All'|'Archive'|'Templates'|'Recent' | 'Notes' | 'Project';
    version: Partial<DState["version"]>;
    project?: LProject;
}

function GenericDashboard(props: DashProps): any {
    const {children, active} = props;
    const user: LUser = LUser.getUser();
    const [isDragging, setIsDragging] = useState(false);

    // Dashboard is not a rc-dock tab, so Dock's handleLayoutChange never fires.
    // Dispatch 'summary' so panels hide correctly.
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('jjodel:editor-type-change', {
            detail: { editorType: 'summary' }
        }));
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const items = e.dataTransfer.items;
        if (items.length > 0) {
            const item = items[0];
            if (item.kind === 'file') {
                setIsDragging(true);
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        // Only set to false if leaving the container (not entering a child)
        if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.jjodel')) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const content = String(event.target?.result);
                try {
                    await ProjectsApi.importFromText(content);
                    U.alert('i', 'Project imported', `"${file.name}" has been imported successfully.`);
                } catch (err) {
                    U.alert('e', 'Import failed', 'The file could not be imported. Please check the file format.');
                }
            };
            reader.readAsText(file);
        } else if (file) {
            U.alert('w', 'Invalid file type', 'Please drop a .jjodel file to import a project.');
        }
    };

    // Determine layout mode: three-column for dashboard pages, two-column for project editing
    const layoutClass = active !== 'Project' ? 'three-column' : 'two-column';

    return (<>
        <Navbar />
        <div
            className={`dashboard-container ${layoutClass} ${isDragging ? 'is-dragging' : ''}`}
            tabIndex={-1}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <LeftBar active={active} projects={user?.projects}/>
            <div className={`dash-content ${active === 'All' ? 'projects-view' : 'user'} ${props.style && props.style}`}>
                {/* Title for non-All views only - All view title is in AllProjects.tsx CTA row */}
                {active !== "All" && (
                    <div>
                        {active === "Recent" && <Title  active={active} title={'Recent'} icon={<i className="bi bi-clock"></i>} />}
                        {active === "Templates" && <Title  active={active} title={'Templates'} icon={<i className="bi bi-lightbulb"></i>} />}
                        {active === "Notes" && <Title  active={active} title={'Project Notes'} icon={<i className="bi bi-pencil-square"></i>} />}
                        {active === "Updates" && <Title  active={active} title={'What\'s new'} icon={<i className="bi bi-clock-history"></i>} />}
                        {active === "Profile" && <Title  active={active} title={'Profile'} icon={<i className="bi bi-clock-history"></i>} />}
                    </div>
                )}
                <Catalog children={children}/>
            </div>

            {/* Right Panel - Only visible on dashboard pages (three-column layout) */}
            {active !== 'Project' && (
                <RightPanel user={user} projects={user?.projects} onNewProject={props.onNewProject} />
            )}

            {/* Drop Overlay */}
            {isDragging && (
                <div className="drop-overlay">
                    <div className="drop-zone">
                        <i className="bi bi-cloud-arrow-up" />
                        <p>Drop .jjodel file to import</p>
                    </div>
                </div>
            )}
        </div>
        <StatusBar />
    </>);
}

type ProjectProps = {
    project: LProject;
}

const ProjectInfoCard = (props: ProjectProps) => {

    const {project} = props;

    /* to be refined */

    return (
        <div className={'details'}>
            <>
                <h5>{project.name ? project.name : 'Unnamed Project'}</h5>
                {project.description && <p>{project.description}</p>}
                {project.metamodels.length === 0 && <img src={colors000} width={220} style={{paddingBottom: '10px'}}/>}
                {project.metamodels.length > 0 && project.models.length === 0 && project.viewpoints.length <= 2 && <img src={colors100} width={220} style={{paddingBottom: '10px'}}/>}
                {project.metamodels.length > 0 && project.models.length === 0 && project.viewpoints.length > 2 && <img src={colors101} width={220} style={{paddingBottom: '10px'}}/>}
                {project.metamodels.length > 0 && project.models.length > 0 && project.viewpoints.length <= 2 && <img src={colors110} width={220} style={{paddingBottom: '10px'}}/>}
                {project.metamodels.length > 0 && project.models.length > 0 && project.viewpoints.length > 2 && <img src={colors111} width={220} style={{paddingBottom: '10px'}}/>}




                {project.metamodels.length === 0 ?
                    <p>This project does not contain any metamodel and consequently no models yet; it only contains the default viewpoints.</p>
                    :
                    <p>
                    {project.metamodels.length === 1 && <>In this project, <b>one metamodel</b> is defined</>}
                    {project.metamodels.length > 1 && <>In this project, <b>{project.metamodels.length} metamodels</b> are defined </>}
                    {project.models.length === 0  ?
                        <> and does not contain any model (it only includes the default viewpoints).</>
                        :
                        <>
                        {project.models.length === 1  && <>, from which <b>one model</b> is instantiated. </>}
                        {project.models.length > 1  && <>, from which <b>{project.models.length}</b> models are instantiated. </>}

                        <>These models are explored and analyzed through <b>{project.viewpoints.length} viewpoints</b> (including the default ones), each offering a distinct perspective on different system concerns. </>
                        </>
                    }


                    </p>
                }
            </>
        </div>
    );
}

/* Project Details / Project Summary */

function ProjectCatalog(props: ProjectProps) {

    const {project} = props;

    let metamodels = project.metamodels;
    let hasmm = !!metamodels.length;
    return (<>
        <ProjectInfoCard project={project} key={'info'} />
        <div className={'row project-list'} key={'list'}>
            <div className='row header' key={'header'}>
                <div className={'col-4 '}>Name</div>
                <div className={'col-2 artifact-type'}>Type</div>
                <div className={'col-1'}>Operation</div>
            </div>

            {metamodels.map((mm) =>{
                let name = mm.name
                return (
                <div className="row data" key={mm.id}>
                    <div className={'col-4 '} onClick={async () => {
                        await DockManager.open2(mm);
                    }}>
                        <ElementBadge type="metamodel" /> {name}</div>
                    <div className={'col-2 artifact-type'}>Metamodel</div>
                    <div className={'buttons'}>
                        <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                            <Btn icon={'open'} action={async () => await DockManager.open2(mm)}
                                 tip={'Open metamodel'}/>
                            <Btn icon={'minispace'}/>
                            <Btn icon={'copy'} action={e => {
                            }} tip={'Duplicate metamodel'}/>
                            <Sep/>
                            <Btn icon={'delete'} action={e => mm.delete()} tip={`Delete model "${name}"`}/>
                        </CommandBar>
                    </div>
                </div>)
            })
            }
            {project.models.map(model => {
                let name = model.name;
                return (
                <div className="row data" key={model.id}>
                    <div className={'col-4 '} onClick={async () => await DockManager.open2(model)}>
                        <ElementBadge type="model" /> {name}</div>
                    <div className={'col-2 artifact-type'}>Model</div>
                    <div className={'buttons'}>
                        <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                            <Btn icon={'open'} action={async () => await DockManager.open2(model)}
                                 tip={'Open model'}/>
                            <Btn icon={'minispace'}/>
                            <Btn icon={'copy'} action={e => {
                            }} tip={'Duplicate model'}/>
                            <Sep/>
                            <Btn icon={'delete'} action={e => model.delete()} tip={`Delete model "${name}"`}/>
                        </CommandBar>
                    </div>
                </div>)
            })
            }
            {project.viewpoints.map(vp => {
                let name = vp?.name;
                return (!vp ? <div key={name||'error_'+vp}>errorvp: {vp + ''}</div> :
                    <div className="row data viewpoint" key={name}>
                        <div className={'col-4'}><ElementBadge type="viewpoint" /> {name}</div>
                        <div className={'col-2 artifact-type'}>Viewpoint</div>
                        <div className={'buttons'}>
                            <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                                <Btn icon={'open'} tip={'Open viewpoint'} disabled={true}/>
                                <Btn icon={'minispace'}/>
                                <Btn icon={'copy'} action={e => vp.duplicate()} tip={'Duplicate viewpoint'}/>
                                <Sep/>
                                <Btn icon={'delete'} action={e => vp.delete()} tip={'Delete viewpoint'}
                                     disabled={name === 'Default' || name === 'Validation default'}/>
                            </CommandBar>
                        </div>
                    </div>)
            })
            }
            <div className={'legenda'} key={'legenda'}>
                <h1>Legenda</h1>
                <div className={'row'}>
                    <div className={'col'}>
                        <ElementBadge type="metamodel" /> Metamodels
                    </div>
                    <div className={'col'}>
                        <ElementBadge type="model" /> Models
                    </div>
                    <div className={'col'}>
                        <ElementBadge type="viewpoint" /> Viewpoints
                    </div>
                    <div className={'col'}>
                        <ElementBadge type="viewpoint" /> Overlay Viewpoints
                    </div>
                    <div className={'col disabled'}>
                        <ElementBadge type="epsilon" className="disabled" /> Epsilon Transformations
                    </div>
                </div>
            </div>
            <div className={'cards-in-project'} style={{width: '1150px', display: 'flex', justifyContent: 'space-between', paddingLeft: 0}}>
                <Cards className={'project-create-cards'} style={{
                        flexWrap: 'wrap',
                        marginLeft: '0px',
                        marginRight: '26px'
                        }
                }>
                    <Cards.Item
                        title={hasmm ? 'Create another metamodel ?' : 'Your first metamodel ?'}
                        subtitle={'Explore multi-view modeling.'}
                        icon={'add'}
                        style={'azure my-3'}
                        action={() => createM2(project) }
                    />
                    {hasmm ? <Cards.Item
                        title={'Create a model ?'}
                        subtitle={'Pick a metamodel schema.'}
                        icon={'add'}
                        style={'dark-blue my-3'}
                        action={() => {
                            let html = document.getElementById('navbar_mmid_'+metamodels[0]?.id) || document.getElementById('navbar_new_model');
                            console.log('create m1 dash', {html, query: "document.getElementById('navbar_mmid_"+metamodels[0]?.id+"')"})
                            // nb: timeout because click interferes with .focus() undoing it.
                            setTimeout(()=>U.ancestorArray(html).reverse().forEach(e=>e.focus?.()), 0);
                        }}/> : null
                    }
                    <Cards.Item icon={'question'} style={'red-orange my-3'} title={'Ehy!'} subtitle={'What do you want to do today?'}/>
                </Cards>
            </div>
        </div>
    </>)}


function ProjectDashboard(props: DashProps): any {
    const query = useQuery();
    const id = query.get('id') || '';
    const project: LProject = LProject.fromPointer(id);

    let vparr = project?.viewpoints || [];
    let allViews = vparr.flatMap((vp: LViewPoint) => vp && vp.allSubViews);
    allViews.push(...vparr as LViewElement[]);
    allViews = allViews.filter(v => v);
    const viewsDeDuplicator: Dictionary<Pointer<DViewElement>, LViewElement> = {};
    for (let v of allViews) viewsDeDuplicator[v.id] = v;

    return (<>
        <Try>
            <>
                <style id={"views-css-injector-d"}>
                    {Object.values(viewsDeDuplicator).map(v => v.compiled_css).join('\n\n')}
                </style>
                {CSS_Units.jsx}
            </>
        </Try>
        <Try><Navbar /></Try>
        <Try><Dock /></Try>
        <Try><StatusBar /></Try>
    </>);
}

function Dashboard(props: DashProps): any {

    return props.active === 'Project' ?
            <ProjectDashboard {...props} className={(props.className||'') + ' bg'} /> :
            <GenericDashboard {...props} />
}

export {Dashboard, ProjectCatalog, Title};



