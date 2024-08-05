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
    icon: "add" | "import" | "clone" | "question";
    style?: "blue" | "red" | "dark" | "clear" | "rainbow" | "default";
    title: string;
    subtitle: string;
    action?: MouseEventHandler;
    children?: JSX.Element[];
};

const Card = (props: CardType) => {

    const icons = {
        add: "bi-plus-circle",
        import: "bi-box-arrow-in-up",
        question: "bi-question-square",
        clone: "bi-clipboard2-check"
    };

    return (<>
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
        </>
    );
}

Cards.Item = Card;

type ChildrenType = {
    projects?: any;
    children?: JSX.Element[];
};


/* main component */

const Catalog = (props: ChildrenType) => {

    const [filters, setFilters] = useState([false,false,false]);
    const [mode, setMode] = useState<string>("cards");

    const Header = (props: ChildrenType) => {
        return (
            <div className='row catalog-header'>
                {props.children}
            </div>
        );
    }

    const CatalogFilters = () => {

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

    const CatalogMode = () => { // unused component?
        return (<>
            <div className={'col left'}>
                <div className="float-end">sorted by
                    <div className={'view-icons'}>
                        <i onClick={(e) => setMode('cards')} className={`bi bi-grid ${mode === "cards" && 'selected'}`}></i>
                        <i onClick={(e) => setMode('list')} className={`bi bi-list ${mode === "list" && 'selected'}`}></i>
                    </div>
                    <div style={{float: 'right'}}>
                    <Menu position={'left'}>
                        <Item action={(e)=> {alert('')}}>Alphabetical</Item>
                        <Item>Date created</Item>
                        <Item>Last modified</Item>
                    </Menu>
                    </div>
                </div>
            </div>
        </>);
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
            <div className={'details'}>
                <h5>Your projects</h5>
                <p>You developed <strong>{props.projects.length}</strong> projects with an overall number of 12 artifacts.</p>
                <img src={colors} width={220} />
            </div>
        );
    }

    type CatalogType = {
        projects: LProject[];
    }

    const CatalogReport = (props: CatalogType) =>{

        let items_public: LProject[] = [];
        let items_private: LProject[] = [];
        let items_collaborative: LProject[] = [];


        if (filters[0]) {
            items_public = props.projects.filter(p => p.type === "public");
        }
        if (filters[1]) {
            items_private = props.projects.filter(p => p.type === "private");
        }
        if (filters[2]) {
            items_collaborative = props.projects.filter(p => p.type === "collaborative");
        }

        //var items  = items_public.concat(items_private,items_collaborative);

        var items = props.projects.filter(p =>
            (filters[0] && p.type ==="public" || filters[1] && p.type ==="private" || filters[2] && p.type ==="collaborative" || !filters[0] && !filters[1] && !filters[2]));

        return (

            mode == "cards" ?

            <div style={{display: (items.length > 0) ? 'flex' : 'flex'}} className={'flex-wrap'} >

                {items.length === 0 && <div>Sorry, there are no results matching your search criteria. Please try again with different filters.</div>}

                {
                    props.projects.map(p => <>
                        {filters[0] && p.type === "public" && <Project key={p.id} data={p} mode={mode} />}
                        {filters[1] && p.type === "private" && <Project key={p.id} data={p} mode={mode} />}
                        {filters[2] && p.type === "collaborative" && <Project key={p.id} data={p} mode={mode} />}
                        {!filters[0] && !filters[1] && !filters[2] && <Project key={p.id} data={p} mode={mode} />}
                    </>)
                }

            </div>

            :
            <div className={'row project-list'}>
                <div className='row header'>
                    <div className={'col-6'}>Name</div><div className={'col-3'}>Last modified</div><div className={'col-3'}>Created</div>
                </div>
                {
                    props.projects.map(p => <>
                        {filters[0] && p.type === "public" && <Project key={p.id} data={p} mode={mode} />}
                        {filters[1] && p.type === "private" && <Project key={p.id} data={p} mode={mode} />}
                        {filters[2] && p.type === "collaborative" && <Project key={p.id} data={p} mode={mode} />}
                        {!filters[0] && !filters[1] && !filters[2] && <Project key={p.id} data={p} mode={mode} />}
                    </>)
                }
            </div>

        );
    };

    return (
        <div>
            <Header>
                <CatalogFilters/>
                <CatalogMode/>
            </Header>
            <CatalogSide>
                <CatalogInfoCard projects={props.projects}/>
                <CatalogReport projects={props.projects}/>
            </CatalogSide>
        </div>
    );
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
        <Dashboard active={'Templates'} version={props.version}>

            <React.Fragment>

                <Cards>
                    <Cards.Item
                        title={'Clone a template'}
                        subtitle={'Clone a template in your workspace.'}
                        icon={'clone'}
                        style={'rainbow'}
                    />
                    {true && <Cards.Item icon={'question'} style={'clear'} title={'Ehy!'} subtitle={'What do you want to do today?'}/>}
                </Cards>

                <Catalog projects={projects} />
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

const TemplatePage = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <AllProjectsConnected {...{...props, children}} />;
}

export {TemplatePage};

