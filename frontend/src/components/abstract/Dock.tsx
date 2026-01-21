import './style.scss';
import React, {Dispatch, ReactElement, ReactNode, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {DState, DUser, LProject, LUser} from '../../joiner';
import {FakeStateProps, windoww} from '../../joiner/types';
import {LayoutData} from 'rc-dock';
import {Collaborative, Console, Info, Logger, Skeleton, MetaData, NestedView} from "../editors";
import {NodeEditor} from "../editors/NodeEditor";
import DockManager from './DockManager';
import {PinnableDock, TabContent, TabHeader} from '../dock/MyRcDock';
import ModelsSummaryTab from "./tabs/ModelsSummaryTab";
import BrokerEditor from "../editors/Broker";
import {PermissionModelTab} from "../editors/PermissionModelTab";
import {MTM} from "../editors/MTM";
import { isProjectModified } from '../../common/libraries/projectModified';
import { Logo } from '../../components/logo';
//import MqttEditor from "../rightbar/mqtt/MqttEditor";
//import NestedView from "../rightbar/nestedViewEditor/ViewEditorNestedVersion";
//import CollaboratorsEditor from "../rightbar/collaboratorsEditor/CollaboratorsEditor";

// ============================================
// RESOLUTION-BASED PANEL WIDTH CALCULATION
// ============================================
const BREAKPOINTS = {
    MONITOR_27: 2560,  // Monitor 27" or larger (2K/4K)
    DESKTOP: 1920,     // Desktop FHD
    LAPTOP: 1440,      // Laptop
    TABLET: 1024       // Tablet
};

export type LayoutMode = 'split' | 'sidebar' | 'canvas-only';

/**
 * Calculate panel width based on screen resolution and layout mode
 */
export function getInitialPanelWidth(layoutMode: LayoutMode = 'split'): number {
    const screenWidth = window.innerWidth;

    // Canvas-only mode: hide properties panel
    if (layoutMode === 'canvas-only') {
        return 0;
    }

    // Sidebar mode: 30% of screen width (min 350px, max 450px)
    if (layoutMode === 'sidebar') {
        return Math.max(350, Math.min(450, Math.floor(screenWidth * 0.30)));
    }

    // Split mode: percentage based on resolution
    if (screenWidth >= BREAKPOINTS.MONITOR_27) {
        // Monitor 27"+: 25% (min 500px, max 800px)
        return Math.max(500, Math.min(800, Math.floor(screenWidth * 0.25)));
    }

    if (screenWidth >= BREAKPOINTS.DESKTOP) {
        // Desktop FHD: 35% (min 500px, max 750px)
        return Math.max(500, Math.min(750, Math.floor(screenWidth * 0.35)));
    }

    if (screenWidth >= BREAKPOINTS.LAPTOP) {
        // Laptop: 40% (min 450px, max 650px)
        return Math.max(450, Math.min(650, Math.floor(screenWidth * 0.40)));
    }

    // Tablet and smaller: 50% (min 400px)
    return Math.max(400, Math.floor(screenWidth * 0.5));
}

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

    // Listener per l'evento di cambio layout dalla navbar
    useEffect(() => {
        const handleLayoutChange = (event: CustomEvent<{ mode: LayoutMode }>) => {
            const newMode = event.detail.mode;
            setLayoutMode(newMode);

            // Aggiorna la larghezza del pannello destro
            if (DockManager.dock) {
                const newWidth = getInitialPanelWidth(newMode);
                const layout = DockManager.dock.getLayout();

                // Trova il pannello destro (editors) e aggiorna la sua dimensione
                if (layout?.dockbox?.children?.[1]) {
                    const rightPanel = layout.dockbox.children[1];
                    if ('size' in rightPanel) {
                        rightPanel.size = newWidth;

                        // Forza il dock a ricaricare il layout
                        DockManager.dock.loadLayout(layout);
                    }
                }
            }
        };

        window.addEventListener('jjodel:layout-mode-change', handleLayoutChange as EventListener);

        return () => {
            window.removeEventListener('jjodel:layout-mode-change', handleLayoutChange as EventListener);
        };
    }, []);

    const groups = {
        'models': {floatable: true, maximizable: true},
        // editors group: tabLocked=true disables drag-and-drop reordering
        // Tabs remain in fixed order: Properties, Tree View, Viewpoints, Node, Console
        'editors': {floatable: true, maximizable: true, tabLocked: true}
    };

    let advanced:boolean = props.advanced;

    const ModelsSummary = {id: id(), title: <TabHeader tid={tid()}><Logo style={{marginLeft: '-10px', fontSize: '1.5rem', paddingRight: '6px'}}/> {user?.project?.name}</TabHeader>, group: 'models', closable: false, content: <TabContent tid={tid()}><ModelsSummaryTab /></TabContent>};
    const structure = {id: id(), title: <TabHeader tid={tid()}>Properties</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Info mode={'tab'}/></TabContent>};
    const metadata = {id: id(), title: <TabHeader tid={tid()}>Metadata</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><MetaData /></TabContent>};
    const tree = {id: id(), title: <TabHeader tid={tid()}>Tree View</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Skeleton /></TabContent>};
    const node = {id: id(), title: <TabHeader tid={tid()}>Node</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><NodeEditor /></TabContent>};
    const views = {id: id(), title: <TabHeader tid={tid()}>Viewpoints</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><NestedView /></TabContent>};
    const collaborative = {id: id(), title: <TabHeader tid={tid()}>Collaborative</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Collaborative /></TabContent>};
    const console = {id: id(), title: <TabHeader tid={tid()}>Console</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Console /></TabContent>};
    const logger = {id: id(), title: <TabHeader tid={tid()}>Logger</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Logger/></TabContent>};
    const permissions = {id: id(), title: <TabHeader tid={tid()}>Permissions</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><PermissionModelTab/></TabContent>};
    const mtm = {id: id(), title: <TabHeader tid={tid()}>Languages</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><MTM/></TabContent>};

    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};

    // Left panel (Models Summary) - takes remaining space (flex: 1 behavior with size: 1)
    layout.dockbox.children.push({tabs: [ModelsSummary], size: 1});

    // Fixed tab order: Properties, Viewpoints, Node, Tree View, Console
    // This order is locked (tabLocked:true in editors group)
    const tabs = [];
    tabs.push(structure);  // Properties
    tabs.push(views);      // Viewpoints
    tabs.push(node);       // Node
    tabs.push(tree);       // Tree View
    tabs.push(console);    // Console
    if (advanced) tabs.push(mtm);
    if (advanced) tabs.push(logger);

    if (false && user?.project?.type === 'collaborative') tabs.push(permissions);

    // Right panel (Editors) - width based on current layout mode (responsive to changes)
    const rightPanelWidth = getInitialPanelWidth(layoutMode);
    layout.dockbox.children.push({tabs, size: rightPanelWidth});

    return (<PinnableDock key={''+advanced} ref={dock => { DockManager.dock = dock }} defaultLayout={layout} groups={groups} />);
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

