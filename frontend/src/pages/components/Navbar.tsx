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
    R,
    Pointer, Pointers, Log
} from '../../joiner';

import {icon} from '../components/icons/Icons';

import {useNavigate} from 'react-router-dom';

import React, {Component, Dispatch, ReactElement, ReactNode, useState} from 'react';
import {FakeStateProps} from '../../joiner/types';
import {connect} from 'react-redux';
import {AuthApi, ProjectsApi} from '../../api/persistance';
import TabDataMaker from "../../../src/components/abstract/tabs/TabDataMaker";
import DockManager from "../../../src/components/abstract/DockManager";

import {Divisor, Item, Menu} from '../components/menu/Menu';

import Collaborative from "../../components/collaborative/Collaborative";
import { isProjectModified } from '../../common/libraries/projectModified';
import { AboutModal } from './about/About';
import {MetricsPanelManager, showMetrics, toggleMetrics} from '../../components/metrics/Metrics';

import {Undoredocomponent} from "../../components/topbar/undoredocomponent";
import {BEGIN, COMMIT, END} from "../../redux/action/action";
import {Tooltip} from "../../components/forEndUser/Tooltip";
import {VersionFixer} from "../../redux/VersionFixer";
import {PinnableDock} from "../../components/dock/MyRcDock";


let windoww = window as any;

export function createM2(project: LProject) {
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
function makeEntry(i: MenuEntry|null|undefined, index: number) {
    if (!i) return null;
    let wasdis = i.disabled;
    if (i.function === placeholder) {
        if (!allowPlaceholders) return null;
        else i.disabled = true;
    }

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
            <li className={hasSubItems ? "hoverable" : ""} key={i.id||i.name} tabIndex={0} onClick={()=>i.function?.()} id={i.id ? 'navbar_'+i.id : undefined}>
                <label className={`highlight ${i.disabled ? 'disabled' : ''}`}>
                    <span>{i.icon || <i className="bi bi-app hidden"/>} {i.jsx || <span>{i.name}</span>}</span>
                    {!i.disabled && slength > 0 ?
                        <i className='bi bi-chevron-right icon-expand-submenu'/> :
                        getKeyStrokes(i.keystroke)
                    }
                </label>
            {hasSubItems &&
                <div className='content right'>
                    <ul className='context-menu right'>
                        {i.subItems && i.subItems.map((si, index) => {
                            if (i.disabled && si) si.disabled = true; // if parent is disabled, so are childrens
                            return makeEntry(si, index)
                        })}
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
    id?: string,
    name: string,
    jsx?: ReactNode,
    icon?: any,
    function?: ()=>any,
    keystroke?: string[],
    subItems?: (MenuEntry|undefined|null)[],
    disabled?: boolean;
} | null;

type DProps = {}

windoww.updateDebuggerComponent = () => {};
function DebuggerComponent(props: DProps) {
    let [depth, setDepth] = useState(windoww.transactionStatus.transactionDepthLevel);
    // let depth = windoww.transactionStatus.transactionDepthLevel;
    windoww.updateDebuggerComponent = () => {
        let d = windoww.transactionStatus.transactionDepthLevel;
        // removed if bc during a transaction setState gets called twice going back. so the set going back is not executed.
        /*if (d !== oldDepth) */setDepth(d);
    }

    return <section className={'debugger'}><>
        <Tooltip tooltip={'Step-By-Step'} inline={true} position={'bottom'}>
            <label onClick={()=> {
                if (depth <= 1) BEGIN(); // pause before triggering step-by-step
                else COMMIT();
            }} className={'debug-icon me-1'}>{icon.stepsquare}</label>
        </Tooltip>
        <Tooltip tooltip={'Pause actions'} inline={true} position={'bottom'}>
            <label className={'debug-icon me-1' + (depth > 1 ? ' disabled' : '')} onClick={()=> BEGIN()}>{icon.pausesquare}</label>
        </Tooltip>
        <Tooltip tooltip={'Resume actions (depth: ' + (depth-1) + ')'} inline={true} position={'bottom'}>
            <label className={'debug-icon me-1' + (depth <= 1 ? ' disabled' : '')} onClick={()=> END()}>{icon.playsquare}</label>
        </Tooltip></>
    </section>
}

const CloseProject = async()=> {
    await Collaborative.disconnect();
    U.resetState();
    R.navigate('/allProjects', true);
};

function placeholder(){}
const allowPlaceholders = true;
function open (url: string) { window.open(url, '_blank'); }


function NavbarComponent(props: AllProps) {
    const [debuggerr, setDebugger] = useState(false);
    const navigate = useNavigate();
    let user: LUser = L.fromPointer(DUser.current);
    let project: LProject | undefined = user?.project || undefined;
    let projectid = U.getProjectID_URL();
    Log.eDev(projectid !== project?.id, 'wrong project setup in navbar', {projectid, project});
    let metamodels: LModel[] = L.fromArr(props.metamodels);
    globalProject = project;
    const Key = Keystrokes;
    const recentProjects: MenuEntry[] = [];
    const [isFullscreen, setFullscreen] = useState(false);
    const toggleFullScreen = () => setFullscreen(U.toggleFullscreen(document.body));

    if (user?.projects) {
        user.projects
            .sort((a, b) => (b.lastModified > a.lastModified) ?  1 : -1)
            .slice(0,20)
            .forEach(p => {
                    let pid = Pointers.from(p);
                    recentProjects.push({
                        icon: icon['project'], name: p.name, disabled: pid === projectid,
                        function: ()=> R.navigate('/project?id=' + pid)
                    })
                }
            );
    }

    let newModel: MenuEntry;
    if (project && metamodels.length > 0) {
        newModel = {
            id: 'new_model',
            name: 'Model',
            icon: icon['model'],
            subItems: metamodels.map((m2, i)=>({
                name: props.mmNames[i], function: () => createM1(project, m2), keystroke: [], id: 'mmid_'+ props.metamodels[i],
            }))
        };
    } else {
        newModel = {
            id: 'new_model',
            name: 'Model',
            icon: icon['model'],
            disabled: true
        }
    }

    const isDashboard = !project;
    const isProject = !!project;
    const isFavorite = project?.isFavorite;

    const saveLayoutItems: MenuEntry[] = [
    ] as any;
    if (props.autosaveLayout) {
        saveLayoutItems.push({name: 'Turn off auto-save', function: () => PinnableDock.toggleAutosave(false), icon: <i className="bi bi-lightning-charge-fill"/>});
    } else {
        saveLayoutItems.push({name: 'Turn on auto-save', function: ()=>PinnableDock.toggleAutosave(true), icon: <i className="bi bi-lightning-charge"/>});
        saveLayoutItems.push({name: 'Save manually', function: () => PinnableDock.save(), icon: icon['save']});
    }

    let lay = props.lay;
    const items: MenuEntry[] = [

        // Jjodel OK

        {name: 'Jjodel',
            subItems: [
                {name: 'About', jsx: <span style={{height: '16px'}}>About Jjodel</span>, function: () => {AboutModal.open();}, icon: icon['jjodel']},
                {name: 'Roadmap',function: () => open('https://www.jjodel.io/roadmap/'), icon: icon['roadmap']},
                // {name: 'divisor'},

                {name: 'Project Settings', function: placeholder, icon: icon['settings'], disabled: true},
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
                isDashboard ? null :
                {name: 'New', icon: icon['new'],
                    subItems: [
                        {name: 'Project', function: placeholder, icon: icon['project'], disabled: true},
                        {name: 'Metamodel', icon: icon['metamodel'], function: ()=> { project && createM2(project); }, keystroke: [Key.alt, Key.cmd, 'M']},
                        newModel
                    ]
                },
                {name: 'Recent Projects', icon: icon['recent'], subItems: recentProjects},

                /* Import Project OK */
                isProject ? null : {name: 'Import Project', function: ProjectsApi.import, icon: icon['import']},
                isDashboard ? null : {name: 'divisor'},

                /* Save Project OK */

                isDashboard ? null : {name: 'Save Project',
                    function: async () => {
                        if (project) {
                            try {
                                SetRootFieldAction.new('isLoading', true);
                                const maxWait = 10 * 1000;
                                let timeout = setTimeout(()=> {
                                    SetRootFieldAction.new('isLoading', false);
                                    U.alert('e', 'Request timed out', <>Verify your connection or&nbsp;
                                        <a href="mailto:info@jjodel.io?subject=Save%20timeout&body=Describe%20your%20actions%20prior%20the%20error%2C%20and%20attach%20your%20latest%20savefile%20if%20possible.">contact our support</a></>);
                                }, maxWait);
                                await ProjectsApi.save(project);
                                clearTimeout(timeout);
                                SetRootFieldAction.new('isLoading', false);
                            } catch (error: any) {
                                U.alert('e', 'Error while Saving Project', error.message);
                            }
                        }
                    }
                    , icon: icon['save'], keystroke: [Key.cmd, 'S']},

                isDashboard ? null : {name: 'Download Project', function: async()=> {
                        if (project) {
                            let dproject = await ProjectsApi.save(project);
                            U.download(`${project.name}.jjodel`, JSON.stringify(dproject));
                        }
                    }, icon: icon['download']},

                isDashboard ? null : {name: 'Close Project', function: async() => {
                        if (isProjectModified()) U.dialog('Close the project without saving?', 'close project', CloseProject);
                        else CloseProject();
                    }, icon: icon['close'], keystroke: [Key.cmd, 'E']},

                /* Delete Project - vedere come fare  TEMPORARLY DISABLED */
                isDashboard ? null : {name: 'Delete Project', function: placeholder, icon: icon['delete'], disabled: true},

            ]},


        isDashboard ? null : {name: 'Edit',
            subItems: [
                {name: 'Undo', icon: icon['undo'], keystroke: [Key.cmd, 'Z']},
                {name: 'Redo', icon: icon['redo'], keystroke: [Key.cmd, 'Y'], subItems:[{name:"i"}]},
                /*
                {name: 'Undo',function:()=>{undo(1)}, disabled:disabledUndo, icon: icon['undo'],
                    keystroke: [Key.cmd, 'Z'], subItems:hoverUndo},
                {name: 'Redo',function:()=>{redo(1)}, disabled:disabledRedo, icon: icon['redo'],
                    keystroke: [Key.shift, Key.cmd, 'Z'], subItems:hoverRedo},
                */
                {name: 'divisor', function: placeholder},
                {name: (isFavorite ? 'Remove from' : 'Add to') +' Favorites', function: ()=> ProjectsApi.favorite(project?.__raw as DProject),
                    icon: icon[isFavorite ? 'favoriteFill' : 'favorite']},
                {name: 'Copy Public Link', function: placeholder, icon: icon['link'], keystroke: [Key.cmd, Key.shift, 'S']} // vedere in scheda progetto // TODO
            ]
        },

        /* View - da fare */
        isDashboard ? null : {name: 'View',
            subItems: [
                {name: 'Zoom-in', function: placeholder, icon: icon['zoom-in'], disabled: true},
                {name: 'Zoom-out', function: placeholder, icon: icon['zoom-out'], disabled: true},
                {name: 'divisor', function: placeholder},
                // todo: layout needs persistence support. then on versionfixer correct user.layout == undefined and project.layout same
                {name: 'Save layout', disabled: true,
                    icon: <i className="bi bi-columns-gap"/>,
                    subItems: saveLayoutItems
                },
                {name: 'Load layout', disabled: true,
                    icon: <i className="bi bi-columns-gap"/>,
                    subItems: [
                        {name: 'Default', function: ()=> PinnableDock.load('Default'), icon: icon['loadl']},
                        {name: 'Project layouts',
                            subItems: [
                                {name: '1', function: ()=> PinnableDock.load('1', 'project'), icon: lay==='p1' ? icon['loadl'] : icon['check']},
                                {name: '2', function: ()=> PinnableDock.load('2', 'project'), icon: lay==='p2' ? icon['loadl'] : icon['check']},
                                {name: '3', function: ()=> PinnableDock.load('3', 'project'), icon: lay==='p3' ? icon['loadl'] : icon['check']},
                            ]
                        },
                        {name: 'User layouts', // todo: dove li memorizzo?
                            /*
                            sul progetto = stessi layout per tutti gli utenti con quel progetto.
                            su user = global = sempre lo stesso layout per ogni progetto
                            mix progetto-utente per fare in modo che ogni combinazione possa avere un layout diverso?
                            collego 1+ layout ad ogni viewpoint?
                            */
                            subItems: [
                                {name: '1', function: ()=> PinnableDock.load('1', 'user'), icon: lay==='u1' ? icon['loadl'] : icon['check']},
                                {name: '2', function: ()=> PinnableDock.load('2', 'user'), icon: lay==='u2' ? icon['loadl'] : icon['check']},
                                {name: '3', function: ()=> PinnableDock.load('3', 'user'), icon: lay==='u3' ? icon['loadl'] : icon['check']},
                            ]
                        }
                    ]
                },

                {name: 'divisor', function: placeholder},
                {name: 'Show/Hide Sidebar', function: placeholder, icon: icon['sidebar'], disabled: true},
                {name: 'Show/Hide Toolbar', function: placeholder, icon: icon['toolbar2'], disabled: true},
                {name: `${isFullscreen ? 'Exit Fullscreen Mode' : 'Fullscreen Mode [F11]'}`, function: toggleFullScreen, icon: icon['fullscreen']},
            ]
        },
        /* ANALYZE - da fare */

        isDashboard ? null : {name: 'Analyze',
            subItems: [
                {name: 'Live Validation', function: placeholder, icon: icon['validation'], disabled: true},
                {name: 'Validate', function: placeholder, icon: icon['validate'], disabled: true},
                {name: 'divisor', function: placeholder},
                {name: 'M2 Analytics', function: ()=> toggleMetrics(), icon: icon['metrics']},
                {name: debuggerr ? 'Hide debugger' : 'Debug loops', function: ()=> setDebugger(!debuggerr), icon: icon[debuggerr ? 'eyeslash' : 'eye']},
                {name: 'Check integrity', function: ()=> VersionFixer.autocorrect(undefined, true, true), icon: icon['tools']},
            ]
        },

        /* HELP ok */

        {name: 'Help',
            subItems: [
                {name: 'What\'s New in Jjodel',function: ()=> open("https://www.jjodel.io/whats-new/"),icon: <i className="bi bi-bell" />},
                {name: 'divisor'},
                {name: 'Homepage',function: ()=> open("https://www.jjodel.io"), icon: <i className="bi bi-house" />},
                {name: 'divisor'},
                {name: 'Learn Jjodel', function: ()=> open("https://www.jjodel.io/learn-jjodel/"), icon: icon['learn']},
                {name: 'Getting Started', function: ()=> open("https://www.jjodel.io/getting-started/"), icon: icon['getting-started']},
                {name: 'Video Tutorials', function: ()=> open("https://www.jjodel.io/video-tutorials/"), icon: icon['video']},
                {name: 'User Guide', function: ()=> open('https://www.jjodel.io/getting-started/'), icon: <i className="bi bi-journal-text" />},
                {name: 'Glossary', function: ()=> open('https://www.jjodel.io/glossary/'), icon: <i className="bi bi-book" />},
                {name: 'FAQ', function: placeholder, icon: icon['faq'], disabled: true},
                {name: 'divisor'},
                {name: 'Support', icon: icon['support'],
                    subItems: [
                        {name: 'Report a Bug', function: placeholder, icon: icon['report-bug'], disabled: true}, // TODO
                        {name: 'Request a Feature', function: placeholder, icon: icon['feature-request'], disabled: true}, // TODO
                        {name: 'Contact', function: placeholder, icon: icon['contact'], disabled: true} // TODO
                    ]}
            ]}

    ];


    let itemsToRegister: MenuEntry[] = items; // [...items]; // [...dashboardItems, ...projectItems];
    let keybindings = U.flattenObjectByKey(itemsToRegister, 'subItems')
        .filter(e=> e && (e.keystroke?.length));
    Keystrokes.register('#root', keybindings);

    type MenuProps = {
        title?: string;
        items: (MenuEntry|null|undefined)[];
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
                    {props.items && props.items.map((i, index) => i ? makeEntry(i, index) : null)}
                </ul>
            </div>
        </div>
    )}

    const MainLogo = ()=> {
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

    const Commands = ()=> {
        return (<section className='nav-commands d-flex'>
            {project && <>
                {debuggerr ? <DebuggerComponent /> : null}
                <label className='text-end d-flex'>
                <span className={"my-auto me-1"}>{props.advanced ? "advanced mode" : "basic mode"}</span>
                <Input type="toggle"
                       className={"my-auto"}
                       style={{fontSize:'1.25em'}}
                       setter={(v) => {
                           SetRootFieldAction.new('advanced', v);
                           windoww.advanced = v;
                       }}
                       getter={()=> props.advanced}/>
                </label>
            </>
            }
        </section>);
    };

    const UserMenu = ()=> {
        return (<>
        <div className='text-end nav-side' id={'navusermenu'}>
                <div style={{float: 'right', left: '300px!important', marginTop: '2px'}}>
                    <Menu position={'left'}>
                        <Item icon={icon['dashboard']} action={async()=> {
                            Collaborative.client.off('pullAction');
                            await Collaborative.client.disconnect();
                            U.resetState();
                            R.navigate('/allProjects');
                        }}>Dashboard</Item>
                        <Divisor />
                        <Item icon={icon['profile']} action={()=> {
                            R.navigate('/account');
                            U.resetState();
                        }}>Profile</Item>
                        {/*makeEntry({icon: icon['settings'], function: placeholder, disabled: true, name: 'User Settings'}, 999)*/}
                        {<Item icon={icon['settings']} action={placeholder} disabled={true}>User Settings</Item>}
                        <Divisor />
                        <Item icon={icon['logout']} action={async ()=> {
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
        <nav id={'navbar'} className={'w-100 nav-container d-flex'} style={{zIndex: 99}}>
            <MainMenu items={items} />
            <MainLogo />
            <UserMenu />
            <Commands />
            <User />
        </nav>
    </>);
}

interface OwnProps {}
interface StateProps {
    user: Pointer<DUser>;
    metamodels: Pointer<DModel>[];
    mmNames: string[];
    version: DState['version'];
    advanced: boolean;
    debug: boolean;
    lay: string; // layout selected shortened, first char is category, second is index. like u1 = user 1, p2 = project 2
    autosaveLayout: boolean;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    // important: use only pointers here, do not set L elements in props.
    // otherwise navbar will update at EVERY state change.
    // other than performance, this would make "Analyze / Debug loops" impossible to click in case of loops.
    // because the dropdown is constantly re-created and disappears.
    ret.user = DUser.current;
    ret.metamodels = state.m2models;
    ret.mmNames = L.fromArr(ret.metamodels).map((mm: any) => mm?.name); // just to force update in case of renaming
    ret.version = state.version;
    ret.advanced = state.advanced;
    ret.debug = state.debug;
    ret.lay = PinnableDock.saveSlotCategory[0] + PinnableDock.saveSlotName[0];
    ret.autosaveLayout = PinnableDock.isAutosave();
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
