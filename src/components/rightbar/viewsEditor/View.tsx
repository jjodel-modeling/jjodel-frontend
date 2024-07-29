import React, {Dispatch, ReactElement} from 'react';
import {DViewElement, Log, LViewElement, Pointer, Try} from '../../../joiner';
import {DState, DUser, LProject, LUser, LViewPoint, Defaults, LPointerTargetable} from "../../../joiner";
import InfoData from './data/InfoData';
import NodeData from './data/NodeData';
import TemplateData from './data/TemplateData';
import EdgeData from './data/EdgeData';
import EdgePointData from './data/EdgePointData';
import {DockLayout} from 'rc-dock';
import {LayoutData} from 'rc-dock/lib/DockData';
import EventsData from './data/CustomData';
import SubViewsData from './data/SubViewsData';
import {FakeStateProps} from "../../../joiner/types";
import {connect} from "react-redux";
import PaletteData from "./data/PaletteData";
import GenericNodeData from "./data/GenericNodeData";
// import "./view.scss";

const tabidprefix = "Dock_in_view_detail";
let idcounter = 0;
function id(){ // NB: cannot use just indexes or tab title because the id is injected in html, so it must be unique in the whole page.
    return tabidprefix + (idcounter++);
}


function ViewDataComponent(props: AllProps) {
    const view = props.view;
    (window as any).view = view;
/*
    if(!view) {
        SetRootFieldAction.new('stackViews', undefined, '-=', false);
        return(<></>);
    }*/
    const viewpoints = props.viewpoints;
    const debug = props.debug;
    const readOnly = !debug && Defaults.check(view.id);

    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};
    let i = 1;
    const tabs = [
        {id: id(), title: 'Overview', group: '1', closable: false, content: <Try><InfoData viewID={view.id} viewpointsID={viewpoints.map(vp => vp.id)} readonly={readOnly} /></Try>},
        {id: id(), title: 'Template', group: '1', closable: false, content: <Try><TemplateData viewID={view.id} readonly={readOnly} /></Try>},
        {id: id(), title: 'Palette/Css', group: '1', closable: false, content: <Try><PaletteData viewID={view.id} readonly={readOnly} /></Try>},
        {id: id(), title: 'Events', group: '1', closable: false, content: <Try><EventsData viewID={view.id} readonly={readOnly} /></Try>},
        {id: id(), title: 'Options', group: '1', closable: false, content: <Try><GenericNodeData viewID={view.id} readonly={readOnly} /></Try>},
    ];
    /*
    if(view.appliableTo === 'node') tabs.push(
        {id: 'sharedid', title: 'Node behaviour', group: '1', closable: false, content: <NodeData viewID={view.id} readonly={readOnly} />},
    );
    if(view.appliableTo === 'edge') tabs.push(
        {id: 'sharedid', title: 'Edge', group: '1', closable: false, content: <EdgeData viewID={view.id} readonly={readOnly} />}
    );
    if(view.appliableTo === 'edgePoint') tabs.push(
        {id: 'sharedid', title: 'EdgePoint', group: '1', closable: false, content: <EdgePointData viewID={view.id} readonly={readOnly} />}
    );*/
    tabs.push({id: id(), title: 'Sub Views', group: '1', closable: false, content: <Try><SubViewsData viewID={view.id} readonly={readOnly} setSelectedView={props.setSelectedView} /></Try>});



    // Log.exx('$crash', "test crash", {propss:props});
    layout.dockbox.children.push({tabs});

    return(<div>
        <div className={'d-flex p-2 view-editor'}>
            <b className={'ms-1 my-auto'}>{view.name}</b>
            <button className={'bg btn-back ms-auto'} onClick={ () => props.setSelectedView(undefined)}>
                <i className={'p-1 bi bi-arrow-left'}></i>
            </button>
        </div>
        <DockLayout defaultLayout={layout} style={{position: 'absolute', left: 10, top: 40, right: 10, bottom: 10, marginBottom: "20px"}} />
    </div>);
}
interface OwnProps {
    viewid: Pointer<DViewElement>;
    setSelectedView: React.Dispatch<React.SetStateAction<Pointer<DViewElement> | undefined>>;// (val: LViewElement | undefined) => {}
}
interface StateProps {
    view: LViewElement;
    project: LProject;
    viewpoints: LViewPoint[];
    debug: boolean;
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const user = LUser.fromPointer(DUser.current);
    ret.project = user.project as LProject;
    ret.viewpoints = ret.project.viewpoints;
    ret.debug = state.debug;
    ret.view = LPointerTargetable.fromPointer(ownProps.viewid, state);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ViewDataConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ViewDataComponent);

export const ViewData = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ViewDataConnected {...{...props, children}} />;
}
export default ViewData;
