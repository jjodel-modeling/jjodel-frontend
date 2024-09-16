import {
    Dictionary, DProject,
    DState,
    DUser,
    DViewElement,
    LPointerTargetable,
    LProject,
    LUser,
    LViewElement,
    LViewPoint,
    Pointer, SetFieldAction,
    Try
} from '../../joiner';
import {LeftBar, Navbar} from './';

import '../dashboard.scss'
import {ReactElement, useRef} from "react";
import {Btn, CommandBar, Sep} from '../../components/commandbar/CommandBar';

import colors from '../../static/img/colors.png';
import useQuery from '../../hooks/useQuery';

import {
    TbSquareRoundedLetterM,
    TbSquareRoundedLetterMFilled,
    TbSquareRoundedLetterV,
    TbSquareRoundedLetterVFilled
} from "react-icons/tb";
import DockManager from '../../components/abstract/DockManager';
import Dock from "../../components/abstract/Dock";
import {CSS_Units} from "../../view/viewElement/view";
import {useStateIfMounted} from 'use-state-if-mounted';


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
}

const Title = (props: TitleProps) => {

    let {title, description} = props;

    const [editTitle, setEditTitle] = useStateIfMounted(false);
    const [editDes, setEditDes] = useStateIfMounted(false);

    const titleRef = useRef();
    const desRef = useRef();

    return (<>
        <div className={'title'}>
            {props.active === 'Project' ?
                <div className={'name project-list'}>
                    {editTitle ?
                        <h2 onBlur={() => setEditTitle(!editTitle)} >
                            <div>
                                {props.icon}
                                <input
                                    autoFocus
                                    type={'text'}
                                    value={title}
                                    style={{padding: '0px', margin: '0'}}
                                    onChange={e => {
                                        if(!props.projectID) return;
                                        SetFieldAction.new(props.projectID, 'name', e.target.value, '', false)
                                    }}
                                />
                            </div>
                        </h2> :
                        <>
                        <h2 onDoubleClick={() => {setEditTitle(!editTitle)}}>
                            {props.icon} {props.title}
                        </h2>
                         </>
                    }
                    {editDes ?
                        <>
                            {props.description &&
                                <h3 onDoubleClick={() => setEditDes(!editDes)} onBlur={() => setEditDes(!editDes)}>
                                    <textarea
                                        autoFocus
                                        rows={4}
                                        cols={60}
                                        value={props.description}
                                        onChange={e => {
                                            if(!props.projectID) return;
                                            SetFieldAction.new(props.projectID, 'description', e.target.value, '', false)
                                        }}
                                    />
                                </h3>}

                        </>
                        :
                        <>
                            {props.description && <h3 onDoubleClick={() => setEditDes(!editDes)} onBlur={() => setEditDes(!editDes)}>{props.description}</h3>}
                        </>
                    }

                </div>
                :
                <div className={'name'}>
                    <h2>{props.icon} {props.title}</h2>
                    {props.description && <h3>{props.description}</h3>}
                </div>
            }
        </div>
    </>);
};


export type DashProps = {
    children?: JSX.Element,
    // NB: account and profile are both used, i don't know which to keep
    active: 'Account'|'Profile'|'Settings'|'Updates'|'Community'|'All'|'Archive'|'Templates'|'Recent' | 'Notes' | 'Project';
    version?: Partial<DState["version"]>;
    project?: LProject;
    projects?:LProject[];
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
            <div className={'user'}>
                <div className={'name'}>
                    <>
                        {active === "All" && <Title active={active} title={'Dashboard'} icon={<i className="bi bi-columns-gap"></i>} />}
                        {active === "Recent" && <Title  active={active} title={'Recent'} icon={<i className="bi bi-clock"></i>} />}
                        {active === "Templates" && <Title  active={active} title={'Templates'} icon={<i className="bi bi-lightbulb"></i>} />}
                        {active === "Notes" && <Title  active={active} title={'Project Notes'} icon={<i className="bi bi-pencil-square"></i>} />}
                        {active === "Updates" && <Title  active={active} title={'What\'s new'} icon={<i className="bi bi-clock-history"></i>} />}
                        {active === "Profile" && <Title  active={active} title={'Profile'} icon={<i className="bi bi-clock-history"></i>} />}
                    </>
                    <Catalog children={children}/>
                </div>
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
                    <h5>{project.name}</h5>
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


function ProjectCatalog(props: ProjectProps) {

    const {project} = props;

    return (<>
        <ProjectInfoCard project={project}/>
            <div className={'row project-list'}  >
                <div className='row header' >

                    <div className={'col-4 '}>Name</div>
                    <div className={'col-2 artifact-type'}>Type</div>
                    <div className={'col-1'}>Operation</div>
                </div>

                {project.metamodels.map(mm =>
                    <div className="row data">
                        <div className={'col-4 '} onClick={async() => await DockManager.open2(mm)}><TbSquareRoundedLetterMFilled style={{fontSize: '1.5em'}}/> {mm.name}</div>
                        <div className={'col-2 artifact-type'}>Metamodel</div>
                        <div className={'col-1'}>
                            <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                                <Btn icon={'open'} action={async() => await DockManager.open2(mm)} tip={'Open metamodel'}/>
                                <Btn icon={'minispace'} />
                                <Btn icon={'copy'} action={e => {}} tip={'Duplicate metamodel'}/>
                                <Sep />
                                <Btn icon={'delete'} action={e => mm.delete()} tip={`Delete model "${mm.name}"`}/>
                            </CommandBar>
                        </div>
                    </div>)
                }
                {project.models.map(model =>
                    <div className="row data">
                        <div className={'col-4 '} key={model.id} onClick={async() => await DockManager.open2(model)} ><TbSquareRoundedLetterM style={{fontSize: '1.5em'}}/> {model.name}</div>
                        <div className={'col-2 artifact-type'}>Model</div>
                        <div className={'col-1'}>
                            <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                                <Btn icon={'open'} action={async() => await DockManager.open2(model)} tip={'Open model'}/>
                                <Btn icon={'minispace'} />
                                <Btn icon={'copy'} action={e => {}} tip={'Duplicate model'}/>
                                <Sep />
                                <Btn icon={'delete'} action={e => model.delete()} tip={`Delete model "${model.name}"`}/>
                            </CommandBar>
                        </div>
                    </div>)
                }
                {project.viewpoints.map(vp =>
                    <div className="row data">
                        <div className={'col-4'}>{vp.isOverlay ? <TbSquareRoundedLetterVFilled style={{fontSize: '1.5em'}}/> : <TbSquareRoundedLetterV style={{fontSize: '1.5em'}}/>} {vp.name}</div>
                        <div className={'col-2 artifact-type'}>Viewpoints</div>
                        <div className={'col-1'}>
                            <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                                <Btn icon={'open'} tip={'Open viewpoint'}/>
                                <Btn icon={'minispace'} />
                                <Btn icon={'copy'} action={e => vp.duplicate()} tip={'Duplicate viewpoint'}/>
                                <Sep />
                                <Btn icon={'delete'} action={e => vp.delete()} tip={'Delete viewpoint'}/>
                            </CommandBar>
                        </div>
                    </div>)
                }
                <div className={'legenda'}>
                    <h1>Legenda</h1>
                    <div className={'row'}>
                        <div className={'col-sm'}>
                        <TbSquareRoundedLetterMFilled style={{fontSize: '1.3em'}}/> Metamodels
                        </div>
                        <div className={'col-sm'}>
                        <TbSquareRoundedLetterM style={{fontSize: '1.3em'}}/> Models
                        </div>
                        <div className={'col-sm'}>
                        <TbSquareRoundedLetterVFilled style={{fontSize: '1.3em'}}/> Viewpoints
                        </div>
                        <div className={'col-sm'}>
                        <TbSquareRoundedLetterV style={{fontSize: '1.3em'}}/> Overlay Viewpoints
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

    let allViews = project?.viewpoints.flatMap((vp: LViewPoint) => vp && vp.allSubViews) || [];
    allViews = allViews.filter(v => v);
    const viewsDeDuplicator: Dictionary<Pointer<DViewElement>, LViewElement> = {};
    for (let v of allViews) viewsDeDuplicator[v.id] = v;

    return (<>
        <Try>
            <>
                <style id={"views-css-injector"}>
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

    const {active, children, version, project} = props;

    return(<>
        {active === 'Project' ?
            <ProjectDashboard version={version} active={active} project={project} children={children}/> :
            <GenericDashboard version={version} active={active} children={children}/>
        }
    </>);
}

export {Dashboard, ProjectCatalog, Title};



