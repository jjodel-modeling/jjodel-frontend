import './style.scss';
import {Dispatch, ReactElement, ReactNode} from 'react';
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
    const groups = {
        'models': {floatable: true, maximizable: true},
        'editors': {floatable: true, maximizable: true}
    };

    /* Models */
    // const ModelsSummary = {id: id(), title: <TabHeader tid={tid()}><JLogo style={{marginLeft: '-10px', fontSize: '1.5rem', paddingRight: '6px'}}/> Summary</TabHeader>, group: 'models', closable: false, content: <TabContent tid={tid()}><ModelsSummaryTab /></TabContent>};


    let advanced:boolean = props.advanced;
    /* Editors */


    const ModelsSummary = {id: id(), title: <TabHeader tid={tid()}><Logo style={{marginLeft: '-10px', fontSize: '1.5rem', paddingRight: '6px'}}/> {user?.project?.name}</TabHeader>, group: 'models', closable: false, content: <TabContent tid={tid()}><ModelsSummaryTab /></TabContent>};
    //const test = {id: id(), title: 'Test', group: 'editors', closable: false, content: <TestTab />};
    const structure = {id: id(), title: <TabHeader tid={tid()}>Properties</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Info mode={'tab'}/></TabContent>};
    const metadata = {id: id(), title: <TabHeader tid={tid()}>Metadata</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><MetaData /></TabContent>};
    const tree = {id: id(), title: <TabHeader tid={tid()}>Tree View</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Skeleton /></TabContent>};
    // const views = {id: id(), title: <TabHeader tid={tid()}>Views</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Views /></TabContent>};
    const node = {id: id(), title: <TabHeader tid={tid()}>Node</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><NodeEditor /></TabContent>};
    const views = {id: id(), title: <TabHeader tid={tid()}>Viewpoints</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><NestedView /></TabContent>};
    //const validation = {id: id(), title: <TabHeader tid={tid()}>Validation</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><ViewpointEditor validation={true} /></TabContent>};
    const collaborative = {id: id(), title: <TabHeader tid={tid()}>Collaborative</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Collaborative /></TabContent>};
    // const mqtt = {id: id(), title: <TabHeader tid={tid()}>Mqtt</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><MqttEditor /></TabContent>};
    // const broker = {id: id(), title: <TabHeader tid={tid()}>Broker</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><BrokerEditor /></TabContent>};
    const console = {id: id(), title: <TabHeader tid={tid()}>Console</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Console /></TabContent>};
    const logger = {id: id(), title: <TabHeader tid={tid()}>Logger</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><Logger/></TabContent>};
    const permissions = {id: id(), title: <TabHeader tid={tid()}>Permissions</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><PermissionModelTab/></TabContent>};
    const mtm = {id: id(), title: <TabHeader tid={tid()}>Languages</TabHeader>, group: 'editors', closable: false, content: <TabContent tid={tid()}><MTM/></TabContent>};

    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};
    layout.dockbox.children.push({tabs: [ModelsSummary]});

    const tabs = [];
    tabs.push(structure);
    tabs.push(tree);
    tabs.push(views);
    // if (advanced) tabs.push(metadata);
    // if (advanced) tabs.push(broker);
    tabs.push(node);
    tabs.push(console);
    if (advanced) tabs.push(mtm);
    if (advanced) tabs.push(logger);

    if (user?.project?.type === 'collaborative') tabs.push(collaborative);
    if (false && user?.project?.type === 'collaborative') tabs.push(permissions);
    layout.dockbox.children.push({tabs});

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

