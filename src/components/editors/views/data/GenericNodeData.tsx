import React, {Dispatch} from 'react';
import {DState, DViewElement, LPointerTargetable, LViewElement, Pointer} from '../../../../joiner';
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";
import EdgeData from "./EdgeData";
import EdgePointData from "./EdgePointData";
import FieldData from "./FieldData";
import GraphData from "./GraphData";
import NodeData from "./NodeData";

function GenericNodeDataComponent(props: AllProps) {
    const view = props.view;
    let dview = (view.__raw || view) as DViewElement;
    const vid = props.view.id;
    const readOnly = props.readonly;
    let isField = true;
    let isGraph = false;
    let isVertex = false;
    let isEdge = false;
    let isEdgePoint = false;
    switch (dview.appliableTo) {
        case 'Graph': isGraph = true; break;
        case 'GraphVertex': isGraph = isVertex = true; break;
        case 'Vertex': isVertex = true; break;
        case 'Edge': isEdge = true; break;
        case 'EdgePoint': isEdgePoint = isVertex = true; break;
        case undefined: case 'Any': isGraph = isVertex = isEdge = isEdgePoint = true; break;
        default: case 'Field': break;
    }
/*
    isField = false;
    isGraph = false;
    isVertex = false;
    isEdge = false;
    isEdgePoint = false;*/
    return(<section className={'p-3'}>
        {isField && <FieldData viewID={vid} readonly={readOnly} />}
        {isEdge && <EdgeData viewID={vid} readonly={readOnly} />}
        {isEdgePoint && <EdgePointData viewID={vid} readonly={readOnly} />}
        {isVertex && <NodeData viewID={vid} readonly={readOnly} />}
        {isGraph && <GraphData viewID={vid} readonly={readOnly} />}
    </section>);
}

interface OwnProps {
    viewID: Pointer<DViewElement>;
    readonly : boolean;
}

interface StateProps {
    view: LViewElement;
}

interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LPointerTargetable.fromPointer(ownProps.viewID);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const GenericNodeData = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(GenericNodeDataComponent);

export default GenericNodeData;
