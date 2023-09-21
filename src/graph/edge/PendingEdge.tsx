import React, {Dispatch, ReactElement, useEffect} from "react";
import {useStateIfMounted} from "use-state-if-mounted";
import {connect} from "react-redux";
import {DState, GObject, LClass, LPointerTargetable, LUser} from "../../joiner";
import "./edge.scss";
import Xarrow, {Xwrapper} from "react-xarrows";

function PendingEdgeComponent(props: AllProps) {

    const source = props.source;
    const [mousePosition, setMousePosition] = useStateIfMounted({x: 0, y: 0});

    useEffect(() => {
        if(source) {
            const updateMousePosition = (ev: MouseEvent) => {setMousePosition({x: ev.clientX, y: ev.clientY});};
            window.addEventListener('mousemove', updateMousePosition);
            return () => {window.removeEventListener('mousemove', updateMousePosition);};
        }
    }, );

    return <Xwrapper>
        <div style={{zIndex: -999, top: mousePosition.y - 100, left: mousePosition.x - 10}}
             id={'extend-target'}></div>
        {source && <Xarrow start={source.nodes[0].id} end={'extend-target'} zIndex={999}
                           showHead={true} headSize={20} showTail={false} color={'rgba(0, 0, 0, 0.5)'} strokeWidth={1} />}
    </Xwrapper>;
}

interface OwnProps { }
interface StateProps { user?: LUser, source?: LClass, edgeSettings?: GObject }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = { } as any;
    ret.user = LPointerTargetable.from(state.isEdgePending.user);
    ret.source = LPointerTargetable.from(state.isEdgePending.source);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const PendingEdgeConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(PendingEdgeComponent);

export const PendingEdge = (props: AllProps, children: (string | React.Component)[] = []): ReactElement => {
    return <PendingEdgeConnected {...{...props, children}} />;
}
export default PendingEdge;
