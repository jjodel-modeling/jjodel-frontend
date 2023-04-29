import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import type {Pointer, DModel} from "../../../joiner";
import {LGraph, LModel, DGraph, DModelElement, LModelElement} from "../../../joiner";
import {DefaultNode} from "../../../joiner/components";
import ToolBar from "../../toolbar/ToolBar";
import PendingEdge from "../../../graph/edge/PendingEdge";
import ContextMenu from "../../toolbar/ContextMenu";
import EdgesManager from "../../../graph/edges/EdgesManager";


function InfoTabComponent(props: AllProps) {
    const metamodels = props.metamodels;
    const models = props.models;

    return(<div className={'p-1'}>
        <b><label className={'ms-1 text-primary'}>Metamodels ({metamodels.length}):</label></b>
        <br />
        {metamodels.map((model, index) => {
            return(<>
                <label className={'ms-3'} key={index}>-{model.name}</label>
                <br />
            </>);
        })}
        <b><label className={'ms-1 text-primary'}>Models ({models.length}):</label></b><br />
        {models.map((model, index) => {
            return(<>
                <label className={'ms-3'} key={index}>
                    -{model.name} <b className={'text-success'}>{model.instanceof ? "conforms to" : "is shapeless"}</b> {model.instanceof?.name}
                </label>
                <br />
            </>);
        })}
    </div>);
}
interface OwnProps {}
interface StateProps {models: LModel[], metamodels: LModel[]}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const models: LModel[] = LModel.fromPointer(state.models);
    ret.metamodels = models.filter((m) => {return m.isMetamodel});
    ret.models = models.filter((m) => {return !m.isMetamodel});
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const InfoTabConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(InfoTabComponent);

export const InfoTab = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <InfoTabConnected {...{...props, childrens}} />;
}
export default InfoTab;
