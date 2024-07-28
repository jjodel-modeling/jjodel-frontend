import React, {ChangeEvent, MouseEventHandler, Component, Dispatch, ReactElement, useState, useRef } from 'react';
import {connect} from 'react-redux';
import {DProject, DState, LProject, Try, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import {Dashboard, Project} from './components';
import Storage from "../data/storage";

import {Menu, Item, Divisor} from './components/menu/Menu';

import colors from '../static/img/colors.png';

type CardsType = {
    children: any;
};

const Cards = (props: CardsType): any => {
    return (
        <React.Fragment>
            <div className='row mb-5 commandbar'>
                {props.children}
            </div>
        </React.Fragment>
    );
}

type CardType = {
    icon: "add" | "import" | "question";
    style?: "blue" | "red" | "dark" | "clear" | "default";
    title: string;
    subtitle: string;
    action?: MouseEventHandler;
};

const Card = (props: CardType) => {

    const icons = {
        add: "bi-plus-circle",
        import: "bi-box-arrow-in-up",
        question: "bi-question-square" 
    };
    
    return (
        <div className={`card ${props.style ? props.style : 'default' }`}>
            <div className={'col icon'}>
                {props.action ?
                    <i onClick={props.action} className={`bi ${icons[props.icon]}`}></i> :
                    <i className={`bi ${icons[props.icon]} disabled`}></i>
                }            
            </div>
            <div className={'col body'}>
                <h5>{props.title}</h5>
                {props.subtitle}
            </div>
        </div>
    );
}

Cards.Item = Card;

type ChildrenType = {
    children: any;
};

const Catalog = (props: ChildrenType) => {
    return (
        <div>
            {props.children}
        </div>
    );
}

const CatalogHeader = (props: ChildrenType) => {
    return (
        <div className='row catalog-header'>
            {props.children}
        </div>
    );
}

const CatalogFilters = () => {
    const [filters, setFilters] = useState([true,true,true]);

    function getFilters(){
        return filters;
    }

    function toggleFilters(el: 0|1|2) {
        switch(el) {
            case 0:
                setFilters([!filters[0], filters[1], filters[2]]);
                break;
            case 1:
                setFilters([filters[0], !filters[1], filters[2]]);
                break;
            case 2:
                setFilters([filters[0], filters[1], !filters[2]]);
                break;
        }
    };

    return (
        <div className={'col left'}>
            {filters[0] ? <button onClick={(e) => toggleFilters(0)} className='active'>public</button> : <button onClick={(e) => toggleFilters(0)}>public</button>}
            {filters[1] ? <button onClick={(e) => toggleFilters(1)} className='active'>private</button> : <button onClick={(e) => toggleFilters(1)}>private</button>}
            {filters[2] ? <button onClick={(e) => toggleFilters(2)} className='active'>collaborative</button> : <button onClick={(e) => toggleFilters(2)} >collaborative</button>}
        </div>
    );
}

const CatalogMode = () => {
    return (
        <div className={'col left'}>
            <div className="float-end">sorted by 
                <div className={'view-icons'}>
                    <i className="bi bi-grid selected"></i>
                    <i className="bi bi-list"></i>
                </div>
                <div style={{float: 'right'}}>
                <Menu position={'left'}>
                    <Item>Alphabetical</Item>
                    <Item>Date created</Item>
                    <Item>Last modified</Item>
                </Menu>
                </div>
            </div>
        </div>
    );
}

const CatalogSide = (props: ChildrenType) => {
    return (
    <div className={'catalog'}>
        {props.children}
    </div>
    );
}

const CatalogInfoCard = (props: any) => {
    return (
        <>
            <div className={'details'}>
                <h5>Your projects</h5>
                <p>You developed <strong>{props.projects.length}</strong> projects with an overall number of 12 artifacts.</p>
                <img src={colors} width={220} />
            </div>
        </>
    );
}

type ReportType = {
    projects: LProject[];
    filters?: [boolean, boolean, boolean];
}

const CatalogReport = (props: ReportType) =>{
    return (
        <>
            <div style={{display: (props.projects.length > 0) ? 'flex' : 'none'}} className={'flex-wrap'}>
                {props.projects.map(p => <Project key={p.id} data={p} />)}
            </div>
        </>
    );
}; 

Catalog.Header = CatalogHeader;
Catalog.Filters = CatalogFilters;
Catalog.Mode = CatalogMode;
Catalog.Side = CatalogSide;
Catalog.InfoCard = CatalogInfoCard;
Catalog.Report = CatalogReport;




function importModal() {
    alert('');
}

function AllProjectsComponent(props: AllProps): JSX.Element {
    const {projects} = props;

    const reader = new FileReader();
    reader.onload = async e => {
        /* Import Project File */
        const content = String(e.target?.result);
        if(!content) return;
        try {
            const project = JSON.parse(content) as DProject;
            const projects = Storage.read<DProject[]>('projects') || [];
            const filtered = projects.filter(p => p.id !== project.id);
            filtered.push(project);
            Storage.write('projects', filtered);
            U.refresh();
        } catch (e) {alert('Invalid File.')}
    }
    const importProject = async(e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files || [];
        if(!files.length) return;
        const file = files[0];
        reader.readAsText(file);
    }




    return(<Try>
        <Dashboard active={'All'} version={props.version}>
            
            <React.Fragment>                

                <Cards>
                    <Cards.Item
                        title={'New jjodel'} 
                        subtitle={'Create a new jjodel project.'}
                        icon={'add'} 
                        style={'red'}   
                    />
                    <Cards.Item
                        title={'Import jjodel'} 
                        subtitle={'Import an existing jjodel project.'}
                        icon={'import'} 
                        style={'blue'} 
                        action={(e) => importModal()}
                    />
                    {true && <Cards.Item icon={'question'} style={'clear'} title={'Ehy!'} subtitle={'What do you want to do today?'}/>}
                </Cards>

                
                <Catalog>
                    <Catalog.Header>
                        <Catalog.Filters />
                        <Catalog.Mode />
                    </Catalog.Header>       
                
                    <Catalog.Side>
                        <Catalog.InfoCard projects={projects}/>
                        
                        {/* 
                        
                        AP: l'upload di progetti deve avvenire tramite il menu principale

                        <div className={'ms-2 p-1 bg-primary w-25 rounded me-auto'}>
                            <b className={'d-block text-center text-gray'}>Do you want to import a project?</b>
                            <input className={'form-control w-100'} type={'file'} onChange={async e => await importProject(e)} />
                        </div>*/}
                        
                        <Catalog.Report projects={projects} />
                        
                    </Catalog.Side>
                    
                        
                        

                    
                </Catalog>
            </React.Fragment>
        </Dashboard>
    </Try>);
}

interface OwnProps {}
interface StateProps {
    projects: LProject[];
    version: DState["version"];
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.projects = LProject.fromArr(state.projects);
    ret.version = state.version;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

const AllProjectsConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(AllProjectsComponent);

const AllProjectsPage = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <AllProjectsConnected {...{...props, children}} />;
}

export {AllProjectsPage};

