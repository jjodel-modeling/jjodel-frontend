import {EdgeOptions, IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, useEffect, useState} from "react";
import {connect} from "react-redux";
import {LModelElement,} from "../../joiner";
import LeaderLine from "leader-line-new";


interface ThisState {}


function EdgesManagerComponent(props: AllProps, state: ThisState) {
    const reduxEdges = props.edges;
    const dragging = props.dragging;
    const [edges, setEdges] = useState(new Map<number, LeaderLine>());

    useEffect(() => {
        for(let reduxEdge of reduxEdges) {
            const id = reduxEdge.id;
            const options = reduxEdge.options;
            if(!edges.has(id)){
                options.color = "red";
                const ld = new LeaderLine(options);
                edges.set(id, ld);
            }
        }

        for(let edge of edges.entries()) {
            const id = edge[0];
            const ld = edge[1];
            if(reduxEdges.filter((x) => {return x.id === id}).length === 0) {
                edges.delete(id);
                ld.remove();
            }
        }

        const lElement: LModelElement = LModelElement.from(dragging.id);
        const subNodes = (lElement.subNodes) ? lElement.subNodes : [];
        const nodes = (lElement.nodes) ? lElement.nodes : [];
        const allNodes = [...nodes, ...subNodes];
        for(let edge of edges.entries()) {
            const id = edge[0];
            const ld = edge[1];
            const start = (ld.start as HTMLElement)['id'];
            const end = (ld.end as HTMLElement)['id'];
            for(let node of allNodes) {
                if(start === node.id || end === node.id) {
                    ld.position();
                }
            }
        }
    },[reduxEdges, dragging.random]);

    return <></>;
}
interface OwnProps {}
interface StateProps { edges: EdgeOptions[], dragging: {random: number, id: string} }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = { edges: state.edges, dragging: state.dragging };
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EdgesManagerConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EdgesManagerComponent);

export const EdgesManager = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <EdgesManagerConnected {...{...props, childrens}} />;
}
export default EdgesManager;
