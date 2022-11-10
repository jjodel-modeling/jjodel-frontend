import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import Xarrow from "react-xarrows";
import {ReactComponent as HeadSvg} from "./assets/head.svg";
import type {LGraphElement, LRefEdge, DClass, LClass, LReference, MyProxyHandler, Pointer} from "../../joiner";
import {LModelElement, Pointers} from "../../joiner";
import Edge from "./Edge";
import EdgeTest from "./test";

interface ThisState {}

function EdgesComponent(props: AllProps, state: ThisState) {
    const lReference: LReference = props.source?.model as any;
    const lTarget: LClass = LModelElement.from(lReference?.type as any as Pointer<DClass, 1, 1, LClass>);
    return <>
        {(props.targets) ? props.targets.map((targetNode) => {
            return <EdgeTest source={props.source as any} target={targetNode} />
        })
            :
            null //<Edges source={props.source} targets={lTarget.nodes} />
        }
    </>;
}

interface OwnProps {
    graphID?: string | LModelElement;
    nodeID?: string | LModelElement;
    source?: LGraphElement;
    targets?: LGraphElement[]
}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    /*const dRefEdges = state.refEdges;
    const lRefEdges: LRefEdge[] = [];
    for(let refEdge of dRefEdges){
        const lRefEdge: LRefEdge = MyProxyHandler.wrap(refEdge);
        lRefEdges.push(lRefEdge);
    }
    const ret: StateProps = {refEdges: lRefEdges};*/
    const ret: StateProps = {};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EdgesConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EdgesComponent);

export const Edges = (props: AllProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <EdgesConnected {...{...props, childrens}} />;
}
export default Edges;
