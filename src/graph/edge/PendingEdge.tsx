import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, useEffect, useState} from "react";
import {connect} from "react-redux";
import {LClass, LPointerTargetable, LUser, SetRootFieldAction} from "../../joiner";
import "./edge.scss";
import LeaderLine from "leader-line-new";

function PendingEdgeComponent(props: AllProps) {

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if(props.source) {
            const source = document.getElementById(props.source.nodes[0].id);
            const target = document.getElementById("edge-target");
            if(source && target) {
                const options: LeaderLine.Options = {start: source, end: target};
                options.size = 2; options.color = "black";
                options.path = "grid"; options.endPlugSize = 3; options.endPlug = "arrow3";
                if(props.edge) { props.edge.position(); }
                else {
                    SetRootFieldAction.new("pendingEdge", new LeaderLine(options), "", false);
                }
            }
            const updateMousePosition = (ev: MouseEvent) => { setMousePosition({ x: ev.clientX, y: ev.clientY }); };
            window.addEventListener('mousemove', updateMousePosition);
            return () => { window.removeEventListener('mousemove', updateMousePosition); };

        } else {
            if(props.edge) {
                SetRootFieldAction.new("pendingEdge", undefined, "", false);
                props.edge.remove();
            }
        }
    }, [mousePosition, props]);

    return <>
        <div className={"target"} style={{top: (mousePosition.y - 40) + "px", left: (mousePosition.x - 10) + "px"}}
               id={"edge-target"}></div>
    </>;
}

interface OwnProps {}
interface StateProps { user: LUser | undefined, source: LClass | undefined, edge: LeaderLine | undefined }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const user = LPointerTargetable.from(state.isEdgePending.user);
    const source = LPointerTargetable.from(state.isEdgePending.source);
    const edge = state.pendingEdge;
    const ret: StateProps = {user, source, edge};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const PendingEdgeConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(PendingEdgeComponent);

export const PendingEdge = (props: AllProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <PendingEdgeConnected {...{...props, childrens}} />;
}
export default PendingEdge;
