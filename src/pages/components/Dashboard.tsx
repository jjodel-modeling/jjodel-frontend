import {LUser, DState, LProject, Try, Dictionary, Pointer, DViewElement, LViewElement, LViewPoint} from '../../joiner';
import {DUser, LPointerTargetable} from '../../joiner';
import {Navbar, LeftBar} from './';

import '../dashboard.scss'
import {ReactElement} from "react";
import { Btn, CommandBar, Sep } from '../../components/commandbar/CommandBar';
import { Item } from './menu/Menu';

import colors from '../../static/img/colors.png';
import useQuery from '../../hooks/useQuery';

import { TbHexagonLetterM } from "react-icons/tb";
import { TbHexagonLetterMFilled } from "react-icons/tb";
import { TbHexagonLetterV } from "react-icons/tb";

import { TbSquareRoundedLetterM } from "react-icons/tb";
import { TbSquareRoundedLetterMFilled } from "react-icons/tb";
import { TbSquareRoundedLetterV } from "react-icons/tb";
import { TbSquareRoundedLetterVFilled } from "react-icons/tb";
import DockManager from '../../components/abstract/DockManager';
import Dock from "../../components/abstract/Dock";
import {CSS_Units} from "../../view/viewElement/view";




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


type ProjectDetailsProp = {
    project: LProject;
}

const ProjectDetails = (props: ProjectDetailsProp) => {

    const {project} = props;

    return (<></>);


}



type TitleProps = {
    title: string;
    icon: ReactElement;
    description?: string;
}

const Title = (props: TitleProps) => {

    /* edit title + description missing */

    return (<>
        <div className={'title'}>
            <div className={'name'}>
                <h2>{props.icon} {props.title}</h2>
                {props.description && <h3>{props.description}</h3>}
            </div>
        </div>
    </>);
};


export type DashProps = {
    children?: JSX.Element,
    // NB: account and profile are both used, i don't know which to keep
    active: 'Account'|'Profile'|'Settings'|'Updates'|'Community'|'All'|'Archive'|'Templates'|'Recent' | 'Notes' | 'Project';
    version: Partial<DState["version"]>;
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
            <LeftBar active={active} projects={user.projects}/>
            <div className={'user'}>
                <div className={'name'}>
                <>
                    {active === "All" && <Title title={'Dashboard'} icon={<i className="bi bi-columns-gap"></i>} />}
                    {active === "Recent" && <Title title={'Recent'} icon={<i className="bi bi-clock"></i>} />}
                    {active === "Templates" && <Title title={'Templates'} icon={<i className="bi bi-lightbulb"></i>} />}
                    {active === "Notes" && <Title title={'Project Notes'} icon={<i className="bi bi-pencil-square"></i>} />}
                    {active === "Updates" && <Title title={'What\'s new'} icon={<i className="bi bi-clock-history"></i>} />}
                    {active === "Profile" && <Title title={'Profile'} icon={<i className="bi bi-clock-history"></i>} />}
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
        <div className={'row project-list'} style={{width: '70%', marginRight: '35%'}}>
            <div className='row header'>

                <div className={'col-3'}>Name</div>
                <div className={'col-2'}>Type</div>
                <div className={'col-2'}>Created</div>
                <div className={'col-2'}>Last modified</div>
                <div className={'col-3'}>Operation</div>
            </div>

            {project.metamodels.map(mm =>
                <div className="row data">
                    <div className={'col-3'} ><TbSquareRoundedLetterMFilled style={{fontSize: '1.5em'}}/> {mm.name}</div>
                    <div className={'col-2'}>Metamodel</div>
                    <div className={'col-2'}>13 days ago</div>
                    <div className={'col-2'}>July 13, 2024</div>
                    <div className={'col-3'}>
                        <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                            <Btn icon={'open'} action={async() => await DockManager.open2(mm)} tip={'Open metamodel'}/>
                            <Btn icon={'minispace'} />
                            <Btn icon={'copy'} action={e => alert('Duplicate metamodel')} tip={'Duplicate metamodel'}/>
                            <Sep />
                            <Btn icon={'delete'} action={e => alert('Delete Metamodel')} tip={`Delete model "${mm.name}"`}/>
                        </CommandBar>
                    </div>
                        {/* <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                            <Btn icon={'favorite'} action={(e => toggleFavorite(data))} tip={'Add to favorites'}/>
                            <Btn icon={'minispace'} />
                            <Btn icon={'copy'} action={e => props.data.duplicate()} tip={'Duplicate project'}/>
                            <Btn icon={'minispace'} />
                            <Btn icon={'download'} action={e => exportProject()} tip={'Download project'}/>
                            <Sep />
                            <Btn icon={'delete'} action={async e => await deleteProject()} tip={'Delete project'}/>
                        </CommandBar>
                    </div>*/}
                </div>)
            }
            {project.models.map(model =>
                <div className="row data">
                    <div className={'col-3'} key={model.id} onClick={async() => await DockManager.open2(model)} ><TbSquareRoundedLetterM style={{fontSize: '1.5em'}}/> {model.name}</div>
                    <div className={'col-2'}>Model</div>
                    <div className={'col-2'}>13 days ago</div>
                    <div className={'col-2'}>July 13, 2024</div>
                    <div className={'col-3'}>
                        <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                            <Btn icon={'open'} action={async() => await DockManager.open2(model)} tip={'Open model'}/>
                            <Btn icon={'minispace'} />
                            <Btn icon={'copy'} action={e => alert('Duplicate model')} tip={'Duplicate model'}/>
                            <Sep />
                            <Btn icon={'delete'} action={e => alert('Delete Model')} tip={`Delete model "${model.name}"`}/>
                        </CommandBar>
                    </div>
                        {/* <CommandBar noBorder={true} style={{marginBottom: '0'}}>


                            <Btn icon={'minispace'} />
                            <Btn icon={'favorite'} action={(e => toggleFavorite(data))} tip={'Add to favorites'}/>
                            <Btn icon={'minispace'} />
                            <Btn icon={'copy'} action={e => props.data.duplicate()} tip={'Duplicate project'}/>
                            <Btn icon={'minispace'} />
                            <Btn icon={'download'} action={e => exportProject()} tip={'Download project'}/>
                            <Sep />
                            <Btn icon={'delete'} action={async e => await deleteProject()} tip={'Delete project'}/>
                        </CommandBar>
                    </div>*/}
                </div>)
            }
            {project.viewpoints.map(vp =>
                <div className="row data">
                    <div className={'col-3'} onClick={()=> {alert()}}>{vp.isOverlay ? <TbSquareRoundedLetterVFilled style={{fontSize: '1.5em'}}/> : <TbSquareRoundedLetterV style={{fontSize: '1.5em'}}/>} {vp.name}</div>
                    <div className={'col-2'}>Viewpoints</div>
                    <div className={'col-2'}>13 days ago</div>
                    <div className={'col-2'}>July 13, 2024</div>
                    <div className={'col-3'}>
                        <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                            <Btn icon={'open'} tip={'Open model'}/>
                            <Btn icon={'minispace'} />
                            <Btn icon={'copy'} tip={'Duplicate model'}/>
                            <Sep />
                            <Btn icon={'delete'} tip={'Delete viewpoint'}/>
                        </CommandBar>
                    </div>
                        {/* <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                            <Btn icon={'favorite'} action={(e => toggleFavorite(data))} tip={'Add to favorites'}/>
                            <Btn icon={'minispace'} />
                            <Btn icon={'copy'} action={e => props.data.duplicate()} tip={'Duplicate project'}/>
                            <Btn icon={'minispace'} />
                            <Btn icon={'download'} action={e => exportProject()} tip={'Download project'}/>
                            <Sep />
                            <Btn icon={'delete'} action={async e => await deleteProject()} tip={'Delete project'}/>
                        </CommandBar>
                    </div>*/}
                </div>)
            }
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
        {/*<div className={"dashboard-container"} tabIndex={-1}>
            <LeftBar active={active} projects={user.projects} project={project} />
            <div className={'user'}>
                <div className={'name'}>
                    <Title title={project.name} icon={<i className="bi bi-p-square"></i>} description={project.description}/>
                    <ProjectCatalog project={project} />
                </div>
            </div>
        </div>
        */}
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

export {Dashboard};

