import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import {DGraphElement, LGraphElement} from "../../model/dataStructure";
import {GObject, Pointer, SetRootFieldAction} from "../../joiner";
import Xarrow from "react-xarrows";
import {useStateIfMounted} from "use-state-if-mounted";
import {useEffectOnce} from "usehooks-ts";
import crypto from "crypto";
import $ from "jquery";


function ReferenceEdgeComponent(props: AllProps) {
    const source = props.source;
    const target = props.target;
    const containment = props.containment;
    let options = props.options;
    if(containment) {
        options = {
            ...options,
            showTail: true,
            tailSize: 15,
            tailShape: {svgElem: <rect style={{
                    rotate: '45deg', fill: 'white', strokeWidth: '0.1', stroke: options.color,
                }} width='.5pt' height='.5pt' />, offsetForward: 1}
        }
    }

    const [sourceAnchor, setSourceAnchor] = useStateIfMounted('');
    const [middleAnchor, setMiddleAnchor] = useStateIfMounted('');
    const [targetAnchor, setTargetAnchor] = useStateIfMounted('');
    const [size, setSize] = useStateIfMounted('10px');
    useEffectOnce(() => {
        setSourceAnchor(crypto.randomBytes(20).toString('hex'));
        setMiddleAnchor(crypto.randomBytes(20).toString('hex'));
        setTargetAnchor(crypto.randomBytes(20).toString('hex'));
    });
    const [checkOnNodes, setCheckOnNodes] = useStateIfMounted(false);
    useEffect(() => {
        const sourceDOM: JQuery<HTMLElement> = $('[id="' + source.id + '"]');
        const targetDOM: JQuery<HTMLElement> = $('[id="' + target.id + '"]');
        if(sourceDOM.length > 0 && targetDOM.length > 0) {
            const sourceAnchorDOM: JQuery<HTMLElement> & GObject = $('[id="' + sourceAnchor + '"]');
            sourceAnchorDOM.draggable({
                cursor: 'grabbing',
                containment: 'parent',
                drag: function(event: GObject, obj: GObject) {
                    SetRootFieldAction.new("dragging", {})
                }
            });
            sourceAnchorDOM.detach().prependTo(sourceDOM);

            const middleAnchorDOM: JQuery<HTMLElement> & GObject = $('[id="' + middleAnchor + '"]');
            middleAnchorDOM.draggable({
                cursor: 'grabbing',
                containment: 'window',
                drag: function(event: GObject, obj: GObject) {
                    SetRootFieldAction.new("dragging", {})
                }
            });

            const targetAnchorDOM: JQuery<HTMLElement> & GObject = $('[id="' + targetAnchor + '"]');
            targetAnchorDOM.draggable({
                cursor: 'grabbing',
                containment: 'parent',
                drag: function(event: GObject, obj: GObject) {
                    SetRootFieldAction.new("dragging", {})
                }
            });
            targetAnchorDOM.detach().prependTo(targetDOM);

            setCheckOnNodes(true);
        }
        else { setCheckOnNodes(false); }
    });

    if(props.display && checkOnNodes) {
        return(<div onClick={(evt) => {setSize((size !== '0px') ? '0px' : '10px')}}>
            <div style={{borderColor: (size !== '0px') ? options.color : 'transparent', height: size, width: size}}
                 id={sourceAnchor} className={'anchor'}></div>
            <div style={{borderColor: (size !== '0px') ? options.color : 'transparent', height: size, width: size}}
                 id={middleAnchor} className={'anchor'}></div>
            <div style={{borderColor: (size !== '0px') ? options.color : 'transparent', height: size, width: size}}
                 id={targetAnchor} className={'anchor'}></div>
            <Xarrow start={sourceAnchor} end={middleAnchor} {...options} showHead={false} />
            <Xarrow start={middleAnchor} end={targetAnchor} {...options} />
        </div>);
    } else { return(<></>); }

}
interface OwnProps {
    sourceID: Pointer<DGraphElement, 1, 1, LGraphElement>;
    targetID: Pointer<DGraphElement, 1, 1, LGraphElement>;
    containment: boolean;
}
interface StateProps { source: LGraphElement, target: LGraphElement, options: GObject, display: boolean }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = { } as any;
    ret.source = LGraphElement.fromPointer(ownProps.sourceID);
    ret.target = LGraphElement.fromPointer(ownProps.targetID);
    ret.options = state._edgeSettings;
    ret.display = state._edgesDisplayed.referenceM2;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ReferenceEdgeConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ReferenceEdgeComponent);

export const ReferenceEdge = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ReferenceEdgeConnected {...{...props, childrens}} />;
}
export default ReferenceEdge;
