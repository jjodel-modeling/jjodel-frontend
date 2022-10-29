import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import Xarrow from "react-xarrows";
import {ReactComponent as HeadSvg} from "./assets/head.svg";
import {LRefEdge} from "../../model/dataStructure/GraphDataElements";
import {LReference, MyProxyHandler} from "../../joiner";
import Edge from "./Edge";

interface ThisState {}
function EdgesComponent(props: AllProps, state: ThisState) {

    const edges = [...props.refEdges];

    return(<div>
        {edges.filter((e) => true).map((lRefEdge, i) => {
            const lReference: LReference = MyProxyHandler.wrap(lRefEdge.start);
            return Edge.ReferenceEdge(lRefEdge, lReference);
        })}
    </div>);
}
interface OwnProps { graphID:string, nodeID: string }
interface StateProps { refEdges: LRefEdge[]; }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const dRefEdges = state.refEdges;
    const lRefEdges: LRefEdge[] = [];
    for(let refEdge of dRefEdges){
        const lRefEdge: LRefEdge = MyProxyHandler.wrap(refEdge);
        lRefEdges.push(lRefEdge);
    }
    const ret: StateProps = {refEdges: lRefEdges};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const EdgesConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EdgesComponent);

export const Edges = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <EdgesConnected {...{...props, childrens}} />;
}
export default Edges;






/*

example:
<EdgeContainer graph={this.props.graphid}> <--genera un svg allineato con la griglia del grafo che lo contiene
    this.props.model.edges.map( e =>
        <Edge vertex_start={ e.start } vertex_end={ e.end } edgeid={ e.id } edge = {e} />
    )
</EdgeContainer>



about "model.edges", every time you create a reference an edge is created inside redux state
if the reference is deleted, the edge is deleted
if the edge is deleted, the user will choose to delete the reference or only the edge
the user can create edges unrelated to modelelements (detached)
a detached edge, can be attached later on to a reference


*/

