import React, {Dispatch, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import type {DModelElement} from "../../model/logicWrapper";
import {LModelElement} from "../../model/logicWrapper";
import type {GObject, Pointer} from "../../joiner";
import {LClass, LReference} from "../../model/logicWrapper";
import $ from "jquery";
import Xarrow, {xarrowPropsType} from "react-xarrows";
import {useEffectOnce} from "usehooks-ts";
import {useStateIfMounted} from "use-state-if-mounted";


function EdgeComponent(props: AllProps) {
    const source = (typeof props.source === 'string') ? props.source : props.source.id;
    const target = (typeof props.target === 'string') ? props.target : props.target.id;
    const [sourceNode, setSourceNode] = useStateIfMounted<GObject|undefined>(undefined);
    const [targetNode, setTargetNode] = useStateIfMounted<GObject|undefined>(undefined);
    const label = (props.label) ? props.label : '';

    useEffectOnce(() => {
        setSourceNode($('[id="' + source + '"]')[0]);
        setTargetNode($('[id="' + target + '"]')[0]);
    })

    return(<div>
       {(sourceNode && targetNode) && <div>
           <Xarrow start={source} end={target} labels={label} />
       </div>}
    </div>);
}
interface OwnProps {
    sourceid: Pointer<DModelElement, 1, 1, LModelElement>,
    targetid: Pointer<DModelElement, 1, 1, LModelElement>,
    label?: string
}
interface StateProps { source: LClass|LReference|string, target: LClass|string }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    let me = LModelElement.fromPointer(ownProps.sourceid);
    switch(me?.className) {
        case 'DClass': ret.source = LClass.fromPointer(me.id); break;
        case 'DReference': ret.source = LReference.fromPointer(me.id); break;
        default: ret.source = ownProps.sourceid; break;
    }
    me = LModelElement.fromPointer(ownProps.targetid);
    switch(me?.className) {
        case 'DClass': ret.target = LClass.fromPointer(me.id); break;
        case 'DReference': ret.target = LReference.fromPointer(me.id); break;
        default: ret.target = ownProps.targetid; break;
    }
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EdgeConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EdgeComponent);

export const Edge = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <EdgeConnected {...{...props, childrens}} />;
}
export default Edge;
