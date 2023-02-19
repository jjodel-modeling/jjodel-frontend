import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import {LGraphElement} from "../../model/dataStructure";
import Xarrow, {xarrowPropsType} from "react-xarrows";
import {SetRootFieldAction} from "../../redux/action/action";
import {GObject, LClass, LReference} from "../../joiner";
import {useEffectOnce} from "usehooks-ts";
import { useStateIfMounted } from "use-state-if-mounted";
import $ from "jquery";

const crypto = require("crypto");
interface ThisState {}
function EdgeComponent(props: AllProps, state: ThisState) {
    let source: LClass|LReference|undefined = props.source.model as any;
    let target: LClass|LReference|undefined = props.target.model as any;

    const [anchorId, setAnchorId] = useStateIfMounted('');
    const [anchorMiddleId, setAnchorMiddleId] = useStateIfMounted('');
    const show = props.showAnchor;
    const size = props.size;
    const color = props.color;

    const firstOptions: xarrowPropsType = {
        start: props.source.id, end: anchorMiddleId,
        path: "grid", color: color, strokeWidth: size,
        showHead: false
    };
    const lastOptions: xarrowPropsType = {
        start: anchorMiddleId, end: props.target.id,
        path: "grid", color: color, strokeWidth: size,
    };

    if(source?.className == "DReference") {
        source = source as LReference;
        lastOptions.showHead = false;
        if(source.containment) {
            firstOptions.showTail = true;
            firstOptions.tailSize = 15;
            firstOptions.tailShape = {svgElem: <rect style={{
                    rotate: "45deg", fill: "white", strokeWidth: "0.1", stroke: color,
                }} width=".5pt" height=".5pt" />, offsetForward: 1};

            //firstOptions.tailShape = {svgElem: <path d="M150 0 L75 200 L225 200 Z" />}
        }
    }
    if(source?.className == "DClass") {
        source = source as LClass;
        lastOptions.showHead = true;
        lastOptions.headSize = 15;
        lastOptions.headColor = 'white';
        lastOptions.headShape = {svgElem:<svg><path strokeWidth={0.1} stroke={color} d="M 0 0 L 1 0.5 L 0 1 L 0 0 z"/></svg>};
        // firstOptions.headShape = {svgElem: <path d="M 0 0 L 1 0.5 L 0 1 L 0.25 0.5 z"/>, offsetForward: 0.5};
    }



    useEffectOnce(() => {
        setAnchorId(crypto.randomBytes(20).toString('hex'));
        setAnchorMiddleId(crypto.randomBytes(20).toString('hex'));
    })


    useEffect(() =>{
        const element: GObject = $('[id="' + anchorId + '"]');
        if(element) {
            element.draggable({
                cursor: "grabbing",
                containment: "window",
                drag: function (event: GObject, obj: GObject) {
                    SetRootFieldAction.new("dragging", {id: 0})
                }
            });
        }
        const middleware: GObject = $('[id="' + anchorMiddleId + '"]');
        if(middleware) {
            middleware.draggable({
                cursor: "grabbing",
                containment: "window",
                drag: function (event: GObject, obj: GObject) {
                    SetRootFieldAction.new("dragging", {id: 0})
                }
            });
        }
    })


    firstOptions.start = anchorId;
    const click = (event: React.MouseEvent<HTMLDivElement>) => {
        if(source) {
            SetRootFieldAction.new('_lastSelected', {
                node: props.source.id,
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
        <div className={"w-100 h-100"}>
            <div style={{visibility: (show) ? 'visible' : 'hidden'}} id={anchorId} className={"anchor"}></div>
            <div style={{borderColor: color}} id={anchorMiddleId} className={"middle-anchor"}></div>
        </div>
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
    const showAnchor = edgeSettings.showAnchor;
    const size = edgeSettings.size;
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
