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
    Pointer, Pointers, Log,
    UndoAction,
    RedoAction,
    GraphPoint
} from '../../joiner';

import {icon} from '../components/icons/Icons';

import {useNavigate} from 'react-router-dom';

import React, {Component, Dispatch, ReactElement, ReactNode, useState, useEffect} from 'react';
import {FakeStateProps} from '../../joiner/types';
import {connect} from 'react-redux';
import {AuthApi, ProjectsApi} from '../../api/persistance';
import TabDataMaker from "../../../src/components/abstract/tabs/TabDataMaker";
import DockManager from "../../../src/components/abstract/DockManager";

import {Divisor, Item, Menu, UserHeader, SubMenu, SubMenuItem} from '../components/menu/Menu';

import Collaborative from "../../components/collaborative/Collaborative";
import { isProjectModified } from '../../common/libraries/projectModified';
import { AboutDialog, AboutDialogController } from './about/AboutDialog';
import {Undoredocomponent} from "../../components/topbar/undoredocomponent";
import {BEGIN, CollabRefreshAction, COMMIT, END} from "../../redux/action/action";
import {Tooltip} from "../../components/forEndUser/Tooltip";
import {VersionFixer} from "../../redux/VersionFixer";
import {PinnableDock} from "../../components/dock/MyRcDock";
import ActivityLogger from '../../services/ActivityLogger';
import { ActivityType } from '../../types/activity';
import { LayoutMode, getSavedLayoutMode, saveLayoutMode, getInitialPanelWidth } from '../../components/abstract/Dock';
import { isProjectOverviewPage } from '../../utils/navigationUtils';
import { formatShortcutPills, getRedoShortcutPills, SHORTCUTS, matchesShortcut, detectCurrentContext, matchesZoomIn, matchesZoomOut, matchesZoomReset, isMac } from '../../utils/keyboardShortcuts';
import { AdvancedModeTutorial, shouldShowAdvancedModeTutorial } from '../../components/AdvancedModeTutorial';
import { M2AnalyticsModal, M2AnalyticsData } from '../../components/M2AnalyticsModal';
import { ShortcutsReference } from '../../components/ShortcutsReference';


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
function getKeyStrokes(keys?: string[], shortcutPills?: string[]){
    // Use new shortcut pills if provided (adaptive to OS)
    if (shortcutPills && shortcutPills.length > 0) {
        return <div className="keystrokes">
            {shortcutPills.map((pill, index) => (
                <kbd key={index} className="keystroke-pill">{pill}</kbd>
            ))}
        </div>;
    }

    // Fallback to old format for backward compatibility
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
                        getKeyStrokes(i.keystroke, i.shortcutPills)
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
    shortcutPills?: string[],  // New: array of pills for keyboard shortcut (adaptive to OS)
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

// Helper function to perform zoom on active graph
function performGraphZoom(metamodels: LModel[], action: 'in' | 'out' | 'reset') {
    const activeMetamodel = metamodels.find(m => m);
    if (!activeMetamodel) return;

    const graph = activeMetamodel.node as LGraph;
    if (!graph) return;

    const oldZoom = graph.zoom;
    let newZoom: GraphPoint;

    switch (action) {
        case 'in':
            newZoom = new GraphPoint(oldZoom.x * 1.1, oldZoom.y * 1.1);
            break;
        case 'out':
            newZoom = new GraphPoint(oldZoom.x / 1.1, oldZoom.y / 1.1);
            break;
        case 'reset':
            newZoom = new GraphPoint(1, 1);
            break;
    }

    TRANSACTION('zoom ' + action, () => {
        graph.zoom = newZoom;
    });
}

function NavbarComponent(props: AllProps) {
    const [debuggerr, setDebugger] = useState(false);
    const navigate = useNavigate();
    let user: LUser = L.fromPointer(DUser.current);
    let project: LProject | undefined = user?.project || undefined;
    let projectid = U.getProjectID_URL();
    Log.eDev(projectid !== project?.id, 'wrong project setup in navbar', {projectid, project});
    let metamodels: LModel[] = L.fromArr(props.metamodels);
    globalProject = project;
    const recentProjects: MenuEntry[] = [];
    const [isFullscreen, setFullscreen] = useState(false);
    const toggleFullScreen = () => setFullscreen(U.toggleFullscreen(document.body));

    // Advanced Mode Tutorial state
    const [showAdvancedTutorial, setShowAdvancedTutorial] = useState(false);

    // M2 Analytics Modal state
    const [showM2Analytics, setShowM2Analytics] = useState(false);
    const [m2AnalyticsData, setM2AnalyticsData] = useState<M2AnalyticsData>({
        metamodelName: 'metamodel_1',
        classification: { score: 0, category: 'small' },
        metrics: { PKG: 0, MC: 0, AMC: 0, CMC: 0, IFLMC: 0, MCWS: 0, LMC: null, SF: 0, ASF: null, EN: 0, LIT: 0 }
    });

    // Keyboard Shortcuts Reference state
    const [showShortcutsReference, setShowShortcutsReference] = useState(false);

    // Function to open M2 Analytics with computed data
    const openM2Analytics = () => {
        if (!project || metamodels.length === 0) return;

        const metamodel = metamodels[0];

        // Get classes (LClass instances) and their raw data (DClass)
        const classes = metamodel.classes || [];
        const dclasses = classes.map((c: any) => c.__raw);

        // DEBUG: Log metamodel structure
        console.log('[M2 Analytics] Metamodel:', metamodel.name);
        console.log('[M2 Analytics] Classes count:', classes.length);
        if (classes.length > 0) {
            const firstClass = classes[0];
            const firstDClass = dclasses[0];
            console.log('[M2 Analytics] First LClass:', firstClass);
            console.log('[M2 Analytics] First LClass keys:', Object.keys(firstClass || {}));
            console.log('[M2 Analytics] First DClass:', firstDClass);
            console.log('[M2 Analytics] First DClass keys:', Object.keys(firstDClass || {}));
            console.log('[M2 Analytics] First class attributes:', firstClass?.attributes);
            console.log('[M2 Analytics] First class allAttributes:', firstClass?.allAttributes);
            console.log('[M2 Analytics] First class references:', firstClass?.references);
            console.log('[M2 Analytics] First class extends:', firstClass?.extends);
            console.log('[M2 Analytics] First class extendedBy:', firstClass?.extendedBy);
        }

        // PKG: # Packages (including nested)
        const PKG = metamodel.allSubPackages?.length || 0;

        // MC: # Metaclasses
        const MC = classes.length;

        // AMC: # Abstract Metaclasses (use DClass for the 'abstract' boolean)
        const AMC = dclasses.filter((c: any) => c?.abstract === true).length;

        // CMC: # Concrete Metaclasses
        const CMC = MC - AMC;

        // IFLMC: # Concrete Featureless Metaclasses
        // Use DClass attributes/references (direct features only, not inherited)
        const IFLMC = dclasses.filter((c: any) => {
            if (c?.abstract === true) return false;
            const attrLen = Array.isArray(c?.attributes) ? c.attributes.length : 0;
            const refLen = Array.isArray(c?.references) ? c.references.length : 0;
            return attrLen + refLen === 0;
        }).length;

        // MCWS: # Metaclasses with Superclass
        // Use DClass extends array
        const MCWS = dclasses.filter((c: any) => {
            const extendsArr = c?.extends;
            return Array.isArray(extendsArr) && extendsArr.length > 0;
        }).length;

        // LMC: % Isolated Metaclasses (no superclass and no subclasses)
        // Use LClass for computed properties (extends and extendedBy)
        const isolated = classes.filter((c: any) => {
            const extendsArr = c.extends;
            const extendedByArr = c.extendedBy;
            const hasSuper = Array.isArray(extendsArr) && extendsArr.length > 0;
            const hasSub = Array.isArray(extendedByArr) && extendedByArr.length > 0;
            return !hasSuper && !hasSub;
        }).length;
        const LMC = MC > 0 ? (isolated / MC) * 100 : null;

        // SF: # Structural Features (all attributes + references, including inherited)
        // Use LClass allAttributes/allReferences for inherited features
        let allAttrCount = 0;
        let allRefCount = 0;
        classes.forEach((c: any) => {
            const attrs = c.allAttributes;
            const refs = c.allReferences;
            allAttrCount += Array.isArray(attrs) ? attrs.length : 0;
            allRefCount += Array.isArray(refs) ? refs.length : 0;
        });
        const SF = allAttrCount + allRefCount;

        console.log('[M2 Analytics] SF calculation - attrs:', allAttrCount, 'refs:', allRefCount, 'total:', SF);

        // ASF: Avg # Structural Features per concrete metaclass
        const ASF = CMC > 0 ? SF / CMC : null;

        // EN: # Enumerations
        const EN = metamodel.enumerators?.length || 0;

        // LIT: # Literals
        const LIT = metamodel.literals?.length || 0;

        console.log('[M2 Analytics] Final metrics:', { PKG, MC, AMC, CMC, IFLMC, MCWS, LMC, SF, ASF, EN, LIT });

        // Calculate EMF classification score (based on # metaclasses)
        // Small: 0-30, Medium: 30-80, Large: 80+
        let score = Math.min(MC * 2.5, 100);
        if (SF > 0) score = Math.min(score + SF * 0.5, 100);
        score = Math.round(score);

        const category: 'small' | 'medium' | 'large' =
            score < 30 ? 'small' : score < 80 ? 'medium' : 'large';

        const data: M2AnalyticsData = {
            metamodelName: metamodel.name || 'Unnamed Metamodel',
            classification: { score, category },
            metrics: {
                PKG,
                MC,
                AMC,
                CMC,
                IFLMC,
                MCWS,
                LMC: LMC !== null ? Math.round(LMC * 100) / 100 : null,
                SF,
                ASF: ASF !== null ? Math.round(ASF * 100) / 100 : null,
                EN,
                LIT
            }
        };
        setM2AnalyticsData(data);
        setShowM2Analytics(true);
    };

    // Function to enable advanced mode (with tutorial check)
    const enableAdvancedMode = (showTutorial: boolean = true) => {
        SetRootFieldAction.new('advanced', true);
        windoww.advanced = true;
        localStorage.setItem('jjodel.interfaceMode', 'advanced');
        U.interfaceMode = 'advanced';

        // Show tutorial if it's the first time and showTutorial is true
        if (showTutorial && shouldShowAdvancedModeTutorial()) {
            setShowAdvancedTutorial(true);
        } else {
            U.alert('i', 'Advanced Mode', 'All features and options are now visible');
        }
    };

    const disableAdvancedMode = () => {
        SetRootFieldAction.new('advanced', false);
        windoww.advanced = false;
        localStorage.setItem('jjodel.interfaceMode', 'basic');
        U.interfaceMode = 'basic';
        U.alert('i', 'Basic Mode', 'Simplified interface active');
    };

    const toggleAdvancedMode = () => {
        if (props.advanced) {
            disableAdvancedMode();
        } else {
            enableAdvancedMode();
        }
    };

    // Layout mode state
    const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => {
        const mode = getSavedLayoutMode();
        // Apply initial layout mode to body
        document.body.setAttribute('data-layout-mode', mode);
        return mode;
    });

    const handleLayoutModeChange = (mode: LayoutMode, resetToDefault: boolean = false) => {
        setLayoutModeState(mode);
        saveLayoutMode(mode);
        // Apply layout mode to body for CSS targeting
        document.body.setAttribute('data-layout-mode', mode);
        // Dispatch event to notify dock to update (includes resetToDefault flag)
        window.dispatchEvent(new CustomEvent('jjodel:layout-mode-change', {
            detail: { mode, resetToDefault }
        }));
    };

    // Handle double-click to reset to default size
    const handleLayoutModeDoubleClick = (mode: LayoutMode) => {
        handleLayoutModeChange(mode, true);
    };

    // Global context-aware keyboard shortcut handler - prevents browser defaults
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // DEBUG: Log all Cmd/Ctrl key events
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modKey = isMac ? event.metaKey : event.ctrlKey;

            if (modKey) {
                console.log('[Jjodel Shortcuts] Handler called:', {
                    key: event.key,
                    code: event.code,
                    altKey: event.altKey,
                    shiftKey: event.shiftKey,
                    hash: window.location.hash,
                    projectInClosure: project ? project.name : 'undefined'
                });
            }

            const target = event.target as HTMLElement;
            const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            // ========================================
            // IMMEDIATELY block browser shortcuts BEFORE any other processing
            // NOTE: We use Alt+CMD for NEW, CLOSE, SIGN_OUT to avoid Chrome interception
            // NOTE: On Mac, Alt modifies the key character, so we use event.code for Alt shortcuts
            // ========================================
            if (modKey && !isInputField) {
                const key = event.key.toUpperCase();
                const code = event.code; // e.g., "KeyN", "KeyW", "KeyQ"

                // Block Jjodel shortcuts (with Alt for NEW/CLOSE/SIGNOUT)
                // Use event.code for Alt shortcuts since Alt changes the character on Mac
                const isAltShortcut = event.altKey && (code === 'KeyN' || code === 'KeyW' || code === 'KeyQ');
                const isCmdOnlyShortcut = !event.altKey && (key === 'S' || key === 'Z' || key === 'Y' ||
                    key === '+' || key === '=' || key === '-' || key === '0' || key === 'B');
                const isHelpShortcut = event.shiftKey && event.key === '?';

                if (isAltShortcut || isCmdOnlyShortcut || isHelpShortcut) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                }
            }

            // Skip processing if user is typing in an input/textarea
            if (isInputField) {
                return;
            }

            // Detect current context for context-aware shortcuts
            const context = detectCurrentContext();

            // DEBUG: Log shortcut detection
            if (modKey && event.altKey) {
                console.log('[Jjodel Shortcuts] Alt+Cmd pressed:', {
                    code: event.code,
                    key: event.key,
                    context,
                    matchesNEW: matchesShortcut(event, SHORTCUTS.NEW),
                    matchesSAVE: matchesShortcut(event, SHORTCUTS.SAVE),
                    matchesCLOSE: matchesShortcut(event, SHORTCUTS.CLOSE),
                    project: project ? project.name : 'undefined',
                    metamodelsCount: metamodels?.length || 0
                });
            }

            // ========================================
            // CMD/Ctrl + N - Context-Aware NEW
            // ========================================
            if (matchesShortcut(event, SHORTCUTS.NEW)) {
                event.preventDefault();
                event.stopPropagation();
                console.log('[Jjodel Shortcuts] NEW shortcut matched! Context:', context, 'Project:', project?.name);

                switch (context) {
                    case 'DASHBOARD':
                        // Dispatch event for AllProjects to handle (opens Create Project dialog)
                        window.dispatchEvent(new CustomEvent('jjodel:new-project'));
                        break;
                    case 'PROJECT_EDITOR':
                        console.log('[Jjodel Shortcuts] Creating M2, project:', project);
                        if (project) createM2(project);
                        break;
                    case 'METAMODEL_EDITOR':
                        // Add new class to the active metamodel's default package
                        // Try to find the metamodel from last selected element, fallback to first metamodel
                        let activeMetamodel = metamodels.find(m => m);
                        if (props.lastSelectedModelElement) {
                            const selectedMetamodel = metamodels.find(m => m.id === props.lastSelectedModelElement);
                            if (selectedMetamodel) {
                                activeMetamodel = selectedMetamodel;
                            }
                        }
                        console.log('[Jjodel Shortcuts] Creating class, activeMetamodel:', activeMetamodel?.name, 'lastSelectedModel:', props.lastSelectedModelElement);
                        if (activeMetamodel) {
                            const defaultPkg = activeMetamodel.packages?.[0];
                            console.log('[Jjodel Shortcuts] defaultPkg:', defaultPkg?.name, 'packages count:', activeMetamodel.packages?.length);
                            if (defaultPkg) {
                                console.log('[Jjodel Shortcuts] Calling defaultPkg.addClass()');
                                const newClass = defaultPkg.addClass();
                                console.log('[Jjodel Shortcuts] addClass() returned:', newClass?.name, 'id:', newClass?.__raw?.id);
                                // Select the newly created class to make it visible on the canvas
                                if (newClass && newClass.__raw?.id) {
                                    setTimeout(() => {
                                        const selector = ".Graph [data-dataid='" + newClass.__raw.id + "']";
                                        const elem = document.querySelector(selector);
                                        console.log('[Jjodel Shortcuts] Selecting element:', selector, 'found:', !!elem);
                                        if (elem) {
                                            (elem as HTMLElement).click();
                                        }
                                    }, 100);
                                }
                            } else {
                                console.warn('[Jjodel Shortcuts] No default package found!');
                            }
                        }
                        break;
                }
                return;
            }

            // ========================================
            // CMD/Ctrl + Shift + N - NEW MODEL (Project context only)
            // ========================================
            if (matchesShortcut(event, SHORTCUTS.NEW_MODEL)) {
                event.preventDefault();
                event.stopPropagation();

                if (context === 'PROJECT_EDITOR' && project && metamodels.length > 0) {
                    // Create model from first metamodel (or could show selector)
                    createM1(project, metamodels[0]);
                }
                return;
            }

            // ========================================
            // CMD/Ctrl + S - Context-Aware SAVE
            // ========================================
            if (matchesShortcut(event, SHORTCUTS.SAVE)) {
                console.log('[Jjodel Shortcuts] SAVE shortcut matched! Context:', context, 'Project:', project?.name);
                event.preventDefault();
                event.stopPropagation();

                if (context === 'PROJECT_EDITOR' || context === 'METAMODEL_EDITOR') {
                    if (project) {
                        (async () => {
                            try {
                                SetRootFieldAction.new('isLoading', true);
                                await ProjectsApi.save(project);
                                SetRootFieldAction.new('isLoading', false);
                            } catch (error: any) {
                                U.alert('e', 'Error while Saving Project', error.message);
                                SetRootFieldAction.new('isLoading', false);
                            }
                        })();
                    }
                } else if (context === 'USER_PROFILE') {
                    // Profile changes are auto-saved, show confirmation
                    U.alert('i', 'Profile Saved', 'Your profile changes are saved automatically.');
                }
                return;
            }

            // ========================================
            // CMD/Ctrl + W - Context-Aware CLOSE
            // ========================================
            if (matchesShortcut(event, SHORTCUTS.CLOSE)) {
                event.preventDefault();
                event.stopPropagation();

                if (context === 'PROJECT_EDITOR' || context === 'METAMODEL_EDITOR') {
                    if (project) {
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
                    }
                } else if (context === 'USER_PROFILE') {
                    // Go back from profile
                    R.navigate('/allProjects');
                }
                return;
            }

            // ========================================
            // CMD/Ctrl + Q - SIGN OUT (all contexts)
            // ========================================
            if (matchesShortcut(event, SHORTCUTS.SIGN_OUT)) {
                event.preventDefault();
                event.stopPropagation();

                if (isProjectModified()) {
                    U.dialog('You are about to log out without saving your project. Do you want to proceed?', 'logout', async () => {
                        await AuthApi.logout();
                        R.navigate('/auth');
                    });
                } else {
                    (async () => {
                        await AuthApi.logout();
                        R.navigate('/auth');
                    })();
                }
                return;
            }

            // ========================================
            // Alt + CMD/Ctrl + M - New Metamodel (specific shortcut, any context)
            // ========================================
            if (matchesShortcut(event, SHORTCUTS.NEW_METAMODEL)) {
                event.preventDefault();
                event.stopPropagation();
                if (project) {
                    createM2(project);
                }
                return;
            }

            // ========================================
            // Shift + CMD/Ctrl + M - Toggle Advanced Mode
            // ========================================
            if (matchesShortcut(event, SHORTCUTS.ADVANCED_MODE)) {
                event.preventDefault();
                event.stopPropagation();
                toggleAdvancedMode();
                return;
            }

            // ========================================
            // CMD/Ctrl + ? (Shift + /) - Show Keyboard Shortcuts
            // ========================================
            const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMacOS ? event.metaKey : event.ctrlKey;
            if (cmdOrCtrl && event.shiftKey && event.key === '?') {
                event.preventDefault();
                event.stopPropagation();
                setShowShortcutsReference(true);
                return;
            }

            // ========================================
            // CMD/Ctrl + Z - UNDO (Editor contexts only)
            // ========================================
            if (context === 'METAMODEL_EDITOR' || context === 'PROJECT_EDITOR') {
                if (matchesShortcut(event, SHORTCUTS.UNDO)) {
                    event.preventDefault();
                    event.stopPropagation();
                    UndoAction.new(1, user?.id, false).commit();
                    return;
                }

                // CMD/Ctrl + Shift + Z (Mac) or CMD/Ctrl + Y (Windows) - REDO
                if (matchesShortcut(event, SHORTCUTS.REDO_MAC) || matchesShortcut(event, SHORTCUTS.REDO_WIN)) {
                    event.preventDefault();
                    event.stopPropagation();
                    RedoAction.new(1, user?.id, false).commit();
                    return;
                }
            }

            // ========================================
            // ZOOM SHORTCUTS (Editor contexts only)
            // ========================================
            if (context === 'METAMODEL_EDITOR' || context === 'PROJECT_EDITOR') {
                // CMD/Ctrl + Plus (+) or (=) - ZOOM IN
                if (matchesZoomIn(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    performGraphZoom(metamodels, 'in');
                    return;
                }

                // CMD/Ctrl + Minus (-) - ZOOM OUT
                if (matchesZoomOut(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    performGraphZoom(metamodels, 'out');
                    return;
                }

                // CMD/Ctrl + Zero (0) - RESET ZOOM
                if (matchesZoomReset(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    performGraphZoom(metamodels, 'reset');
                    return;
                }

                // ========================================
                // CMD/Ctrl + B - TOGGLE TREE VIEW
                // ========================================
                if (matchesShortcut(event, SHORTCUTS.TOGGLE_TREE_VIEW)) {
                    event.preventDefault();
                    event.stopPropagation();
                    window.dispatchEvent(new CustomEvent('jjodel:toggle-tree-view'));
                    return;
                }
            }
        };

        // Register on both window and document for maximum coverage
        window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
        document.addEventListener('keydown', handleKeyDown, true); // Also on document
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [project, metamodels, props.advanced, user]);

    if (user?.projects) {
        user.projects
            .sort((a, b) => (b.lastModified > a.lastModified) ?  1 : -1)
            .slice(0,20)
            .forEach(p => {
                    let pid = Pointers.from(p);
                    recentProjects.push({
                        icon: <i className="bi bi-folder" />, name: p.name, disabled: pid === projectid,
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
            icon: <i className="bi bi-box" />,
            subItems: metamodels.map((m2, i)=>({
                name: props.mmNames[i], function: () => createM1(project, m2), id: 'mmid_'+ props.metamodels[i],
            }))
        };
    } else {
        newModel = {
            id: 'new_model',
            name: 'Model',
            icon: <i className="bi bi-box" />,
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
        saveLayoutItems.push({name: 'Save manually', function: () => PinnableDock.save(), icon: <i className="bi bi-floppy" />});
    }

    let lay = props.lay;
    const items: MenuEntry[] = [

        // Jjodel Menu
        {name: 'Jjodel',
            subItems: [
                {name: 'About Jjodel', function: () => {AboutDialogController.open();}, icon: <i className="bi bi-shield" />},
                {name: 'Roadmap', function: () => open('https://www.jjodel.io/roadmap/'), icon: <i className="bi bi-calendar3" />},
                {name: 'divisor'},
                {name: 'Sign-out', function: async () => {
                    if (isProjectModified()) {
                        U.dialog('You are about to log out without saving your project. Do you want to proceed?', 'logout', async () => {
                            await AuthApi.logout();
                            R.navigate('/auth');
                        });
                    } else {
                        await AuthApi.logout();
                        R.navigate('/auth');
                    }
                }, icon: <i className="bi bi-box-arrow-right" />, shortcutPills: formatShortcutPills(SHORTCUTS.SIGN_OUT)},
            ]},

        /* File */

        {name: 'File',
            subItems: [
                isDashboard ? null :
                {name: 'New', icon: <i className="bi bi-plus-circle" />,
                    subItems: [
                        {name: 'Project', function: placeholder, icon: <i className="bi bi-folder" />, disabled: true},
                        {name: 'Metamodel', icon: <i className="bi bi-diagram-3" />, function: ()=> { project && createM2(project); }, shortcutPills: formatShortcutPills(SHORTCUTS.NEW_METAMODEL)},
                        newModel
                    ]
                },
                {name: 'Recent Projects', icon: <i className="bi bi-clock-history" />, subItems: recentProjects},

                /* Import Project */
                isProject ? null : {name: 'Import Project', function: ProjectsApi.import, icon: <i className="bi bi-upload" />},
                isDashboard ? null : {name: 'divisor'},

                /* Save Project */
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
                    , icon: <i className="bi bi-floppy" />, shortcutPills: formatShortcutPills(SHORTCUTS.SAVE)},

                isDashboard ? null : {name: 'Download Project', function: async()=> {
                        if (project) {
                            let dproject = await ProjectsApi.save(project);
                            U.download(`${project.name}.jjodel`, JSON.stringify(dproject));
                        }
                    }, icon: <i className="bi bi-download" />},

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
}, icon: <i className="bi bi-x-lg" />, shortcutPills: formatShortcutPills(SHORTCUTS.CLOSE)},

                /* Delete Project - temporarily disabled */
                isDashboard ? null : {name: 'Delete Project', function: placeholder, icon: <i className="bi bi-trash" />, disabled: true},

            ]},


        /* Edit - always visible, items disabled on dashboard */
        {name: 'Edit',
            subItems: [
                {name: 'Undo', icon: <i className="bi bi-arrow-counterclockwise" />, shortcutPills: formatShortcutPills(SHORTCUTS.UNDO), disabled: isDashboard},
                {name: 'Redo', icon: <i className="bi bi-arrow-clockwise" />, shortcutPills: getRedoShortcutPills(), subItems:[{name:"i"}], disabled: isDashboard},
                {name: 'divisor', function: placeholder},
                {name: (isFavorite ? 'Remove from' : 'Add to') +' Favorites', function: ()=> ProjectsApi.favorite(project?.__raw as DProject),
                    icon: <i className={`bi ${isFavorite ? 'bi-star-fill' : 'bi-star'}`} />, disabled: isDashboard},
                {name: 'Copy Public Link', function: placeholder, icon: <i className="bi bi-link-45deg" />, shortcutPills: formatShortcutPills(SHORTCUTS.COPY_LINK), disabled: true}
            ]
        },

        /* View - always visible, items disabled on dashboard */
        {name: 'View',
            subItems: [
                {name: props.advanced ? 'Switch to Basic Mode' : 'Switch to Advanced Mode',
                    function: toggleAdvancedMode,
                    icon: props.advanced ? <i className="bi bi-sliders" /> : <i className="bi bi-lightning-charge" />,
                    shortcutPills: formatShortcutPills(SHORTCUTS.ADVANCED_MODE)
                },
                {name: 'divisor', function: placeholder},
                {name: 'Zoom-in',
                    function: () => performGraphZoom(metamodels, 'in'),
                    icon: <i className="bi bi-zoom-in" />,
                    shortcutPills: formatShortcutPills(SHORTCUTS.ZOOM_IN),
                    disabled: isDashboard
                },
                {name: 'Zoom-out',
                    function: () => performGraphZoom(metamodels, 'out'),
                    icon: <i className="bi bi-zoom-out" />,
                    shortcutPills: formatShortcutPills(SHORTCUTS.ZOOM_OUT),
                    disabled: isDashboard
                },
                {name: 'Reset Zoom',
                    function: () => performGraphZoom(metamodels, 'reset'),
                    icon: <i className="bi bi-arrow-counterclockwise" />,
                    shortcutPills: formatShortcutPills(SHORTCUTS.ZOOM_RESET),
                    disabled: isDashboard
                },
                {name: 'divisor', function: placeholder},
                {name: 'Save layout', disabled: true,
                    icon: <i className="bi bi-grid-3x3" />,
                    subItems: saveLayoutItems
                },
                {name: 'Load layout', disabled: isDashboard,
                    icon: <i className="bi bi-grid-3x3" />,
                    subItems: [
                        {name: 'Default', function: ()=> PinnableDock.load('Default'), icon: <i className="bi bi-arrow-clockwise" />},
                        {name: 'Project layouts', icon: <i className="bi bi-folder" />,
                            subItems: [
                                {name: '1', function: ()=> PinnableDock.load('1', 'project'), icon: lay==='p1' ? <i className="bi bi-check-circle-fill" /> : <i className="bi bi-circle" />},
                                {name: '2', function: ()=> PinnableDock.load('2', 'project'), icon: lay==='p2' ? <i className="bi bi-check-circle-fill" /> : <i className="bi bi-circle" />},
                                {name: '3', function: ()=> PinnableDock.load('3', 'project'), icon: lay==='p3' ? <i className="bi bi-check-circle-fill" /> : <i className="bi bi-circle" />},
                            ]
                        },
                        {name: 'User layouts', icon: <i className="bi bi-person" />,
                            subItems: [
                                {name: '1', function: ()=> PinnableDock.load('1', 'user'), icon: lay==='u1' ? <i className="bi bi-check-circle-fill" /> : <i className="bi bi-circle" />},
                                {name: '2', function: ()=> PinnableDock.load('2', 'user'), icon: lay==='u2' ? <i className="bi bi-check-circle-fill" /> : <i className="bi bi-circle" />},
                                {name: '3', function: ()=> PinnableDock.load('3', 'user'), icon: lay==='u3' ? <i className="bi bi-check-circle-fill" /> : <i className="bi bi-circle" />},
                            ]
                        }
                    ]
                },
                {name: 'divisor', function: placeholder},
                {name: 'Show/Hide Sidebar', function: placeholder, icon: <i className="bi bi-layout-sidebar" />, disabled: true},
                {name: 'Show/Hide Toolbar', function: placeholder, icon: <i className="bi bi-menu-button" />, disabled: true},
                {name: `${isFullscreen ? 'Exit Fullscreen Mode' : 'Fullscreen Mode [F11]'}`, function: toggleFullScreen, icon: <i className="bi bi-arrows-fullscreen" />},
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
                            icon: <i className="bi bi-diagram-3" />,
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
                {name: 'Live Validation', function: placeholder, icon: <i className="bi bi-check-circle" />, disabled: true},
                {name: 'Validate', function: placeholder, icon: <i className="bi bi-clipboard-check" />, disabled: true},
                // Advanced-only items below
                ...(props.advanced ? [
                    {name: 'divisor', function: placeholder},
                    {name: 'M2 Analytics', function: openM2Analytics, icon: <i className="bi bi-graph-up" />, disabled: isDashboard || metamodels.length === 0},
                    {name: debuggerr ? 'Hide debugger' : 'Debug loops', function: ()=> setDebugger(!debuggerr), icon: <i className={`bi ${debuggerr ? 'bi-eye-slash' : 'bi-eye'}`} />, disabled: isDashboard},
                    {name: 'Check integrity', function: ()=> VersionFixer.autocorrect(undefined, true, true), icon: <i className="bi bi-tools" />, disabled: isDashboard},
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
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? '\u2318' : 'Ctrl';

        const helpItems: MenuEntry[] = [
            {name: 'Keyboard Shortcuts', function: () => setShowShortcutsReference(true), icon: <i className="bi bi-keyboard" />, keystroke: [modKey, '?']},
            {name: 'divisor'},
            {name: 'What\'s New in Jjodel', function: ()=> open("https://www.jjodel.io/whats-new/"), icon: <i className="bi bi-bell" />},
            {name: 'Homepage', function: ()=> open("https://www.jjodel.io"), icon: <i className="bi bi-house" />},
            {name: 'divisor'},
            {name: 'Learn Jjodel', function: ()=> open("https://www.jjodel.io/learn-jjodel/"), icon: <i className="bi bi-infinity" />},
            {name: 'Getting Started', function: ()=> open("https://www.jjodel.io/getting-started/"), icon: <i className="bi bi-rocket-takeoff" />},
            {name: 'Video Tutorials', function: ()=> open("https://www.jjodel.io/video-tutorials/"), icon: <i className="bi bi-play-circle" />},
            {name: 'User Guide', function: ()=> open('https://www.jjodel.io/getting-started/'), icon: <i className="bi bi-journal-text" />},
            {name: 'Glossary', function: ()=> open('https://www.jjodel.io/glossary/'), icon: <i className="bi bi-book" />},
            {name: 'FAQ', function: placeholder, icon: <i className="bi bi-chat-left-dots" />, disabled: true},
            {name: 'divisor'},
            {name: 'Support', icon: <i className="bi bi-life-preserver" />,
                subItems: [
                    {name: 'Report a Bug', function: placeholder, icon: <i className="bi bi-bug" />, disabled: true},
                    {name: 'Request a Feature', function: placeholder, icon: <i className="bi bi-hand-index" />, disabled: true},
                    {name: 'Contact', function: placeholder, icon: <i className="bi bi-envelope" />, disabled: true}
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

    // TreeView Toggle button
    // Dispatches custom event to toggle the Tree View sidebar
    const TreeViewToggle = () => {
        const [isTreeViewOpen, setIsTreeViewOpen] = useState(() => {
            const saved = localStorage.getItem('jjodel_tree_view_open');
            return saved === 'true';
        });

        // Listen for tree view state changes
        useEffect(() => {
            const handleStorageChange = () => {
                const saved = localStorage.getItem('jjodel_tree_view_open');
                setIsTreeViewOpen(saved === 'true');
            };
            window.addEventListener('storage', handleStorageChange);
            // Also listen for our custom toggle event to sync state
            const handleToggle = () => {
                setTimeout(() => {
                    const saved = localStorage.getItem('jjodel_tree_view_open');
                    setIsTreeViewOpen(saved === 'true');
                }, 50);
            };
            window.addEventListener('jjodel:toggle-tree-view', handleToggle);
            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('jjodel:toggle-tree-view', handleToggle);
            };
        }, []);

        const handleToggle = () => {
            window.dispatchEvent(new CustomEvent('jjodel:toggle-tree-view'));
        };

        const isMacOS = isMac();
        const shortcutLabel = isMacOS ? '⌘B' : 'Ctrl+B';

        return (
            <Tooltip tooltip={`Tree View (${shortcutLabel})`} inline={true} position="bottom" offsetY={8}>
                <button
                    className={`layout-btn ${isTreeViewOpen ? 'layout-btn--active' : ''}`}
                    onClick={handleToggle}
                    aria-label="Toggle Tree View"
                >
                    <i className="bi bi-diagram-2" />
                </button>
            </Tooltip>
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



        // Nel tuo componente
        if (isProjectOverviewPage()) {
            return null;
        }

        return (<>
            <div className="navbar__layout-controls">
                
                <Tooltip tooltip="50% - 50% (doppio click = reset)" inline={true} position="bottom" offsetY={8}>
                    <button
                        className={`layout-btn ${layoutMode === 'split' ? 'layout-btn--active' : ''}`}
                        onClick={() => handleLayoutModeChange('split')}
                        onDoubleClick={() => handleLayoutModeDoubleClick('split')}
                        aria-label="Split view"
                    >
                        <i className="bi bi-layout-split" />
                    </button>
                </Tooltip>
                <Tooltip tooltip="70% - 30% (doppio click = reset)" inline={true} position="bottom" offsetY={8}>
                    <button
                        className={`layout-btn ${layoutMode === 'sidebar' ? 'layout-btn--active' : ''}`}
                        onClick={() => handleLayoutModeChange('sidebar')}
                        onDoubleClick={() => handleLayoutModeDoubleClick('sidebar')}
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
                {/* Mode Toggle - Basic/Advanced */}
                <div className="navbar__mode-toggle">
                    <Tooltip tooltip={props.advanced ? "Switch to Basic Mode" : "Switch to Advanced Mode"} inline={true} position="bottom" offsetY={8}>
                        <button
                            className={`mode-toggle-btn ${props.advanced ? 'mode-toggle-btn--advanced' : 'mode-toggle-btn--basic'}`}
                            onClick={toggleAdvancedMode}
                            aria-label={props.advanced ? "Switch to Basic Mode" : "Switch to Advanced Mode"}
                        >
                            <i className={props.advanced ? "bi bi-gear-wide-connected" : "bi bi-mortarboard"} />
                            <span>{props.advanced ? 'Advanced' : 'Basic'}</span>
                        </button>
                    </Tooltip>
                </div>
                {/* Layout Controls Group */}
                <LayoutControls />
                {/* Tree View Toggle - only in editor context */}
                {project && metamodels.length > 0 && !isProjectOverviewPage() && <TreeViewToggle />}
                {/* Divider */}
                {project && <div className="navbar__divider" />}
                {/* User Controls */}
                <JodieButton />
                <HelpMenu />
                <UserMenu />
            </div>
        </nav>
        <AboutDialog />
        <AdvancedModeTutorial
            isOpen={showAdvancedTutorial}
            onClose={() => setShowAdvancedTutorial(false)}
        />
        <M2AnalyticsModal
            isOpen={showM2Analytics}
            onClose={() => setShowM2Analytics(false)}
            data={m2AnalyticsData}
        />
        <ShortcutsReference
            isOpen={showShortcutsReference}
            onClose={() => setShowShortcutsReference(false)}
        />
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
    lastSelectedModelElement?: Pointer<DModel>; // For detecting active metamodel from last selected element
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

    // Get the model of the last selected element (for determining active metamodel in shortcuts)
    if (state._lastSelected?.modelElement) {
        try {
            const lastSelectedElem = state.idlookup[state._lastSelected.modelElement];
            if (lastSelectedElem) {
                // Walk up the parent chain to find the model
                let current: any = lastSelectedElem;
                while (current) {
                    if (current.className === 'DModel') {
                        ret.lastSelectedModelElement = current.id;
                        break;
                    }
                    current = current.father ? state.idlookup[current.father] : null;
                }
            }
        } catch (e) {
            // Ignore errors in walking the parent chain
        }
    }
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
