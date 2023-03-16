import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, useEffect} from "react";
import {useStateIfMounted} from "use-state-if-mounted";
import {connect} from "react-redux";
import {GObject, LClass, LPointerTargetable, LUser} from "../../joiner";
import "./edge.scss";
import Xarrow, {Xwrapper} from "react-xarrows";

function PendingEdgeComponent(props: AllProps) {

    const source = props.source;
    const [mousePosition, setMousePosition] = useStateIfMounted({x: 0, y: 0});
    const options = props.edgeSettings;

    useEffect(() => {
        if(source) {
            const updateMousePosition = (ev: MouseEvent) => {setMousePosition({x: ev.clientX, y: ev.clientY});};
            window.addEventListener('mousemove', updateMousePosition);
            return () => {window.removeEventListener('mousemove', updateMousePosition);};
        }
    }, );

    return <Xwrapper>
        <div style={{top: (mousePosition.y - 40) + "px", left: (mousePosition.x - 10) + "px"}}
             id={'extend-target'}></div>
        {source && <Xarrow start={source.nodes[0].id} end={'extend-target'} {...options} />}
    </Xwrapper>;
}

interface OwnProps { }
interface StateProps { user?: LUser, source?: LClass, edgeSettings?: GObject }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = { } as any;
    ret.user = LPointerTargetable.from(state.isEdgePending.user);
    ret.source = LPointerTargetable.from(state.isEdgePending.source);
    ret.edgeSettings = state._edgeSettings;
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
