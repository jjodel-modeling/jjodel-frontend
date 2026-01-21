import './style.scss';
import './navbar.scss';
import jjodelLogo from '../../static/img/logo-light-150.png';
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

import {Divisor, Item, Menu, UserHeader, SubMenu, SubMenuItem} from '../components/menu/Menu';

import Collaborative from "../../components/collaborative/Collaborative";
import { isProjectModified } from '../../common/libraries/projectModified';
import { AboutDialog, AboutDialogController } from './about/AboutDialog';
import {MetricsPanelManager, showMetrics, toggleMetrics} from '../../components/metrics/Metrics';

import {Undoredocomponent} from "../../components/topbar/undoredocomponent";
import {BEGIN, CollabRefreshAction, COMMIT, END} from "../../redux/action/action";
import {Tooltip} from "../../components/forEndUser/Tooltip";
import {VersionFixer} from "../../redux/VersionFixer";
import {PinnableDock} from "../../components/dock/MyRcDock";
import ActivityLogger from '../../services/ActivityLogger';
import { ActivityType } from '../../types/activity';
import { LayoutMode, getSavedLayoutMode, saveLayoutMode, getInitialPanelWidth } from '../../components/abstract/Dock';


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

    // Log activity
    ActivityLogger.log({
        type: ActivityType.METAMODEL_CREATED,
        projectId: project.id,
        projectName: project.name || 'Unnamed Project',
        entityId: dModel.id,
        entityName: name,
    });
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

    // Log activity
    ActivityLogger.log({
        type: ActivityType.MODEL_CREATED,
        projectId: project.id,
        projectName: project.name || 'Unnamed Project',
        entityId: dModel.id,
        entityName: name,
    });
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



/* User badge component - now used as menu trigger */
const UserBadge = (props: {name: string, initials: string}) => {
    return (
        <div className={'user-badge'} title={props.name}>
            {props.initials.toUpperCase()}
        </div>
    );
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
    // Disabilita il prompt del browser PRIMA di navigare
    U.disableUnsavedChangesWarning();
    U.isProjectModified = false;
    
    await Collaborative.disconnect();
    U.resetState();
    
    // Usa setTimeout per assicurarti che il flag sia impostato prima della navigazione
    setTimeout(() => {
        R.navigate('/allProjects', true);
    }, 0);
};

const SaveAndCloseProject = async(project: LProject | undefined) => {
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
            U.isProjectModified = false;
            SetRootFieldAction.new('isLoading', false);
        } catch (error: any) {
            U.alert('e', 'Error while Saving Project', error.message);
            SetRootFieldAction.new('isLoading', false);
            return; // Non chiudere se il salvataggio fallisce
        }
    }
    
    // Disabilita il prompt del browser e chiudi
    U.disableUnsavedChangesWarning();
    await CloseProject();
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

    // Layout mode state
    const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => {
        const mode = getSavedLayoutMode();
        // Apply initial layout mode to body
        document.body.setAttribute('data-layout-mode', mode);
        return mode;
    });

    const handleLayoutModeChange = (mode: LayoutMode) => {
        setLayoutModeState(mode);
        saveLayoutMode(mode);
        // Apply layout mode to body for CSS targeting
        document.body.setAttribute('data-layout-mode', mode);
        // Dispatch event to notify dock to update
        window.dispatchEvent(new CustomEvent('jjodel:layout-mode-change', { detail: { mode } }));
    };

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
                {name: 'About Jjodel', function: () => {AboutDialogController.open();}, icon: icon['jjodel']},
                {name: 'Roadmap',function: () => open('https://www.jjodel.io/roadmap/'), icon: icon['roadmap']},
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
    if (isProjectModified()) {
        U.dialog2(
            'Unsaved changes',
            'You have unsaved changes. What do you want to do?',
            [
                { txt: 'Cancel' },
                { txt: "Don't save", action: CloseProject as any },
                { txt: 'Save & Exit', action: (() => SaveAndCloseProject(project)) as any }
            ]
        );
    } else {
        CloseProject();
    }
}, icon: icon['close'], keystroke: [Key.cmd, 'E']},

                /* Delete Project - vedere come fare  TEMPORARLY DISABLED */
                isDashboard ? null : {name: 'Delete Project', function: placeholder, icon: icon['delete'], disabled: true},

            ]},


        /* Edit - always visible, items disabled on dashboard */
        {name: 'Edit',
            subItems: [
                {name: 'Undo', icon: icon['undo'], keystroke: [Key.cmd, 'Z'], disabled: isDashboard},
                {name: 'Redo', icon: icon['redo'], keystroke: [Key.cmd, 'Y'], subItems:[{name:"i"}], disabled: isDashboard},
                {name: 'divisor', function: placeholder},
                {name: (isFavorite ? 'Remove from' : 'Add to') +' Favorites', function: ()=> ProjectsApi.favorite(project?.__raw as DProject),
                    icon: icon[isFavorite ? 'favoriteFill' : 'favorite'], disabled: isDashboard},
                {name: 'Copy Public Link', function: placeholder, icon: icon['link'], keystroke: [Key.cmd, Key.shift, 'S'], disabled: true}
            ]
        },

        /* View - always visible, items disabled on dashboard */
        {name: 'View',
            subItems: [
                {name: props.advanced ? 'Switch to Basic Mode' : 'Switch to Advanced Mode',
                    function: () => {
                        const newMode = !props.advanced;
                        SetRootFieldAction.new('advanced', newMode);
                        windoww.advanced = newMode;
                        // Also update localStorage for persistence
                        localStorage.setItem('jjodel.interfaceMode', newMode ? 'advanced' : 'basic');
                        U.interfaceMode = newMode ? 'advanced' : 'basic';
                        // Show toast notification
                        U.alert('i', newMode ? 'Advanced Mode' : 'Basic Mode',
                            newMode ? 'All features and options are now visible' : 'Simplified interface active');
                    },
                    icon: props.advanced ? <i className="bi bi-sliders" /> : <i className="bi bi-lightning-charge" />,
                    keystroke: [Key.cmd, Key.shift, 'M']
                },
                {name: 'divisor', function: placeholder},
                {name: 'Zoom-in', function: placeholder, icon: icon['zoom-in'], disabled: true},
                {name: 'Zoom-out', function: placeholder, icon: icon['zoom-out'], disabled: true},
                {name: 'divisor', function: placeholder},
                {name: 'Save layout', disabled: true,
                    icon: <i className="bi bi-columns-gap"/>,
                    subItems: saveLayoutItems
                },
                {name: 'Load layout', disabled: isDashboard,
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
                        {name: 'User layouts',
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

        /* Tools - always visible */
        {name: 'Tools',
            subItems: [
                ...(isDashboard || metamodels.length === 0 ? [
                    {name: 'No metamodel tools', disabled: true, icon: <i className="bi bi-tools" />}
                ] : [
                    {name: 'Metamodel Tools', icon: <i className="bi bi-tools" />, disabled: true,
                        subItems: metamodels.map((m2, i) => ({
                            name: props.mmNames[i] || 'Unnamed',
                            icon: icon['metamodel'],
                            disabled: true
                        }))
                    },
                    {name: 'Custom Tools', icon: <i className="bi bi-gear" />, disabled: true}
                ]),
                // Debug Mode toggle - always visible (independent from Advanced Mode)
                {name: 'divisor'},
                {name: props.debug ? 'Disable Debug Mode' : 'Enable Debug Mode',
                    function: () => {
                        TRANSACTION('debug', ()=>SetRootFieldAction.new('debug', !props.debug), props.debug, !props.debug);
                        U.debug = !props.debug;
                    },
                    icon: <i className={`bi ${props.debug ? 'bi-bug-fill' : 'bi-bug'}`} />
                }
            ]
        },

        /* Analyze - always visible, some items only in advanced mode */
        {name: 'Analyze',
            subItems: [
                {name: 'Live Validation', function: placeholder, icon: icon['validation'], disabled: true},
                {name: 'Validate', function: placeholder, icon: icon['validate'], disabled: true},
                // Advanced-only items below
                ...(props.advanced ? [
                    {name: 'divisor', function: placeholder},
                    {name: 'M2 Analytics', function: ()=> toggleMetrics(), icon: icon['metrics'], disabled: isDashboard},
                    {name: debuggerr ? 'Hide debugger' : 'Debug loops', function: ()=> setDebugger(!debuggerr), icon: icon[debuggerr ? 'eyeslash' : 'eye'], disabled: isDashboard},
                    {name: 'Check integrity', function: ()=> VersionFixer.autocorrect(undefined, true, true), icon: icon['tools'], disabled: isDashboard},
                ] : []),
            ]
        },

        // Help is now a separate component (HelpMenu) on the right side

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
        return (
        <div className='nav-logo' onClick={() => R.navigate('/allProjects')}>
            <div className={"aligner"}>
                <img
                    src={jjodelLogo}
                    alt="Jjodel"
                    className="nav-logo__image"
                />
            </div>
        </div>
        );
    }

    // Help dropdown menu - matches spec design
    const HelpMenu = () => {
        const helpItems: MenuEntry[] = [
            {name: 'What\'s New in Jjodel', function: ()=> open("https://www.jjodel.io/whats-new/"), icon: <i className="bi bi-bell" />},
            {name: 'Homepage', function: ()=> open("https://www.jjodel.io"), icon: <i className="bi bi-house" />},
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
                    {name: 'Report a Bug', function: placeholder, icon: icon['report-bug'], disabled: true},
                    {name: 'Request a Feature', function: placeholder, icon: icon['feature-request'], disabled: true},
                    {name: 'Contact', function: placeholder, icon: icon['contact'], disabled: true}
                ]}
        ];

        return (
            <div className='nav-hamburger hoverable inline help-menu' tabIndex={0}>
                <span className={'menu-title'}>
                    <i className="bi bi-question-circle" style={{marginRight: '6px'}} />
                    Help
                </span>
                <div className={'content context-menu'}>
                    <ul>
                        {helpItems.map((i, index) => i ? makeEntry(i, index) : null)}
                    </ul>
                </div>
            </div>
        );
    }

    const Commands = ()=> {
        return (<section className='nav-commands d-flex'>
            {project && debuggerr ? <DebuggerComponent /> : null}
        </section>);
    };

    // Jodie AI Assistant button
    const JodieButton = () => {
        const openJodie = () => {
            window.dispatchEvent(new CustomEvent('jodie:open'));
        };

        return (
            <button
                className="jodie-trigger-btn"
                onClick={openJodie}
                title="Ask Jodie - AI Assistant"
            >
                <i className="bi bi-chat-heart" />
                <span>Jodie</span>
            </button>
        );
    };

    // Layout Controls - Split/Sidebar toggle buttons + User Menu
    // Only visible when editing metamodels and model instances (not on project overview)
    const LayoutControls = () => {
        // Check if the editor is manipulating metamodels and model instances
        // This is true when a project is loaded AND there are metamodels in the editor
        const isEditingModels = !!project && metamodels.length > 0;
        if (!isEditingModels) return null;

        // Also check if there are actual editor tabs open (not just the ModelsSummary tab)
        // The dock has a 'models' group that contains ModelsSummary + any open metamodel/model tabs
        // We only show layout controls when there are tabs open beyond just the summary
        const dock = DockManager.dock;
        if (dock) {
            const layout = dock.getLayout();
            // Find the 'models' panel in the layout
            const modelsPanel = layout?.dockbox?.children?.[0];
            if (modelsPanel && 'tabs' in modelsPanel) {
                // If there's only 1 tab (ModelsSummary), we're in the project overview page
                // Layout controls should only appear when editing a metamodel/model (2+ tabs)
                if (modelsPanel.tabs.length <= 1) {
                    return null;
                }
            }
        }

        return (<>
            <div className="navbar__layout-controls">
                
                <Tooltip tooltip="50% - 50%" inline={true} position="bottom" offsetY={8}>
                    <button
                        className={`layout-btn ${layoutMode === 'split' ? 'layout-btn--active' : ''}`}
                        onClick={() => handleLayoutModeChange('split')}
                        aria-label="Split view"
                    >
                        <i className="bi bi-layout-split" />
                    </button>
                </Tooltip>
                <Tooltip tooltip="70% - 30%" inline={true} position="bottom" offsetY={8}>
                    <button
                        className={`layout-btn ${layoutMode === 'sidebar' ? 'layout-btn--active' : ''}`}
                        onClick={() => handleLayoutModeChange('sidebar')}
                        aria-label="Sidebar view"
                    >
                        <i className="bi bi-layout-sidebar-reverse" />
                    </button>
                </Tooltip>
                <Tooltip tooltip="Fullscreen" inline={true} position="bottom" offsetY={8}>
                    <button
                        className={`layout-btn ${layoutMode === 'canvas-only' ? 'layout-btn--active' : ''}`}
                        onClick={() => handleLayoutModeChange('canvas-only')}
                        aria-label="Fullscreen"
                    >
                        <i className="bi bi-fullscreen" />
                    </button>
                </Tooltip>
            </div>
            </>
        );
    };

    const UserMenu = ()=> {
        const userName = `${user?.name || ''} ${user?.surname || ''}`.trim();
        const userEmail = user?.email || '';
        const initials = userName.split(' ').map(n => n[0] || '').join('');

        // Theme state - read from document attribute
        const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
            const stored = localStorage.getItem('theme');
            if (stored === 'dark' || stored === 'light') return stored;
            return document.documentElement.getAttribute('data-theme') as 'light' | 'dark' || 'light';
        });

        const setTheme = (newTheme: 'light' | 'dark') => {
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            setThemeState(newTheme);
        };

        return (
            <div className='user-menu-container' id={'navusermenu'}>
                <Menu
                    position={'left'}
                    trigger={<UserBadge name={userName} initials={initials} />}
                >
                    <UserHeader name={userName} email={userEmail} />
                    <Item icon={<i className="bi bi-grid" />} action={async()=> {
                        Collaborative.client.off('pullAction');
                        await Collaborative.client.disconnect();
                        U.resetState();
                        R.navigate('/allProjects');
                    }}>Dashboard</Item>
                    <Item icon={<i className="bi bi-person-circle" />} action={()=> {
                        R.navigate('/account');
                        U.resetState();
                    }}>Profile</Item>
                    <Item icon={<i className="bi bi-person-gear" />} action={placeholder} disabled={true}>Account</Item>
                    <Item icon={<i className="bi bi-box-arrow-left" />} action={async ()=> {
                        if (isProjectModified()) {
                            U.dialog('You are about to log out without saving your project. Do you want to proceed?', 'logout', async ()=>{
                                await AuthApi.logout();
                                R.navigate('/auth');
                            });
                        } else {
                            await AuthApi.logout();
                            R.navigate('/auth');
                        }
                    }}>Sign out</Item>
                    <Divisor />
                    <SubMenu icon={<i className="bi bi-circle-half" />} label="Theme">
                        <SubMenuItem
                            icon={<i className="bi bi-sun" />}
                            action={() => setTheme('light')}
                            active={theme === 'light'}
                        >
                            Light
                        </SubMenuItem>
                        <SubMenuItem
                            icon={<i className="bi bi-moon" />}
                            action={() => setTheme('dark')}
                            active={theme === 'dark'}
                        >
                            Dark
                        </SubMenuItem>
                    </SubMenu>
                </Menu>
            </div>
        );
    }

    return(<>
        <nav id={'navbar'} className={'w-100 nav-container d-flex'} style={{zIndex: 99}}>
            <MainLogo />
            <MainMenu items={items} />
            <Commands />
            <div className="main-header-right">
                {/* Badges */}
                {props.debug && <span className="debug-badge">DEBUG</span>}
                {props.advanced && (
                    <span className="advanced-mode-badge" title="Advanced Mode is enabled. More options and features are visible.">
                        ADV
                    </span>
                )}
                {/* Layout Controls Group */}
                <LayoutControls />
                {/* Divider */}
                {project && <div className="navbar__divider" />}
                {/* User Controls */}
                <JodieButton />
                <HelpMenu />
                <UserMenu />
            </div>
        </nav>
        <AboutDialog />
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
