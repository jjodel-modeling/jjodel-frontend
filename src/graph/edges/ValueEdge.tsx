import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import {DGraphElement, LGraphElement} from "../../model/dataStructure";
import {GObject, Pointer, SetRootFieldAction} from "../../joiner";
import Xarrow from "react-xarrows";
import {useStateIfMounted} from "use-state-if-mounted";
import {useEffectOnce} from "usehooks-ts";
import crypto from "crypto";
import "./style.scss";
import $ from "jquery";

function ValueEdgeComponent(props: AllProps) {
    const source = props.source;
    const target = props.target;
    let options = props.options;
    options = {
        ...options,
        showHead: false
    }

    const [middleAnchor, setMiddleAnchor] = useStateIfMounted('');
    useEffectOnce(() => {
        setMiddleAnchor(crypto.randomBytes(20).toString('hex'));
    });
    useEffect(() => {
        const middleware: GObject = $('[id="' + middleAnchor + '"]');
        if(middleware) {
            middleware.draggable({
                cursor: "grabbing",
                containment: "window",
                drag: function (event: GObject, obj: GObject) {
                    SetRootFieldAction.new("dragging", {})
                }
            });
        }
    });

    if(props.display) {
        return(<>
            <div style={{borderColor: options.color}} id={middleAnchor} className={'middle-anchor'}></div>
            <Xarrow start={source.id} end={middleAnchor} showHead={false} {...options} />
            <Xarrow start={middleAnchor} end={target.id} {...options} />
        </>);
    } else { return(<></>); }

}
interface OwnProps {
    sourceID: Pointer<DGraphElement, 1, 1, LGraphElement>;
    targetID: Pointer<DGraphElement, 1, 1, LGraphElement>;
}
interface StateProps { source: LGraphElement, target: LGraphElement, options: GObject, display: boolean }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = { } as any;
    ret.source = LGraphElement.fromPointer(ownProps.sourceID);
    ret.target = LGraphElement.fromPointer(ownProps.targetID);
    ret.options = state._edgeSettings;
    ret.display = state._edgesDisplayed.referenceM1;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ValueEdgeConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ValueEdgeComponent);

export const ValueEdge = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ValueEdgeConnected {...{...props, childrens}} />;
}
export default ValueEdge;
