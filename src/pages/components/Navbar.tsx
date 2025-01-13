import './style.scss';
import './navbar.scss';
import {
    Dictionary,
    DModel,
    DState,
    DUser,
    Input,
    Keystrokes,
    LGraph,
    LModel,
    LPackage,
    LProject,
    LUser,
    Selectors,
    SetRootFieldAction,
    U
} from '../../joiner';

import {icon} from '../components/icons/Icons';

import {useNavigate} from 'react-router-dom';

import React, {Component, Dispatch, ReactElement, useState} from 'react';
import {FakeStateProps} from '../../joiner/types';
import {connect} from 'react-redux';
import {MetamodelPopup, ModelPopup} from './popups';
import {AuthApi, ProjectsApi} from '../../api/persistance';
import TabDataMaker from "../../../src/components/abstract/tabs/TabDataMaker";
import DockManager from "../../../src/components/abstract/DockManager";

import {Divisor, Item, Menu} from '../components/menu/Menu';
import {InternalToggle} from '../../components/widgets/Widgets';
import jj from '../../static/img/jj-k.png';
import Storage from '../../data/storage';
import Collaborative from "../../components/collaborative/Collaborative";
let windoww = window as any;

windoww.projectModified = false;

windoww.setProjectModified = function() {
    windoww.projectModified = true;
}

windoww.unseProjecttModified = function() {
    windoww.projectModified = false;
}

function createM2(project: LProject) {
    let name = 'metamodel_' + 1;
    let names: string[] = Selectors.getAllMetamodels().map(m => m.name);
    name = U.increaseEndingNumber(name, false, false, newName => names.indexOf(newName) >= 0);
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
    let name = 'model_' + 1;
    let modelNames: (string)[] = metamodel.models.map(m => m.name);
    name = U.increaseEndingNumber(name, false, false, newName => modelNames.indexOf(newName) >= 0);
    const dModel: DModel = DModel.new(name, metamodel.id, false, true);
    const lModel: LModel = LModel.fromD(dModel);
    project.models = [...project.models, lModel];
    project.graphs = [...project.graphs, lModel.node as LGraph];
    const tab = TabDataMaker.model(dModel);
    DockManager.open('models', tab);
}
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
        if (i.subItems && i.subItems.length === 0) return undefined;
        let slength = i.subItems ? i.subItems.length : 0;
        return (
            <li className={slength > 0 ? "hoverable" : ""} tabIndex={0} onClick={()=>i.function?.()}>
                <label className={`highlight ${i.disabled && 'disabled'}`}>
                    {i.icon ?
                        <span>{i.icon} {i.name}</span> :
                        <span><i className="bi bi-app hidden"></i> {i.name}</span>
                    }
                    {!i.disabled && slength > 0 ?
                        <i className='bi bi-chevron-right icon-expand-submenu'></i> :
                        getKeyStrokes(i.keystroke)
                    }
                </label>
            {!i.disabled && slength > 0 &&
                <div className='content right'>
                    <ul className='context-menu right'>
                        {i.subItems!.map(si => makeEntry(si))}
                    </ul>
                </div>
            }
            </li>
        );
    }
}



type UserProps = {}
const User = (props: UserProps) => {
    const user: LUser = LUser.fromPointer(DUser.current);
    const name = `${user?.name} ${user?.surname}`;
    const initials = name.split(' ').map(n=>n[0]).join('');
    return (<div className={'user text-end'}>
        <div className={'initials'}>
            {initials.toUpperCase()}
        </div>
        &nbsp;&nbsp;
        <span>{name}</span>
    </div>);
};

type MenuEntry = {
    name: string,
    icon?: any,
    function?: ()=>any,
    keystroke?: string[],
    subItems?:MenuEntry[],
    disabled?: boolean;
};

function NavbarComponent(props: AllProps) {

    const navigate = useNavigate();

    const {version, metamodels, advanced, debug} = props;
    const [focussed, setFocussed] = useState('');
    const [clicked, setClicked] = useState('');

    const project = props.project;

    
    
    
    // const menuType = "normal";



    const Key = Keystrokes;
    let projectItems: MenuEntry[] = [];
    {/*name: 'Save as', icon: icon['save'], function:  () => {project && ProjectsApi.save(project)}, keystroke: [Key.shift, Key.cmd, 'S']*/}
    {/*name: 'divisor', function: () => {}, keystroke: []*/}
    {/*name: 'Import...', icon: icon['import'], function: () => {}, keystroke: []*/}
    {/*
        {name: 'divisor', function: () => {}, keystroke: []},
        {name: 'View', icon: icon['view'],
            subItems: [
            {name: 'Show dot grid', icon: icon['grid'], function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Maximize editor', icon: icon['maximize'], function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Zoom in', icon: icon['zoom-in'], function: async() => {}, keystroke: [Key.cmd, '+']},
            {name: 'Zoom out', icon: icon['zoom-out'], function: async() => {}, keystroke: [Key.cmd, '-']},
            {name: 'Zoom to 100%', function: async() => {}, keystroke: [Key.cmd, '0']},
        ],
            keystroke: []
        },
    */
    }
    //            {name: 'Close project', icon: icon['close'], function: () => {
    //                 navigate('/allProjects');
    //                 Collaborative.client.off('pullAction');
    //                 Collaborative.client.disconnect();
    //                 SetRootFieldAction.new('collaborativeSession', false);
    //                 U.refresh();
    //                 }, keystroke: [Key.cmd, 'Q']},
    if (project){
        projectItems = [

            {name: 'New metamodel', icon: icon['new'], function: ()=>createM2(project), keystroke: [Key.alt, Key.cmd, 'M']},

            {
                name: 'New model',
                icon: icon['new'],
                subItems: project.metamodels.filter(m2=>!!m2).map((m2, i)=>({
                    name: m2.name, function: () => { createM1(project, m2) }, keystroke: []
                })),
                disabled: project.metamodels.length == 0
            },

            {name: 'divisor', function: () => {}, keystroke: []},
            {name: 'Close project', icon: icon['close'], function: () => {
                navigate('/allProjects');
                Collaborative.client.off('pullAction');
                Collaborative.client.disconnect();
                SetRootFieldAction.new('collaborativeSession', false);
                U.resetState();
                }, keystroke: [Key.cmd, 'Q']},
            {name: 'divisor', function: () => {}, keystroke: []},
            /*{name: 'Undo', icon: icon['undo'], function: () => {
                }, keystroke: [Key.cmd, 'Z']},
            {name: 'Redo', icon: icon['redo'], function: () => {
                }, keystroke: [Key.cmd, 'Y']}, // maybe better cmd + Y ?
            
            {name: 'divisor', function: () => {}, keystroke: []},*/
            {name: 'Save', icon: icon['save'], function: async() => {
                await ProjectsApi.save(project);
                }, keystroke: [Key.cmd, 'S']},
            {name: 'Download', icon: icon['download'], function: async() => {
                    await ProjectsApi.save(project);
                    U.download(`${project.name}.jjodel`, JSON.stringify(project.__raw));
                }, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Help', icon: icon['help'], subItems: [
                    {name: 'What\'s new', icon: icon['whats-new'], function: async() => {document.location.href="https://www.jjodel.io/whats-new/"}, keystroke: []},
                    {name: 'divisor', function: async() => {}, keystroke: []},
                    {name: 'Homepage', icon: icon['home'], function: async() => {document.location.href="https://www.jjodel.io/"}, keystroke: []},
                    {name: 'Getting started', icon: icon['getting-started'], function: async() => {document.location.href="https://www.jjodel.io/getting-started/"}, keystroke: []},
                    {name: 'User guide', icon: icon['manual'], function: async() => {document.location.href="https://www.jjodel.io/manual/"}, keystroke: []},
                    {name: 'divisor', function: async() => {}, keystroke: []},
                    {name: 'Legal terms', icon: icon['legal'], function: async() => {document.location.href="https://www.jjodel.io/terms-conditions-page/"}, keystroke: []}
                ],
                keystroke: []}

        ];
    }

    const dashboardItems: MenuEntry[] = [

        {name: 'New project', icon: <i className="bi bi-plus-square"></i>, function:
            async()=>{
                navigate('/allProjects');
                await ProjectsApi.create('public', undefined, undefined, undefined, props.user.projects);
                /*
                SetRootFieldAction.new('isLoading', true);
                await U.sleep(1);
                await ProjectsApi.create('public', 'Unnamed Project');
                SetRootFieldAction.new('isLoading', false);*/
            },
            keystroke: [Key.cmd, 'M']},
            {name: 'divisor', function: () => {}, keystroke: []},

        {name: 'Import...', icon: <i className="bi bi-arrow-bar-left"></i>, function: ProjectsApi.import, keystroke: []},
        {name: 'divisor', function: () => {}, keystroke: []},
        {name: 'Help', icon: <i className="bi bi-question-square"></i>, subItems: [
            {name: 'What\'s new', icon: <i className="bi bi-clock"></i>, function: () => {document.location.href="https://www.jjodel.io/whats-new/"}, keystroke: []},
            {name: 'divisor', function: () => {}, keystroke: []},
            {name: 'Homepage', icon: <i className="bi bi-house"></i>, function: () => {document.location.href="https://www.jjodel.io/"}, keystroke: []},
            {name: 'Getting started', icon: <i className="bi bi-airplane"></i>, function: () => {document.location.href="https://www.jjodel.io/getting-started/"}, keystroke: []},
            {name: 'User guide', icon: <i className="bi bi-journals"></i>, function: () => {document.location.href="https://www.jjodel.io/manual/"}, keystroke: []},
            {name: 'divisor', function: () => {}, keystroke: []},
            {name: 'Legal terms', icon: <i className="bi bi-mortarboard"></i>, function: () => {document.location.href="https://www.jjodel.io/terms-conditions-page/"}, keystroke: []}
        ],
        keystroke: []},
        {name: 'About jjodel', icon: <i className="bi bi-info-square"></i>, function: () => {}, keystroke: []},
        {name: 'divisor', function: () => {}, keystroke: []},
        {name: 'Logout', icon: <i className="bi bi-box-arrow-right"></i>, function: async() => {
                navigate('/auth');
                await AuthApi.logout();
            }, keystroke: [Key.cmd, 'Q']}
    ];

    let itemsToRegister: MenuEntry[] = [...dashboardItems, ...projectItems];
    Keystrokes.register('#root', Object.values(itemsToRegister));

    type MenuProps = { items: MenuEntry[] }
    const MainMenu = (props: MenuProps) => {

        return(
            <div className='nav-hamburger hoverable' tabIndex={0}>
                <i className="bi bi-grid-3x3-gap-fill list"></i>
                <div className={'content context-menu'}>
                    <ul>
                        {props.items.map(i => makeEntry(i))}
                    </ul>
                </div>
            </div>
        );
    };

    const Logo = () => {
        return (
        <div className='nav-logo'>
            <div className={"aligner"}>

                {props.debug ?
                    <div className='logo-on' onContextMenu={(e)=>{ e.preventDefault(); SetRootFieldAction.new('debug', !props.debug)}}></div>
                    :
                    <div className='logo' onContextMenu={(e)=>{ e.preventDefault(); SetRootFieldAction.new('debug', !props.debug)}}></div>
                }
                {props.debug && <i className="bi bi-bug-fill"></i>}

            </div>
        </div>
        );
    }

    const Commands = () => {
        return (<label className='text-end nav-commands d-flex'>
            {project && <>
                <span className={"my-auto me-1"}>{props.advanced ? "advanced" : "base"}</span>
                <Input type="toggle"
                       className={"my-auto"}
                       style={{fontSize:'1.25em'}}
                       setter={(v) => {
                           SetRootFieldAction.new('advanced', v);
                       }}
                       getter={() => props.advanced}/>
            </>
            }
        </label>);
    };

    const UserMenu = () => {
        return (<>
        <div className='text-end nav-side'>
                <div style={{float: 'right', left: '300px!important', marginTop: '2px'}}>
                    <Menu position={'left'}>
                        <Item icon={icon['dashboard']} action={() => {
                            navigate('/allProjects');
                            Collaborative.client.off('pullAction');
                            Collaborative.client.disconnect();
                            SetRootFieldAction.new('collaborativeSession', false);
                            U.resetState();
                        }}>Dashboard</Item>
                        <Divisor />
                        <Item icon={icon['profile']} action={()=> {
                            navigate('/account');
                            U.resetState();
                        }}>Profile</Item>
                        <Item icon={icon['settings']} action={(e)=> {alert('')}}>Settings</Item>
                        <Divisor />
                        <Item icon={icon['logout']} action={async() => {
                            navigate('/auth');
                            await AuthApi.logout();
                        }}>Logout</Item>
                    </Menu>
                </div>
            </div>
        </>);
    }

    return(<>
        <nav className={'w-100 nav-container d-flex'} style={{zIndex: 99}}>
            {project ?
                <MainMenu items={projectItems}/>
                :
                <MainMenu items={dashboardItems} />
            }
            <Logo />
            <UserMenu />
            <Commands />
            <User />
        </nav>

        {project && clicked === 'new.metamodel' && <MetamodelPopup {...{project, setClicked}} />}
        {project && clicked === 'new.model' && <ModelPopup {...{metamodels, project, setClicked}} />}
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
    ret.project = ret.user?.project || undefined;
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
