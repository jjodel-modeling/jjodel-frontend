import './style.scss';
import {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState, LoggerComponent, Try} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import {DockLayout, LayoutData} from 'rc-dock';
import {Info, Skeleton, Viewpoints, Views, Logger, Console} from "../../components/editors";
import {ModelMetaData} from '../rightbar/structureEditor/ModelMetaData';
import NodeEditor from '../rightbar/styleEditor/StyleEditor';
import DockManager from './DockManager';
import {PinnableDock, TabContent, TabHeader} from '../dock/MyRcDock';
import ModelsSummaryTab from "./tabs/ModelsSummaryTab";
import MqttEditor from "../rightbar/mqtt/MqttEditor";
import NestedView from "../rightbar/viewpointsEditor/ViewEditorNestedVersion";


const tabidprefix = "DockComponent_rightbar_";
let idcounter = 0;
function id(){ // NB: cannot use just indexes or tab title because the id is injected in html, so it must be unique in the whole page.
    return tabidprefix + (++idcounter);
}
function tid(){
    return tabidprefix + (idcounter);
}

function DockComponent(props: AllProps) {
    const groups = {
        'models': {floatable: true, maximizable: true},
        'editors': {floatable: true, maximizable: true}
    };

    /* Models */
    const ModelsSummary = {id: id(), title: <TabHeader tid={tid()}>Summary</TabHeader>, group: 'models', closable: false, content: <TabContent tid={tid()}><ModelsSummaryTab /></TabContent>};

    /* Editors */
    //const test = {id: id(), title: 'Test', group: 'editors', closable: false, content: <TestTab />};
    const structure = {id: id(), title: <TabHeader tid={tid()}>Structure</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Info /></TabContent>};
    const metadata = {id: id(), title: <TabHeader tid={tid()}>Metadata</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><ModelMetaData /></TabContent>};
    const tree = {id: id(), title: <TabHeader tid={tid()}>Tree View</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Skeleton /></TabContent>};
    const views = {id: id(), title: <TabHeader tid={tid()}>Views</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Views /></TabContent>};
    const node = {id: id(), title: <TabHeader tid={tid()}>Node</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><NodeEditor /></TabContent>};
    const viewpoints = {id: id(), title: <TabHeader tid={tid()}>Perspectives</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><NestedView /></TabContent>};
    //const validation = {id: id(), title: <TabHeader tid={tid()}>Validation</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><ViewpointEditor validation={true} /></TabContent>};
    //const collaborators = {id: id(), title: <TabHeader tid={tid()}>Collaborators</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><CollaboratorsEditor /></TabContent>};
    //const mqtt = {id: id(), title: <TabHeader tid={tid()}>Mqtt</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><MqttEditor /></TabContent>};
    const console = {id: id(), title: <TabHeader tid={tid()}>Console</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Console /></TabContent>};
    const logger = {id: id(), title: <TabHeader tid={tid()}>Logger</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Logger/></TabContent>};

    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};
    layout.dockbox.children.push({tabs: [ModelsSummary]});
    layout.dockbox.children.push({tabs: [
        structure,
        // metadata,
        tree,
        views,
        viewpoints,
        // validation,
        // collaborators,
        // mqtt,
        node,
        console,
        logger
    ]});

    return (<PinnableDock ref={dock => DockManager.dock = dock} defaultLayout={layout} groups={groups} />);
}
interface OwnProps {}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
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

const Dock = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <DockConnected {...{...props, children}} />;
}

export default Dock;

