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
import InfoTab from './tabs/InfoTab';
import DockManager from './DockManager';

function DockComponent(props: AllProps) {
    const groups = {
        'models': {floatable: true, maximizable: true},
        'editors': {floatable: true, maximizable: true}
    };

    /* Models */
    const info = {id: '0', title: 'Summary', group: 'models', closable: false, content: <InfoTab />};

    /* Editors */
    const test = {id: '999', title: 'Test', group: 'editors', closable: false, content: <TestTab />};
    const structure = {id: '1', title: 'Structure', group: 'editors', closable: false, content: <StructureEditor />};
    const tree = {id: '2', title: 'Tree View', group: 'editors', closable: false, content: <TreeEditor />};
    const views = {id: '3', title: 'Views', group: 'editors', closable: false, content: <ViewsEditor />};
    const node = {id: '4', title: 'Node', group: 'editors', closable: false, content: <NodeEditor />};
    const viewpoints = {id: '6', title: 'Viewpoints', group: 'editors', closable: false, content: <ViewpointEditor />};
    const collaborators = {id: '7', title: 'Collaborators', group: 'editors', closable: false, content: <CollaboratorsEditor />};
    const console = {id: '8', title: 'Console', group: 'editors', closable: false, content: <Console />};

    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};
    layout.dockbox.children.push({tabs: [info]});
    layout.dockbox.children.push({tabs: [
        structure,
        tree,
        node,
        views,
        viewpoints,
        collaborators,
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

