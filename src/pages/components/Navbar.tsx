import './style.scss';
import './navbar.scss';
import {
    Dictionary, DModel,
    DState,
    DUser,
    GObject, Keystrokes, LGraph,
    LModel, LPackage,
    LProject,
    LUser,
    Selectors,
    SetRootFieldAction,
    U
} from '../../joiner';

import React, {Component, Dispatch, ReactElement, ReactNode, useState} from 'react';
import {FakeStateProps} from '../../joiner/types';
import {connect} from 'react-redux';
import {MetamodelPopup, ModelPopup} from './popups';
import {ProjectsApi} from '../../api/persistance';
import {useNavigate} from 'react-router-dom';
import logo from '../../static/img/jjodel.jpg';
import TabDataMaker from "../../components/abstract/tabs/TabDataMaker";
import DockManager from "../../components/abstract/DockManager";
import DebugImage from "../../static/img/debug.png";

import {Menu, Item, Divisor} from '../components/menu/Menu';

import jj from '../../static/img/jj-k.png';

function getKeyStrokes(keys?: string[]){
    if (!keys || !keys.length) return undefined;
    return <div className={"keystrokes"}>
        {keys.map(k => Keystrokes.getKeystrokeJsx(k))}
    </div>
}

function makeEntry(i: MenuEntry) {

    if (i.name === "divisor") {
        return (
            <li className='divisor'>
                <hr />
            </li>
        );
    } else {
        return (
            <li className={i.subItems ? "hoverable" : ""} tabIndex={0} onClick={()=>i.function?.()}>
                <label className='highlight'>
                    {i.icon ?
                        <span>{i.icon} {i.name}</span> :
                        <span><i className="bi bi-app hidden"></i> {i.name}</span>
                    }
                    {i.subItems ?
                        <i className='bi bi-chevron-right icon-expand-submenu'></i> :
                        getKeyStrokes(i.keystroke)
                    }
                </label>
            {i.subItems &&
                <div className='content right'>
                    <ul className='context-menu right'>
                        {i.subItems.map(si => makeEntry(si))}
                    </ul>
                </div>
            }
            </li>
        );
    }
}

const createM2 = (project: LProject) => {
    let name = 'metamodel_' + 0;
    let names: string[] = Selectors.getAllMetamodels().map(m => m.name);
    name = U.increaseEndingNumber(name, false, false, newName => names.indexOf(newName) >= 0)
    const dModel = DModel.new(name, undefined, true);
    const lModel: LModel = LModel.fromD(dModel);
    project.metamodels = [...project.metamodels, lModel];
    project.graphs = [...project.graphs, lModel.node as LGraph];
    const dPackage = lModel.addChild('package');
    const lPackage: LPackage = LPackage.fromD(dPackage);
    lPackage.name = 'default';
    const tab = TabDataMaker.metamodel(dModel);
    DockManager.open('models', tab);
}

const createM1 = (project: LProject, metamodel: LModel) => {
    let name = 'model_' + 0;
    let modelNames: (string)[] = metamodel.models.map(m => m.name);
    name = U.increaseEndingNumber(name, false, false, newName => modelNames.indexOf(newName) >= 0);
    const dModel: DModel = DModel.new(name, metamodel.id, false, true);
    const lModel: LModel = LModel.fromD(dModel);
    project.models = [...project.models, lModel];
    project.graphs = [...project.graphs, lModel.node as LGraph];
    const tab = TabDataMaker.model(dModel);
    DockManager.open('models', tab);
}

type UserProps = {
    user?: LUser;
}
const User = (props: UserProps) => {
    return (
        <div className={'user'}>Alfonso <b>Pierantonio</b></div>
    );
};

type MenuEntry = {name: string, icon?: any, function?: ()=>any, keystroke?: string[], subItems?:MenuEntry[]};

function NavbarComponent(props: AllProps) {


    const {version, metamodels, advanced, debug} = props;
    const [focussed, setFocussed] = useState('');
    const [clicked, setClicked] = useState('');
    const navigate = useNavigate();
    const project: LProject = props.project as LProject;

    const menuType = "normal";

    const K = Keystrokes;
    const projectItems: MenuEntry[] = [

        {name: 'New metamodel', icon: <i className="bi bi-plus-square"></i>, function: ()=>createM2(project), keystroke: [K.alt, K.cmd, 'M']},
        {name: 'New model', icon: <i className="bi bi-plus-square"></i>, function: async() => {}, keystroke: []},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Close project', icon: <i className="bi bi-dash-square"></i>, function: () => {window.location = window.location.origin + '/#/allProjects' as any}, keystroke: [K.cmd, 'Q']},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Undo', icon: <i className="bi bi-arrow-counterclockwise"></i>, function: async() => {}, keystroke: [K.cmd, 'Z']},
        {name: 'Redo', icon: <i className="bi bi-arrow-clockwise"></i>, function: async() => {}, keystroke: [K.shift, K.cmd, 'Z']}, // maybe better cmd + Y ?
        {name: 'divisor', icon: <></>, function: async() => {}, keystroke: []},
        {name: 'Save', icon: <i className="bi bi-upload"></i>, function: async() => {project && await ProjectsApi.save(project)}, keystroke: [K.cmd, 'S']},
        {name: 'Save as', icon: <i className="bi bi-upload"></i>, function: async() => {}, keystroke: [K.shift, K.cmd, 'S']},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Import...', icon: <i className="bi bi-arrow-bar-left"></i>, function: async() => {}, keystroke: []},
        {name: 'Export as...', icon: <i className="bi bi-arrow-bar-right"></i>, function: async() => {}, keystroke: []},
        {name: 'divisor', function: async() => {}, keystroke: []},


        {name: 'View', icon: <i className="bi bi-tv"></i>,
            subItems: [
                {name: 'Show dot grid', icon: <i className="bi bi-grid-3x3-gap"></i>, function: async() => {}, keystroke: []},
                {name: 'divisor', function: async() => {}, keystroke: []},
                {name: 'Maximize editor', icon: <i className="bi bi-arrows-fullscreen"></i>, function: async() => {}, keystroke: []},
                {name: 'divisor', function: async() => {}, keystroke: []},
                {name: 'Zoom in', icon: <i className="bi bi-zoom-in"></i>, function: async() => {}, keystroke: [K.cmd, '+']},
                {name: 'Zoom out', icon: <i className="bi bi-zoom-out"></i>, function: async() => {}, keystroke: [K.cmd, '-']},
                {name: 'Zoom to 100%', function: async() => {}, keystroke: [K.cmd, '0']},
            ],
            keystroke: []
        },
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Help', icon: <i className="bi bi-question-square"></i>, subItems: [
            {name: 'What\'s new', icon: <i className="bi bi-clock"></i>, function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Homepage', icon: <i className="bi bi-house"></i>, function: async() => {}, keystroke: []},
            {name: 'Getting started', icon: <i className="bi bi-airplane"></i>, function: async() => {}, keystroke: []},
            {name: 'User guide', icon: <i className="bi bi-journals"></i>, function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Legal terms', icon: <i className="bi bi-mortarboard"></i>, function: async() => {}, keystroke: []}
        ],
        keystroke: []},
        {name: 'About jjodel', icon: <img src={jj} width={15}/>, function: async() => {}, keystroke: []}


    ];

    const createProject = ()=>ProjectsApi.create('public', undefined, undefined, undefined, props.user.projects);

    const dashboardItems: MenuEntry[] = [

        {name: 'New project', icon: <i className="bi bi-plus-square"></i>, function: createProject, keystroke: [K.cmd, 'M']},
        {name: 'Import...', icon: <i className="bi bi-arrow-bar-left"></i>, function: ProjectsApi.importModal, keystroke: []},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Help', icon: <i className="bi bi-question-square"></i>, subItems: [
            {name: 'What\'s new', icon: <i className="bi bi-clock"></i>, function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Homepage', icon: <i className="bi bi-house"></i>, function: async() => {}, keystroke: []},
            {name: 'Getting started', icon: <i className="bi bi-airplane"></i>, function: async() => {}, keystroke: []},
            {name: 'User guide', icon: <i className="bi bi-journals"></i>, function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Legal terms', icon: <i className="bi bi-mortarboard"></i>, function: async() => {}, keystroke: []}
        ],
        keystroke: []},
        {name: 'About jjodel', icon: <img src={jj} width={15}/>, function: async() => {}, keystroke: []},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Logout', icon: <i className="bi bi-box-arrow-right"></i>, function: async() => {}, keystroke: [K.cmd, 'Q']},

        /* {name: 'Project',
            subItems: [
                {name: 'New', function: async() => {
                    navigate('/allProjects');
                    SetRootFieldAction.new('isLoading', true);
                    await U.sleep(1);
                    await ProjectsApi.create('public', 'Unnamed Project');
                    SetRootFieldAction.new('isLoading', false);
                }},
            ]
        }*/
    ];

    let itemsToRegister: MenuEntry[] = [...dashboardItems/*, ...projectItems*/];
    Keystrokes.register('#root', Object.values(itemsToRegister));

    const MainMenu = () => {

        return(
            <div className='col nav-hamburger hoverable' tabIndex={0}>
                <i className="bi bi-grid-3x3-gap-fill list"></i>
                <div className={'content context-menu'}>
                    <ul>
                        {projectItems.map(i => makeEntry(i))}
                    </ul>
                </div>
            </div>
        );



    };

    if(project)

        return(<>
            <nav className={'nav-container d-flex'} style={{zIndex: 99}}>

                <MainMenu />
                <div className='col nav-logo'>
                    <img height={24} src={logo} alt={'jjodel logo'} onContextMenu={(e)=>{ e.preventDefault(); SetRootFieldAction.new('debug', !props.debug)}}/>
                    {props.debug && <img alt='debug' height={24} src={DebugImage}/>}
                </div>
                <div className='col nav-side'>
                    <div style={{float: 'right', left: '300px!important', width: '31px', marginTop: '2px'}}>
                        <Menu position={'left'}>
                            <Item icon={<i className="bi bi-grid"></i>} action={(e)=> {alert('')}}>Dashboard</Item>
                            <Divisor />
                            <Item icon={<i className="bi bi-person-square"></i>}action={(e)=> {alert('')}}>Profile</Item>
                            <Item icon={<i className="bi bi-sliders"></i>} action={(e)=> {alert('')}}>Account</Item>
                            <Divisor />
                            <Item icon={<i className="bi bi-box-arrow-right"></i>} action={(e)=> {alert('')}}>Sign out</Item>
                        </Menu>
                    </div>
                </div>
                <User />
            </nav>



                    {/*
                        <label onClick={e => SetRootFieldAction.new('debug', !debug)} className={`my-auto py-0 mx-2 cursor-pointer item text-white rounded ${debug ? 'bg-success' : 'bg-danger'}`}>
                            DEBUG
                        </label>
                        <label  className={`my-auto py-0 mx-2 item`}>
                            <img src="src/static/img/logo.png" />
                        </label>

                    </div>
                </ul>*/}



            {clicked === 'new.metamodel' && <MetamodelPopup {...{project, setClicked}} />}
            {clicked === 'new.model' && <ModelPopup {...{metamodels, project, setClicked}} />}
        </>);
    else
        return(<>
            <nav className={'nav-container d-flex'} style={{zIndex: 99}}>
                <div className='col nav-hamburger hoverable' tabIndex={0}>
                    <i className="bi bi-grid-3x3-gap-fill list"></i>
                    <div className={'content context-menu'}>
                        <ul>
                            {dashboardItems.map(i => makeEntry(i))}
                        </ul>
                    </div>
                </div>
                <div className='nav-logo col'>
                    <img height={24} src={logo} />
                </div>
                <div className='nav-side col'>
                    <div style={{float: 'right', left: '300px!important', width: '31px', marginTop: '2px'}}>
                        <Menu position={'left'}>
                            <Item action={(e)=> {alert('')}}><i className="bi bi-grid"></i> Dashboard</Item>
                            <Divisor />
                            <Item action={(e)=> {alert('')}}><i className="bi bi-person-square"></i> Profile</Item>
                            <Item action={(e)=> {alert('')}}><i className="bi bi-sliders"></i> Account</Item>
                            <Divisor />
                            <Item action={(e)=> {alert('')}}><i className="bi bi-box-arrow-right"></i> Sign out</Item>
                        </Menu>
                    </div>
                </div>
                <User />
            </nav>



            {/*<nav className={'nav-container d-flex'} style={{zIndex: 99}}>
                <div className='nav-hamburger hoverable col' tabIndex={0}>
                    <i className="bi bi-grid-3x3-gap-fill list"></i>
                    <div className={'content context-menu'}>
                        <ul>
                            {dashboardItems.map(i => makeEntry(i))}
                        </ul>
                    </div>
                </div>
                <div className='nav-logo col'>
                    <img height={24} src={logo} />
                </div>
                <div className='nav-side col'>
                    <User />
                </div>
            </nav>
             <nav style={{zIndex: 99}}>
                <ul className={'new-navbar'}>
                    {dashboardItems.map(i => <li key={i.name} className={'new-dropdown'}>
                        <label>{i.name}</label>
                        <ul className={'new-dropdown-content'}>
                            {i.subItems.map(si => <li key={si.name} onClick={async() => {
                                setClicked(`${i.name}.${si.name}`.toLowerCase());
                                await si.function();
                            }}>
                                <label>{si.name}</label>
                            </li>)}
                        </ul>
                    </li>)}
                </ul>
                        </nav>*/}
        </>);
}

interface OwnProps {}
interface StateProps {
    user: LUser;
    project?: LProject;
    metamodels: LModel[];
    version: DState['version'];
    advanced: boolean;
    debug: boolean;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    ret.project = ret.user.project || undefined;
    ret.metamodels = LModel.fromArr(state.m2models);
    ret.version = state.version;
    ret.advanced = state.advanced;
    ret.debug = state.debug;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

const NavbarConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(NavbarComponent);

const Navbar = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <NavbarConnected {...{...props, children}} />;
}

export {Navbar};
