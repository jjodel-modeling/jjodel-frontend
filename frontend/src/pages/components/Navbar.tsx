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
import { JjodelProjectIcon } from '../../components/icons/JjodelProjectIcon';

import {useNavigate} from 'react-router-dom';

import React, {Component, Dispatch, ReactElement, ReactNode, useState, useEffect, useMemo, useCallback} from 'react';
import {FakeStateProps} from '../../joiner/types';
import {connect} from 'react-redux';
import {AuthApi, ProjectsApi} from '../../api/persistance';
import TabDataMaker from "../../../src/components/abstract/tabs/TabDataMaker";
import DockManager from "../../components/abstract/DockManager";

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
import { useGlobalDrawer } from '../../contexts/GlobalDrawerContext';
import { useSettingsModal } from '../../contexts/SettingsModalContext';
import { useTheme } from '../../services/ThemeService';
import { buildProjectExportJson } from '../../model/megamodelPersistence';
import { getRuntimeMegamodel } from '../../model/megamodelRuntime';
import { useAvatar } from '../../hooks/useAvatar';
import { AVATAR_COLORS, AVATAR_ICONS } from '../../constants/avatarConfig';
import { JjScriptConsole } from '../../jjscript/components/JjScriptConsole';


let windoww = window as any;

export function createM2(project: LProject, name0?: string) {
    let name = name0 || 'metamodel_' + 1;
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

export function createM1(project: LProject, metamodel: LModel) {
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
const UserBadge = (props: {name: string, initials: string, color?: string, icon?: string | null}) => {
    return (
        <div className={'user-badge'} title={props.name}
             style={props.color ? { backgroundColor: props.color } : undefined}>
            {props.icon
                ? <i className={`bi ${props.icon}`} style={{ fontSize: 16 }} />
                : props.initials.toUpperCase()
            }
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

// Simple menu components (inline, no complex memoization)
function Submenu({ title, items }: { title?: string; items: (MenuEntry|null|undefined)[] }) {
    return (
        <div className='nav-hamburger hoverable inline' tabIndex={0}>
            {title && <span className={'menu-title'}>{title}</span>}
            <div className={'content context-menu'}>
                <ul>
                    {items && items.map((i, index) => i ? makeEntry(i, index) : null)}
                </ul>
            </div>
        </div>
    );
}

function MainMenu({ items }: { items: (MenuEntry|null|undefined)[] }) {
    return (
        <>
            {items.map(m => !m || !m.subItems?.length ? null :
                <Submenu key={m.name} title={m.name} items={m.subItems} />
            )}
        </>
    );
}

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

    TRANSACTION('zoom ' + action, () => graph.zoom = newZoom);
}

function NavbarComponent(props: AllProps) {
    const [debuggerr, setDebugger] = useState(false);
    const navigate = useNavigate();
    let user: LUser = LUser.getUser();
    let project: LProject | undefined = user?.project || undefined;
    let projectid = U.getProjectID_URL();
    Log.eDev(projectid !== project?.id, 'wrong project setup in navbar', {projectid, project});
    let metamodels: LModel[] = L.fromArr(props.metamodels);
    // Parse mmNames from string (joined with '|||') to avoid array reference changes
    const mmNamesArray = useMemo(() => props.mmNames ? props.mmNames.split('|||') : [], [props.mmNames]);
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
    const [showConsole, setShowConsole] = useState(false);

    // Hoisted hooks from formerly-inner components (HelpMenu, UserMenu, LevelBadge, TreeViewToggle)
    // Defining function components inside render causes React to unmount/remount them on every re-render.
    // See comment at line ~1162 about MainLogo having the same issue.
    const { openDrawer } = useGlobalDrawer();
    const { openSettings } = useSettingsModal();
    const [theme, setTheme] = useTheme();
    const [avatarConfig] = useAvatar();

    // TreeViewToggle state (hoisted)
    const [isTreeViewOpen, setIsTreeViewOpen] = useState(() => {
        const saved = localStorage.getItem('jjodel_tree_view_open');
        return saved === 'true';
    });
    useEffect(() => {
        const handleStorageChange = () => {
            const saved = localStorage.getItem('jjodel_tree_view_open');
            setIsTreeViewOpen(saved === 'true');
        };
        window.addEventListener('storage', handleStorageChange);
        const handleTreeViewToggle = () => {
            setTimeout(() => {
                const saved = localStorage.getItem('jjodel_tree_view_open');
                setIsTreeViewOpen(saved === 'true');
            }, 50);
        };
        window.addEventListener('jjodel:toggle-tree-view', handleTreeViewToggle);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('jjodel:toggle-tree-view', handleTreeViewToggle);
        };
    }, []);

    // ─── Show singleton instances toggle (per-model, localStorage-backed) ───
    const getActiveModelTab = useCallback((): { id: string; isModel: boolean } | null => {
        if (!DockManager.dock) return null;
        try {
            const layout = DockManager.dock.getLayout();
            const modelsPanel = layout?.dockbox?.children?.[0];
            const tabs = (modelsPanel as any)?.tabs || [];
            const activeId: string = (modelsPanel as any)?.activeId || tabs[0]?.id;
            if (!activeId) return null;
            const state = store.getState() as any;
            const raw = state[activeId] || state.idlookup?.[activeId];
            if (!raw) return null;
            return { id: activeId, isModel: raw.isMetamodel === false };
        } catch { return null; }
    }, []);

    const [showSingletons, setShowSingletons] = useState<boolean>(() => {
        const tab = getActiveModelTab();
        if (!tab) return false;
        return localStorage.getItem(`jjodel.showSingletons.${tab.id}`) === 'true';
    });

    // Sync singleton toggle when active tab changes
    useEffect(() => {
        const syncSingletonState = () => {
            const tab = getActiveModelTab();
            if (!tab) { setShowSingletons(false); return; }
            setShowSingletons(localStorage.getItem(`jjodel.showSingletons.${tab.id}`) === 'true');
        };
        window.addEventListener('jjodel:active-tab', syncSingletonState);
        return () => window.removeEventListener('jjodel:active-tab', syncSingletonState);
    }, [getActiveModelTab]);

    const toggleShowSingletons = useCallback(() => {
        const tab = getActiveModelTab();
        if (!tab || !tab.isModel) return;
        const newVal = !showSingletons;
        localStorage.setItem(`jjodel.showSingletons.${tab.id}`, String(newVal));
        setShowSingletons(newVal);
        console.log(`[singleton] show=${newVal}, modelId=${tab.id}`);
        window.dispatchEvent(new CustomEvent('jjodel:toggle-singletons', { detail: { modelId: tab.id, show: newVal } }));
    }, [getActiveModelTab, showSingletons]);

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
                        // Get lastSelectedModelElement directly from store to avoid re-renders
                        const currentState = store.getState();
                        let lastSelectedModelElement: string | undefined;
                        if (currentState._lastSelected?.modelElement) {
                            try {
                                const lastSelectedElem = currentState.idlookup[currentState._lastSelected.modelElement];
                                if (lastSelectedElem) {
                                    let current: any = lastSelectedElem;
                                    while (current) {
                                        if (current.className === 'DModel') {
                                            lastSelectedModelElement = current.id;
                                            break;
                                        }
                                        current = current.father ? currentState.idlookup[current.father] : null;
                                    }
                                }
                            } catch (e) { /* ignore */ }
                        }
                        if (lastSelectedModelElement) {
                            const selectedMetamodel = metamodels.find(m => m.id === lastSelectedModelElement);
                            if (selectedMetamodel) {
                                activeMetamodel = selectedMetamodel;
                            }
                        }
                        console.log('[Jjodel Shortcuts] Creating class, activeMetamodel:', activeMetamodel?.name, 'lastSelectedModel:', lastSelectedModelElement);
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
                    });
                } else {
                    (async () => {
                        await AuthApi.logout();
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
                name: mmNamesArray[i], function: () => createM1(project, m2), id: 'mmid_'+ props.metamodels[i],
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

    const isActiveTabModel = getActiveModelTab()?.isModel === true;
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
                        });
                    } else {
                        await AuthApi.logout();
                    }
                }, icon: <i className="bi bi-box-arrow-right" />, shortcutPills: formatShortcutPills(SHORTCUTS.SIGN_OUT)},
                {name: 'Logout', function: async() => {
                        if (isProjectModified()) {
                            U.dialog('You are about to log out without saving your project. Do you want to proceed?', 'logout', async ()=>{
                                await AuthApi.logout();
                            });
                        } else {
                            await AuthApi.logout();
                        }},
                    icon: icon['logout']}
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
                            U.download(`${project.name}.jjodel`, JSON.stringify(buildProjectExportJson(dproject as unknown as Record<string, unknown>, getRuntimeMegamodel(project.id))));
                        }
                    }, icon: <i className="bi bi-download" />},

                /* Export Canvas as Image */
                isDashboard ? null : {name: 'Export Canvas', icon: <i className="bi bi-image" />,
                    disabled: metamodels.length === 0,
                    subItems: [
                        {name: 'Export as PNG', function: () => window.dispatchEvent(new CustomEvent('jjodel:export-canvas', { detail: { format: 'png' } })), icon: <i className="bi bi-file-image" />, disabled: metamodels.length === 0},
                        {name: 'Export as JPEG', function: () => window.dispatchEvent(new CustomEvent('jjodel:export-canvas', { detail: { format: 'jpeg' } })), icon: <i className="bi bi-file-image" />, disabled: metamodels.length === 0},
                        {name: 'Export as SVG', function: () => window.dispatchEvent(new CustomEvent('jjodel:export-canvas', { detail: { format: 'svg' } })), icon: <i className="bi bi-filetype-svg" />, disabled: metamodels.length === 0},
                        {name: 'divisor'},
                        {name: 'Copy to Clipboard', function: () => window.dispatchEvent(new CustomEvent('jjodel:export-canvas', { detail: { format: 'clipboard' } })), icon: <i className="bi bi-clipboard" />, disabled: metamodels.length === 0},
                    ]
                },
                isDashboard ? null : {name: 'divisor'},

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
                {name: showSingletons ? 'Show singleton instances  \u2713' : 'Show singleton instances',
                    function: toggleShowSingletons,
                    icon: <i className={`bi ${showSingletons ? 'bi-diamond-fill' : 'bi-diamond'}`} />,
                    disabled: isDashboard || !isActiveTabModel
                },
                {name: 'divisor', function: placeholder},
                {name: props.debug ? 'Debug Mode  \u2713' : 'Debug Mode',
                    function: () => {
                        TRANSACTION('debug', ()=>SetRootFieldAction.new('debug', !props.debug), props.debug, !props.debug);
                        U.debug = !props.debug;
                    },
                    icon: <i className={`bi ${props.debug ? 'bi-bug-fill' : 'bi-bug'}`} />
                },
                {name: 'divisor', function: placeholder},
                {name: showConsole ? 'Show Console  \u2713' : 'Show Console',
                    function: () => setShowConsole(prev => !prev),
                    icon: <i className={`bi ${showConsole ? 'bi-terminal-fill' : 'bi-terminal'}`} />
                },
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
                            name: mmNamesArray[i] || 'Unnamed',
                            icon: <i className="bi bi-diagram-3" />,
                            disabled: true
                        }))
                    },
                    {name: 'Custom Tools', icon: <i className="bi bi-gear" />, disabled: true}
                ]),
                // Environment Generation
                {name: 'divisor'},
                {name: 'Generate Environment...',
                    function: () => {
                        window.dispatchEvent(new CustomEvent('envgen-open-wizard'));
                    },
                    icon: <i className="bi bi-box-seam" />,
                    disabled: isDashboard || metamodels.length === 0
                },
                {name: 'divisor'},
                {name: 'Polymetric View',
                    jsx: <span>Polymetric View <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px', fontWeight: 400 }}>(beta)</span></span>,
                    function: () => {
                        window.dispatchEvent(new CustomEvent('jjodel:open-polymetric'));
                    },
                    icon: <i className="bi bi-grid-3x3-gap" />,
                    disabled: isDashboard || metamodels.length === 0
                },
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
        .filter(e=> e && (e.keystroke?.length) && !e.disabled);
    Keystrokes.register('#root', 'navbar', keybindings);


    // MainLogo inlined below — defining it as a function component inside render
    // caused React to unmount/remount it on every re-render, making the <img> flicker.

    // Help dropdown menu items (inlined to avoid inner component flicker)
    const helpMenuMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const helpMenuModKey = helpMenuMac ? '\u2318' : 'Ctrl';
    const helpItems: MenuEntry[] = [
        {name: 'Keyboard Shortcuts', function: () => setShowShortcutsReference(true), icon: <i className="bi bi-keyboard" />, keystroke: [helpMenuModKey, '?']},
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

    // Commands inlined below to avoid inner component flicker

    // TreeViewToggle and LayoutControls were inner components that are no longer rendered
    // (TreeView renders nothing, LayoutControls moved to EditorV2 Toolbar).

    // UserMenu — inlined below to avoid inner component flicker.
    // Hooks (useGlobalDrawer, useSettingsModal, useTheme, useAvatar) are hoisted above.
    const userName = `${user?.name || ''} ${user?.surname || ''}`.trim();
    const userEmail = user?.email || '';
    const userInitials = userName.split(' ').map(n => n[0] || '').join('');

    // ─── Custom Tab Strip synced with DockManager ───
    const [openTabs, setOpenTabs] = useState<Array<{id: string; title: string; type: string; active: boolean; closable: boolean}>>([]);

    // Sync tabs from DockManager on layout changes
    useEffect(() => {
        const syncTabs = () => {
            if (!DockManager.dock) return;
            try {
                const layout = DockManager.dock.getLayout();
                const modelsPanel = layout?.dockbox?.children?.[0];
                if (!modelsPanel || !('tabs' in modelsPanel)) return;

                const tabs = (modelsPanel as any).tabs || [];
                const activeId = (modelsPanel as any).activeId || tabs[0]?.id;
                const state = store.getState();

                const tabList = tabs.map((tab: any) => {
                    const id = tab.id || '';
                    let title = '';
                    let type = 'project';
                    const closable = tab.closable !== false;

                    // Determine type and title from tab ID
                    if (id.startsWith('DockComponent_rightbar_')) {
                        // Project summary tab
                        title = project?.name || 'Project';
                        type = 'project';
                    } else if (id.startsWith('jjtl_')) {
                        type = 'transformation';
                        // Try to find transformation name
                        const rawTitle = tab.title;
                        if (typeof rawTitle === 'string') {
                            title = rawTitle;
                        } else if (rawTitle?.props?.children) {
                            // React element — extract text
                            const children = rawTitle.props.children;
                            if (Array.isArray(children)) {
                                title = children.filter((c: any) => typeof c === 'string').join('');
                            } else if (typeof children === 'string') {
                                title = children;
                            }
                        }
                        if (!title) title = 'Transformation';
                    } else if (id.startsWith('doc_')) {
                        type = 'documentation';
                        title = 'Documentation';
                    } else if (id.startsWith('vp_')) {
                        type = 'viewpoint';
                        // Extract title from React element or look up viewpoint
                        const vpId = id.slice(3); // strip 'vp_' prefix
                        const rawVp = (state as any)[vpId] || (state as any).idlookup?.[vpId];
                        title = rawVp?.name || 'Viewpoint';
                        if (!title || title === 'Viewpoint') {
                            // Try extracting from tab title JSX
                            const rawTitle = tab.title;
                            if (rawTitle?.props?.children) {
                                const children = rawTitle.props.children;
                                if (Array.isArray(children)) {
                                    title = children.filter((c: any) => typeof c === 'string').join('').trim() || 'Viewpoint';
                                } else if (typeof children === 'string') {
                                    title = children;
                                }
                            }
                        }
                    } else {
                        // Model/Metamodel — look up in state
                        const raw = (state as any)[id] || (state as any).idlookup?.[id];
                        if (raw) {
                            title = raw.name || 'Unnamed';
                            type = raw.isMetamodel ? 'metamodel' : 'model';
                        } else {
                            title = 'Unnamed';
                            type = 'metamodel';
                        }
                    }

                    return { id, title, type, active: id === activeId, closable };
                });

                setOpenTabs(tabList);
            } catch (e) {
                // Ignore errors during sync
            }
        };

        // Sync on layout changes
        const handleActiveTab = () => setTimeout(syncTabs, 50);
        window.addEventListener('jjodel:active-tab', handleActiveTab);

        // Initial sync
        const initialTimer = setTimeout(syncTabs, 200);
        // Periodic sync (layout changes don't always fire events)
        const interval = setInterval(syncTabs, 1000);

        return () => {
            window.removeEventListener('jjodel:active-tab', handleActiveTab);
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [project]);

    const handleTabClick2 = useCallback((tabId: string) => {
        if (!DockManager.dock) return;
        try {
            const layout = DockManager.dock.getLayout();
            const modelsPanel = layout?.dockbox?.children?.[0];
            if (modelsPanel) {
                const updated = JSON.parse(JSON.stringify(layout));
                updated.dockbox.children[0].activeId = tabId;
                DockManager.dock.loadLayout(updated);
            }
        } catch (e) {
            console.warn('[Navbar] Error switching tab:', e);
        }
    }, []);

    const handleTabClick = useCallback((tabId: string) => {
        if (!DockManager.dock) return;
        DockManager.dock.updateTab(tabId, null, true);
    }, []);

    const handleTabClose = useCallback((tabId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        DockManager.closeTab(tabId);
    }, []);

    // Tab type badge letter or icon
    const getTabBadge = (type: string): { letter: string; icon?: string; className: string } => {
        switch (type) {
            case 'metamodel': return { letter: 'M', className: 'appbar-tab__badge--metamodel' };
            case 'model': return { letter: 'm', className: 'appbar-tab__badge--model' };
            case 'transformation': return { letter: 'T', className: 'appbar-tab__badge--transformation' };
            case 'documentation': return { letter: 'D', className: 'appbar-tab__badge--documentation' };
            case 'viewpoint': return { letter: 'V', className: 'appbar-tab__badge--viewpoint' };
            default: return { letter: '', className: '' };
        }
    };

    // Overflow logic
    const MAX_VISIBLE_TABS = 6;
    const visibleTabs = openTabs.filter(t => t.type !== 'project'); // Don't show project summary in navbar
    const tabsToShow = visibleTabs.length > MAX_VISIBLE_TABS
        ? [...visibleTabs.slice(0, MAX_VISIBLE_TABS)]
        : visibleTabs;
    const overflowTabs = visibleTabs.length > MAX_VISIBLE_TABS
        ? visibleTabs.slice(MAX_VISIBLE_TABS)
        : [];
    // Ensure active tab is always visible
    const activeTab = visibleTabs.find(t => t.active);
    if (activeTab && !tabsToShow.find(t => t.id === activeTab.id)) {
        tabsToShow.pop();
        tabsToShow.push(activeTab);
    }

    const isProjectSelected = !visibleTabs.some(t => t.active);
    const [showOverflow, setShowOverflow] = useState(false);

    // Level badge component
    // LevelBadge — inlined below. useSettingsModal() hoisted above.
    const levelLabel = props.advanced ? 'Advanced' : 'Basic';

    return(<>
        <nav id={'navbar'} className={'w-100 nav-container d-flex appbar'} style={{zIndex: 99}}>
            <div className='nav-logo' onClick={() => R.navigate('/allProjects')}>
                <div className={"aligner"}>
                    <img
                        src={jjodelLogo}
                        alt="Jjodel"
                        className="nav-logo__image"
                    />
                </div>
            </div>
            <div className="appbar__sep" />
            <MainMenu items={items} />
            <section className='nav-commands d-flex'>
                {project && debuggerr ? <DebuggerComponent /> : null}
            </section>

            {/* Project link */}
            {project && (<>
                <div className="appbar__sep" />
                <button
                    className={`appbar-project-link ${isProjectSelected ? 'appbar-project-link--selected' : 'appbar-project-link--unselected'}`}
                    onClick={() => {
                        const dock = DockManager.dock;
                        if (dock) {
                            const layout = dock.getLayout();
                            const modelsPanel = layout?.dockbox?.children?.[0];
                            if (modelsPanel && 'tabs' in modelsPanel && (modelsPanel as any).tabs?.length > 0) {
                                const firstTabId = (modelsPanel as any).tabs[0].id;
                                dock.updateTab(firstTabId, null, true);
                            }
                        }
                    }}
                    title="Project overview"
                >
                    <JjodelProjectIcon className="appbar-project-link__icon" />
                    <span className="appbar-project-link__name">{project.name || 'Unnamed'}</span>
                </button>
            </>)}

            {/* Custom Tab Strip */}
            {visibleTabs.length > 0 && (<>
                <div className="appbar__sep" />
                <div className="appbar-tabs">
                    {tabsToShow.map(tab => {
                        const badge = getTabBadge(tab.type);
                        return (
                            <button
                                key={tab.id}
                                className={`appbar-tab appbar-tab--${tab.type} ${tab.active ? 'appbar-tab--active' : ''}`}
                                onClick={() => handleTabClick(tab.id)}
                                title={tab.title}
                            >
                                {(badge.letter || badge.icon) && (
                                    <span className={`appbar-tab__badge ${badge.className}`}>
                                        {badge.icon ? <i className={`bi ${badge.icon}`} /> : badge.letter}
                                    </span>
                                )}
                                <span className="appbar-tab__name">{tab.title}</span>
                                {tab.closable && (
                                    <span
                                        className="appbar-tab__close"
                                        onClick={(e) => handleTabClose(tab.id, e)}
                                        title="Close"
                                    >
                                        &times;
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    {overflowTabs.length > 0 && (
                        <div className="appbar-tabs__overflow" style={{ position: 'relative' }}>
                            <button
                                className="appbar-tabs__overflow-btn"
                                onClick={() => setShowOverflow(!showOverflow)}
                            >
                                +{overflowTabs.length} &#x25BE;
                            </button>
                            {showOverflow && (
                                <div className="appbar-tabs__overflow-dropdown">
                                    {overflowTabs.map(tab => {
                                        const badge = getTabBadge(tab.type);
                                        return (
                                            <button
                                                key={tab.id}
                                                className="appbar-tabs__overflow-item"
                                                onClick={() => { handleTabClick(tab.id); setShowOverflow(false); }}
                                            >
                                                {(badge.letter || badge.icon) && (
                                                    <span className={`appbar-tab__badge ${badge.className}`}>
                                                        {badge.icon ? <i className={`bi ${badge.icon}`} /> : badge.letter}
                                                    </span>
                                                )}
                                                <span>{tab.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    {/* New tab button */}
                    {project && (
                        <button
                            className="appbar-tabs__new"
                            onClick={() => project && createM2(project)}
                            title="New metamodel"
                        >
                            +
                        </button>
                    )}
                </div>
            </>)}

            <div className="main-header-right">
                {/* Level badge (read-only) — inlined */}
                <button
                    className={`appbar-level-badge ${props.advanced ? 'appbar-level-badge--advanced' : ''}`}
                    onClick={() => openSettings('profile')}
                    title="Click to change in Settings"
                >
                    <span className="appbar-level-badge__dot" />
                    {levelLabel}
                </button>
                <div className="appbar__sep" />
                {/* Layout Controls moved to EditorV2 Toolbar */}
                {/* Tree View Toggle — currently renders nothing (commented out) */}
                {/* Divider */}
                {project && <div className="appbar__sep" />}
                {/* Help menu — inlined */}
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
                {/* User menu — inlined */}
                <div className='user-menu-container' id={'navusermenu'}>
                    <Menu
                        position={'left'}
                        trigger={<UserBadge name={userName} initials={userInitials} color={AVATAR_COLORS[avatarConfig.colorIndex].hex} icon={AVATAR_ICONS[avatarConfig.iconIndex]} />}
                    >
                        <UserHeader name={userName} email={userEmail} />
                        <Item icon={<i className="bi bi-grid" />} action={async()=> {
                            Collaborative.client.off('pullAction');
                            await Collaborative.client.disconnect();
                            U.resetState();
                            R.navigate('/allProjects');
                        }}>Dashboard</Item>
                        <Item icon={<i className="bi bi-person-circle" />} action={()=> {
                            openSettings('profile');
                        }}>Profile</Item>
                        <Item icon={<i className="bi bi-gear" />} action={()=> {
                            openSettings();
                        }}>Settings</Item>
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
        {showConsole && (
            <div
                style={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    width: 560,
                    height: 420,
                    zIndex: 9999,
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'default',
                    userSelect: 'none',
                }}>
                    <span><i className="bi bi-terminal" style={{marginRight: 6}}/> JjScript Console</span>
                    <button
                        onClick={() => setShowConsole(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: 16,
                            lineHeight: 1,
                            padding: '0 2px',
                        }}
                    >
                        <i className="bi bi-x-lg"/>
                    </button>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <JjScriptConsole />
                </div>
            </div>
        )}
    </>);
}

interface OwnProps {}
interface StateProps {
    user: Pointer<DUser>;
    metamodels: Pointer<DModel>[];
    mmNames: string; // Joined with '|||' to avoid array reference changes causing re-renders
    version: DState['version'];
    advanced: boolean;
    debug: boolean;
    lay: string; // layout selected shortened, first char is category, second is index. like u1 = user 1, p2 = project 2
    autosaveLayout: boolean;
    // NOTE: lastSelectedModelElement removed to prevent menu flickering
    // It's now accessed directly from store in the keyboard shortcut handler
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
    // Convert to string to avoid array reference changes causing re-renders
    // The string will be split back into array in the component
    ret.mmNames = L.fromArr(ret.metamodels).map((mm: any) => mm?.name).join('|||');
    ret.version = state.version;
    ret.advanced = state.advanced;
    ret.debug = state.debug;
    ret.lay = PinnableDock.saveSlotCategory[0] + PinnableDock.saveSlotName[0];
    ret.autosaveLayout = PinnableDock.isAutosave();
    // NOTE: lastSelectedModelElement is now accessed directly from store in keyboard handler
    // to prevent menu flickering caused by frequent re-renders
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
