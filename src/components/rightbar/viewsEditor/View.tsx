import React, {Dispatch, ReactElement} from 'react';
import {DViewElement, DViewPoint, Log, LViewElement, Pointer, Try, U} from '../../../joiner';
import {DState, DUser, LProject, LUser, LViewPoint, Defaults, LPointerTargetable} from "../../../joiner";
import InfoData from './data/InfoData';
import NodeData from './data/NodeData';
import TemplateData from './data/TemplateData';
import EdgeData from './data/EdgeData';
import EdgePointData from './data/EdgePointData';
import {DockLayout} from 'rc-dock';
import {LayoutData} from 'rc-dock/lib/DockData';
import EventsData from './data/CustomData';
import {FakeStateProps, Overlap} from "../../../joiner/types";
import {connect} from "react-redux";
import PaletteData from "./data/PaletteData";
import GenericNodeData from "./data/GenericNodeData";

import { CommandBar, Btn } from '../../commandbar/CommandBar';
import "./view.scss";

const tabidprefix = "Dock_in_view_detail";

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
    let viewChain: LViewElement[] = [...view.fatherChain.reverse(), view];

    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};

    let idcounter = 0;
    function id(){ // NB: cannot use just indexes or tab title because the id is injected in html, so it must be unique in the whole page.
        return tabidprefix + (idcounter++);
    }

    const tabs = [
        {id: id(), title: 'Apply to', group: '1', closable: false, content: <Try><InfoData viewID={view.id} viewpointsID={viewpoints.map(vp => vp.id)} readonly={readOnly} /></Try>},
        {id: id(), title: 'Template', group: '1', closable: false, content: <Try><TemplateData viewID={view.id} readonly={readOnly} /></Try>},
        {id: id(), title: 'Style', group: '1', closable: false, content: <Try><PaletteData viewID={view.id} readonly={readOnly} /></Try>},
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
    //tabs.push({id: id(), title: 'Sub Views', group: '1', closable: false, content: <Try><SubViewsData viewID={view.id} readonly={readOnly} setSelectedView={props.setSelectedView} /></Try>});



    // Log.exx('$crash', "test crash", {propss:props});
    layout.dockbox.children.push({tabs});
    // let allParentViews = view.father

    return(<div className={"view-editor-root"}>
        {<div className={'view-editor-header'}>
            <CommandBar>
                <Btn icon={'back'} action={() => props.setSelectedView(undefined)} tip={'Back'}/>
            </CommandBar>
            <div className={"path-list"}>{
                (viewChain.map((v, i) => <>
                    <div className={"path-element"} onClick={()=>props.setSelectedView(i === 0 ? undefined : v.id)}>
                        {U.cropStr(v.name, 1,1, 10, 10)}
                    </div>
                </>) as any
                ).separator(
                    <i className={"path-separator bi bi-chevron-right"} />
                )
            }</div>
        </div>}
        <DockLayout defaultLayout={layout} />
    </div>);
}
interface OwnProps {
    viewid: Pointer<DViewElement>;
    viewpoints: Pointer<DViewPoint>[];
    setSelectedView: React.Dispatch<React.SetStateAction<Pointer<DViewElement> | undefined>>;// (val: LViewElement | undefined) => {}
}
interface StateProps {
    view: LViewElement;
    project: LProject;
    viewpoints: LViewPoint[];
    debug: boolean;
}
interface DispatchProps { }
type AllProps = Overlap<OwnProps, StateProps> & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    // const user = LUser.fromPointer(DUser.current, state);
    // ret.project = user.project as LProject;
    ret.viewpoints = LPointerTargetable.fromArr(ownProps.viewpoints); // ret.project.viewpoints;
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
