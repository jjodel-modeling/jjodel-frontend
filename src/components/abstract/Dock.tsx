import './style.scss';
import {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import {DockLayout, LayoutData} from 'rc-dock';
import TestTab from './tabs/TestTab';
import StructureEditor from '../rightbar/structureEditor/StructureEditor';
import TreeEditor from '../rightbar/treeEditor/treeEditor';
import ViewsEditor from '../rightbar/viewsEditor/ViewsEditor';
import NodeEditor from '../rightbar/styleEditor/StyleEditor';
import ViewpointEditor from '../rightbar/viewpointsEditor/ViewpointsEditor';
import CollaboratorsEditor from '../rightbar/collaboratorsEditor/CollaboratorsEditor';
import Console from '../rightbar/console/Console';
import ModelsSummaryTab from './tabs/ModelsSummaryTab';
import DockManager from './DockManager';
import MqttEditor from "../rightbar/mqtt/MqttEditor";

function DockComponent(props: AllProps) {
    const groups = {
        'models': {floatable: true, maximizable: true},
        'editors': {floatable: true, maximizable: true}
    };

    /* Models */
    const ModelsSummary = {id: '0', title: 'Summary', group: 'models', closable: false, content: <ModelsSummaryTab />};

    /* Editors */
    let index = 1;
    const test = {id: `${index++}`, title: 'Test', group: 'editors', closable: false, content: <TestTab />};
    const structure = {id: `${index++}`, title: 'Structure', group: 'editors', closable: false, content: <StructureEditor />};
    const tree = {id: `${index++}`, title: 'Tree View', group: 'editors', closable: false, content: <TreeEditor />};
    const views = {id: `${index++}`, title: 'Views', group: 'editors', closable: false, content: <ViewsEditor />};
    const node = {id: `${index++}`, title: 'Node', group: 'editors', closable: false, content: <NodeEditor />};
    const viewpoints = {id: `${index++}`, title: 'Perspectives', group: 'editors', closable: false, content: <ViewpointEditor validation={false} />};
    const validation = {id: `${index++}`, title: 'Validation', group: 'editors', closable: false, content: <ViewpointEditor validation={true} />};
    const collaborators = {id: `${index++}`, title: 'Collaborators', group: 'editors', closable: false, content: <CollaboratorsEditor />};
    const mqtt = {id: `${index++}`, title: 'Mqtt', group: 'editors', closable: false, content: <MqttEditor />};
    const console = {id: `${index++}`, title: 'Console', group: 'editors', closable: false, content: <Console />};

    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};
    layout.dockbox.children.push({tabs: [ModelsSummary]});
    layout.dockbox.children.push({tabs: [
        structure,
        tree,
        views,
        viewpoints,
        validation,
        // collaborators,
        // mqtt,
        node,
        console
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

