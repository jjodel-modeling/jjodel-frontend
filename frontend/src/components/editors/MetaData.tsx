import {DNamedElement, DState, GObject, LModelElement, LPointerTargetable, Overlap} from "../../joiner";
import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";

type AllProps = Overlap<OwnProps, Overlap<StateProps, DispatchProps>>;
function MetaDataComponent(props:AllProps): ReactElement{
    let ddata: DNamedElement = props.data?.__raw as any;
    return(
        <div className={'px-3 mt-3 metadata-editor'}>
            {
    !props.data ? "Select a Node." : <>
        <h2>{props.data.name}</h2>
    {ddata.className !== 'DModel' && props.data.isInstantiable() &&
    <label className={"d-flex"}>
    <span className={"my-auto"}>Icon</span>
        <input className={"ms-1 my-auto"} type={"url"} placeholder={"icon url or base64 string"} value={props.data.state.icon}
        onChange={(e)=>{ props.data.state={icon:e.target.value}}}/>
        {props.data.state.icon && <img className={"ms-1 my-auto"} style={{maxWidth: "50px", maxHeight: "50px"}} src={props.data.state.icon} alt={"Invalid url/data"}/>}
        </label>}
        </>}
        </div>);
        }
// todo: how to memo with redux?
// memo(ModelMetaDataComponent, ((p1: AllProps, p2: AllProps) => { p1.data.clonedCounter === p2.data.clonedCounter}) as any);

export interface OwnProps {}
interface StateProps {
    data: LPointerTargetable & GObject;
}
interface DispatchProps { }

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as StateProps;
    const dataid = state._lastSelected?.modelElement;
    if (dataid) ret.data = LModelElement.fromPointer(dataid);
    /*
    const nodeid = state._lastSelected?.node;
    if(nodeid) ret.node = LGraphElement.fromPointer(nodeid);
    const viewid = state._lastSelected?.view;
    if(viewid) ret.view = LViewElement.fromPointer(viewid);*/
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const MetaDataConnected = connect<StateProps, DispatchProps, OwnProps, DState>(mapStateToProps, mapDispatchToProps)(MetaDataComponent);

export function MetaData(props: OwnProps, children: (string | React.Component)[] = []): ReactElement {
    return <MetaDataConnected {...{...props, children}} />;
}
