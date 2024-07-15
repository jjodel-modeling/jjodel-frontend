import './style.scss';
import {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState, LoggerComponent, Try} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import {DockLayout, LayoutData} from 'rc-dock';
import {Info, Skeleton, Viewpoints, Views, Logger, Console} from "../../components/editors";
import DockManager from './DockManager';
import ModelsSummaryTab from "./tabs/ModelsSummaryTab";


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
    const structure = {id: id(), title: 'Structure', group: 'editors', closable: false, content: <Try><Info /></Try>};
    // const metadata = {id: id(), title: 'Metadata', group: 'editors', closable: false, content: <Try><ModelMetaData /></Try>};
    const tree = {id: id(), title: 'Tree View', group: 'editors', closable: false, content: <Try><Skeleton /></Try>};
    const views = {id: id(), title: 'Views', group: 'editors', closable: false, content: <Try><Views /></Try>};
    // const node = {id: id(), title: 'Node', group: 'editors', closable: false, content: <Try><NodeEditor /></Try>};
    const viewpoints = {id: id(), title: 'Perspectives', group: 'editors', closable: false, content: <Try><Viewpoints /></Try>};
    // const validation = {id: id(), title: 'Validation', group: 'editors', closable: false, content: <Try><ViewpointEditor validation={true} /></Try>};
    // const collaborators = {id: id(), title: 'Collaborators', group: 'editors', closable: false, content: <Try><CollaboratorsEditor /></Try>};
    // const mqtt = {id: id(), title: 'Mqtt', group: 'editors', closable: false, content: <Try><MqttEditor /></Try>};
    const console = {id: id(), title: 'Console', group: 'editors', closable: false, content: <Try><Console /></Try>};
    // const logger = {id: id(), title: 'Logger', group: 'editors', closable: false, content: <Try><LoggerComponent /></Try>};
    const logger = {id: id(), title: 'Logger', group: 'editors', closable: false, content: <Try><Logger /></Try>};


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
        // node,
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

