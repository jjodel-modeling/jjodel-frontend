import {AllPropss as VertexProps} from "../graph/vertex/Vertex";
import React, {CSSProperties, ReactNode} from "react";
import ToolButton from "../graph/toolButton/ToolButton";
import {DUser, Pointer, SetRootFieldAction} from "../joiner";
import {U} from "./U";
import Draggable, {DraggableData, DraggableEvent} from "react-draggable";
import {useXarrow} from "react-xarrows";

export default class JSX {

    public static nodeRender(props: VertexProps, render: ReactNode): ReactNode {
        const classname = props.data.className;
        const classes: string[] = [];
        classes.push(classname);
        if(props.data.id === props.lastSelected) classes.push("selected");

        const select = (forUser:Pointer<DUser, 0, 1> = null) => {
            if (!forUser) forUser = DUser.current;
            props.node.isSelected[forUser] = true;
            SetRootFieldAction.new('_lastSelected', {
                node: props.nodeid,
                view: props.view.id,
                modelElement: props.data?.id
            });
        }
        const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
            select();
            e.stopPropagation();
            e.nativeEvent.stopPropagation();
        }

        const sizeStyle: CSSProperties = {};
        /*
        sizeStyle.height = "inherit"
        if(props.isVertex && props.data.className !== "DPackage") {
            //sizeStyle.position = "absolute";
            sizeStyle.width = "min-content";
            sizeStyle.top = props.data.y + "px";
            sizeStyle.left = props.data.x + "px";
        } else {
            sizeStyle.position = "relative";
            sizeStyle.width = "100%"
        }
        */


        /*
        return(
            <div id={props.node?.id}
                 data-dataid={props.data?.id}
                 data-viewid={props.view?.id}
                 data-modelname={props.data?.className}
                 data-userselecting={JSON.stringify(props.node?.__raw.isSelected || {})}
                 style={{...sizeStyle}}
                 className={classes.join(' ')}
                 onClick={onClick}
            >
                {U.showToolButton(classname) ?
                    <ToolButton isVertex={props.isVertex} data={props.data} /> : <></>
                }
                {render}
            </div>
        );
        */
        //const updateArrow = useXarrow();
        //onDrag={updateArrow} onStop={updateArrow}
        return(<>
            <Draggable>
                <div id={"id_1"} className={"test-arrow1"}></div>
            </Draggable>
            <Draggable >
                <div id={"id_2"} className={"test-arrow2"}></div>
            </Draggable>
            <div id={"id_3"} className={"test-arrow3"}></div>
            <div id={"id_4"} className={"test-arrow4"}></div>
        </>);
    }

    public static nodeDraggableRender(props: VertexProps, render: ReactNode): ReactNode {
        const dragStart = (e: DraggableEvent, data: DraggableData) => {e.stopPropagation(); }
        const dragging = (e: DraggableEvent, data: DraggableData) => {e.stopPropagation();}
        const dragStop = (e: DraggableEvent, data: DraggableData) => {e.stopPropagation();}

        return(
            <Draggable onStart={dragStart} onDrag={dragging} onStop={dragStop}>
                {JSX.nodeRender(props, render)}
            </Draggable>
        );
    }
}
