import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import type {GObject, Pointer, DModel} from "../../joiner";
import {Edges, LModel, LReference, DState} from "../../joiner";

function EdgesManagerComponent(props: AllProps) {
    const model = props.model;
    const classes = model.classes;
    if(classes) {
        const references: LReference[] = [];
        for(let lClass of classes) { references.push(...lClass.references) }
        return(<div>
            {classes.map((lClass) => {return lClass.subNodes?.filter((node) => { return node.model?.className === "DReference" })
                .map((refNode) => { return <Edges source={refNode} /> })})}
            {classes.map((lClass) => {return lClass.nodes?.map((node) => {return <Edges source={node} />})})}
        </div>);
    } return(<></>);

}
interface OwnProps { modelid: Pointer<DModel, 1, 1, LModel> }
interface StateProps { model: LModel }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = { } as any;
    ret.model = LModel.fromPointer(ownProps.modelid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EdgesManagerConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(EdgesManagerComponent);

export const EdgesManager = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <EdgesManagerConnected {...{...props, children}} />;
}
export default EdgesManager;
