import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import {LGraphElement} from "../../model/dataStructure";
import Xarrow, {xarrowPropsType, Xwrapper} from "react-xarrows";
import {SetRootFieldAction} from "../../redux/action/action";
import {GObject, LClass, LReference, Selectors} from "../../joiner";
import {useEffectOnce} from "usehooks-ts";
import { useStateIfMounted } from "use-state-if-mounted";
import $ from "jquery";

const crypto = require("crypto");
interface ThisState {}
function EdgeComponent(props: AllProps, state: ThisState) {
    const sourceNode = props.source;
    let source: LClass|LReference|undefined = sourceNode.model as any;
    const targetNode = props.target;
    let target: LClass|LReference|undefined = targetNode.model as any;

    const show = props.showAnchor;
    const size = props.size;
    const color = props.color;

    const [middleAnchor, setMiddleAnchor] = useStateIfMounted('');

    const firstOptions: xarrowPropsType = {
        start: sourceNode.id, end: middleAnchor,
        path: "grid", color: color, strokeWidth: size,
        showHead: false, zIndex: 100
    };
    const lastOptions: xarrowPropsType = {
        start: middleAnchor, end: targetNode.id,
        path: "grid", color: color, strokeWidth: size, zIndex: 100
    };

    if(source?.className == "DReference") {
        source = source as LReference;
        firstOptions.start = source.father.nodes[0].id;
        lastOptions.showHead = false;
        if(source.containment) {
            firstOptions.showTail = true;
            firstOptions.tailSize = 15;
            firstOptions.tailShape = {svgElem: <rect style={{
                    rotate: "45deg", fill: "white", strokeWidth: "0.1", stroke: color,
                }} width=".5pt" height=".5pt" />, offsetForward: 1};
        }
    }
    if(source?.className == "DClass") {
        source = source as LClass;
        lastOptions.showHead = true;
        lastOptions.headSize = 15;
        lastOptions.headColor = 'white';
        lastOptions.headShape = {svgElem:<svg><path strokeWidth={0.1} stroke={color} d="M 0 0 L 1 0.5 L 0 1 L 0 0 z"/></svg>};
    }

    useEffectOnce(() => {
        setMiddleAnchor(crypto.randomBytes(20).toString('hex'));
    })

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
    })

    const click = (event: React.MouseEvent<HTMLDivElement>) => {
        if(source) {
            SetRootFieldAction.new('_lastSelected', {
                node: sourceNode.id,
                view: undefined,
                modelElement: source.id
            });
        }
        event.preventDefault();
        event.stopPropagation();
    }

    const contextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    }

    return(<div onClick={click} onContextMenu={contextMenu}>
        <div style={{borderColor: color}} id={middleAnchor} className={"middle-anchor"}></div>
        <Xarrow {...firstOptions} />
        <Xarrow {...lastOptions} />
    </div>);
}
interface OwnProps { source: LGraphElement; target: LGraphElement; }
interface StateProps { showAnchor: boolean, size: number, color: string }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const edgeSettings = state._edgeSettings;
    const showAnchor = false //edgeSettings.showAnchor;
    const size = edgeSettings.strokeWidth;
    const color = edgeSettings.color;
    const ret: StateProps = { showAnchor, size, color };
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
