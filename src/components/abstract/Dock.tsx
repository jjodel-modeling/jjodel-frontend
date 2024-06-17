import './style.scss';
import {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState, Try} from '../../joiner';
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

function DockComponent(props: AllProps) {
    const groups = {
        'models': {floatable: true, maximizable: true},
        'editors': {floatable: true, maximizable: true}
    };

    /* Models */
    const ModelsSummary = {id: '0', title: 'Summary', group: 'models', closable: false, content: <Try><ModelsSummaryTab /></Try>};

    /* Editors */
    let index = 1;
    const test = {id: `${index++}`, title: 'Test', group: 'editors', closable: false, content: <TestTab />};
    const structure = {id: `${index++}`, title: 'Structure', group: 'editors', closable: false, content: <Try><StructureEditor /></Try>};
    const metadata = {id: `${index++}`, title: 'Metadata', group: 'editors', closable: false, content: <Try><ModelMetaData /></Try>};
    const tree = {id: `${index++}`, title: 'Tree View', group: 'editors', closable: false, content: <Try><TreeEditor /></Try>};
    const views = {id: `${index++}`, title: 'Views', group: 'editors', closable: false, content: <Try><ViewsEditor /></Try>};
    const node = {id: `${index++}`, title: 'Node', group: 'editors', closable: false, content: <Try><NodeEditor /></Try>};
    const viewpoints = {id: `${index++}`, title: 'Perspectives', group: 'editors', closable: false, content: <Try><ViewpointEditor validation={false} /></Try>};
    const validation = {id: `${index++}`, title: 'Validation', group: 'editors', closable: false, content: <Try><ViewpointEditor validation={true} /></Try>};
    const collaborators = {id: `${index++}`, title: 'Collaborators', group: 'editors', closable: false, content: <Try><CollaboratorsEditor /></Try>};
    const mqtt = {id: `${index++}`, title: 'Mqtt', group: 'editors', closable: false, content: <Try><MqttEditor /></Try>};
    const console = {id: `${index++}`, title: 'Console', group: 'editors', closable: false, content: <Try><Console /></Try>};

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

