import './style.scss';
import './navbar.scss';
import {
    Dictionary,
    DModel,
    DProject,
    DState,
    DUser,
    Input,
    Keystrokes,
    L,
    LGraph,
    LModel,
    LPackage,
    LProject,
    LUser,
    Selectors,
    SetRootFieldAction,
    TRANSACTION,
    store,
    U,
    R
} from '../../joiner';

import {icon} from '../components/icons/Icons';

import {useNavigate} from 'react-router-dom';

import React, {Component, Dispatch, ReactElement, ReactNode, useState} from 'react';
import {FakeStateProps} from '../../joiner/types';
import {connect} from 'react-redux';
import {MetamodelPopup, ModelPopup} from './popups';
import {AuthApi, ProjectsApi} from '../../api/persistance';
import TabDataMaker from "../../../src/components/abstract/tabs/TabDataMaker";
import DockManager from "../../../src/components/abstract/DockManager";

import {Divisor, Item, Menu} from '../components/menu/Menu';

import Collaborative from "../../components/collaborative/Collaborative";
import { isProjectModified } from '../../common/libraries/projectModified';
import { AboutModal } from './about/About';
import { MetricsPanelManager } from '../../components/metrics/Metrics';
import Api from '../../data/api';
import {Undoredocomponent} from "../../components/topbar/undoredocomponent";


let windoww = window as any;

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

let globalProject: LProject|undefined = undefined as any;
function makeEntry(i: MenuEntry, index: number) {
    if (!i) return;
    let isUndo = (i.name === "Undo" || i.name === "Redo");
    // if (true as any) return <li >{i.name}</li>;

    if (i.name === "Redo") { return null; }
    if (i.name === "Undo") {
        if (!globalProject) return null;
        return <Undoredocomponent key={'undo'} project={globalProject} />
    }
    if (i.name === "divisor") {
        return (
            <li key={index} className='divisor'>
                <hr />
            </li>
        );
    } else {
        if (i.subItems && i.subItems.length === 0) return undefined;
        let slength = i.subItems ? i.subItems.length : 0;

        let hasSubItems = (!i.disabled && slength > 0) || isUndo;

        return (
            <li className={hasSubItems ? "hoverable" : ""} key={i.name} tabIndex={0} onClick={()=>i.function?.()}>
                <label className={`highlight ${i.disabled ? 'disabled' : ''}`}>
                    <span>{i.icon || <i className="bi bi-app hidden"/>} <span>{i.name}</span></span>
                    {!i.disabled && slength > 0 ?
                        <i className='bi bi-chevron-right icon-expand-submenu'/> :
                        getKeyStrokes(i.keystroke)
                    }
                </label>
            {hasSubItems &&
                <div className='content right'>
                    <ul className='context-menu right'>
                        {i.subItems && i.subItems.map((si, index) => makeEntry(si, index))}
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
} | null;

function NavbarComponent(props: AllProps) {
    const {version, metamodels, advanced, debug, project} = props;
    const [focussed, setFocussed] = useState('');
    const [clicked, setClicked] = useState('');
    const navigate = useNavigate();
    globalProject = project;

    const open = (url: string) => { window.open(url, '_blank'); }

    const Key = Keystrokes;
    let projectItems2: MenuEntry[] = [];

    if (project){
        projectItems2 = [

            /* New Metamodel */

            {name: 'New metamodel', icon: icon['new'], function: () => createM2(project), keystroke: [Key.alt, Key.cmd, 'M']},

            /* New Model */
            {
                name: 'New model',
                icon: icon['new'],
                subItems: project.metamodels.filter(m2=>!!m2).map((m2, i)=>({
                    name: m2.name, function: () => createM1(project, m2), keystroke: []
                })),
                disabled: project.metamodels.length == 0
            },

            /* ----- */

            {name: 'divisor', function: () => {}, keystroke: []},

            /* Close */

            {name: 'Close', icon: icon['close'], function: () => {
                if (isProjectModified()) {
                    U.dialog('Close the project without saving?', 'close project', ()=>{
                        R.navigate('/allProjects');
                        Collaborative.client.off('pullAction');
                        Collaborative.client.disconnect();
                        SetRootFieldAction.new('collaborativeSession', false);
                        U.resetState();
                    });
                } else {
                    R.navigate('/allProjects');
                    Collaborative.client.off('pullAction');
                    Collaborative.client.disconnect();
                    SetRootFieldAction.new('collaborativeSession', false);
                    U.resetState();
                }
            }, keystroke: [Key.cmd, 'W']},

            /* ----- */

            {name: 'divisor', function: () => {}, keystroke: []},

            /* Save & Close */

            {name: 'Save & Close', icon: icon['close'], function: async () => {
                if (isProjectModified()) {
                    await ProjectsApi.save(project);
                }

                R.navigate('/allProjects');
                Collaborative.client.off('pullAction');
                Collaborative.client.disconnect();
                SetRootFieldAction.new('collaborativeSession', false);
                U.resetState();
            }, keystroke: []},

            /* Save */

            {name: 'Save', icon: icon['save'], function: async() => {
                await ProjectsApi.save(project);
            }, keystroke: [Key.cmd, 'S']},



            /* Download */

            {name: 'Download', icon: icon['download'], function: async() => {
                await ProjectsApi.save(project);
                U.download(`${project.name}.jjodel`, JSON.stringify(project.__raw));
            }, keystroke: []},



            /* ----- */

            {name: 'divisor', function: () => {}, keystroke: []},

            /* Help */

            {name: 'Help', icon: icon['help'], subItems: [
                {name: 'What\'s new', icon: icon['whats-new'], function: async() => {R.navigate("https://www.jjodel.io/whats-new/")}, keystroke: []},
                {name: 'divisor', function: async() => {}, keystroke: []},
                {name: 'Homepage', icon: icon['home'], function: async() => {R.navigate("https://www.jjodel.io/")}, keystroke: []},
                {name: 'Getting started', icon: icon['getting-started'], function: async() => {R.navigate("https://www.jjodel.io/getting-started/")}, keystroke: []},
                {name: 'User guide', icon: icon['manual'], function: async() => {R.navigate("https://www.jjodel.io/manual/")}, keystroke: []},
                {name: 'divisor', function: async() => {}, keystroke: []},
                {name: 'Legal terms', icon: icon['legal'], function: async() => {R.navigate("https://www.jjodel.io/terms-conditions-page/")}, keystroke: []}
            ],
            keystroke: []}
        ];
    }

    const dashboardItems2: MenuEntry[] = [

        {name: 'New project', icon: <i className="bi bi-plus-square"></i>, function:
            async()=>{
                R.navigate('/allProjects');
                await ProjectsApi.create('public', undefined, undefined, undefined, props.user?.projects);
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
            {name: 'What\'s new', icon: <i className="bi bi-clock"></i>, function: () => {R.navigate("https://www.jjodel.io/whats-new/", navigate)}, keystroke: []},
            {name: 'divisor', function: () => {}, keystroke: []},
            {name: 'Homepage', icon: <i className="bi bi-house"></i>, function: () => {R.navigate("https://www.jjodel.io/", navigate)}, keystroke: []},
            {name: 'Getting started', icon: <i className="bi bi-airplane"></i>, function: () => {R.navigate("https://www.jjodel.io/getting-started/", navigate)}, keystroke: []},
            {name: 'User guide', icon: <i className="bi bi-journals"></i>, function: () => {R.navigate("https://www.jjodel.io/manual/", navigate)}, keystroke: []},
            {name: 'divisor', function: () => {}, keystroke: []},
            {name: 'Legal terms', icon: <i className="bi bi-mortarboard"></i>, function: () => {R.navigate("https://www.jjodel.io/terms-conditions-page/", navigate)}, keystroke: []}
        ],
        keystroke: []},

        {name: 'About jjodel', icon: <i className="bi bi-info-square"></i>, function: () => {}, keystroke: []},
        {name: 'divisor', function: () => {}, keystroke: []},
        {name: 'Logout', icon: <i className="bi bi-box-arrow-right"></i>, function: async() => {
                await AuthApi.logout();
                R.navigate('/auth', true);
            }, keystroke: [Key.cmd, 'Q']}
    ];



    /* -- */

    const recentProjects: MenuEntry[] = [];
    const recentProjectsDisabled: MenuEntry[] = [];
    let user: LUser = L.fromPointer(DUser.current); // props.user || L.fromPointer(DUser.current);



    /*

        The following is used for toggling fullscreen mode from the View menu

    */

    const [fullscreen, setFullscreen] = useState(false);

    function isFullscreen() {
        return fullscreen;
    }

    function toggleFullScreen() {
        const elem = document.body;
        setFullscreen(U.toggleFullscreen(elem));
    }

    /*

        An error occurs in 'Recent projects' when a project is selected, then is saved - at this points all projects in user.projects are lost

    */

    /* retrieve all projects */

    // if (user.projects[0]) {
    //     localStorage.setItem('projects', JSON.stringify(user.projects));
    //     let projects = user.projects;
    // } else {
    //     let projects = JSON.parse(localStorage.getItem('projects') || '[]');
    // }


    /* -- */

    if (user?.projects) {

        user.projects
            .sort((a,b) => (b.lastModified > a.lastModified) ?  1 : -1)
            .slice(0,20)
            .map(p =>
                recentProjects.push({name: p.name, function: ()=>{alert(p.name)}, icon: icon['project']})
            );

        user.projects
            .sort((a,b) => (b.lastModified > a.lastModified) ?  1 : -1)
            .slice(0,20)
            .map(p =>
                recentProjectsDisabled.push({name: p.name, function: ()=>{alert(p.name)}, icon: icon['project'], disabled: true})
            );
    }

    let newModel: MenuEntry[] = [];

    if (project && project.metamodels.length > 0) {
        newModel.push({
            name: 'Model',
            icon: icon['model'],
            subItems: project.metamodels.filter(m2=>!!m2).map((m2, i)=>({
                name: m2.name, function: () => createM1(project, m2), keystroke: []
            }))
        });
    } else {
        newModel.push({
            name: 'Model',
            icon: icon['model'],
            disabled: true
        });
    }


    const isDashboard = !project;
    const isProject = !!project;

    const items: MenuEntry[] = [

        // Jjodel OK

        {name: 'Jjodel',
            subItems: [
                {name: 'About Jjodel',function: () => {AboutModal.open();}, icon: icon['jjodel']},
                {name: 'Roadmap',function: () => open('https://www.jjodel.io/roadmap/'), icon: icon['roadmap']},
                {name: 'divisor'},

                {name: 'Settings', function: ()=> alert(), icon: icon['settings'], disabled: true}, // TO-DO
                {name: 'divisor'},
                {name: 'Logout', function: async() => {
                        if (isProjectModified()) {
                            U.dialog('You are about to log out without saving your project. Do you want to proceed?', 'logout', async ()=>{
                                await AuthApi.logout();
                                R.navigate('/auth');
                            });
                        } else {
                            await AuthApi.logout();
                            R.navigate('/auth');
                        }},
                    icon: icon['logout']}
            ]},

        /* File */

        {name: 'File',
            subItems: [
                {name: 'New',function: () => {}, icon: icon['new'],
                    subItems: [
                        {name: 'Project', function: () => {}, icon: icon['project'], disabled: true},
                        isDashboard ? null : {name: 'Metamodel', icon: icon['metamodel'], function: ()=>{ project && createM2(project); }, keystroke: [Key.alt, Key.cmd, 'M']},
                        isDashboard ? null : newModel[0]
                    ]
                },
                /* Recent Projects OK - va sistemato il refersh dei progetti */
                {name: 'Recent Projects',function: () => {}, icon: icon['recent'], subItems: recentProjects},

                /* Import Project OK */
                isProject ? null : {name: 'Import Project', function: ProjectsApi.import, icon: icon['import']},
                {name: 'divisor'},

                /* Save Project OK */

                isDashboard ? null : {name: 'Save Project',
                    function: async () => {
                        if (project) {
                            try {
                                await ProjectsApi.save(project);
                            } catch (error: any) {
                                U.alert('e', 'Error while Saving Project', error.message);
                            }
                        }
                    }
                    , icon: icon['save'], keystroke: [Key.cmd, 'S']},

                /* Close Project OK */

                isDashboard ? null : {name: 'Close Project',function: async() => {
                        if (isProjectModified()) {
                            U.dialog('Close the project without saving?', 'close project', async()=>{
                                Collaborative.client.off('pullAction');
                                await Collaborative.client.disconnect();
                                SetRootFieldAction.new('collaborativeSession', false);
                                U.resetState();
                                R.navigate('/allProjects', true);
                            });
                        } else {
                            Collaborative.client.off('pullAction');
                            await Collaborative.client.disconnect();
                            SetRootFieldAction.new('collaborativeSession', false);
                            U.resetState();
                            R.navigate('/allProjects', true);
                        }
                    }, icon: icon['close'], keystroke: [Key.cmd, 'E']},

                /* Delete Project - vedere come fare  TEMPORARLY DISABLED */
                true as any ? null : {name: 'Delete Project', function: ()=>{}, icon: icon['delete'], disabled: true},

                /* Download Project OK */

                isDashboard ? null : {name: 'Download Project', function: async() => {
                        if (project) {
                            await ProjectsApi.save(project);
                            U.download(`${project.name}.jjodel`, JSON.stringify(project.__raw));
                        }
                    }, icon: icon['download']}
            ]},

        /* Edit: Damiano aggiungere funzioni undo/redo */

        isDashboard ? null : {name: 'Edit',
            subItems: [
                {name: 'Undo',function: () => {}, icon: icon['undo'], keystroke: [Key.cmd, 'Z']},
                {name: 'Redo',function: () => {}, icon: icon['redo'], keystroke: [Key.cmd, 'Y'], subItems:[{name:"i"}]},
                /*
                {name: 'Undo',function:()=>{undo(1)}, disabled:disabledUndo, icon: icon['undo'],
                    keystroke: [Key.cmd, 'Z'], subItems:hoverUndo},
                {name: 'Redo',function:()=>{redo(1)}, disabled:disabledRedo, icon: icon['redo'],
                    keystroke: [Key.shift, Key.cmd, 'Z'], subItems:hoverRedo},
                */
                {name: 'divisor'},
                {name: 'Add to Favorites', function: () => {}, icon: icon['favorite']}, // vedere in leftbar // TODO
                {name: 'Copy Public Link', function: () =>{}, icon: icon['link'], keystroke: [Key.cmd, Key.shift, 'S']} // vedere in scheda progetto // TODO
            ]
        },

        /* View - da fare */
        isDashboard ? null : {name: 'View',
            subItems: [
                {name: 'Zoom-in', function: ()=>{}, icon: icon['zoom-in'], disabled: true}, // TODO
                {name: 'Zoom-out', function: ()=>{}, icon: icon['zoom-out'], disabled: true}, // TODO

                {name: 'divisor'},
                {name: 'Toggle Grid', function: ()=>{}, icon: icon['toggle-grid'], disabled: true}, // TODO
                {name: 'Toggle Snap-to-Grid', function: ()=>{}, icon: icon['toggle-snap'], disabled: true}, // TODO

                {name: 'divisor'},
                {name: 'Show/Hide Sidebar', function: ()=>{}, icon: icon['sidebar'], disabled: true}, // TODO
                {name: 'Show/Hide Toolbar', function: ()=>{}, icon: icon['toolbar2'], disabled: true}, // TODO

                {name: `${isFullscreen() ? 'Exit Fullscreen Mode' : 'Fullscreen Mode'}`, function: ()=>{toggleFullScreen()}, icon: icon['fullscreen']},
                {name: 'Reset Layout', function: ()=>{}, icon: icon['reset-layout'], disabled: true} // TODO
            ]
        },
        /* ANALYZE - da fare */

        isDashboard ? null : {name: 'Analyze',
            subItems: [
                {name: 'Live Validation',function: () => {},icon: icon['validation'], disabled: true}, // TODO
                {name: 'Validate',function: () => {}, icon: icon['validate'], disabled: true}, // TODO
                {name: 'divisor'},
                {name: 'Analytics', function: () => {}, icon: icon['metrics'], disabled: true} // TODO

            ]
        },

        /* HELP ok */

        {name: 'Help',
            subItems: [
                {name: 'What\'s New in Jjodel',function: () => open("https://www.jjodel.io/whats-new/"),icon: <i className="bi bi-bell" />},
                {name: 'divisor'},
                {name: 'Homepage',function: () => open("https://www.jjodel.io"), icon: <i className="bi bi-house" />},
                {name: 'divisor'},
                {name: 'Learn Jjodel', function: () => open("https://www.jjodel.io/learn-jjodel/"), icon: icon['learn']},
                {name: 'Getting Started', function: ()=> open("https://www.jjodel.io/getting-started/"), icon: icon['getting-started']},
                {name: 'Video Tutorials', function: ()=> open("https://www.jjodel.io/video-tutorials/"), icon: icon['video']},
                {name: 'User Guide', function: ()=> open('https://www.jjodel.io/getting-started/'), icon: <i className="bi bi-journal-text" />},
                {name: 'Glossary', function: ()=> open('https://www.jjodel.io/glossary/'), icon: <i className="bi bi-book" />},
                {name: 'FAQ',function: () => {}, icon: icon['faq'], disabled: true},
                {name: 'divisor'},
                {name: 'Support', function: ()=>{}, icon: icon['support'],
                    subItems: [
                        {name: 'Report a Bug', function: ()=>{}, icon: icon['report-bug'], disabled: true}, // TODO
                        {name: 'Request a Feature', function: ()=>{}, icon: icon['feature-request'], disabled: true}, // TODO
                        {name: 'Contact', function: ()=>{}, icon: icon['contact'], disabled: true} // TODO
                    ]}
            ]}

    ];


    let itemsToRegister: MenuEntry[] = items; // [...items]; // [...dashboardItems, ...projectItems];
    let keybindings = U.flattenObjectByKey(itemsToRegister, 'subItems')
        .filter(e=> e && (e.keystroke?.length));
    Keystrokes.register('#root', keybindings);

    type MenuProps = {
        title?: string;
        items: MenuEntry[];
    }

    const MainMenu = (props: MenuProps) => {
        return(<>
                { props.items.map(m => !m || !m.subItems?.length ? null : <Submenu key={m.name} title={m.name} items={m.subItems} />) }
            </>
        );
    }

    const Submenu = (props: MenuProps) => {
        return (<div className='nav-hamburger hoverable inline' key={props.title} tabIndex={0}>
            {props.title && <span className={'menu-title'} key={'title'}>{props.title}</span>}
            <div className={'content context-menu'} key={'content'}>
                <ul>
                    {props.items && props.items.map((i, index) => makeEntry(i, index))}
                </ul>
            </div>
        </div>
    )}

    const MainMenu2 = (props: MenuProps) => {

        return(
            <div className='nav-hamburger hoverable' tabIndex={0}>
                <i className="bi bi-grid-3x3-gap-fill list"></i>
                <div className={'content context-menu'}>
                    <ul>
                        { props.items.map((i, index) => makeEntry(i, index)) }
                    </ul>
                </div>
            </div>
        );
    };

    const MainLogo = () => {
        let toggleDebug = (e: any)=>{
            e.preventDefault();
            TRANSACTION('debug', ()=>SetRootFieldAction.new('debug', !props.debug), props.debug, !props.debug);
            U.debug = !props.debug;
        }
        return (
        <div className='nav-logo'>
            <div className={"aligner"}>

                {props.debug ?
                    <div className='logo-on' onContextMenu={toggleDebug}></div>
                    :
                    <div className='logo' onContextMenu={toggleDebug}></div>
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
                           windoww.advanced = v;
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
                        <Item icon={icon['dashboard']} action={async() => {
                            Collaborative.client.off('pullAction');
                            await Collaborative.client.disconnect();
                            SetRootFieldAction.new('collaborativeSession', false);
                            U.resetState();
                            R.navigate('/allProjects');
                        }}>Dashboard</Item>
                        <Divisor />
                        <Item icon={icon['profile']} action={()=> {
                            R.navigate('/account');
                            U.resetState();
                        }}>Profile</Item>
                        <Item icon={icon['settings']} action={(e)=> {alert('')}}>Settings</Item>
                        <Divisor />
                        <Item icon={icon['logout']} action={async () => {
                            if (isProjectModified()) {
                                U.dialog('You are about to log out without saving your project. Do you want to proceed?', 'logout', async ()=>{
                                    await AuthApi.logout();
                                    R.navigate('/auth');
                                });
                            } else {
                                await AuthApi.logout();
                                R.navigate('/auth');
                            }
                        }}>Logout</Item>
                    </Menu>
                </div>
            </div>
        </>);
    }

    return(<>
        <nav className={'w-100 nav-container d-flex'} style={{zIndex: 99}}>
            <MainMenu items={items} />
            <MainLogo />
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

const Navbar = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <NavbarConnected {...{...props, children}} />;
}

export {Navbar};
