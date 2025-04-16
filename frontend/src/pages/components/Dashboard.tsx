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

import '../dashboard.scss'
import {JSX, ReactElement, useRef} from "react";
import {Btn, CommandBar, Sep} from '../../components/commandbar/CommandBar';

import colors from '../../static/img/colors.png';
import useQuery from '../../hooks/useQuery';

import {
    TbSquareRoundedLetterM,
    TbSquareRoundedLetterMFilled,
    TbSquareRoundedLetterV,
    TbSquareRoundedLetterVFilled,
    TbSquareRoundedLetterE
} from "react-icons/tb";
import DockManager from '../../components/abstract/DockManager';
import Dock from "../../components/abstract/Dock";
import {CSS_Units} from "../../view/viewElement/view";
import {useStateIfMounted} from 'use-state-if-mounted';
import { Tooltip } from '../../components/forEndUser/Tooltip';
import { ProjectsApi } from '../../api/persistance';


type UserProps = {
    name: string;
    initials: string;
};

const User = (props: UserProps) => {
    return (<>
        <div className={'user'}>
            <div className={'initials'}>{props.initials}</div>
            <div className={'name'}><h2>{props.name}'s projects</h2></div>
        </div>
    </>);
};

type TitleProps = {
    projectID?: Pointer<DProject>;
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
                    <span className={"my-auto me-1"}>{props.type === "public" ? "public" : props.type === "private" ? "private" : "collaborative"}</span>
                    
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

        // <h2 onBlur={() => setEditTitle(!editTitle)} >

        // function setTitle(e: any) {
        //     if (title === '') {
        //         U.alert('e', 'Title cannot be empty', 'Please enter a title for the project.');
        //         e.target.focus();
        //         return;
        //     }
        //     setProjectModified();
        //     setEditTitle(!editTitle);
        // }

        // function setDescription(e: any) {

        //     if (description === '') {
        //         U.alert('e', 'Description cannot be empty', 'Please enter a description for the project.');
        //         e.target.focus();
        //         return;
        //     }
        //     setProjectModified();
        //     setEditDes(!editDes);
        // }

        // function setPrivacy(e: any) {
        //     setProjectModified();
        // }



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
    const user: LUser = LPointerTargetable.fromPointer(DUser.current);

    return (<>
        <Navbar />
        <div className={"dashboard-container"} tabIndex={-1}>
            <LeftBar active={active} projects={user?.projects}/>
            <div className={`dash-content user ${props.style && props.style}`}>
                <div>
                    <>
                        {active === "All" && <Title active={active} title={'Dashboard'} icon={<i className="bi bi-columns-gap"></i>} />}
                        {active === "Recent" && <Title  active={active} title={'Recent'} icon={<i className="bi bi-clock"></i>} />}
                        {active === "Templates" && <Title  active={active} title={'Templates'} icon={<i className="bi bi-lightbulb"></i>} />}
                        {active === "Notes" && <Title  active={active} title={'Project Notes'} icon={<i className="bi bi-pencil-square"></i>} />}
                        {active === "Updates" && <Title  active={active} title={'What\'s new'} icon={<i className="bi bi-clock-history"></i>} />}
                        {active === "Profile" && <Title  active={active} title={'Profile'} icon={<i className="bi bi-clock-history"></i>} />}
                    </>
                </div>
                <Catalog children={children}/>
            </div>
        </div>
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
                <img src={colors} width={220} style={{paddingBottom: '10px'}}/>

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

    return (<>
        <ProjectInfoCard project={project} key={'info'} />
        <div className={'row project-list'} key={'list'}>
            <div className='row header' key={'header'}>
                <div className={'col-4 '}>Name</div>
                <div className={'col-2 artifact-type'}>Type</div>
                <div className={'col-1'}>Operation</div>
            </div>

            {project.metamodels.map((mm) =>{
                let name = mm.name
                return (
                <div className="row data" key={mm.id}>
                    <div className={'col-4 '} onClick={async () => await DockManager.open2(mm)}>
                        <TbSquareRoundedLetterMFilled style={{fontSize: '1.5em'}}/> {name}</div>
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
                        <TbSquareRoundedLetterM style={{fontSize: '1.5em'}}/> {name}</div>
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
                        <div className={'col-4'}>{vp.isOverlay ?
                            <TbSquareRoundedLetterVFilled style={{fontSize: '1.5em'}}/> :
                            <TbSquareRoundedLetterV style={{fontSize: '1.5em'}}/>} {name}</div>
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
                        <TbSquareRoundedLetterMFilled style={{fontSize: '1.3em'}}/> Metamodels
                    </div>
                    <div className={'col'}>
                        <TbSquareRoundedLetterM style={{fontSize: '1.3em'}}/> Models
                    </div>
                    <div className={'col'}>
                        <TbSquareRoundedLetterVFilled style={{fontSize: '1.3em'}}/> Viewpoints
                    </div>
                    <div className={'col'}>
                        <TbSquareRoundedLetterV style={{fontSize: '1.3em'}}/> Overlay Viewpoints
                    </div>
                    <div className={'col disabled'}>
                        <TbSquareRoundedLetterE className={'disabled'} style={{fontSize: '1.3em'}}/> Epsilon Transformations
                    </div>
                </div>
            </div>
        </div>
    </>)}


function ProjectDashboard(props: DashProps): any {

    const {children, active} = props;
    const user: LUser = LPointerTargetable.fromPointer(DUser.current);
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
        <Navbar />
        <Try><Dock /></Try>
    </>);
}

function Dashboard(props: DashProps): any {

    return props.active === 'Project' ?
            <ProjectDashboard {...props} className={(props.className||'') + ' bg'} /> :
            <GenericDashboard {...props} />
}

export {Dashboard, ProjectCatalog, Title};



