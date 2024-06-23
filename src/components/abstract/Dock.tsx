import './style.scss';
import {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState, LoggerComponent, Try} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import {DockLayout, LayoutData} from 'rc-dock';
import TestTab from './tabs/TestTab';
import StructureEditor from '../rightbar/structureEditor/StructureEditor';
import {ModelMetaData} from '../rightbar/structureEditor/ModelMetaData';
import TreeEditor from '../rightbar/treeEditor/treeEditor';
import ViewsEditor from '../rightbar/viewsEditor/ViewsEditor';
import NodeEditor from '../rightbar/styleEditor/StyleEditor';
import ViewpointEditor from '../rightbar/viewpointsEditor/ViewpointsEditor';
import CollaboratorsEditor from '../rightbar/collaboratorsEditor/CollaboratorsEditor';
import Console from '../rightbar/console/Console';
import ModelsSummaryTab from './tabs/ModelsSummaryTab';
import DockManager from './DockManager';
import MqttEditor from "../rightbar/mqtt/MqttEditor";


const tabidprefix = "DockComponent_rightbar_";
let idcounter = 0;
function id(){ // NB: cannot use just indexes or tab title because the id is injected in html, so it must be unique in the whole page.
    return tabidprefix + (idcounter++);
}
function DockComponent(props: AllProps) {
    const groups = {
        'models': {floatable: true, maximizable: true},
        'editors': {floatable: true, maximizable: true}
    };

    /* Models */
    const ModelsSummary = {id: id(), title: 'Summary', group: 'models', closable: false, content: <Try><ModelsSummaryTab /></Try>};

    /* Editors */
    const test = {id: id(), title: 'Test', group: 'editors', closable: false, content: <TestTab />};
    const structure = {id: id(), title: 'Structure', group: 'editors', closable: false, content: <Try><StructureEditor /></Try>};
    const metadata = {id: id(), title: 'Metadata', group: 'editors', closable: false, content: <Try><ModelMetaData /></Try>};
    const tree = {id: id(), title: 'Tree View', group: 'editors', closable: false, content: <Try><TreeEditor /></Try>};
    const views = {id: id(), title: 'Views', group: 'editors', closable: false, content: <Try><ViewsEditor /></Try>};
    const node = {id: id(), title: 'Node', group: 'editors', closable: false, content: <Try><NodeEditor /></Try>};
    const viewpoints = {id: id(), title: 'Perspectives', group: 'editors', closable: false, content: <Try><ViewpointEditor validation={false} /></Try>};
    const validation = {id: id(), title: 'Validation', group: 'editors', closable: false, content: <Try><ViewpointEditor validation={true} /></Try>};
    const collaborators = {id: id(), title: 'Collaborators', group: 'editors', closable: false, content: <Try><CollaboratorsEditor /></Try>};
    const mqtt = {id: id(), title: 'Mqtt', group: 'editors', closable: false, content: <Try><MqttEditor /></Try>};
    const console = {id: id(), title: 'Console', group: 'editors', closable: false, content: <Try><Console /></Try>};
    const logger = {id: id(), title: 'Logger', group: 'editors', closable: false, content: <Try><LoggerComponent /></Try>};

    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};
    layout.dockbox.children.push({tabs: [ModelsSummary]});
    layout.dockbox.children.push({tabs: [
        structure,
        metadata,
        tree,
        views,
        viewpoints,
        validation,
        // collaborators,
        // mqtt,
        node,
        console,
        logger
    ]});

    return (<DockLayout ref={dock => DockManager.dock = dock} defaultLayout={layout} groups={groups} />);
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

