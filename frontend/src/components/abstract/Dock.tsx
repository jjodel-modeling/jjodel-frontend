import './style.scss';
import React, {Dispatch, ReactElement, ReactNode, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {DState, DUser, LProject, LUser} from '../../joiner';
import {FakeStateProps, windoww} from '../../joiner/types';
import {LayoutData} from 'rc-dock';
import {Collaborative, Console, Logger, MetaData, NestedView} from "../editors";
import {NodeEditor} from "../editors/NodeEditor";
import {PropertiesWithTreeView} from "../editors/PropertiesWithTreeView";
import DockManager from './DockManager';
import {PinnableDock, TabContent, TabHeader} from '../dock/MyRcDock';
import ModelsSummaryTab from "./tabs/ModelsSummaryTab";
import BrokerEditor from "../editors/Broker";
import {PermissionModelTab} from "../editors/PermissionModelTab";
import {MTM} from "../editors/MTM";
import { isProjectModified } from '../../common/libraries/projectModified';
import { Logo } from '../../components/logo';
import { SimpleResizeHandle } from '../SimpleResizeHandle';
//import MqttEditor from "../rightbar/mqtt/MqttEditor";
//import NestedView from "../rightbar/nestedViewEditor/ViewEditorNestedVersion";
//import CollaboratorsEditor from "../rightbar/collaboratorsEditor/CollaboratorsEditor";

// ============================================
// LAYOUT MODE TYPES
// ============================================
export type LayoutMode = 'split' | 'sidebar' | 'canvas-only' | 'vertical-console';

/**
 * Get saved layout mode from localStorage
 */
export function getSavedLayoutMode(): LayoutMode {
    const saved = localStorage.getItem('jjodel_layout_mode');
    return (saved as LayoutMode) || 'split';
}

/**
 * Save layout mode to localStorage
 */
export function saveLayoutMode(mode: LayoutMode): void {
    localStorage.setItem('jjodel_layout_mode', mode);
}

/**
 * Get the default panel size ratio for a layout mode (as percentage)
 */
export function getDefaultPanelRatio(mode: LayoutMode): number {
    switch (mode) {
        case 'split': return 50;      // 50% canvas, 50% properties
        case 'sidebar': return 30;    // 70% canvas, 30% properties
        case 'canvas-only': return 0; // 100% canvas, 0% properties
        case 'vertical-console': return 0; // Not used for vertical mode
        default: return 50;
    }
}

/**
 * Activate vertical console mode programmatically (for testing)
 * Usage: In browser console, run: window.setVerticalConsoleMode()
 */
export function activateVerticalConsoleMode(): void {
    saveLayoutMode('vertical-console');
    window.dispatchEvent(new CustomEvent('jjodel:layout-mode-change', {
        detail: { mode: 'vertical-console' as LayoutMode }
    }));
    console.log('✅ Vertical Console Mode activated. Refresh if needed.');
}

// Expose to window for easy testing
if (typeof window !== 'undefined') {
    (window as any).setVerticalConsoleMode = activateVerticalConsoleMode;
    (window as any).setSplitMode = () => {
        saveLayoutMode('split');
        window.location.reload();
    };
}

/**
 * Save dock panel ratio to localStorage for a specific mode
 */
export function saveDockPanelRatio(mode: LayoutMode, ratio: number): void {
    localStorage.setItem(`jjodel_dock_ratio_${mode}`, String(ratio));
}

/**
 * Get saved dock panel ratio from localStorage, or default if not saved
 */
export function getSavedDockPanelRatio(mode: LayoutMode): number {
    const saved = localStorage.getItem(`jjodel_dock_ratio_${mode}`);
    if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
            return parsed;
        }
    }
    return getDefaultPanelRatio(mode);
}

/**
 * Get initial panel width for right panel (for backward compatibility)
 * @deprecated Use calculatePanelSizes instead
 */
export function getInitialPanelWidth(mode: LayoutMode): number {
    const { rightSize } = calculatePanelSizes(mode);
    return rightSize;
}

/**
 * Calculate panel sizes based on ratio
 * Returns { leftSize, rightSize } in pixels
 */
export function calculatePanelSizes(mode: LayoutMode): { leftSize: number; rightSize: number } {
    const screenWidth = window.innerWidth;

    // Canvas-only mode: full canvas, no properties
    if (mode === 'canvas-only') {
        return { leftSize: screenWidth, rightSize: 0 };
    }

    // Get saved ratio or default
    const rightRatio = getSavedDockPanelRatio(mode);
    const rightSize = Math.max(300, Math.floor(screenWidth * (rightRatio / 100)));
    const leftSize = screenWidth - rightSize;

    return { leftSize, rightSize };
}






const tabidprefix = "DockComponent_rightbar_";
let idcounter = 0;
function id(){ // NB: cannot use just indexes or tab title because the id is injected in html, so it must be unique in the whole page.
    return tabidprefix + (++idcounter);
}
function tid(){
    return tabidprefix + (idcounter);
}


function DockComponent(props: AllProps) {
    const {user} = props;
    idcounter = 0;

    // State per il layout mode - si aggiorna quando cambia dalla navbar
    const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => getSavedLayoutMode());

    // State for console height in vertical-console mode
    const [consoleHeight, setConsoleHeight] = useState<number>(() => {
        const stored = localStorage.getItem('jjodel_vertical_console_height');
        return stored ? parseInt(stored, 10) : 400;
    });

    // Handler for console height change
    const handleConsoleHeightChange = (height: number) => {
        setConsoleHeight(height);
        localStorage.setItem('jjodel_vertical_console_height', height.toString());
    };

    // Listener per l'evento di cambio layout dalla navbar
    useEffect(() => {
        const handleLayoutChange = (event: CustomEvent<{ mode: LayoutMode; resetToDefault?: boolean }>) => {
            const newMode = event.detail.mode;
            const resetToDefault = event.detail.resetToDefault || false;

            // Update panel sizes based on mode - do this BEFORE state update to avoid re-render issues
            if (DockManager.dock) {
                const currentLayout = DockManager.dock.getLayout();
                if (currentLayout?.dockbox?.children?.length >= 2) {
                    const screenWidth = window.innerWidth;
                    let rightPanelRatio: number;

                    if (resetToDefault) {
                        // Double-click: reset to default ratio
                        rightPanelRatio = getDefaultPanelRatio(newMode);
                        // Clear saved ratio so next single-click uses default
                        localStorage.removeItem(`jjodel_dock_ratio_${newMode}`);
                    } else {
                        // Single-click: use saved ratio or default
                        rightPanelRatio = getSavedDockPanelRatio(newMode);
                    }

                    // Calculate sizes based on ratio
                    const rightPanelSize = Math.floor(screenWidth * (rightPanelRatio / 100));
                    const leftPanelSize = screenWidth - rightPanelSize;

                    // Create a deep copy to avoid mutating the original layout
                    // This preserves all tabs and activeId without issues
                    const updatedLayout = JSON.parse(JSON.stringify(currentLayout));

                    // Update only the sizes - preserves tabs, activeId, and all other properties
                    updatedLayout.dockbox.children[0].size = leftPanelSize;
                    updatedLayout.dockbox.children[1].size = rightPanelSize;

                    // Load updated layout - this preserves all open tabs and selection
                    DockManager.dock.loadLayout(updatedLayout);

                    // Trigger resize event to make rc-dock recalculate
                    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                }
            }

            // Update state AFTER layout is updated to avoid race conditions
            setLayoutMode(newMode);
        };

        // Listen for dock panel resize to save the ratio
        const handleDockResize = () => {
            if (DockManager.dock) {
                const layout = DockManager.dock.getLayout();
                if (layout?.dockbox?.children?.length >= 2) {
                    const leftSize = layout.dockbox.children[0].size || 1;
                    const rightSize = layout.dockbox.children[1].size || 1;
                    const total = leftSize + rightSize;
                    const rightRatio = Math.round((rightSize / total) * 100);

                    // Save the ratio for the current mode
                    const currentMode = getSavedLayoutMode();
                    if (currentMode !== 'canvas-only') {
                        saveDockPanelRatio(currentMode, rightRatio);
                    }
                }
            }
        };

        window.addEventListener('jjodel:layout-mode-change', handleLayoutChange as EventListener);

        // Debounced resize save (save after user stops resizing)
        let resizeTimeout: ReturnType<typeof setTimeout>;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleDockResize, 500);
        };
        window.addEventListener('mouseup', debouncedResize);

        return () => {
            window.removeEventListener('jjodel:layout-mode-change', handleLayoutChange as EventListener);
            window.removeEventListener('mouseup', debouncedResize);
            clearTimeout(resizeTimeout);
        };
    }, []);

    const THIN_STRIP_WIDTH = 40;

    // Listen for editor type changes to resize right panel per visibility matrix
    useEffect(() => {
        const handleEditorTypeChange = (event: Event) => {
            const { editorType } = (event as CustomEvent).detail;
            if (!DockManager.dock) return;

            const layout = DockManager.dock.getLayout();
            if (!layout?.dockbox?.children || layout.dockbox.children.length < 2) return;

            const updatedLayout = JSON.parse(JSON.stringify(layout));

            // Check if project has artifacts
            const project = user?.project;
            const hasArtifacts = (project?.metamodels?.length ?? 0) > 0
                              || (project?.models?.length ?? 0) > 0;

            if (!hasArtifacts) {
                // No artifacts → hide right panel completely
                updatedLayout.dockbox.children[1].size = 0;
                updatedLayout.dockbox.children[0].size = window.innerWidth;
            } else if (editorType === 'model' || editorType === 'metamodel') {
                // Modeling editor → restore normal saved size
                const rightRatio = getSavedDockPanelRatio(getSavedLayoutMode());
                const rightPx = Math.max(300, Math.floor(window.innerWidth * (rightRatio / 100)));
                updatedLayout.dockbox.children[1].size = rightPx;
                updatedLayout.dockbox.children[0].size = window.innerWidth - rightPx;
            } else {
                // transformation, summary, null → thin strip
                updatedLayout.dockbox.children[1].size = THIN_STRIP_WIDTH;
                updatedLayout.dockbox.children[0].size = window.innerWidth - THIN_STRIP_WIDTH;
            }

            DockManager.dock.loadLayout(updatedLayout);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
        };

        window.addEventListener('jjodel:editor-type-change', handleEditorTypeChange);
        return () => {
            window.removeEventListener('jjodel:editor-type-change', handleEditorTypeChange);
        };
    }, [user?.project]);

    const groups = {
        'models': {floatable: true, maximizable: false},
        // editors group: tabLocked=true disables drag-and-drop reordering
        // Tabs remain in fixed order: Properties, Tree View, Viewpoints, Node, Console
        'editors': {floatable: true, maximizable: false, tabLocked: true}
    };

    let advanced:boolean = props.advanced;

    const ModelsSummary = {id: id(), title: <TabHeader tid={tid()}><Logo style={{marginLeft: '-10px', fontSize: '1.5rem', paddingRight: '6px'}}/> {user?.project?.name}</TabHeader>, group: 'models', closable: false, content: <TabContent tid={tid()}><ModelsSummaryTab /></TabContent>};
    const structure = {id: id(), title: <TabHeader tid={tid()}>Properties</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><PropertiesWithTreeView mode={'tab'}/></TabContent>};
    const metadata = {id: id(), title: <TabHeader tid={tid()}>Metadata</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><MetaData /></TabContent>};
    // Tree View tab removed - now using dedicated TreeViewSidebar component
    const node = {id: id(), title: <TabHeader tid={tid()}>Node</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><NodeEditor /></TabContent>};
    const views = {id: id(), title: <TabHeader tid={tid()}>Viewpoints</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><NestedView /></TabContent>};
    const collaborative = {id: id(), title: <TabHeader tid={tid()}>Collaborative</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Collaborative /></TabContent>};
    const console = {id: id(), title: <TabHeader tid={tid()}>Console</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Console /></TabContent>};
    const logger = {id: id(), title: <TabHeader tid={tid()}>Logger</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Logger/></TabContent>};
    const permissions = {id: id(), title: <TabHeader tid={tid()}>Permissions</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><PermissionModelTab/></TabContent>};
    const mtm = {id: id(), title: <TabHeader tid={tid()}>Languages</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><MTM/></TabContent>};

    // Check if we're in vertical-console mode
    if (layoutMode === 'vertical-console') {
        // Vertical layout: Canvas on top, Console at bottom with resize handle
        const canvasHeight = window.innerHeight - consoleHeight;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                {/* Canvas area - takes remaining space */}
                <div style={{ height: `${canvasHeight}px`, overflow: 'auto', position: 'relative' }}>
                    <ModelsSummaryTab />
                </div>

                {/* Resize Handle */}
                <SimpleResizeHandle
                    onHeightChange={handleConsoleHeightChange}
                    currentHeight={consoleHeight}
                />

                {/* Console area - fixed height */}
                <div style={{ height: `${consoleHeight}px`, overflow: 'auto', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                    <Console />
                </div>
            </div>
        );
    }

    // Standard horizontal layout (existing behavior)
    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};

    // Calculate panel sizes based on layout mode
    // Note: When JjTL is active, CSS handles hiding the right panel
    const { leftSize, rightSize } = calculatePanelSizes(layoutMode);

    // Left panel (Models Summary / Canvas)
    layout.dockbox.children.push({tabs: [ModelsSummary], size: leftSize});

    // Properties is the sole right-panel content.
    // Viewpoints editing → accessible via toolbar viewpoint selector (Prompt 6)
    // Node → collapsible section inside Properties (advanced mode only)
    // Console → will become bottom drawer (Prompt 7)
    // Components are kept intact, only removed from tab navigation.
    const tabs = [];
    tabs.push(structure);  // Properties (sole content)

    if (false && user?.project?.type === 'collaborative') tabs.push(permissions);

    // Right panel (Editors) - Properties only
    // Note: JjTL editor hides this panel via DockManager.dock.loadLayout() in JjtlDevelopmentEnv.tsx
    layout.dockbox.children.push({tabs, size: rightSize});

    // Emit custom event when the active tab in the left panel changes
    // so that StatusBar can switch between project stats and editor breadcrumb.
    const handleLayoutChange = (newLayout: any) => {
        const activeId = newLayout?.dockbox?.children?.[0]?.activeId;
        if (activeId) {
            window.dispatchEvent(new CustomEvent('jjodel:active-tab', { detail: { activeId } }));

            // Hide properties panel when Documentation tab is active
            const isDocTab = activeId === 'documentation' || activeId.startsWith('doc_');
            if (isDocTab) {
                document.body.setAttribute('data-active-tab', 'documentation');
            } else {
                document.body.removeAttribute('data-active-tab');
            }
        }
    };

    return (<PinnableDock key={''+advanced} ref={dock => { DockManager.dock = dock }} defaultLayout={layout} groups={groups} onLayoutChange={handleLayoutChange} />);
}
interface OwnProps {}
interface StateProps {
    user: LUser|null
    advanced: boolean;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    if(DUser.current) ret.user = LUser.fromPointer(DUser.current);
    else ret.user = null;
    ret.advanced = state.advanced;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const DockConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(DockComponent);

const Dock = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <DockConnected {...{...props, children}} />;
}

export default Dock;

