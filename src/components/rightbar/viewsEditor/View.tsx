import React, {Dispatch, ReactElement} from 'react';
import type {LViewElement} from '../../../joiner';
import {DState, DUser, LProject, LUser, LViewPoint, Defaults} from "../../../joiner";
import InfoData from './data/InfoData';
import NodeData from './data/NodeData';
import TemplateData from './data/TemplateData';
import EdgeData from './data/EdgeData';
import EdgePointData from './data/EdgePointData';
import {DockLayout} from 'rc-dock';
import {LayoutData} from 'rc-dock/lib/DockData';
import CustomData from './data/CustomData';
import SubViewsData from './data/SubViewsData';
import {FakeStateProps} from "../../../joiner/types";
import {connect} from "react-redux";

function ViewDataComponent(props: AllProps) {
    const view = props.view;
/*
    if(!view) {
        SetRootFieldAction.new('stackViews', undefined, '-=', false);
        return(<></>);
    }*/
    const viewpoints = props.viewpoints;
    const debug = props.debug;
    const readOnly = !debug && Defaults.check(view.id);

    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};
    const tabs = [
        {id: '1', title: 'Info', group: '1', closable: false, content: <InfoData view={view} viewpoints={viewpoints} readonly={readOnly} />},
        {id: '2', title: 'Node', group: '1', closable: false, content: <NodeData view={view} readonly={readOnly} />},
        {id: '3', title: 'Template', group: '1', closable: false, content: <TemplateData view={view} readonly={readOnly} />},
        {id: '4', title: 'Custom Data', group: '1', closable: false, content: <CustomData viewID={view.id} readonly={readOnly} />},
        {id: '5', title: 'Sub Views', group: '1', closable: false, content: <SubViewsData viewID={view.id} readonly={readOnly} setSelectedView={props.setSelectedView} />}
    ];
    if(view.appliableTo === 'edge') tabs.push(
        {id: '5', title: 'Edge', group: '1', closable: false, content: <EdgeData view={view} readonly={readOnly} />}
    );
    if(view.appliableTo === 'edgePoint') tabs.push(
        {id: '6', title: 'EdgePoint', group: '1', closable: false, content: <EdgePointData view={view} readonly={readOnly} />}
    );
    layout.dockbox.children.push({tabs});

    return(<div>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>{view.name}</b>
            <button className={'btn btn-danger ms-auto'} onClick={ () => props.setSelectedView(undefined)}>
                <i className={'p-1 bi bi-arrow-left'}></i>
            </button>
        </div>
        <DockLayout defaultLayout={layout} style={{position: 'absolute', left: 10, top: 40, right: 10, bottom: 10}} />
    </div>);
}
interface OwnProps {
    view: LViewElement;
    setSelectedView: React.Dispatch<React.SetStateAction<LViewElement | undefined>>;// (val: LViewElement | undefined) => {}
}
interface StateProps {
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
