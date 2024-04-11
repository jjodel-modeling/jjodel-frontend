import React, {Dispatch, ReactElement} from 'react';
import type {DViewElement, LViewElement, Pointer} from '../../../joiner';
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
        {id: ''+i++, title: 'Overview', group: '1', closable: false, content: <InfoData viewID={view.id} viewpointsID={viewpoints.map(vp => vp.id)} readonly={readOnly} />},
        {id: ''+i++, title: 'Template', group: '1', closable: false, content: <TemplateData viewID={view.id} readonly={readOnly} />},
        {id: ''+i++, title: 'Palette/Css', group: '1', closable: false, content: <PaletteData viewID={view.id} readonly={readOnly} />},
        {id: ''+i++, title: 'Events', group: '1', closable: false, content: <EventsData viewID={view.id} readonly={readOnly} />},
        {id: ''+i++, title: 'Node behaviour', group: '1', closable: false, content: <NodeData viewID={view.id} readonly={readOnly} />},
    ];
    if(view.appliableTo === 'edge') tabs.push(
        {id: ''+i++, title: 'Edge', group: '1', closable: false, content: <EdgeData viewID={view.id} readonly={readOnly} />}
    );
    if(view.appliableTo === 'edgePoint') tabs.push(
        {id: ''+i++, title: 'EdgePoint', group: '1', closable: false, content: <EdgePointData viewID={view.id} readonly={readOnly} />}
    );
    tabs.push({id: ''+i++, title: 'Sub Views', group: '1', closable: false, content: <SubViewsData viewID={view.id} readonly={readOnly} setSelectedView={props.setSelectedView} />});
    layout.dockbox.children.push({tabs});

    return(<div>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>{view.name}</b>
            <button className={'btn btn-danger ms-auto'} onClick={ () => props.setSelectedView(undefined)}>
                <i className={'p-1 bi bi-arrow-left'}></i>
            </button>
        </div>
        <DockLayout defaultLayout={layout} style={{position: 'absolute', left: 10, top: 40, right: 10, bottom: 10, marginBottom: "20px"}} />
    </div>);
}
interface OwnProps {
    viewid: Pointer<DViewElement>;
    setSelectedView: React.Dispatch<React.SetStateAction<LViewElement | undefined>>;// (val: LViewElement | undefined) => {}
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
